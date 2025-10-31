# AI Lip Reading Model Integration Plan

## Executive Summary

This document outlines the integration strategy for implementing the Auto-AVSR (Audio-Visual Speech Recognition) lip reading model into the existing Flask + React application, leveraging Google Colab's GPU resources for inference while maintaining the current application architecture.

**Key Decision**: Hybrid Architecture - Local Flask app handles user management, database, and UI, while Google Colab runs the GPU-intensive inference tasks.

---

## 1. Architecture Overview

### 1.1 System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
│  - Transcription UI (RealTimeTranscription, VideoUploadZone) │
│  - Video player, results display                             │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTP/WebSocket
┌──────────────────▼──────────────────────────────────────────┐
│              Local Flask Backend (Port 5000)                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  API Routes:                                            │ │
│  │  - /api/transcription/upload (receives video)          │ │
│  │  - /api/transcription/status/{id} (check job status)   │ │
│  │  - /api/transcription/results/{id} (get results)       │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Services:                                              │ │
│  │  - TranscriptionService (job queue management)         │ │
│  │  - FileHandler (video upload to Google Drive)          │ │
│  │  - ColabAPIClient (communicate with Colab service)     │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Database:                                              │ │
│  │  - Transcription model (already exists)                │ │
│  │  - TranscriptionJob model (NEW - for async tracking)   │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────┬──────────────────────────────────────────┘
                   │ REST API (via ngrok)
┌──────────────────▼──────────────────────────────────────────┐
│         Google Colab Inference Service (ngrok URL)          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Flask App (Cell 5):                                    │ │
│  │  - /api/process (receive video from Drive link)        │ │
│  │  - /api/health (health check)                          │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Inference Pipeline:                                    │ │
│  │  - InferencePipeline (from pipelines.pipeline)         │ │
│  │  - LRS3_V_WER19.1 model (250M params)                  │ │
│  │  - MediaPipe face detector                             │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  GPU Resources:                                         │ │
│  │  - Tesla T4 / V100 GPU (Colab free/pro)                │ │
│  │  - CUDA acceleration                                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Data Flow

1. **Video Upload**:
   - User uploads video → Local Flask receives it
   - Flask validates & saves metadata to DB
   - Video uploaded to Google Drive (not local storage for large files)
   - Flask creates TranscriptionJob record with status='pending'

2. **Inference Request**:
   - Flask sends POST to Colab service `/api/process` with:
     - Google Drive video link (shareable URL)
     - Job ID
     - User ID
   - Colab service downloads video from Drive
   - Colab processes video through InferencePipeline
   - Colab returns transcription text + timestamps

3. **Result Storage**:
   - Flask receives results from Colab
   - Updates TranscriptionJob status='completed'
   - Creates/updates Transcription record
   - User sees results in UI

---

## 2. File Storage Strategy

### 2.1 Problem: GitHub File Size Limits

**Current Issue**: Large video files cannot be uploaded to GitHub repository.

### 2.2 Solution: Google Drive Integration

#### For Development/Local:
- Keep small test videos (<25MB) in `backend/uploads/transcription/`
- Add to `.gitignore`: `backend/uploads/transcription/*.mp4`
- Store only metadata paths in database

#### For Production/Colab:
- Upload videos to Google Drive folder (shared with Colab)
- Store Google Drive file ID in database
- Use Drive API to generate shareable links
- Colab downloads directly from Drive

#### Implementation:

```python
# backend/app/utils/google_drive_handler.py
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
import os

class GoogleDriveHandler:
    def __init__(self):
        # Service account credentials for automated access
        self.credentials = self._load_credentials()
        self.service = build('drive', 'v3', credentials=self.credentials)
        self.folder_id = os.getenv('GOOGLE_DRIVE_FOLDER_ID')
    
    def upload_video(self, file_path: str, filename: str) -> dict:
        """Upload video to Google Drive, return file_id and shareable_link"""
        file_metadata = {
            'name': filename,
            'parents': [self.folder_id]
        }
        media = MediaFileUpload(file_path, mimetype='video/mp4')
        
        file = self.service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id,webViewLink,webContentLink'
        ).execute()
        
        # Make file publicly accessible (or share with Colab service account)
        self.service.permissions().create(
            fileId=file['id'],
            body={'role': 'reader', 'type': 'anyone'}
        ).execute()
        
        return {
            'file_id': file['id'],
            'shareable_link': file['webContentLink'],
            'view_link': file['webViewLink']
        }
    
    def download_video(self, file_id: str, output_path: str):
        """Download video from Drive (used by Colab)"""
        request = self.service.files().get_media(fileId=file_id)
        with open(output_path, 'wb') as f:
            f.write(request.execute())
```

### 2.3 Database Schema Updates

```python
# backend/app/models/transcription_job.py (NEW)
class TranscriptionJob(db.Model):
    __tablename__ = 'transcription_jobs'
    
    id: so.Mapped[int] = so.mapped_column(primary_key=True)
    public_id: so.Mapped[str] = so.mapped_column(sa.String(25), unique=True)
    user_id: so.Mapped[int] = so.mapped_column(sa.ForeignKey('accounts.id'))
    transcription_id: so.Mapped[int | None] = so.mapped_column(sa.ForeignKey('transcriptions.id'))
    
    # File storage
    local_path: so.Mapped[str | None] = so.mapped_column(sa.String(255))  # For small files
    google_drive_id: so.Mapped[str | None] = so.mapped_column(sa.String(255))
    google_drive_link: so.Mapped[str | None] = so.mapped_column(sa.Text())
    
    # Job status
    status: so.Mapped[str] = so.mapped_column(sa.String(20), default='pending')
    # Statuses: pending, processing, completed, failed
    
    # Colab communication
    colab_job_id: so.Mapped[str | None] = so.mapped_column(sa.String(100))
    colab_service_url: so.Mapped[str | None] = so.mapped_column(sa.String(255))
    
    # Error handling
    error_message: so.Mapped[str | None] = so.mapped_column(sa.Text())
    retry_count: so.Mapped[int] = so.mapped_column(sa.Integer, default=0)
    
    created_at: so.Mapped[datetime] = so.mapped_column(sa.DateTime, default=datetime.utcnow)
    updated_at: so.Mapped[datetime] = so.mapped_column(sa.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

---

## 3. Backend Implementation

### 3.1 New API Endpoints

```python
# backend/app/api/transcription.py (NEW or extend existing)

from flask import Blueprint, request, jsonify, current_app
from ..services.transcription_service import TranscriptionService
from ..services.colab_api_client import ColabAPIClient

bp = Blueprint('transcription', __name__, url_prefix='/api/transcription')

@bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_video():
    """Upload video for transcription"""
    try:
        if 'video' not in request.files:
            return jsonify({'error': 'No video file provided'}), 400
        
        video_file = request.files['video']
        title = request.form.get('title', 'Untitled Transcription')
        
        service = TranscriptionService()
        job = service.create_transcription_job(
            user_id=get_jwt_identity(),
            video_file=video_file,
            title=title
        )
        
        # Trigger Colab processing
        colab_client = ColabAPIClient()
        colab_client.submit_job(job)
        
        return jsonify({
            'success': True,
            'job_id': job.public_id,
            'status': job.status
        }), 201
        
    except Exception as e:
        current_app.logger.error(f"Upload error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@bp.route('/status/<job_id>', methods=['GET'])
@jwt_required()
def get_job_status(job_id):
    """Check transcription job status"""
    service = TranscriptionService()
    job = service.get_job_by_id(job_id, user_id=get_jwt_identity())
    
    if not job:
        return jsonify({'error': 'Job not found'}), 404
    
    return jsonify({
        'job_id': job.public_id,
        'status': job.status,
        'progress': job.progress_percentage if hasattr(job, 'progress_percentage') else None,
        'created_at': job.created_at.isoformat()
    })

@bp.route('/results/<job_id>', methods=['GET'])
@jwt_required()
def get_results(job_id):
    """Get transcription results"""
    service = TranscriptionService()
    transcription = service.get_transcription_by_job_id(job_id, user_id=get_jwt_identity())
    
    if not transcription:
        return jsonify({'error': 'Results not found'}), 404
    
    return jsonify({
        'id': transcription.public_id,
        'title': transcription.title,
        'content_text': transcription.content_text,
        'timestamps_json': transcription.timestamps_json,
        'created_at': transcription.creation_date.isoformat()
    })
```

### 3.2 Colab API Client

```python
# backend/app/services/colab_api_client.py (NEW)

import requests
import os
from typing import Dict, Optional
from flask import current_app

class ColabAPIClient:
    """Client to communicate with Google Colab inference service"""
    
    def __init__(self):
        # ngrok URL from Colab (updated dynamically)
        self.base_url = os.getenv('COLAB_SERVICE_URL', 'http://your-ngrok-url.ngrok.io')
        self.timeout = 300  # 5 minutes for processing
    
    def submit_job(self, job) -> bool:
        """Submit transcription job to Colab service"""
        try:
            payload = {
                'job_id': job.public_id,
                'video_url': job.google_drive_link,  # Shareable Drive link
                'user_id': job.user_id,
                'callback_url': f"{current_app.config.get('BASE_URL')}/api/transcription/callback"
            }
            
            response = requests.post(
                f"{self.base_url}/api/process",
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                job.colab_job_id = result.get('colab_job_id')
                job.status = 'processing'
                job.colab_service_url = self.base_url
                return True
            else:
                current_app.logger.error(f"Colab API error: {response.text}")
                job.status = 'failed'
                job.error_message = response.text
                return False
                
        except requests.exceptions.RequestException as e:
            current_app.logger.error(f"Colab API connection error: {str(e)}")
            job.status = 'failed'
            job.error_message = str(e)
            return False
    
    def check_health(self) -> bool:
        """Check if Colab service is running"""
        try:
            response = requests.get(
                f"{self.base_url}/api/health",
                timeout=5
            )
            return response.status_code == 200
        except:
            return False
```

### 3.3 Transcription Service

```python
# backend/app/services/transcription_service.py (NEW or extend)

from ..models.transcription_job import TranscriptionJob
from ..models.transcription import Transcription
from ..utils.file_handler import FileHandler
from ..utils.google_drive_handler import GoogleDriveHandler
from ..utils.id_generator import generate_id

class TranscriptionService:
    """Service for managing transcription jobs and results"""
    
    def __init__(self):
        self.file_handler = FileHandler()
        self.drive_handler = GoogleDriveHandler()
        self.max_local_size_mb = 25  # Files smaller than this stay local
    
    def create_transcription_job(self, user_id: int, video_file, title: str) -> TranscriptionJob:
        """Create a new transcription job"""
        # Validate file
        if not self.file_handler.validate_video_file(video_file.filename):
            raise ValueError("Invalid video file type")
        
        # Check file size
        file_size_mb = video_file.seek(0, 2) / (1024 * 1024)
        video_file.seek(0)
        
        job = TranscriptionJob(
            public_id=generate_id('TJB'),
            user_id=user_id,
            status='pending'
        )
        
        if file_size_mb < self.max_local_size_mb:
            # Store locally
            upload_path = self.file_handler.create_upload_directory('uploads/transcription')
            filename = self.file_handler.generate_unique_filename(video_file.filename, 'trans')
            file_path = self.file_handler.save_uploaded_file(video_file, upload_path, filename)
            job.local_path = self.file_handler.get_relative_path(file_path)
        else:
            # Upload to Google Drive
            temp_path = f"/tmp/{self.file_handler.generate_unique_filename(video_file.filename)}"
            video_file.save(temp_path)
            
            drive_info = self.drive_handler.upload_video(
                temp_path,
                video_file.filename
            )
            
            job.google_drive_id = drive_info['file_id']
            job.google_drive_link = drive_info['shareable_link']
            
            # Clean up temp file
            os.remove(temp_path)
        
        db.session.add(job)
        db.session.commit()
        
        return job
    
    def process_colab_callback(self, job_id: str, transcription_text: str, 
                              timestamps: Optional[Dict] = None) -> Transcription:
        """Process callback from Colab service with results"""
        job = TranscriptionJob.query.filter_by(public_id=job_id).first()
        if not job:
            raise ValueError("Job not found")
        
        # Create or update transcription record
        if job.transcription_id:
            transcription = Transcription.query.get(job.transcription_id)
        else:
            transcription = Transcription(
                public_id=generate_id('TRN'),
                user_id=job.user_id,
                title=f"Transcription {job.public_id}"
            )
            db.session.add(transcription)
            job.transcription_id = transcription.id
        
        transcription.content_text = transcription_text
        transcription.timestamps_json = json.dumps(timestamps) if timestamps else None
        transcription.video_source_path = job.local_path or job.google_drive_link
        
        job.status = 'completed'
        
        db.session.commit()
        return transcription
```

---

## 4. Colab Service Implementation

### 4.1 Enhanced Flask App in Colab

Update `colab_cell_5_web_server.txt` to add new endpoints:

```python
# Add to web/app.py in Colab

from flask import Flask, request, jsonify
from pipelines.pipeline import InferencePipeline
import torch
import gdown
import tempfile
import os
import requests

app = Flask(__name__)
pipeline = None

def initialize_pipeline():
    """Initialize inference pipeline"""
    global pipeline
    CONFIG_PATH = "/content/lipreading/configs/LRS3_V_WER19.1.ini"
    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    
    pipeline = InferencePipeline(
        config_filename=CONFIG_PATH,
        detector="mediapipe",
        face_track=True,
        device=device
    )
    print(f"✅ Pipeline initialized on {device}")

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'gpu_available': torch.cuda.is_available(),
        'pipeline_loaded': pipeline is not None
    }), 200

@app.route('/api/process', methods=['POST'])
def process_video():
    """Process video for transcription"""
    try:
        data = request.json
        job_id = data.get('job_id')
        video_url = data.get('video_url')  # Google Drive shareable link
        callback_url = data.get('callback_url')
        
        if not pipeline:
            initialize_pipeline()
        
        # Download video from Google Drive
        temp_video = tempfile.mktemp(suffix='.mp4')
        
        # Extract file ID from Drive URL
        file_id = extract_drive_id(video_url)
        download_url = f"https://drive.google.com/uc?id={file_id}"
        gdown.download(download_url, temp_video, quiet=False)
        
        # Process video
        print(f"🔄 Processing job {job_id}...")
        transcription_text = pipeline(temp_video)
        
        # Clean up
        if os.path.exists(temp_video):
            os.remove(temp_video)
        
        # Send callback to local Flask
        if callback_url:
            requests.post(callback_url, json={
                'job_id': job_id,
                'transcription': transcription_text,
                'status': 'completed'
            }, timeout=10)
        
        return jsonify({
            'success': True,
            'job_id': job_id,
            'transcription': transcription_text,
            'colab_job_id': f"colab_{job_id}"
        }), 200
        
    except Exception as e:
        print(f"❌ Processing error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def extract_drive_id(url: str) -> str:
    """Extract file ID from Google Drive URL"""
    if '/d/' in url:
        return url.split('/d/')[1].split('/')[0]
    elif 'id=' in url:
        return url.split('id=')[1].split('&')[0]
    return url

# Initialize on startup
initialize_pipeline()
```

### 4.2 Colab Setup Script (Updated)

Create a unified Colab notebook cell that:
1. Sets up environment (Cell 1)
2. Downloads models (Cell 2)
3. Initializes pipeline
4. Starts Flask server with ngrok (Cell 5)

---

## 5. Frontend Updates

### 5.1 Transcription Service

```typescript
// frontend/src/services/transcription/transcriptionService.ts

import { API_BASE_URL } from '@/lib/constants';
import { apiRequest } from '@/lib/api';

export interface TranscriptionJob {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  created_at: string;
}

export interface TranscriptionResult {
  id: string;
  title: string;
  content_text: string;
  timestamps_json?: string;
  created_at: string;
}

export const uploadVideoForTranscription = async (
  videoFile: File,
  title: string
): Promise<TranscriptionJob> => {
  const formData = new FormData();
  formData.append('video', videoFile);
  formData.append('title', title);

  const response = await apiRequest<{ success: boolean; job_id: string; status: string }>(
    '/api/transcription/upload',
    {
      method: 'POST',
      body: formData,
      // Don't set Content-Type, let browser set it with boundary
    }
  );

  return {
    job_id: response.job_id,
    status: response.status as TranscriptionJob['status'],
    created_at: new Date().toISOString(),
  };
};

export const checkJobStatus = async (jobId: string): Promise<TranscriptionJob> => {
  const response = await apiRequest<TranscriptionJob>(
    `/api/transcription/status/${jobId}`
  );
  return response;
};

export const getTranscriptionResults = async (jobId: string): Promise<TranscriptionResult> => {
  const response = await apiRequest<TranscriptionResult>(
    `/api/transcription/results/${jobId}`
  );
  return response;
};

export const pollJobStatus = async (
  jobId: string,
  onUpdate: (job: TranscriptionJob) => void,
  intervalMs: number = 2000
): Promise<TranscriptionResult> => {
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const job = await checkJobStatus(jobId);
        onUpdate(job);

        if (job.status === 'completed') {
          clearInterval(interval);
          const result = await getTranscriptionResults(jobId);
          resolve(result);
        } else if (job.status === 'failed') {
          clearInterval(interval);
          reject(new Error('Transcription job failed'));
        }
      } catch (error) {
        clearInterval(interval);
        reject(error);
      }
    }, intervalMs);
  });
};
```

### 5.2 Update VideoUploadZone Component

```typescript
// frontend/src/components/transcription/VideoUploadZone.tsx

import { useState } from 'react';
import { uploadVideoForTranscription, pollJobStatus, TranscriptionJob } from '@/services/transcription/transcriptionService';
import { useToast } from '@/hooks/use-toast';

export const VideoUploadZone = ({ onTranscriptionComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [job, setJob] = useState<TranscriptionJob | null>(null);
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const newJob = await uploadVideoForTranscription(file, file.name);
      setJob(newJob);
      setUploading(false);
      setProcessing(true);

      // Poll for results
      const result = await pollJobStatus(
        newJob.job_id,
        (updatedJob) => {
          setJob(updatedJob);
          toast({
            title: 'Processing...',
            description: `Status: ${updatedJob.status}`,
          });
        }
      );

      setProcessing(false);
      onTranscriptionComplete(result);
      toast({
        title: 'Success!',
        description: 'Transcription completed',
      });
    } catch (error) {
      setUploading(false);
      setProcessing(false);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    // ... existing UI with status updates
  );
};
```

---

## 6. Deployment Strategy

### 6.1 Development Workflow

1. **Local Development**:
   - Run Flask backend locally (`python run.py`)
   - Run React frontend locally (`npm run dev`)
   - Start Colab notebook and get ngrok URL
   - Set `COLAB_SERVICE_URL` environment variable in local Flask

2. **Testing**:
   - Upload small test videos (<25MB) - uses local storage
   - Upload large videos - uses Google Drive
   - Verify Colab processing works
   - Check database records

### 6.2 Production Considerations

**Option A: Always-On Colab (Free Tier Limitations)**
- Colab free tier disconnects after inactivity
- Need to restart Colab session and update ngrok URL
- Good for demos, not for production

**Option B: Colab Pro/Pro+ (Paid)**
- Longer runtime, better GPU
- Still needs ngrok URL management

**Option C: Deploy to Cloud GPU (Recommended for Production)**
- Google Cloud Run with GPU
- AWS Lambda with GPU
- Azure Container Instances
- Persistent ngrok URL or direct domain

### 6.3 Environment Variables

**Local Flask Backend (.env)**:
```env
COLAB_SERVICE_URL=http://your-ngrok-url.ngrok.io
GOOGLE_DRIVE_FOLDER_ID=your-folder-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
BASE_URL=http://localhost:5000
```

**Colab Environment**:
```python
# Set in Colab notebook
os.environ['COLAB_CALLBACK_URL'] = 'http://your-flask-url/api/transcription/callback'
```

---

## 7. Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Create `TranscriptionJob` model and migration
- [ ] Implement `GoogleDriveHandler` utility
- [ ] Create `ColabAPIClient` service
- [ ] Set up Google Drive API credentials
- [ ] Test Drive upload/download

### Phase 2: Backend API (Week 1-2)
- [ ] Implement `/api/transcription/upload` endpoint
- [ ] Implement `/api/transcription/status/{id}` endpoint
- [ ] Implement `/api/transcription/results/{id}` endpoint
- [ ] Implement `/api/transcription/callback` endpoint (for Colab callbacks)
- [ ] Add error handling and logging

### Phase 3: Colab Service (Week 2)
- [ ] Update Colab Flask app with new endpoints
- [ ] Test Colab service health check
- [ ] Test video processing from Drive link
- [ ] Set up ngrok tunnel
- [ ] Test end-to-end with local Flask

### Phase 4: Frontend Integration (Week 2-3)
- [ ] Create transcription service in frontend
- [ ] Update `VideoUploadZone` component
- [ ] Add job status polling UI
- [ ] Update `RealTimeTranscription` (if needed)
- [ ] Test complete user flow

### Phase 5: Testing & Optimization (Week 3)
- [ ] Test with various video sizes
- [ ] Test error scenarios (Colab down, Drive access issues)
- [ ] Optimize polling intervals
- [ ] Add retry logic for failed jobs
- [ ] Performance testing

### Phase 6: Documentation & Deployment (Week 4)
- [ ] Update README with setup instructions
- [ ] Document Colab notebook setup
- [ ] Create deployment guide
- [ ] Set up monitoring/logging

---

## 8. File Size Management Strategy

### For GitHub Repository:
1. **Add to .gitignore**:
```
backend/uploads/transcription/*.mp4
backend/uploads/transcription/*.avi
backend/uploads/transcription/*.mov
backend/uploads/series/videos/*.mp4
```

2. **Use Git LFS for small test files** (if needed):
```bash
git lfs track "*.mp4"
git lfs track "*.avi"
```

3. **Store sample videos separately**:
   - Create `backend/sample_videos/` (not in uploads/)
   - Keep only very small samples (<5MB) in repo
   - Document where to get full datasets

### For Database:
- Store only file paths or Drive IDs
- Never store video binary in database
- Use relative paths for local files
- Use Drive IDs for cloud files

---

## 9. Security Considerations

1. **Authentication**:
   - All transcription endpoints require JWT authentication
   - Users can only access their own transcriptions

2. **File Access**:
   - Google Drive folder should be private
   - Use service account for automated access
   - Generate temporary shareable links with expiration

3. **API Security**:
   - Validate ngrok URL to prevent unauthorized access
   - Rate limiting on upload endpoints
   - File size limits (e.g., max 500MB per video)

4. **Colab Service**:
   - Add API key authentication for Colab endpoints
   - Validate callback URLs to prevent SSRF

---

## 10. Monitoring & Error Handling

### Job Status Tracking:
- Database stores all job states
- Failed jobs include error messages
- Retry mechanism for transient failures

### Logging:
- Flask logs all transcription requests
- Colab service logs processing times
- Track GPU usage and performance

### User Feedback:
- Real-time status updates in UI
- Progress indicators during processing
- Clear error messages

---

## 11. Cost Estimation

### Google Colab:
- **Free Tier**: Limited GPU hours, disconnects after inactivity
- **Pro ($10/month)**: Better GPU, longer sessions
- **Pro+ ($50/month)**: Priority access, fastest GPUs

### Google Drive:
- **Free**: 15GB storage
- **Workspace Basic ($6/month)**: 30GB
- **Workspace Standard ($12/month)**: 2TB

### ngrok:
- **Free**: Limited tunnels, random URLs
- **Paid ($8/month)**: Reserved domain, more tunnels

---

## 12. Future Enhancements

1. **Real-time Processing**:
   - WebSocket connection for live updates
   - Stream video chunks to Colab
   - Real-time transcription display

2. **Batch Processing**:
   - Queue multiple videos
   - Process in parallel on Colab
   - Bulk download results

3. **Model Optimization**:
   - Support for smaller/faster models
   - Model quantization for faster inference
   - Multiple model options

4. **Alternative Infrastructure**:
   - Deploy to cloud GPU services
   - Use Kubernetes for scaling
   - Serverless GPU functions

---

## 13. Quick Start Checklist

### Local Setup:
- [ ] Install Google Drive API Python client
- [ ] Create Google Cloud project and service account
- [ ] Download service account JSON key
- [ ] Set up Google Drive folder for uploads
- [ ] Install additional Python packages (see requirements)
- [ ] Run database migrations for TranscriptionJob

### Colab Setup:
- [ ] Clone lipreading repository
- [ ] Install dependencies (Cell 1)
- [ ] Download models (Cell 2)
- [ ] Set up Flask app (Cell 5)
- [ ] Get ngrok URL
- [ ] Test health check endpoint

### Integration:
- [ ] Update Flask config with Colab URL
- [ ] Test file upload to Drive
- [ ] Test Colab API connection
- [ ] Run end-to-end test

---

## 14. References

- [Auto-AVSR DeepWiki](https://deepwiki.com/mpc001/auto_avsr/1-overview)
- [Lip Reading GitHub Repository](https://github.com/kelsongitlee/lipreading)
- [Google Drive API Documentation](https://developers.google.com/drive/api/v3/about-sdk)
- [ngrok Documentation](https://ngrok.com/docs)

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-XX  
**Author**: AI Assistant


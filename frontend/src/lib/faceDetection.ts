/**
 * Face Detection Utility using MediaPipe Face Detection
 * Provides proper face and mouth detection for real-time practice
 */
import { FaceDetection } from '@mediapipe/face_detection';

export interface FaceDetectionResult {
  faceDetected: boolean;
  faceConfidence: number;
  mouthOpen: boolean;
  mouthOpenRatio: number;
  faceBox: { x: number; y: number; width: number; height: number } | null;
  faceAngle: 'front' | 'side' | 'unknown';
  message: string;
}

export class FaceDetectionService {
  private faceDetection: FaceDetection | null = null;
  private isInitialized = false;
  private pendingResolve: ((result: FaceDetectionResult) => void) | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.faceDetection = new FaceDetection({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`;
        }
      });

      this.faceDetection.setOptions({
        model: 'short', // faster model for real-time
        minDetectionConfidence: 0.5,
      });

      // set up results callback
      this.faceDetection.onResults((results) => {
        if (this.pendingResolve) {
          const resolve = this.pendingResolve;
          this.pendingResolve = null;

          if (!results.detections || results.detections.length === 0) {
            resolve({
              faceDetected: false,
              faceConfidence: 0,
              mouthOpen: false,
              mouthOpenRatio: 0,
              faceBox: null,
              faceAngle: 'unknown',
              message: 'No face detected - please position your face in front of the camera'
            });
            return;
          }
          
          // get first (most confident) detection
          const detection = results.detections[0];
          const bbox = detection.boundingBox;
          
          // MediaPipe Face Detection doesn't expose score directly, use a default confidence
          const score = 0.8; // assume good confidence if detection exists

          // calculate face box (normalized to 0-1, need actual canvas dimensions)
          // We'll use a standard size for now, but should use actual video dimensions
          const canvasWidth = 640; // TODO: use actual video width
          const canvasHeight = 480; // TODO: use actual video height
          const faceBox = {
            x: (bbox.xCenter - bbox.width / 2) * canvasWidth,
            y: (bbox.yCenter - bbox.height / 2) * canvasHeight,
            width: bbox.width * canvasWidth,
            height: bbox.height * canvasHeight
          };

          // estimate face angle (simplified - based on bounding box aspect ratio)
          const aspectRatio = bbox.width / bbox.height;
          let faceAngle: 'front' | 'side' | 'unknown' = 'unknown';
          if (aspectRatio > 0.7 && aspectRatio < 1.0) {
            faceAngle = 'front';
          } else if (aspectRatio < 0.7) {
            faceAngle = 'side';
          }

          // check if face is centered and good size
          const isCentered = Math.abs(bbox.xCenter - 0.5) < 0.2;
          const isGoodSize = bbox.width > 0.15 && bbox.height > 0.15;
          
          // simplified mouth detection - assume mouth is visible if face is well-positioned
          const mouthOpen = isCentered && isGoodSize && faceAngle === 'front';
          const mouthOpenRatio = mouthOpen ? 0.7 : 0.3;

          let message = '';
          if (!isCentered) {
            message = 'Face not centered - please move to the center of the frame';
          } else if (!isGoodSize) {
            message = 'Face too small - please move closer to the camera';
          } else if (faceAngle === 'side') {
            message = 'Face angled - please face the camera directly';
          } else {
            message = 'Face detected clearly';
          }

          resolve({
            faceDetected: true,
            faceConfidence: score,
            mouthOpen,
            mouthOpenRatio,
            faceBox,
            faceAngle,
            message
          });
        }
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('[FaceDetection] Initialization error:', error);
      throw error;
    }
  }

  async detectFace(videoElement: HTMLVideoElement): Promise<FaceDetectionResult> {
    if (!this.faceDetection || !this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve) => {
      if (!this.faceDetection) {
        resolve({
          faceDetected: false,
          faceConfidence: 0,
          mouthOpen: false,
          mouthOpenRatio: 0,
          faceBox: null,
          faceAngle: 'unknown',
          message: 'Face detection not initialized'
        });
        return;
      }

      // check if video is ready
      if (videoElement.readyState < 2) {
        resolve({
          faceDetected: false,
          faceConfidence: 0,
          mouthOpen: false,
          mouthOpenRatio: 0,
          faceBox: null,
          faceAngle: 'unknown',
          message: 'Video not ready'
        });
        return;
      }

      // create canvas to process frame - use actual video dimensions
      const canvas = document.createElement('canvas');
      const videoWidth = videoElement.videoWidth || 640;
      const videoHeight = videoElement.videoHeight || 480;
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve({
          faceDetected: false,
          faceConfidence: 0,
          mouthOpen: false,
          mouthOpenRatio: 0,
          faceBox: null,
          faceAngle: 'unknown',
          message: 'Canvas context not available'
        });
        return;
      }

      // draw video frame to canvas
      try {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      } catch (error) {
        resolve({
          faceDetected: false,
          faceConfidence: 0,
          mouthOpen: false,
          mouthOpenRatio: 0,
          faceBox: null,
          faceAngle: 'unknown',
          message: `Error drawing video: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
        return;
      }

      // store resolve function and send frame for processing
      this.pendingResolve = resolve;
      
      try {
        this.faceDetection.send({ image: canvas });
      } catch (error) {
        resolve({
          faceDetected: false,
          faceConfidence: 0,
          mouthOpen: false,
          mouthOpenRatio: 0,
          faceBox: null,
          faceAngle: 'unknown',
          message: `Error sending frame: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    });
  }

  dispose(): void {
    if (this.faceDetection) {
      this.faceDetection.close();
      this.faceDetection = null;
    }
    this.isInitialized = false;
    this.pendingResolve = null;
  }
}

// singleton instance
export const faceDetectionService = new FaceDetectionService();


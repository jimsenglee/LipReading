
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import AnimatedBreadcrumb from '@/components/ui/animated-breadcrumb';
import RealTimeTranscription from '@/components/transcription/RealTimeTranscription';
import VideoUploadZone from '@/components/transcription/VideoUploadZone';
import { 
  Video, 
  Upload,
  History,
  BookOpen
} from 'lucide-react';

const Transcription = () => {
  const [activeTab, setActiveTab] = React.useState('realtime');
  
  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Transcription' }
  ];

  // Handle transcription updates
  const handleTranscriptionUpdate = (text: string) => {
    // This can be used to sync with other components or save progress
    console.log('Transcription updated:', text);
  };

  // Handle completed file transcription
  const handleTranscriptionComplete = (transcription: string, file: File) => {
    console.log('File transcription complete:', { transcription, fileName: file.name });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <AnimatedBreadcrumb items={breadcrumbItems} />
      
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          AI Lip Reading Transcription
        </h1>
        <p className="text-gray-600 mt-1">
          Advanced real-time and file-based lip reading with high accuracy
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-primary/5 border border-primary/20">
          <TabsTrigger value="realtime" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Video className="h-4 w-4" />
            Real-time
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Upload className="h-4 w-4" />
            File Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="realtime" className="space-y-6">
          <RealTimeTranscription onTranscriptionUpdate={handleTranscriptionUpdate} />
        </TabsContent>

        <TabsContent value="upload" className="space-y-6">
          <VideoUploadZone onTranscriptionComplete={handleTranscriptionComplete} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Transcription;

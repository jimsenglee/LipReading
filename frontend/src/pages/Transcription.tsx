
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AnimatedBreadcrumb from '@/components/ui/animated-breadcrumb';
import RealTimeTranscription from '@/components/transcription/RealTimeTranscription';
import VideoUploadZone from '@/components/transcription/VideoUploadZone';
import TranscriptionHistory from '@/components/transcription/TranscriptionHistory';
import { 
  Video, 
  Upload,
  History
} from 'lucide-react';

const Transcription = () => {
  const [activeTab, setActiveTab] = React.useState('realtime');
  
  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Transcription' }
  ];

  // handle transcription updates
  const handleTranscriptionUpdate = (text: string) => {
    // this can be used to sync with other components or save progress
    console.log('[DEBUG] Transcription update:', text);
  };

  // handle completed file transcription
  const handleTranscriptionComplete = (transcription: string, file: File) => {
    // handle completed transcription
    console.log('[DEBUG] Transcription complete:', transcription, file.name);
    // switch to history tab to show the new transcription
    setActiveTab('history');
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
        <TabsList className="grid w-full grid-cols-3 bg-primary/5 border border-primary/20">
          <TabsTrigger value="realtime" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Video className="h-4 w-4" />
            Real-time
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Upload className="h-4 w-4" />
            File Upload
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="realtime" className="space-y-6">
          <RealTimeTranscription onTranscriptionUpdate={handleTranscriptionUpdate} />
        </TabsContent>

        <TabsContent value="upload" className="space-y-6">
          <VideoUploadZone onTranscriptionComplete={handleTranscriptionComplete} />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <TranscriptionHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Transcription;

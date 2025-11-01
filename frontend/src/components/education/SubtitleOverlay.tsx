import { useEffect, useState } from 'react';

interface SubtitleCue {
  start: number;
  end: number;
  text: string;
}

interface SubtitleOverlayProps {
  subtitleUrl: string | null;
  currentTime: number;
  enabled: boolean;
}

const SubtitleOverlay: React.FC<SubtitleOverlayProps> = ({ subtitleUrl, currentTime, enabled }) => {
  const [cues, setCues] = useState<SubtitleCue[]>([]);
  const [currentText, setCurrentText] = useState<string>('');

  // Parse VTT file
  useEffect(() => {
    if (!subtitleUrl || !enabled) {
      setCues([]);
      return;
    }

    const fetchAndParseVTT = async () => {
      try {
        const response = await fetch(subtitleUrl);
        const text = await response.text();
        
        // Parse VTT format
        const parsedCues: SubtitleCue[] = [];
        const lines = text.split('\n');
        
        let i = 0;
        while (i < lines.length) {
          // Skip WEBVTT header
          if (lines[i].trim() === 'WEBVTT') {
            i++;
            continue;
          }
          
          // Skip empty lines
          if (!lines[i].trim()) {
            i++;
            continue;
          }
          
          // Check for timestamp line (00:00:00.000 --> 00:00:00.000)
          const timestampRegex = /(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})\.(\d{3})/;
          const match = lines[i].match(timestampRegex);
          
          if (match) {
            // Parse start time
            const startSeconds = parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3]) + parseInt(match[4]) / 1000;
            // Parse end time
            const endSeconds = parseInt(match[5]) * 3600 + parseInt(match[6]) * 60 + parseInt(match[7]) + parseInt(match[8]) / 1000;
            
            // Collect subtitle text (may span multiple lines)
            i++;
            let subtitleText = '';
            while (i < lines.length && lines[i].trim() && !lines[i].match(timestampRegex)) {
              if (subtitleText) subtitleText += ' ';
              subtitleText += lines[i].trim();
              i++;
            }
            
            if (subtitleText) {
              parsedCues.push({
                start: startSeconds,
                end: endSeconds,
                text: subtitleText
              });
            }
          } else {
            i++;
          }
        }
        
        setCues(parsedCues);
      } catch (error) {
        console.error('Failed to load subtitles:', error);
        setCues([]);
      }
    };

    fetchAndParseVTT();
  }, [subtitleUrl, enabled]);

  // Find current subtitle
  useEffect(() => {
    if (!enabled || cues.length === 0) {
      setCurrentText('');
      return;
    }

    const activeCue = cues.find(cue => currentTime >= cue.start && currentTime <= cue.end);
    setCurrentText(activeCue?.text || '');
  }, [currentTime, cues, enabled]);

  if (!enabled || !currentText) {
    return null;
  }

  return (
    <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-black/75 rounded-lg max-w-4xl w-[90%] pointer-events-none">
      <p className="text-white text-center text-lg font-medium leading-relaxed">
        {currentText}
      </p>
    </div>
  );
};

export default SubtitleOverlay;


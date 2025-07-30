import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useFeedbackToast } from '@/components/ui/feedback-toast';
import { 
  Eye, 
  Type, 
  Palette, 
  Volume2,
  Monitor,
  Moon,
  Sun,
  Contrast,
  ZoomIn
} from 'lucide-react';

interface AccessibilitySettingsProps {
  onSettingsChange?: (settings: AccessibilitySettings) => void;
}

interface AccessibilitySettings {
  fontSize: string;
  theme: 'light' | 'dark';
  highContrast: boolean;
  reducedMotion: boolean;
  autoScroll: boolean;
  transcriptionFontSize: number;
  showConfidenceScores: boolean;
  highlightUncertainWords: boolean;
}

const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({ 
  onSettingsChange 
}) => {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    fontSize: 'medium',
    theme: 'light',
    highContrast: false,
    reducedMotion: false,
    autoScroll: true,
    transcriptionFontSize: 16,
    showConfidenceScores: true,
    highlightUncertainWords: true
  });

  const feedbackToast = useFeedbackToast();

  useEffect(() => {
    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem('accessibilitySettings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(parsed);
    }
  }, []);

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K, 
    value: AccessibilitySettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    // Save to localStorage
    localStorage.setItem('accessibilitySettings', JSON.stringify(newSettings));
    
    // Apply changes immediately
    applyAccessibilityChanges(key, value);
    
    // Notify parent component
    onSettingsChange?.(newSettings);
    
    // Show feedback
    feedbackToast.success(
      "Settings Updated",
      `${key.replace(/([A-Z])/g, ' $1').toLowerCase()} has been updated.`
    );
  };

  const applyAccessibilityChanges = (key: keyof AccessibilitySettings, value: any) => {
    const root = document.documentElement;
    
    switch (key) {
      case 'fontSize':
        // Apply font size to transcription areas
        const transcriptionElements = document.querySelectorAll('.transcription-text');
        transcriptionElements.forEach(el => {
          (el as HTMLElement).style.fontSize = getFontSizeValue(value);
        });
        break;
        
      case 'theme':
        // Apply theme changes
        root.classList.toggle('dark', value === 'dark');
        feedbackToast.info(
          "Theme Applied",
          `Switched to ${value} mode successfully.`
        );
        break;
        
      case 'highContrast':
        root.classList.toggle('high-contrast', value as boolean);
        break;
        
      case 'reducedMotion':
        root.style.setProperty('--animation-duration', value ? '0ms' : '300ms');
        break;
        
      case 'transcriptionFontSize':
        root.style.setProperty('--transcription-font-size', `${value}px`);
        break;
    }
  };

  const getFontSizeValue = (size: string) => {
    const sizes = {
      small: '14px',
      medium: '16px',
      large: '18px',
      'extra-large': '20px'
    };
    return sizes[size as keyof typeof sizes] || '16px';
  };

  const previewText = "This is a sample transcription text to demonstrate how your changes will look.";

  return (
    <div className="space-y-6">
      {/* Font and Display Settings */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Type className="h-5 w-5" />
            Font & Display Settings
          </CardTitle>
          <CardDescription>
            Customize text appearance for better readability
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Transcription Font Size */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Transcription Font Size</div>
                <div className="text-sm text-gray-600">Adjust text size for transcriptions</div>
              </div>
              <Badge variant="outline" className="border-primary/20">
                {settings.transcriptionFontSize}px
              </Badge>
            </div>
            <Slider
              value={[settings.transcriptionFontSize]}
              onValueChange={([value]) => updateSetting('transcriptionFontSize', value)}
              min={12}
              max={24}
              step={1}
              className="w-full"
            />
          </div>

          {/* General Font Size */}
          <div className="space-y-2">
            <div className="font-medium">General Font Size</div>
            <Select 
              value={settings.fontSize}
              onValueChange={(value) => updateSetting('fontSize', value)}
            >
              <SelectTrigger className="border-primary/20 focus:border-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
                <SelectItem value="extra-large">Extra Large</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="text-sm font-medium text-primary mb-2">Preview:</div>
            <div 
              className="transcription-text"
              style={{ fontSize: `${settings.transcriptionFontSize}px` }}
            >
              {previewText}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Theme and Visual Settings */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Palette className="h-5 w-5" />
            Theme & Visual Settings
          </CardTitle>
          <CardDescription>
            Customize the visual appearance of the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme Selection */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-medium flex items-center gap-2">
                {settings.theme === 'light' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                Application Theme
              </div>
              <div className="text-sm text-gray-600">
                Switch between light and dark themes
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">Light</span>
              <Switch
                checked={settings.theme === 'dark'}
                onCheckedChange={(checked) => updateSetting('theme', checked ? 'dark' : 'light')}
              />
              <span className="text-sm">Dark</span>
            </div>
          </div>

          {/* High Contrast */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-medium flex items-center gap-2">
                <Contrast className="h-4 w-4" />
                High Contrast Mode
              </div>
              <div className="text-sm text-gray-600">
                Increase contrast for better visibility
              </div>
            </div>
            <Switch
              checked={settings.highContrast}
              onCheckedChange={(checked) => updateSetting('highContrast', checked)}
            />
          </div>

          {/* Reduced Motion */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-medium">Reduce Motion</div>
              <div className="text-sm text-gray-600">
                Minimize animations and transitions
              </div>
            </div>
            <Switch
              checked={settings.reducedMotion}
              onCheckedChange={(checked) => updateSetting('reducedMotion', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Transcription Display Settings */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Eye className="h-5 w-5" />
            Transcription Display
          </CardTitle>
          <CardDescription>
            Customize how transcriptions are displayed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Show Confidence Scores */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-medium">Show Confidence Scores</div>
              <div className="text-sm text-gray-600">
                Display accuracy percentages for transcribed words
              </div>
            </div>
            <Switch
              checked={settings.showConfidenceScores}
              onCheckedChange={(checked) => updateSetting('showConfidenceScores', checked)}
            />
          </div>

          {/* Highlight Uncertain Words */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-medium">Highlight Uncertain Words</div>
              <div className="text-sm text-gray-600">
                Mark words with low confidence in a different color
              </div>
            </div>
            <Switch
              checked={settings.highlightUncertainWords}
              onCheckedChange={(checked) => updateSetting('highlightUncertainWords', checked)}
            />
          </div>

          {/* Auto-scroll */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-medium">Auto-scroll During Transcription</div>
              <div className="text-sm text-gray-600">
                Automatically scroll to keep up with new text
              </div>
            </div>
            <Switch
              checked={settings.autoScroll}
              onCheckedChange={(checked) => updateSetting('autoScroll', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Reset Settings */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-primary">Reset Settings</CardTitle>
          <CardDescription>
            Restore all accessibility settings to their default values
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="outline" 
            onClick={() => {
              const defaultSettings: AccessibilitySettings = {
                fontSize: 'medium',
                theme: 'light',
                highContrast: false,
                reducedMotion: false,
                autoScroll: true,
                transcriptionFontSize: 16,
                showConfidenceScores: true,
                highlightUncertainWords: true
              };
              
              setSettings(defaultSettings);
              localStorage.setItem('accessibilitySettings', JSON.stringify(defaultSettings));
              onSettingsChange?.(defaultSettings);
              
              feedbackToast.success(
                "Settings Reset",
                "All accessibility settings have been restored to defaults."
              );
            }}
            className="border-primary/20 text-primary hover:bg-primary/10"
          >
            Reset to Defaults
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessibilitySettings;
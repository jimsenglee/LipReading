import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useFeedbackToast } from '@/components/ui/feedback-toast';
import { 
  Type, 
  Moon,
  Sun
} from 'lucide-react';

interface AccessibilitySettingsProps {
  onSettingsChange?: (settings: AccessibilitySettings) => void;
}

interface AccessibilitySettings {
  fontSize: number;
  isDarkMode: boolean;
}

const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({ 
  onSettingsChange 
}) => {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    fontSize: 16,
    isDarkMode: false
  });

  const feedbackToast = useFeedbackToast();

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedFontSize = parseInt(localStorage.getItem('userFontSize') || '16');
    const savedTheme = localStorage.getItem('userTheme') || 'Light';
    
    setSettings({
      fontSize: savedFontSize,
      isDarkMode: savedTheme === 'Dark'
    });

    // Apply dark mode on initial load
    if (savedTheme === 'Dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const updateSetting = (key: keyof AccessibilitySettings, value: string | boolean | number) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    // Save to localStorage
    if (key === 'fontSize') {
      localStorage.setItem('userFontSize', value.toString());
    } else if (key === 'isDarkMode') {
      const themeValue = value ? 'Dark' : 'Light';
      localStorage.setItem('userTheme', themeValue);
      
      // Apply theme immediately
      if (value) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    
    // Notify parent component
    onSettingsChange?.(newSettings);
    
    // Show feedback
    feedbackToast.success(
      "Settings Updated", 
      `Your ${key === 'fontSize' ? 'font size' : 'theme'} preference has been saved.`
    );
  };

  const handleSaveAll = () => {
    // All settings are already saved automatically
    feedbackToast.success(
      "All Settings Saved",
      "Your accessibility preferences have been saved successfully."
    );
  };

  const getFontSizeClass = (size: number) => {
    if (size <= 14) return 'text-sm';
    if (size >= 18) return 'text-lg';
    return 'text-base'; // Medium (16px)
  };

  return (
    <div className="space-y-6">
      {/* Font Size Settings */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Type className="h-5 w-5" />
            Font Size
          </CardTitle>
          <CardDescription>
            Adjust text size throughout the application for better readability
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">General Font Size</div>
                <div className="text-sm text-muted-foreground">Adjust text size for better readability</div>
              </div>
              <Badge variant="outline" className="border-primary/20">
                {settings.fontSize}px
              </Badge>
            </div>
            <Slider
              value={[settings.fontSize]}
              onValueChange={([value]) => updateSetting('fontSize', value)}
              min={12}
              max={24}
              step={1}
              className="w-full"
            />
          </div>

          {/* Font Size Preview */}
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="text-sm font-medium text-primary mb-2">Preview:</div>
            <div style={{ fontSize: `${settings.fontSize}px` }}>
              This is a sample text to demonstrate how your selected font size will appear in the application.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Theme Settings */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            {settings.isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            Theme
          </CardTitle>
          <CardDescription>
            Switch between light and dark modes for comfortable viewing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-medium flex items-center gap-2">
                Dark Mode
              </div>
              <div className="text-sm text-muted-foreground">
                Enable dark theme for reduced eye strain in low-light environments
              </div>
            </div>
            <Switch
              checked={settings.isDarkMode}
              onCheckedChange={(checked) => updateSetting('isDarkMode', checked)}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          {/* Theme Preview */}
          <div className="p-4 border border-border rounded-lg bg-card text-card-foreground transition-colors">
            <div className="text-sm font-medium mb-2">Theme Preview:</div>
            <div className="text-sm text-muted-foreground">
              This preview shows how the {settings.isDarkMode ? 'dark' : 'light'} theme will look across the application.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save All Settings Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSaveAll}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          <Type className="h-4 w-4 mr-2" />
          Save All Settings
        </Button>
      </div>
    </div>
  );
};

export default AccessibilitySettings;
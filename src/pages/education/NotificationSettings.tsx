import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  Bell, 
  Mail, 
  Smartphone, 
  Clock, 
  Settings,
  CheckCircle,
  Calendar,
  Zap,
  Target
} from 'lucide-react';
import { motion } from 'framer-motion';
import AnimatedBreadcrumb from '@/components/ui/animated-breadcrumb';
import { useToast } from '@/hooks/use-toast';

interface NotificationPreference {
  type: string;
  enabled: boolean;
  frequency: string;
  time: string;
}

const NotificationSettings = () => {
  const { toast } = useToast();
  
  const [notifications, setNotifications] = useState<NotificationPreference[]>([
    {
      type: 'practice-reminders',
      enabled: true,
      frequency: 'daily',
      time: '18:00'
    },
    {
      type: 'quiz-reminders',
      enabled: false,
      frequency: 'weekly',
      time: '10:00'
    },
    {
      type: 'achievement-alerts',
      enabled: true,
      frequency: 'immediate',
      time: '09:00'
    },
    {
      type: 'progress-summary',
      enabled: true,
      frequency: 'weekly',
      time: '19:00'
    }
  ]);

  const [reminderFrequency, setReminderFrequency] = useState('daily');
  const [reminderTime, setReminderTime] = useState('18:00');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);

  const breadcrumbItems = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Education', href: '/education' },
    { title: 'Notification Settings' }
  ];

  const frequencyOptions = [
    { value: 'never', label: 'Never', description: 'Turn off all reminders' },
    { value: 'daily', label: 'Daily', description: 'Remind me every day' },
    { value: 'weekly', label: 'Weekly', description: 'Remind me once a week' },
    { value: 'bi-weekly', label: 'Bi-weekly', description: 'Remind me every two weeks' }
  ];

  const timeOptions = [
    { value: '09:00', label: '9:00 AM' },
    { value: '12:00', label: '12:00 PM' },
    { value: '15:00', label: '3:00 PM' },
    { value: '18:00', label: '6:00 PM' },
    { value: '20:00', label: '8:00 PM' }
  ];

  const notificationTypes = [
    {
      id: 'practice-reminders',
      title: 'Practice Reminders',
      description: 'Get reminded to practice your lip-reading skills',
      icon: <Target className="h-5 w-5 text-blue-600" />,
      color: 'bg-blue-50 border-blue-200'
    },
    {
      id: 'quiz-reminders',
      title: 'Quiz Reminders',
      description: 'Reminders to take new quizzes and test your progress',
      icon: <Clock className="h-5 w-5 text-green-600" />,
      color: 'bg-green-50 border-green-200'
    },
    {
      id: 'achievement-alerts',
      title: 'Achievement Alerts',
      description: 'Instant notifications when you unlock new achievements',
      icon: <Zap className="h-5 w-5 text-yellow-600" />,
      color: 'bg-yellow-50 border-yellow-200'
    },
    {
      id: 'progress-summary',
      title: 'Progress Summary',
      description: 'Weekly summaries of your learning progress and statistics',
      icon: <CheckCircle className="h-5 w-5 text-purple-600" />,
      color: 'bg-purple-50 border-purple-200'
    }
  ];

  const updateNotification = (type: string, field: keyof NotificationPreference, value: any) => {
    setNotifications(prev => prev.map(notification =>
      notification.type === type
        ? { ...notification, [field]: value }
        : notification
    ));
  };

  const saveSettings = () => {
    // Here you would typically save to backend
    toast({
      title: "Settings Saved",
      description: "Your notification preferences have been updated successfully."
    });
  };

  const testNotification = () => {
    toast({
      title: "Test Notification",
      description: "This is how your practice reminders will look! 🎯"
    });
  };

  const getFrequencyBadge = (frequency: string) => {
    const colors = {
      'never': 'secondary',
      'daily': 'default',
      'weekly': 'default',
      'bi-weekly': 'outline',
      'immediate': 'destructive'
    } as const;
    
    return (
      <Badge variant={colors[frequency as keyof typeof colors] || 'outline'}>
        {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <AnimatedBreadcrumb items={breadcrumbItems} />
      
      <motion.div 
        className="text-center space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold text-primary">Notification Settings</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Manage your practice reminders and stay motivated with personalized notifications
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Settings */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Quick Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Email Notifications</Label>
                  <p className="text-xs text-gray-500">Receive reminders via email</p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Push Notifications</Label>
                  <p className="text-xs text-gray-500">Browser push notifications</p>
                </div>
                <Switch
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                />
              </div>

              <div className="pt-4 border-t">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={testNotification}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Test Notification
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Practice Reminder Quick Setup */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">Practice Reminders</CardTitle>
              <CardDescription>
                Set your preferred reminder schedule
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-3 block">Frequency</Label>
                <RadioGroup value={reminderFrequency} onValueChange={setReminderFrequency}>
                  {frequencyOptions.map(option => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-gray-500">{option.description}</div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {reminderFrequency !== 'never' && (
                <div>
                  <Label className="text-sm font-medium mb-3 block">Preferred Time</Label>
                  <RadioGroup value={reminderTime} onValueChange={setReminderTime}>
                    {timeOptions.map(option => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={`time-${option.value}`} />
                        <Label htmlFor={`time-${option.value}`} className="cursor-pointer">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detailed Notification Settings */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Notification Types</CardTitle>
              <CardDescription>
                Customize each type of notification individually
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notificationTypes.map((type, index) => {
                  const notification = notifications.find(n => n.type === type.id);
                  
                  return (
                    <motion.div
                      key={type.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-lg border transition-all ${
                        notification?.enabled ? type.color : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="mt-1">{type.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold">{type.title}</h4>
                            {notification && getFrequencyBadge(notification.frequency)}
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{type.description}</p>
                          
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={notification?.enabled || false}
                                onCheckedChange={(checked) => 
                                  updateNotification(type.id, 'enabled', checked)
                                }
                              />
                              <Label className="text-sm">Enable</Label>
                            </div>
                            
                            {notification?.enabled && (
                              <>
                                <div className="flex items-center gap-2">
                                  <Label className="text-sm">Frequency:</Label>
                                  <select
                                    value={notification.frequency}
                                    onChange={(e) => 
                                      updateNotification(type.id, 'frequency', e.target.value)
                                    }
                                    className="text-sm border border-gray-300 rounded px-2 py-1"
                                  >
                                    <option value="immediate">Immediate</option>
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="never">Never</option>
                                  </select>
                                </div>
                                
                                {notification.frequency !== 'immediate' && notification.frequency !== 'never' && (
                                  <div className="flex items-center gap-2">
                                    <Label className="text-sm">Time:</Label>
                                    <select
                                      value={notification.time}
                                      onChange={(e) => 
                                        updateNotification(type.id, 'time', e.target.value)
                                      }
                                      className="text-sm border border-gray-300 rounded px-2 py-1"
                                    >
                                      {timeOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                          {option.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Notification Preview */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Notification Preview</CardTitle>
              <CardDescription>
                See how your notifications will appear
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Email Notification Preview */}
                <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-blue-600 mt-1" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-900 mb-1">
                        📚 Time for your lip-reading practice!
                      </h4>
                      <p className="text-sm text-blue-700 mb-2">
                        You're doing great! Keep up the momentum with a quick 10-minute practice session.
                      </p>
                      <div className="text-xs text-blue-600">
                        🎯 Current streak: 5 days | 📈 Average score: 87%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Push Notification Preview */}
                <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                  <div className="flex items-start gap-3">
                    <Smartphone className="h-5 w-5 text-green-600 mt-1" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-green-900 mb-1">
                        🏆 Achievement Unlocked!
                      </h4>
                      <p className="text-sm text-green-700">
                        Congratulations! You've earned the "Weekly Warrior" badge for practicing 7 days in a row.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Summary Preview */}
                <div className="p-4 border border-purple-200 rounded-lg bg-purple-50">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-purple-600 mt-1" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-purple-900 mb-1">
                        📊 Your Weekly Progress Summary
                      </h4>
                      <p className="text-sm text-purple-700 mb-2">
                        This week you completed 5 practice sessions and 3 quizzes. Your average score improved by 8%!
                      </p>
                      <div className="text-xs text-purple-600">
                        ⭐ Keep up the excellent work!
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={saveSettings}
              className="bg-primary hover:bg-primary/90 px-8"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
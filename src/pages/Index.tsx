
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Video, 
  BookOpen, 
  BarChart3, 
  Users,
  CheckCircle,
  Play,
  TrendingUp,
  Shield
} from 'lucide-react';

const Index = () => {
  const features = [
    {
      icon: Video,
      title: 'Real-time Transcription',
      description: 'Live lip-reading with your webcam for instant communication',
      color: 'bg-blue-500'
    },
    {
      icon: BookOpen,
      title: 'Interactive Learning',
      description: 'Comprehensive tutorials and quizzes to master lip-reading',
      color: 'bg-green-500'
    },
    {
      icon: BarChart3,
      title: 'Performance Analytics',
      description: 'Track your progress with detailed accuracy reports',
      color: 'bg-purple-500'
    },
    {
      icon: Users,
      title: 'Multi-user Support',
      description: 'Admin tools for managing users and educational content',
      color: 'bg-orange-500'
    }
  ];

  const benefits = [
    'State-of-the-art AI lip-reading technology',
    'Real-time and video file transcription',
    'Personalized learning paths',
    'Detailed performance tracking',
    'Multi-format video support',
    'Custom dictionary integration'
  ];

  const stats = [
    { label: 'Accuracy Rate', value: '91%', icon: TrendingUp },
    { label: 'Active Users', value: '1,200+', icon: Users },
    { label: 'Sessions Daily', value: '850+', icon: Video },
    { label: 'Uptime', value: '99.8%', icon: Shield }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Video className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">LipRead AI</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <Badge className="mb-4 bg-blue-100 text-blue-800">
              Next-Generation Accessibility Technology
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Master Lip-Reading with
              <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent"> AI Power</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Transform your communication with our advanced lip-reading platform. 
              Real-time transcription, interactive learning, and personalized progress tracking.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link to="/register">
              <Button size="lg" className="flex items-center gap-2 px-8 py-3">
                <Play className="h-5 w-5" />
                Start Learning Free
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="px-8 py-3">
                Sign In
              </Button>
            </Link>
          </div>

          {/* Demo Accounts Info */}
          <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-lg p-6 max-w-md mx-auto">
            <h3 className="font-semibold mb-3">Try Demo Accounts</h3>
            <div className="text-sm space-y-1">
              <div><strong>User:</strong> user@example.com</div>
              <div><strong>Admin:</strong> admin@example.com</div>
              <div className="text-gray-600">Password: any password</div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
                  <stat.icon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our comprehensive platform provides all the tools you need to master lip-reading
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/60 backdrop-blur-sm">
                <CardHeader>
                  <div className={`inline-flex items-center justify-center w-12 h-12 ${feature.color} text-white rounded-lg mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-teal-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Why Choose LipRead AI?</h2>
              <p className="text-xl mb-8 text-blue-100">
                Join thousands of users who have improved their communication skills with our cutting-edge platform.
              </p>
              <div className="grid grid-cols-1 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-300" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-video bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Video className="h-16 w-16 mx-auto mb-4 text-white/80" />
                  <p className="text-white/80">Interactive Demo Coming Soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready to Transform Your Communication?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Start your lip-reading journey today with our comprehensive AI-powered platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="flex items-center gap-2 px-8 py-3">
                Get Started Free
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="px-8 py-3">
                Sign In to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Video className="h-8 w-8 text-blue-400" />
              <span className="ml-2 text-xl font-bold">LipRead AI</span>
            </div>
            <p className="text-gray-400 mb-4">
              Empowering communication through advanced lip-reading technology
            </p>
            <div className="text-sm text-gray-500">
              © 2024 LipRead AI. Built with modern web technologies.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

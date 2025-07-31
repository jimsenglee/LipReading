// Progress Tracking API Simulation
// This service simulates API calls for tutorial series progress tracking, enrollment, and feedback

import { TutorialSeries, Video, UserProgress, SeriesRating, UserFeedback } from '@/data/tutorialSeries';

// Simulated API delay
const API_DELAY = 500;

// Mock localStorage keys
const STORAGE_KEYS = {
  USER_PROGRESS: 'tutorialSeriesProgress',
  SERIES_RATINGS: 'seriesRatings',
  USER_FEEDBACK: 'userFeedback',
  SKIP_WARNINGS: 'skipAdvancedWarnings'
};

// Utility function to simulate API delay
const delay = (ms: number = API_DELAY) => new Promise(resolve => setTimeout(resolve, ms));

// Progress Tracking Service
export class ProgressTrackingService {
  
  // Enrollment Methods
  static async enrollInSeries(seriesId: string, userId: string = 'current-user'): Promise<{ success: boolean; message: string }> {
    await delay();
    
    try {
      const progressData = this.getStoredProgress();
      
      if (!progressData[seriesId]) {
        progressData[seriesId] = {
          status: 'in-progress',
          enrolledAt: new Date().toISOString(),
          completedVideos: [],
          totalWatchTime: 0
        };
        
        localStorage.setItem(STORAGE_KEYS.USER_PROGRESS, JSON.stringify(progressData));
        
        return {
          success: true,
          message: 'Successfully enrolled in the series!'
        };
      } else {
        return {
          success: false,
          message: 'Already enrolled in this series'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to enroll in series'
      };
    }
  }

  static async unenrollFromSeries(seriesId: string, userId: string = 'current-user'): Promise<{ success: boolean; message: string }> {
    await delay();
    
    try {
      const progressData = this.getStoredProgress();
      
      if (progressData[seriesId]) {
        delete progressData[seriesId];
        localStorage.setItem(STORAGE_KEYS.USER_PROGRESS, JSON.stringify(progressData));
        
        return {
          success: true,
          message: 'Successfully unenrolled from the series'
        };
      } else {
        return {
          success: false,
          message: 'Not enrolled in this series'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to unenroll from series'
      };
    }
  }

  // Video Progress Methods
  static async markVideoCompleted(seriesId: string, videoId: string, timeSpent: number = 0, userId: string = 'current-user'): Promise<{ success: boolean; message: string; progress?: UserProgress }> {
    await delay();
    
    try {
      const progressData = this.getStoredProgress();
      
      if (!progressData[seriesId]) {
        // Auto-enroll if not already enrolled
        await this.enrollInSeries(seriesId, userId);
        return this.markVideoCompleted(seriesId, videoId, timeSpent, userId);
      }
      
      const userProgress = progressData[seriesId];
      
      if (!userProgress.completedVideos.includes(videoId)) {
        userProgress.completedVideos.push(videoId);
        userProgress.totalWatchTime += timeSpent;
        userProgress.lastWatchedVideo = videoId;
        
        // Check if series is completed (assuming 8 videos per series for now)
        const totalVideos = 8; // This should be dynamic based on actual series data
        if (userProgress.completedVideos.length >= totalVideos) {
          userProgress.status = 'completed';
          userProgress.completedAt = new Date().toISOString();
        }
        
        localStorage.setItem(STORAGE_KEYS.USER_PROGRESS, JSON.stringify(progressData));
        
        return {
          success: true,
          message: 'Video marked as completed!',
          progress: userProgress
        };
      } else {
        return {
          success: true,
          message: 'Video already completed',
          progress: userProgress
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update video progress'
      };
    }
  }

  static async updateVideoPosition(seriesId: string, videoId: string, position: number, userId: string = 'current-user'): Promise<{ success: boolean }> {
    await delay(100); // Shorter delay for frequent updates
    
    try {
      const progressData = this.getStoredProgress();
      
      if (progressData[seriesId]) {
        progressData[seriesId].lastWatchedVideo = videoId;
        localStorage.setItem(STORAGE_KEYS.USER_PROGRESS, JSON.stringify(progressData));
      }
      
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  }

  // Feedback and Rating Methods
  static async submitSeriesRating(seriesId: string, rating: number, review?: string, userId: string = 'current-user'): Promise<{ success: boolean; message: string }> {
    await delay();
    
    try {
      const ratingsData = this.getStoredRatings();
      const userFeedbackData = this.getStoredFeedback();
      
      // Update series rating
      if (!ratingsData[seriesId]) {
        ratingsData[seriesId] = {
          average: rating,
          totalReviews: 1,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
        ratingsData[seriesId].distribution[rating as 1 | 2 | 3 | 4 | 5] = 1;
      } else {
        // Recalculate average (simplified - in real app would need more sophisticated approach)
        const currentTotal = ratingsData[seriesId].average * ratingsData[seriesId].totalReviews;
        ratingsData[seriesId].totalReviews += 1;
        ratingsData[seriesId].average = (currentTotal + rating) / ratingsData[seriesId].totalReviews;
        ratingsData[seriesId].distribution[rating as 1 | 2 | 3 | 4 | 5] += 1;
      }
      
      // Store user feedback
      const feedbackId = `feedback-${Date.now()}`;
      userFeedbackData[feedbackId] = {
        id: feedbackId,
        userId,
        userName: `User ${userId}`, // Mock username
        rating,
        comment: review,
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem(STORAGE_KEYS.SERIES_RATINGS, JSON.stringify(ratingsData));
      localStorage.setItem(STORAGE_KEYS.USER_FEEDBACK, JSON.stringify(userFeedbackData));
      
      return {
        success: true,
        message: 'Thank you for your feedback!'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to submit rating'
      };
    }
  }

  static async submitVideoFeedback(seriesId: string, videoId: string, feedback: { helpful: boolean; comments?: string }, userId: string = 'current-user'): Promise<{ success: boolean; message: string }> {
    await delay();
    
    try {
      const feedbackData = this.getStoredFeedback();
      
      const feedbackId = `video-feedback-${Date.now()}`;
      feedbackData[feedbackId] = {
        id: feedbackId,
        userId,
        userName: `User ${userId}`, // Mock username
        rating: feedback.helpful ? 5 : 1, // Convert boolean to rating
        comment: feedback.comments,
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem(STORAGE_KEYS.USER_FEEDBACK, JSON.stringify(feedbackData));
      
      return {
        success: true,
        message: 'Thank you for your feedback!'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to submit feedback'
      };
    }
  }

  // Data Retrieval Methods
  static async getUserProgress(userId: string = 'current-user'): Promise<{ [seriesId: string]: UserProgress }> {
    await delay(200);
    return this.getStoredProgress();
  }

  static async getSeriesProgress(seriesId: string, userId: string = 'current-user'): Promise<UserProgress | null> {
    await delay(200);
    const progressData = this.getStoredProgress();
    return progressData[seriesId] || null;
  }

  static async getSeriesRatings(seriesId: string): Promise<SeriesRating | null> {
    await delay(200);
    const ratingsData = this.getStoredRatings();
    return ratingsData[seriesId] || null;
  }

  static async getUserFeedback(userId: string = 'current-user'): Promise<UserFeedback[]> {
    await delay(200);
    const feedbackData = this.getStoredFeedback();
    return Object.values(feedbackData).filter((feedback: UserFeedback) => feedback.userId === userId);
  }

  // Learning Analytics
  static async getLearningAnalytics(userId: string = 'current-user'): Promise<{
    totalEnrolledSeries: number;
    completedSeries: number;
    inProgressSeries: number;
    totalWatchTime: number;
    averageRating: number;
    streakDays: number;
  }> {
    await delay();
    
    const progressData = this.getStoredProgress();
    const userSeries = Object.values(progressData);
    
    const totalEnrolledSeries = userSeries.length;
    const completedSeries = userSeries.filter((s: UserProgress) => s.status === 'completed').length;
    const inProgressSeries = userSeries.filter((s: UserProgress) => s.status === 'in-progress').length;
    const totalWatchTime = userSeries.reduce((total: number, s: UserProgress) => total + (s.totalWatchTime || 0), 0);
    
    // Mock streak calculation
    const streakDays = 7;
    const averageRating = 4.6;
    
    return {
      totalEnrolledSeries,
      completedSeries,
      inProgressSeries,
      totalWatchTime,
      averageRating,
      streakDays
    };
  }

  // Notification Methods
  static async getProgressNotifications(userId: string = 'current-user'): Promise<Array<{
    id: string;
    type: 'achievement' | 'reminder' | 'recommendation';
    title: string;
    message: string;
    createdAt: string;
    isRead: boolean;
  }>> {
    await delay(300);
    
    // Mock notifications based on progress
    const progressData = this.getStoredProgress();
    const notifications = [];
    
    // Check for completion achievements
    for (const [seriesId, progress] of Object.entries(progressData)) {
      if (progress.status === 'completed') {
        notifications.push({
          id: `achievement-${seriesId}`,
          type: 'achievement' as const,
          title: 'Series Completed! 🎉',
          message: `Congratulations on completing the tutorial series!`,
          createdAt: progress.enrolledAt || new Date().toISOString(),
          isRead: false
        });
      }
    }
    
    return notifications.slice(0, 5); // Return latest 5
  }

  // Private helper methods
  private static getStoredProgress(): { [seriesId: string]: UserProgress } {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_PROGRESS);
    return stored ? JSON.parse(stored) : {};
  }

  private static getStoredRatings(): { [seriesId: string]: SeriesRating } {
    const stored = localStorage.getItem(STORAGE_KEYS.SERIES_RATINGS);
    return stored ? JSON.parse(stored) : {};
  }

  private static getStoredFeedback(): { [feedbackId: string]: UserFeedback } {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_FEEDBACK);
    return stored ? JSON.parse(stored) : {};
  }

  // Utility Methods
  static async clearAllProgress(): Promise<{ success: boolean }> {
    await delay();
    
    try {
      localStorage.removeItem(STORAGE_KEYS.USER_PROGRESS);
      localStorage.removeItem(STORAGE_KEYS.SERIES_RATINGS);
      localStorage.removeItem(STORAGE_KEYS.USER_FEEDBACK);
      
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  }

  static async exportUserData(userId: string = 'current-user'): Promise<{
    progress: { [seriesId: string]: UserProgress };
    feedback: UserFeedback[];
    analytics: {
      totalEnrolledSeries: number;
      completedSeries: number;
      inProgressSeries: number;
      totalWatchTime: number;
    };
  }> {
    await delay();
    
    const progress = this.getStoredProgress();
    const feedback = await this.getUserFeedback(userId);
    const analytics = await this.getLearningAnalytics(userId);
    
    return {
      progress,
      feedback,
      analytics
    };
  }
}

// Export instance methods for easier usage
export const progressAPI = {
  // Enrollment
  enroll: ProgressTrackingService.enrollInSeries,
  unenroll: ProgressTrackingService.unenrollFromSeries,
  
  // Progress
  markVideoCompleted: ProgressTrackingService.markVideoCompleted,
  updateVideoPosition: ProgressTrackingService.updateVideoPosition,
  getUserProgress: ProgressTrackingService.getUserProgress,
  getSeriesProgress: ProgressTrackingService.getSeriesProgress,
  
  // Feedback
  submitRating: ProgressTrackingService.submitSeriesRating,
  submitVideoFeedback: ProgressTrackingService.submitVideoFeedback,
  getUserFeedback: ProgressTrackingService.getUserFeedback,
  
  // Analytics
  getAnalytics: ProgressTrackingService.getLearningAnalytics,
  getNotifications: ProgressTrackingService.getProgressNotifications,
  
  // Utility
  clearAll: ProgressTrackingService.clearAllProgress,
  exportData: ProgressTrackingService.exportUserData
};

export default progressAPI;

import { useContext } from 'react';
import { EducationContext } from '@/contexts/EducationContext';

export const useEducation = () => {
  const context = useContext(EducationContext);
  if (context === undefined) {
    throw new Error('useEducation must be used within an EducationProvider');
  }
  return context;
};

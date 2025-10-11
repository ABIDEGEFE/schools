import React from 'react';
import { Award } from 'lucide-react';

interface LicenseBadgeProps {
  isLicensed: boolean;
  size?: 'sm' | 'md';
}

export const LicenseBadge: React.FC<LicenseBadgeProps> = ({ isLicensed, size = 'md' }) => {
  if (!isLicensed) return null;

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5'
  };

  return (
    <div className="inline-flex items-center">
      <Award className={`${sizeClasses[size]} text-yellow-500`} fill="currentColor" />
    </div>
  );
};
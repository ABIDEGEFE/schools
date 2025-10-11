import React, { useState } from 'react';
import { Button } from '../common/Button';
import { Camera, CheckCircle, AlertCircle } from 'lucide-react';

interface ExamEnvironmentCheckerProps {
  onVerificationComplete: () => void;
}

export const ExamEnvironmentChecker: React.FC<ExamEnvironmentCheckerProps> = ({
  onVerificationComplete
}) => {
  const [verificationStep, setVerificationStep] = useState<'initial' | 'checking' | 'complete'>('initial');

  const startVerification = async () => {
    setVerificationStep('checking');
    
    // Mock verification process
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setVerificationStep('complete');
    setTimeout(() => {
      onVerificationComplete();
    }, 1500);
  };

  return (
    <div className="text-center space-y-6 py-8">
      {verificationStep === 'initial' && (
        <>
          <div className="mb-6">
            <Camera className="h-24 w-24 text-blue-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Environment Verification Required</h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Please allow camera access to verify your exam environment. This ensures academic integrity and a fair testing experience for all students.
            </p>
          </div>
          
          <div className="space-y-3 text-sm text-gray-600 max-w-md mx-auto">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Ensure good lighting</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Clear your workspace</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Have your ID ready</span>
            </div>
          </div>

          <Button onClick={startVerification} size="lg" className="bg-blue-600 hover:bg-blue-700">
            Start Verification
          </Button>
        </>
      )}

      {verificationStep === 'checking' && (
        <>
          <div className="mb-6">
            <div className="animate-pulse">
              <Camera className="h-24 w-24 text-blue-500 mx-auto mb-4" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Verifying Environment...</h2>
            <p className="text-gray-600">
              Please remain still while we verify your exam environment
            </p>
          </div>
          
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Checking camera feed...</span>
          </div>
        </>
      )}

      {verificationStep === 'complete' && (
        <>
          <div className="mb-6">
            <CheckCircle className="h-24 w-24 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-4">Verification Complete!</h2>
            <p className="text-gray-600">
              Your exam environment has been verified. Starting exam...
            </p>
          </div>
        </>
      )}
    </div>
  );
};
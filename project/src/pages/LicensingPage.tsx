import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/StatusBadge';
import { Award, CheckCircle, XCircle, Calendar, Trophy, Megaphone } from 'lucide-react';

export const LicensingPage: React.FC = () => {
  const { state, updateUser } = useAuth();
  const { addNotification } = useNotifications();
  const [examScheduled, setExamScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const user = state.user;

  if (!user) return null;

  const isEligible = user.wins > 0 && user.status === 'green';
  const hasLicense = user.isLicensed;

  const handleScheduleExam = () => {
    const examDate = new Date();
    examDate.setDate(examDate.getDate() + 7); // Schedule for next week
    setScheduledDate(examDate.toLocaleDateString());
    setExamScheduled(true);
    
    addNotification({
      message: 'License exam scheduled successfully!',
      type: 'success'
    });
  };

  const handleTakeExam = async () => {
    // Mock taking the licensing exam
    const passed = Math.random() > 0.3; // 70% pass rate
    
    if (passed) {
      updateUser({ isLicensed: true });
      addNotification({
        message: 'Congratulations! You are now a licensed user!',
        type: 'success'
      });
    } else {
      addNotification({
        message: 'License exam failed. You can retake it in 30 days.',
        type: 'error'
      });
    }
    setExamScheduled(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Licensing Exam</h1>
        <p className="text-gray-600">Become a licensed user to access premium features</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status Card */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Award className="mr-2 h-5 w-5 text-yellow-500" />
            License Status
          </h3>

          {hasLicense ? (
            <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h4 className="text-xl font-bold text-green-800 mb-2">Licensed User</h4>
              <p className="text-green-700">
                Congratulations! You have access to premium features including the Material Bank.
              </p>
            </div>
          ) : (
            <div className="text-center p-6 bg-gray-50 rounded-lg border border-gray-200">
              <XCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-xl font-bold text-gray-800 mb-2">Not Licensed</h4>
              <p className="text-gray-600">
                Complete the licensing requirements to access premium features.
              </p>
            </div>
          )}
        </div>

        {/* Requirements Card */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Requirements</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <span>At least 1 competition win</span>
              </div>
              {user.wins > 0 ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 flex items-center justify-center">
                  <StatusBadge status="green" size="sm" />
                </div>
                <span>Green status level</span>
              </div>
              {user.status === 'green' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Current Progress</h4>
            <div className="text-sm text-blue-800">
              <p>Competition Wins: <strong>{user.wins}</strong></p>
              <p>Status Level: <strong className="capitalize">{user.status}</strong></p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {hasLicense ? (
          <div className="text-center">
            <h3 className="text-lg font-semibold text-green-800 mb-4">
              You are a licensed user!
            </h3>
            <p className="text-gray-600 mb-6">
              You now have access to the Material Bank where you can buy and sell educational materials.
            </p>
            <Button onClick={() => window.location.href = '/bank'}>
              Visit Material Bank
            </Button>
          </div>
        ) : isEligible ? (
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              You're eligible for the licensing exam!
            </h3>
            
            {!examScheduled ? (
              <div>
                <p className="text-gray-600 mb-6">
                  You meet all requirements. Schedule your licensing exam to become a licensed user.
                </p>
                <Button onClick={handleScheduleExam} size="lg">
                  Schedule License Exam
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Exam Scheduled</span>
                  </div>
                  <p className="text-blue-800">Date: {scheduledDate}</p>
                </div>
                
                <p className="text-gray-600 mb-4">
                  Your licensing exam has been scheduled. You can take it now or wait until the scheduled date.
                </p>
                
                <div className="space-y-3">
                  <Button onClick={handleTakeExam} size="lg" className="w-full">
                    Take Exam Now
                  </Button>
                  <Button variant="outline" onClick={() => setExamScheduled(false)} className="w-full">
                    Cancel Exam
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Licensing Requirements Not Met
            </h3>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <p className="text-amber-800 mb-4">
                To be eligible for the licensing exam, you need:
              </p>
              <ul className="text-left text-amber-800 space-y-2">
                <li className="flex items-center space-x-2">
                  {user.wins > 0 ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span>At least 1 competition win (you have {user.wins})</span>
                </li>
                <li className="flex items-center space-x-2">
                  {user.status === 'green' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span>Green status level (you have {user.status})</span>
                </li>
              </ul>
            </div>
            
            <div className="mt-6">
              <p className="text-gray-600">
                Keep participating in competitions and improving your performance to meet these requirements!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Benefits Section */}
      <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg p-6 border border-yellow-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Award className="mr-2 h-5 w-5 text-yellow-600" />
          License Benefits
        </h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Megaphone className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Material Bank Access</h4>
              <p className="text-sm text-gray-600">Create and sell educational materials</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Trophy className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Premium Competitions</h4>
              <p className="text-sm text-gray-600">Access to exclusive high-level competitions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
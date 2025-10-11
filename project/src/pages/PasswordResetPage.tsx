import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import { api } from '../utils/api';
import { Button } from '../components/common/Button';
import { Mail, Key, Lock } from 'lucide-react';

export const PasswordResetPage: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [step, setStep] = useState<'email' | 'token'>('email');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    token: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Mock sending reset token
      await new Promise(resolve => setTimeout(resolve, 1000));
      addNotification({
        message: 'Reset token sent to your email!',
        type: 'success'
      });
      setStep('token');
    } catch (error) {
      addNotification({
        message: 'Error sending reset token. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      addNotification({
        message: 'Passwords do not match!',
        type: 'error'
      });
      return;
    }

    if (formData.newPassword.length < 8) {
      addNotification({
        message: 'Password must be at least 8 characters long!',
        type: 'error'
      });
      return;
    }

    setLoading(true);

    try {
      await api.resetPassword(formData.email, formData.token, formData.newPassword);
      addNotification({
        message: 'Password reset successfully! Please login with your new password.',
        type: 'success'
      });
      navigate('/login');
    } catch (error) {
      addNotification({
        message: 'Invalid token or error resetting password.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Reset Password</h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === 'email' ? 'Enter your email to receive a reset token' : 'Enter your reset token and new password'}
          </p>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleEmailSubmit} className="mt-8 space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full">
              Send Reset Token
            </Button>
          </form>
        ) : (
          <form onSubmit={handlePasswordReset} className="mt-8 space-y-6">
            <div>
              <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-1">
                Reset Token
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  id="token"
                  name="token"
                  type="text"
                  required
                  value={formData.token}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter reset token from email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  required
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter new password"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full">
              Reset Password
            </Button>
          </form>
        )}

        <div className="text-center">
          <Link 
            to="/login" 
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            Back to Login
          </Link>
        </div>

        {step === 'email' && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Demo:</strong> Use token "DEMO123" after submitting any email address.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { api } from '../utils/api';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/StatusBadge';
import { LicenseBadge } from '../components/common/LicenseBadge';
import { Upload, User, Mail, Trophy, Sword } from 'lucide-react';
import { ReceiverModal } from '../components/competition/ReceiverModal';
import { SenderModal } from '../components/competition/SenderModal';
import { CommonModal } from '../components/competition/CommonModal';
import { useNavigate } from 'react-router-dom';

export const UserProfilePage: React.FC = () => {
  const { state, updateUser, updateCompetition, resetCompetition } = useAuth();
  const { addNotification } = useNotifications();
  const [uploading, setUploading] = useState(false);
  const [now, setNow] = useState(new Date());

  // WebSocket is handled centrally in AuthContext now

  const navigate = useNavigate();
  const user = state.user;
  const competition = state.competition;
  

  const [isSenderModalOpen, setSenderModalOpen] = useState(false);
  const [isReceiverModalOpen, setReceiverModalOpen] = useState(false);
  const [isCommonModalOpen, setCommonModalOpen] = useState(false);

  // Open the appropriate modal automatically when competition state changes
  useEffect(() => {
    if (competition?.status === 'pending') {
      if (competition.isReceiver) {
        setReceiverModalOpen(true);
      } else {
        setSenderModalOpen(true);
      }
    } else {
      // close modals for other statuses
      setReceiverModalOpen(false);
      setSenderModalOpen(false);
    }
  }, [competition?.status, competition?.isReceiver]);


  useEffect(() => {
    // update every second while a competition is scheduled (for the countdown)
    if ((competition.status === 'accepted' || competition.status === 'scheduled') && competition.scheduledDate) {
      const timer = setInterval(() => setNow(new Date()), 1000);
      return () => clearInterval(timer);
    }
  }, [competition.status, competition.scheduledDate]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addNotification({
        message: 'Please select an image file',
        type: 'error'
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addNotification({
        message: 'File size must be less than 5MB',
        type: 'error'
      });
      return;
    }

    setUploading(true);

    try {
      const imageUrl = await api.uploadProfilePicture(file);
      updateUser({ profilePicture: imageUrl });
      addNotification({
        message: 'Profile picture updated successfully!',
        type: 'success'
      });
    } catch (error) {
      addNotification({
        message: 'Error uploading profile picture',
        type: 'error'
      });
    } finally {
      setUploading(false);
    }
  };

  // Competition feature logic
  let competitionLabel = 'Make Competition';
  let competitionAction: (() => void) | null = null;
  let competitionBg = 'bg-blue-100 hover:bg-blue-200';
  let competitionAnimated = false;
  let competitionInfo: React.ReactNode = null;

  if (competition.status === 'pending') {
    competitionLabel = 'Upcoming Competition';
    competitionBg = 'bg-yellow-100 animate-pulse';
    competitionAnimated = true;
    competitionInfo = (
      <div className="text-sm text-yellow-700 mt-2">
        Waiting for opponent to accept...
      </div>
    );
    competitionAction = () => {
      // open either sender or receiver modal depending on who the current user is
      if (competition.isReceiver) {
        setReceiverModalOpen(true);
      } else {
        setSenderModalOpen(true);
      }
    };
  } else if (competition.status === 'accepted' || competition.status === 'scheduled') {
    competitionLabel = 'Upcoming Competition';
    competitionBg = 'bg-green-100 animate-pulse';
    competitionAnimated = true;
    console.log('competition schedule date is', competition.scheduledDate);
    competitionInfo = (
      <div className="text-sm text-green-700 mt-2">
  Competition scheduled with <span className="font-semibold">{competition.opponent?.name}</span> from <span className="font-semibold">{(competition.opponent?.school as any)?.name || competition.opponent?.school || ''}</span>.<br />
        Date: <span className="font-semibold">{competition.scheduledDate ? new Date(competition.scheduledDate).toLocaleString() : '' }</span>
        {competition.scheduledDate && (() => {
          const scheduledMs = new Date(competition.scheduledDate).getTime();
          const rem = scheduledMs - now.getTime();
          if (rem > 0) {
            const minutes = Math.floor(rem / 60000);
            const seconds = Math.floor((rem % 60000) / 1000).toString().padStart(2, '0');
            return (
              <div className="text-sm text-green-700 mt-1">Starts in <span className="font-semibold">{minutes}:{seconds}</span></div>
            );
          }
          return null;
        })()}
      </div>
    );
    competitionAction = () => {
      setCommonModalOpen(true);
    };
    // If the scheduled date is reached, allow to start
    if (competition.status === 'scheduled' && competition.scheduledDate && now >= new Date(competition.scheduledDate)) {
      competitionLabel = 'Start Competition';
      competitionBg = 'bg-red-100 animate-bounce';
      competitionAnimated = true;
      competitionAction = () => {
        navigate('/competition');
        resetCompetition();
      };
      competitionInfo = (
        <div className="text-sm text-red-700 mt-2 font-semibold">
          Competition is ready! Click to start.
        </div>
      );
    }
  } else {
    // Default: make competition
    competitionAction = () => {
      // Reset any previous competition state
      resetCompetition();
      navigate('/explore/schools');
    };
  }

  if (!user) return null;
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">Manage your account information and preferences</p>
        </div>
        {/* Competition Feature Button */}
        <div>
          <Button
            onClick={competitionAction || (() => {})}
            className={`flex items-center space-x-2 font-bold shadow ${competitionBg} transition-all duration-300`}
            style={competitionAnimated ? { boxShadow: '0 0 10px 2px #fbbf24' } : {}}
          >
            <Sword className="h-5 w-5" />
            <span>{competitionLabel}</span>
          </Button>
          {competitionInfo}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Picture Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="mb-6">
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt="Profile"
                  className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-gray-100"
                />
              ) : (
                <div className="w-32 h-32 rounded-full mx-auto bg-gray-200 flex items-center justify-center border-4 border-gray-100">
                  <User className="h-16 w-16 text-gray-400" />
                </div>
              )}
            </div>

            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploading}
              />
              <Button
                variant="outline"
                loading={uploading}
                disabled={uploading}
                className="w-full flex items-center justify-center space-x-2"
              >
                <Upload size={16} />
                <span>Upload Picture</span>
              </Button>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Max 5MB, JPG/PNG only
            </p>
          </div>
        </div>

        {/* User Information */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="mr-2 h-5 w-5 text-blue-600" />
              Account Information
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <p className="text-gray-900">{user.name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <p className="text-gray-900">{user.email}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <p className="text-gray-900">
                    {user.role === 'AD' ? 'Administrator' : user.role === 'TC' ? 'Teacher' : 'Student'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Status</label>
                  <StatusBadge status={user.status} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">License Status</label>
                  <div className="flex items-center space-x-2">
                    {user.is_licensed ? (
                      <>
                        <LicenseBadge isLicensed={user.is_licensed} size="sm" />
                        <span className="text-green-600 font-medium">Licensed</span>
                      </>
                    ) : (
                      <span className="text-gray-500">Not Licensed</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Competition Record</label>
                  <div className="flex items-center space-x-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <span className="text-gray-900 font-medium">{user.wins} wins</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Status Level</p>
              <p className="text-2xl font-bold text-blue-900 capitalize">{user.status}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <StatusBadge status={user.status} />
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-800">Competition Wins</p>
              <p className="text-2xl font-bold text-yellow-900">{user.wins}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Trophy className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">License Status</p>
              <p className="text-2xl font-bold text-green-900">
                {user.is_licensed ? 'Licensed' : user.wins > 0 && user.status == 'green'? "pending" : "Not licensed"}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              {/* <Award className={`h-6 w-6 ${user.isLicensed ? 'text-green-600' : 'text-gray-400'}`} /> */}
              <LicenseBadge isLicensed={user.is_licensed} size="md" />
            </div>
          </div>
        </div>
      </div>

    {/* Competition Modals */}
    <>
    {competition.id && 
         <SenderModal
        isOpen={isSenderModalOpen}
        onClose={() => setSenderModalOpen(false)}
        onCancel={async () => {
          if (!competition.id) return setSenderModalOpen(false);
          const response = await api.updateCompetition(competition.id as string, { status: 'none' });
          updateCompetition({ status: response.status });
          setSenderModalOpen(false);
        }}
  opponentName={competition.opponent?.name || ''}
  opponentSchool={typeof competition.opponent?.school === 'object' ? (competition.opponent?.school as any)?.name: ''}
      />
      }

     {competition.id && 
      <ReceiverModal
        isOpen={isReceiverModalOpen}
        onClose={() => setReceiverModalOpen(false)}
        onAccept={async () => {
            if (!competition.id) return;
      const response = await api.updateCompetition(competition.id as string, { status: 'scheduled' });
      console.log('response after accepting competition', response);
      updateCompetition({ status: response.status, scheduledDate: response.scheduled_date || response.scheduledDate });
            setReceiverModalOpen(false);
            setCommonModalOpen(true);

        }}
        onReject={async () => {
            if (!competition.id) return;
            const response = await api.updateCompetition(competition.id as string, { status: 'none' });
            console.log('response after rejecting competition', response);
            updateCompetition({ status: response.status });
            setReceiverModalOpen(false);
          }
        }
  senderName={competition.opponent?.name || ''}
      />
     }

      <CommonModal
        isOpen={isCommonModalOpen}
        onClose={() => setCommonModalOpen(false)}
        scheduledDate={competition.scheduledDate}
      />

    </>
  </div>
)};
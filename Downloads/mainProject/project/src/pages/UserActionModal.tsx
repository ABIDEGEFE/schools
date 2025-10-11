// import { User } from '../data/mockData';
import { User } from '../contexts/AuthContext';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/StatusBadge';
import { LicenseBadge } from '../components/common/LicenseBadge';
import { UserIcon, MessageCircle, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';


interface UserActionsModalProps {
  user: User | null;
  currentUser: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (user: User) => void;
  onSendCompetitionRequest: (user: User) => void;
  selectedUserId?: string | null;
  selectedSchoolId?: string | null;
}
// ...existing code...

export const UserActionsModal: React.FC<UserActionsModalProps> = ({
  // selectedUserId,
  user,
  currentUser,
  isOpen,
  onClose,
  onSendMessage,
  onSendCompetitionRequest
}) => {
  const navigate = useNavigate();
  
  if (!user || !currentUser) return null;
  const canCompete = currentUser?.status === user.status;

  // Handler for navigating to messages page with selected user
  const handleNavigateToMessages = () => {
    onSendMessage(user);
    navigate(`/messages?userId=${user.id}`, {
      state: { selectedUserId: user.id }
    });
    onClose();
  };

  // Handler for navigating to marketplace as a buyer (NOT seller's bank)
  const handleBuyMaterial = () => {
    // Route to marketplace and pass sellerId as query param
    navigate(`/marketplace?sellerId=${user.id}`);
    onClose();
  };

  // Handler for navigating to user's bank/materials page (for sellers)
  // const handleNavigateToBank = () => {
  //   navigate(`/bank?userId=${user.id}`);
  //   onClose();
  // };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Connect with ${user.name}`}
      size="sm"
    >
      <div className="space-y-4">
        <div className="text-center">
          <div className="flex justify-center mb-3">
            {user.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user.name}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                <UserIcon className="h-10 w-10 text-gray-400" />
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
            <LicenseBadge isLicensed={user.is_licensed} />
          </div>
          
          <div className="flex items-center justify-center space-x-3 mb-4">
            <StatusBadge status={user.status} size="sm" />
            <span className="text-sm text-gray-600">
              {user.role === 'TC' ? 'Teacher' : 'Student'} • {user.wins} wins
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleNavigateToMessages}
            className="w-full flex items-center justify-center space-x-2"
          >
            <MessageCircle size={16} />
            <span>Send Message</span>
          </Button>

          <Button
            variant={canCompete ? "success" : "outline"}
            disabled={!canCompete}
            onClick={() => onSendCompetitionRequest(user)}
            className="w-full flex items-center justify-center space-x-2"
          >
            <Trophy size={16} />
            <span>Send Competition Request</span>
          </Button>

          <Button
            variant={user.is_licensed ? "primary" : "outline"}
            disabled={!user.is_licensed}
            onClick={user.is_licensed ? handleBuyMaterial : undefined}
            className="w-full flex items-center justify-center space-x-2"
          >
            <span>Buy Materials</span>
          </Button>

          {!canCompete && (
            <p className="text-sm text-amber-600 text-center bg-amber-50 p-2 rounded-md">
              You can only compete with users who have the same status level as you.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};
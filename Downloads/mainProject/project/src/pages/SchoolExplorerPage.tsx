import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { api } from '../utils/api';
import { School, User } from '../data/mockData';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/StatusBadge';
import { LicenseBadge } from '../components/common/LicenseBadge';
import { UserActionsModal } from './UserActionModal';
import {Search, ChevronLeft, User as UserIcon } from 'lucide-react';


export const SchoolExplorerPage: React.FC = () => {
  const { state,  updateCompetition } = useAuth();
  const { addNotification } = useNotifications();
  const [searchTerm, setSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [schoolUsers, setSchoolUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const schoolData = await api.getSchools();
        setSchools(schoolData);
      } catch (error) {
        addNotification({
          message: 'Error loading schools',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSchools();
  }, [addNotification]);

  const filteredSchools = schools.filter(school =>
    school.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

    // Filter users based on user search term
  const filteredSchoolUsers = schoolUsers.filter(user =>
    user.name.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const handleSchoolSelect = async (school: School, schoolID: string) => {
    setSelectedSchool(school);
    setSelectedSchoolId(schoolID);
    setUsersLoading(true);

    try {
      const userData = await api.getUsers(school.id);
      setSchoolUsers(userData.filter(u => u.id !== state.user?.id)); // Exclude current user
    } catch (error) {
      addNotification({
        message: 'Error loading school users',
        type: 'error'
      });
    } finally {
      setUsersLoading(false);
    }
  };

  const handleSendCompetitionRequest = (targetUser: User) => {
    if (state.user?.status !== targetUser.status) {
      addNotification({
        message: `You cannot compete with ${targetUser.name} because you are not on the same status.`,
        type: 'warning'
      });
      return;
    }

    updateCompetition({
    status: 'pending',
    opponent: {
      id: targetUser.id,
      name: targetUser.name,
      school: selectedSchool?.name || ''
    }
  });

    // Mock sending competition request
    addNotification({
      message: `Competition request sent to ${targetUser.name}!`,
      type: 'success'
    });
    setSelectedUser(null);
  };

  const handleSendMessage = (targetUser: User) => {
    // Mock sending message
    addNotification({
      message: `Starting conversation with ${targetUser.name}!`,
      type: 'info'
    });
    // setSelectedUser(null);
    return;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Explore Schools</h1>
        <p className="text-gray-600">Connect with users from other educational institutions</p>
      </div>

            {/* Fixed Search Bar */}
      <div className="mb-4 max-w-md sticky top-0 z-10 bg-white pt-2 pb-2">
        <div className="relative">
          <input
            type="text"
            placeholder={selectedSchool ? "Search students..." : "Search schools..."}
            value={selectedSchool ? userSearchTerm : searchTerm}
            onChange={e => selectedSchool ? setUserSearchTerm(e.target.value) : setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        </div>
      </div>

      {!selectedSchool ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSchools.length > 0 ? (
            filteredSchools.map((school) => (
              <div
                key={school.id}
                onClick={() => {
                  handleSchoolSelect(school, school.id);
                  setUserSearchTerm(''); // Reset user search on school select
                }}
                className="bg-white rounded-lg shadow-sm p-6 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">{school.name}</h3>
                  <StatusBadge status={school.status} size="sm" />
                </div>
                <p className="text-sm text-gray-600 mb-4">{school.address}</p>
                <Button variant="outline" size="sm" className="w-full">
                  View Users
                </Button>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-500 py-12">
              No schools found.
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedSchool(null);
                setSchoolUsers([]);
                setUserSearchTerm('');
              }}
              className="flex items-center space-x-2"
            >
              <ChevronLeft size={16} />
              <span>Back to Schools</span>
            </Button>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{selectedSchool.name}</h2>
              <p className="text-sm text-gray-600">Users in this school</p>
            </div>
          </div>

          {usersLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredSchoolUsers.length > 0 ? (
                filteredSchoolUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => {
                      setSelectedUser(user);
                      setSelectedUserId(user.id);
                    }}
                    className="bg-white rounded-lg shadow-sm p-6 cursor-pointer transition-all duration-200 hover:shadow-md"
                  >
                    <div className="text-center">
                      {user.profilePicture ? (
                        <img
                          src={user.profilePicture}
                          alt={user.name}
                          className="w-16 h-16 rounded-full mx-auto mb-3 object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full mx-auto mb-3 bg-gray-200 flex items-center justify-center">
                          <UserIcon className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      
                      <h3 className="font-semibold text-gray-900 flex items-center justify-center space-x-2">
                        <span>{user.name}</span>
                        <LicenseBadge isLicensed={user.isLicensed} size="sm" />
                      </h3>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        {user.role === 'TC' ? 'Teacher' : 'Student'}
                      </p>
                      
                      <div className="flex items-center justify-center space-x-2 mb-3">
                        <StatusBadge status={user.status} size="sm" />
                        <span className="text-sm text-gray-500">{user.wins} wins</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center text-gray-500 py-12">
                  No users found.
                </div>
              )}
            </div>
          )}

          {!usersLoading && filteredSchoolUsers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No users found in this school.</p>
            </div>
          )}
        </div>
      )}

      {selectedUser && (
        <UserActionsModal
          user={selectedUser}
          currentUser={state.user}
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          onSendMessage={handleSendMessage}
          onSendCompetitionRequest={handleSendCompetitionRequest} // handleSendCompetitionRequest(targetUser: User)
        />
      )}
    </div>
  );
};

// interface UserActionsModalProps {
//   user: User | null;
//   currentUser: User | null;
//   isOpen: boolean;
//   onClose: () => void;
//   onSendMessage: (user: User) => void;
//   onSendCompetitionRequest: (user: User) => void;
// }
// // ...existing code...

// const UserActionsModal: React.FC<UserActionsModalProps> = ({
//   user,
//   currentUser,
//   isOpen,
//   onClose,
//   onSendMessage,
//   onSendCompetitionRequest
// }) => {
//   const navigate = useNavigate();

//   if (!user) return null;

//   const canCompete = currentUser?.status === user.status;

//   // Handler for navigating to messages page with selected user
//   const handleNavigateToMessages = () => {
//     navigate(`/messages?userId=${user.id}`);
//     onSendMessage(user);
//     onClose();
//   };

//   // Handler for navigating to marketplace as a buyer (NOT seller's bank)
//   const handleBuyMaterial = () => {
//     // Route to marketplace and pass sellerId as query param
//     navigate(`/marketplace?sellerId=${user.id}`);
//     onClose();
//   };

//   // Handler for navigating to user's bank/materials page (for sellers)
//   // const handleNavigateToBank = () => {
//   //   navigate(`/bank?userId=${user.id}`);
//   //   onClose();
//   // };

//   return (
//     <Modal
//       isOpen={isOpen}
//       onClose={onClose}
//       title={`Connect with ${user.name}`}
//       size="md"
//     >
//       <div className="space-y-4">
//         <div className="text-center">
//           <div className="flex justify-center mb-3">
//             {user.profilePicture ? (
//               <img
//                 src={user.profilePicture}
//                 alt={user.name}
//                 className="w-20 h-20 rounded-full object-cover"
//               />
//             ) : (
//               <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
//                 <UserIcon className="h-10 w-10 text-gray-400" />
//               </div>
//             )}
//           </div>
          
//           <div className="flex items-center justify-center space-x-2 mb-2">
//             <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
//             <LicenseBadge isLicensed={user.isLicensed} />
//           </div>
          
//           <div className="flex items-center justify-center space-x-3 mb-4">
//             <StatusBadge status={user.status} size="sm" />
//             <span className="text-sm text-gray-600">
//               {user.role === 'TC' ? 'Teacher' : 'Student'} • {user.wins} wins
//             </span>
//           </div>
//         </div>

//         <div className="space-y-3">
//           <Button
//             onClick={handleNavigateToMessages}
//             className="w-full flex items-center justify-center space-x-2"
//           >
//             <MessageCircle size={16} />
//             <span>Send Message</span>
//           </Button>

//           <Button
//             variant={canCompete ? "success" : "outline"}
//             disabled={!canCompete}
//             onClick={() => onSendCompetitionRequest(user)}
//             className="w-full flex items-center justify-center space-x-2"
//           >
//             <Trophy size={16} />
//             <span>Send Competition Request</span>
//           </Button>

//           <Button
//             variant={user.isLicensed ? "primary" : "outline"}
//             disabled={!user.isLicensed}
//             onClick={user.isLicensed ? handleBuyMaterial : undefined}
//             className="w-full flex items-center justify-center space-x-2"
//           >
//             <span>Buy Materials</span>
//           </Button>

//           {!canCompete && (
//             <p className="text-sm text-amber-600 text-center bg-amber-50 p-2 rounded-md">
//               You can only compete with users who have the same status level as you.
//             </p>
//           )}
//         </div>
//       </div>
//     </Modal>
//   );
// };
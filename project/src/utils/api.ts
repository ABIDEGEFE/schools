import { School, User, Exam, Announcement, Material, Question } from '../data/mockData';
import { mockSchools, mockUsers, mockExams, mockAnnouncements, mockMaterials, mockQuestions } from '../data/mockData';
import { useAuth } from '../contexts/AuthContext';
// Mock API functions - replace with actual axios calls when integrating with Django
// Use sessionStorage so token is scoped to a single browser tab/window
const token = () => sessionStorage.getItem('token');

const schoolIDFunction = () => {
  const { state } = useAuth();
  return state.selectedSchoolId;
}
//  console.log('Selected school ID in api.ts:', setSelectedSchool);
export const api = {

    login: async (email: string, password: string, schoolID: string): Promise<User> => {
      console.log('Logging in with school ID:', schoolID);
      const response = await fetch(`http://localhost:8000/api/login/${schoolID}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        throw new Error('Login failed');
      }
      const data = await response.json();
      // console.log('response data:', data);
  const token = data.token; // Store the token for future requests
  // store in sessionStorage so each tab keeps its own session
  sessionStorage.setItem('token', token);
      return data.user as User;
    },

  resetPassword: async (email: string, token: string, newPassword: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Mock password reset
    console.log('Password reset for:', email);
  },

  // Schools
  getSchools: async (): Promise<School[]> => {
    const response = await fetch('http://localhost:8000/api/schools/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token()}`, // Include token in headers
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch schools');
    }
    const data = await response.json();
    console.log('fetched schools', data)
    return data as School[];
  },

  // Users
  getUsers: async (schoolId: string): Promise<User[]> => {
    const response = await fetch(`http://localhost:8000/api/schools/${schoolId}/users/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token()}`, // Include token in headers
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    const data = await response.json();
    return data as User[];  
  },

  createUser: async (userData: Omit<User, 'id'>): Promise<User> => {
    const response = await fetch('http://localhost:8000/api/register/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token()}`, // Include token in headers
      },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      throw new Error('Failed to create user');
    }
    const newUser = await response.json();
    return newUser as User; 
  },

  updateUser: async (id: string, updates: Partial<User>): Promise<User> => {
    const response = await fetch(`http://localhost:8000/api/update/users/${id}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token()}`, // Include token in headers
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      throw new Error('Failed to update user');
    }
    const updatedUser = await response.json();
    return updatedUser as User;
  },

  deleteUser: async (id: string): Promise<void> => {
    const response = await fetch(`http://localhost:8000/api/delete/users/${id}/`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token()}`,
      },
    });
    if (response.status === 204 || response.ok) {
      return;
    }
    const err = await response.json().catch(() => ({ detail: 'Delete failed' }));
    throw new Error(err.detail || 'Failed to delete user');
  },

  getUsersByStatus: async (status: 'green' | 'yellow' | 'red', schoolId: string): Promise<User[]> => {
    // Backend expects the school id as a path parameter: /api/users/status/{status}/{school_id}/
    const response = await fetch(`http://localhost:8000/api/users/status/${status}/${schoolId}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token()}`, // Include token in headers
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch users by status');
    }
    const data = await response.json();
    return data.filter((user: User) => user.status === status) as User[];
    // await new Promise(resolve => setTimeout(resolve, 500));
    // return mockUsers.filter(user => user.status === status);
  },

  // Get all users (across schools)
  getAllUsers: async (): Promise<User[]> => {
    const response = await fetch('http://localhost:8000/api/users/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token()}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    const data = await response.json();
    return data as User[];
  },

  // Messages
  getMessageHistory: async (otherUserId: string): Promise<any[]> => {
    const response = await fetch(`http://localhost:8000/api/messages/history/${otherUserId}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token()}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch message history');
    }
    const data = await response.json();
    return data;
  },

  // Exams
  getExams: async (): Promise<Exam[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockExams;
  },

  getExamQuestions: async (examId: string): Promise<Question[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockQuestions;
  },

  submitExam: async (examId: string, answers: number[]): Promise<{ score: number; passed: boolean }> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const correctAnswers = mockQuestions.map(q => q.correctAnswer);
    const score = answers.reduce((acc, answer, index) => {
      return acc + (answer === correctAnswers[index] ? 1 : 0);
    }, 0);
    const percentage = (score / correctAnswers.length) * 100;
    return { score: percentage, passed: percentage >= 70 };
  },

  // Announcements
  getAnnouncements: async (schoolId: string): Promise<Announcement[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockAnnouncements.filter(a => a.schoolId === schoolId);
  },

  createAnnouncement: async (announcement: Omit<Announcement, 'id' | 'createdAt'>): Promise<Announcement> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newAnnouncement: Announcement = {
      ...announcement,
      id: (mockAnnouncements.length + 1).toString(),
      createdAt: new Date().toISOString(),
    };
    mockAnnouncements.push(newAnnouncement);
    return newAnnouncement;
  },

  // Materials
  getMaterials: async (): Promise<Material[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockMaterials;
  },

  createMaterial: async (material: Omit<Material, 'id' | 'upvotes' | 'downvotes' | 'comments'>): Promise<Material> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newMaterial: Material = {
      ...material,
      id: (mockMaterials.length + 1).toString(),
      upvotes: 0,
      downvotes: 0,
      comments: [],
    };
    mockMaterials.push(newMaterial);
    return newMaterial;
  },

  voteMaterial: async (materialId: string, vote: 'up' | 'down'): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const material = mockMaterials.find(m => m.id === materialId);
    if (material) {
      if (vote === 'up') {
        material.upvotes++;
      } else {
        material.downvotes++;
      }
    }
  },

  // Profile picture upload
  uploadProfilePicture: async (file: File): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log(file)
    // Mock file upload - return placeholder URL
    return `https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400`;
  },
};
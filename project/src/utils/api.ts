import { School, User, Exam, Announcement, Material, Question } from '../data/mockData';
import { mockExams, mockMaterials, mockQuestions } from '../data/mockData';
// Mock API functions - replace with actual axios calls when integrating with Django
// Use sessionStorage so token is scoped to a single browser tab/window

// Ensure cookies are sent/received on every request for session auth
const fetchWithCreds = (url: string, options: RequestInit = {}) => fetch(url, { credentials: 'include', ...options });

// Extract CSRF token from cookies for unsafe methods (POST/PATCH/DELETE)
const getCsrfToken = (): string | undefined => {
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : undefined;
};

// NOTE: this file used some mock helpers during initial scaffolding; keep focused helpers only
export const api = {

  login: async (username: string, password: string) => {
    const response = await fetchWithCreds('http://localhost:8000/api/users/login_view/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    // console.log("Login response:", response);
    if (!response.ok) {
      console.log("Login failed with status:", response.status);
      throw new Error('Login failed');
    }
    else{

      const data = await response.json();
      console.log("Login successful, response data:", data);
      const userInfo = data.user as User;
      return userInfo;
    }
  },

  logout: async (): Promise<string> => {
    const response = await fetchWithCreds('http://localhost:8000/api/users/logout_view/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(getCsrfToken() ? { 'X-CSRFToken': getCsrfToken()! } : {}),
      },
    });

    const data = await response.text();
    console.log("Logout response data:", data);
    if (!response.ok) {
      throw new Error('Logout failed');
    }
    return data;
  },

  resetPassword: async (email: string, _token: string, _newPassword: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Mock password reset
    console.log('Password reset for:', email);
  },

  // Schools
  getSchools: async (): Promise<School[]> => {
    const response = await fetchWithCreds('http://localhost:8000/api/schools/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch schools');
    }
    const data = await response.json();
    console.log('fetched schools', data)
    return data as School[];
  },

  createSchool: async (schoolData: Omit<School, 'id'>): Promise<School> => {
    const response = await fetchWithCreds('http://localhost:8000/api/schools/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(getCsrfToken() ? { 'X-CSRFToken': getCsrfToken()! } : {}),
      },
      body: JSON.stringify(schoolData),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Create failed' }));
      throw new Error(err.detail || 'Failed to create school');
    }
    const newSchool = await response.json();
    return newSchool as School;
  },

  updateSchool: async (id: string, updates: Partial<School>): Promise<School> => {
    console.log("API updateSchool called with id:", id, "and updates:", updates);
    const response = await fetchWithCreds(`http://localhost:8000/api/schools/${id}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(getCsrfToken() ? { 'X-CSRFToken': getCsrfToken()! } : {}),
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Update failed' }));
      throw new Error(err.detail || 'Failed to update school');
    }
    const updated = await response.json();
    return updated as School;
  },

  deleteSchool: async (id: string): Promise<void> => {
    const response = await fetchWithCreds(`http://localhost:8000/api/schools/${id}/`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(getCsrfToken() ? { 'X-CSRFToken': getCsrfToken()! } : {}),
      },
    });
    if (response.status === 204 || response.ok) {
      return;
    }
    const err = await response.json().catch(() => ({ detail: 'Delete failed' }));
    throw new Error(err.detail || 'Failed to delete school');
  },

  getSchoolsByStatus: async (status: 'active' | 'inactive'): Promise<School[]> => {
    const response = await fetchWithCreds(`http://localhost:8000/api/schools/get_schools_by_status/${status}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch schools by status');
    }
    const data = await response.json();
    return data as School[];
  },

  // Users
  registerAdmin: async (adminData: { name: string; email: string; password: string; schoolId: string; role: string }): Promise<User> => {
    const response = await fetchWithCreds('http://localhost:8000/api/register/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(getCsrfToken() ? { 'X-CSRFToken': getCsrfToken()! } : {}),
      },
      body: JSON.stringify(adminData),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Registration failed' }));
      throw new Error(err.detail || 'Failed to register admin');
    }
    const newAdmin = await response.json();
    return newAdmin as User; 
  },

  getUsers: async (schoolId: string): Promise<User[]> => {
    const response = await fetchWithCreds(`http://localhost:8000/api/users/get_users_by_school/${schoolId}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    const data = await response.json();
    return data as User[];  
  },

  createUser: async (userData: Omit<User, 'id'>): Promise<User> => {
    const response = await fetchWithCreds('http://localhost:8000/api/users/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(getCsrfToken() ? { 'X-CSRFToken': getCsrfToken()! } : {}),
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
    const response = await fetchWithCreds(`http://localhost:8000/api/users/${id}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(getCsrfToken() ? { 'X-CSRFToken': getCsrfToken()! } : {}),
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
    const response = await fetchWithCreds(`http://localhost:8000/api/users/${id}/`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(getCsrfToken() ? { 'X-CSRFToken': getCsrfToken()! } : {}),
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
    const response = await fetchWithCreds(`http://localhost:8000/api/users/get_user_by_status/${schoolId}/${status}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
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
    const response = await fetchWithCreds('http://localhost:8000/api/users/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    const data = await response.json();
    return data as User[];
  },

  // Messages
  getMessageHistory: async (otherUserId: string, currentUserId: string): Promise<any[]> => {
    const response = await fetchWithCreds(`http://localhost:8000/api/messages/get_messages_between/${otherUserId}/${currentUserId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch message history');
    }
    const data = await response.json();
    return data;
  },

  // Fetch conversations (threads) the backend exposes
  getConversations: async (): Promise<any[]> => {
    const response = await fetchWithCreds('http://localhost:8000/api/conversations/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch conversations');
    }
    const data = await response.json();
    return data;
  },

  // Competitions
  sendCompetition: async (payload: { senderId: string; receiverId: string; schoolId?: string }): Promise<any> => {
    const response = await fetchWithCreds('http://localhost:8000/api/competitions/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(getCsrfToken() ? { 'X-CSRFToken': getCsrfToken()! } : {}),
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Failed to send competition request' }));
      throw new Error(err.detail || 'Failed to send competition request');
    }
    return await response.json();
  },

  updateCompetition: async (id: string, updates: Partial<any>): Promise<any> => {
    const response = await fetchWithCreds(`http://localhost:8000/api/competitions/${id}/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(getCsrfToken() ? { 'X-CSRFToken': getCsrfToken()! } : {}),
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Failed to update competition' }));
      throw new Error(err.detail || 'Failed to update competition');
    }
    return await response.json();
  },

  getCompetitionBetween: async (userA: string, userB: string): Promise<any[]> => {
    const response = await fetchWithCreds(`http://localhost:8000/api/competitions/?sender=${userA}&receiver=${userB}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch competitions');
    }
    return await response.json();
  },

  // Fetch competitions where the given user is either sender or receiver
  getCompetitionsForUser: async (userId: string): Promise<any[]> => {
    const bySender = await fetchWithCreds(`http://localhost:8000/api/competitions/?sender=${userId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const senderData = bySender.ok ? await bySender.json() : [];

    const byReceiver = await fetchWithCreds(`http://localhost:8000/api/competitions/?receiver=${userId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const receiverData = byReceiver.ok ? await byReceiver.json() : [];

    // merge unique by id
    const map: Record<string, any> = {};
    [...senderData, ...receiverData].forEach((c: any) => { map[c.id] = c; });
    return Object.values(map);
  },

  // Exams
  getExams: async (): Promise<Exam[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockExams;
  },

  getExamQuestions: async (_examId: string): Promise<Question[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockQuestions;
  },

  submitExam: async (_examId: string, answers: number[]): Promise<{ score: number; passed: boolean }> => {
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
    const response = await fetchWithCreds('http://localhost:8000/api/announcements/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch announcements');
    }
    const data = await response.json();
    // normalize backend created_at to createdAt and filter by school if needed
    const normalized = data.map((a: any) => ({ ...a, createdAt: a.created_at || a.createdAt }));
    return normalized.filter((a: any) => !a.school || a.school.id === schoolId || a.author?.role === 'SA');
  },

  createAnnouncement: async (announcement: Omit<Announcement, 'id' | 'createdAt'>): Promise<Announcement> => {
    const response = await fetchWithCreds('http://localhost:8000/api/announcements/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(announcement),
    });
    if (!response.ok) {
      throw new Error('Failed to create announcement');
    }
    const data = await response.json();
    return data as Announcement;  
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
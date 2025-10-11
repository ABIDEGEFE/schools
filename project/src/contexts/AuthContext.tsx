import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { api } from '../utils/api';


export interface User {
  id: string;
  name: string;
  email: string;
  role: 'AD' | 'TC' | 'ST'; // Admin, Teacher, Student
  schoolId: string;
  status: 'green' | 'yellow' | 'red';
  is_licensed: boolean;
  wins: number;
  profilePicture?: string;
}

interface AuthState {
  user: User | null;
  selectedSchoolId: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  competition: Competition;
}

interface Competition {
  status: 'none' | 'pending' | 'accepted' | 'scheduled' | 'ready';
  scheduledDate?: string;
  opponent?: {
    id: string;
    name: string;
    school: string;
  };
}

// interface AuthState {
//   user: User | null;
//   selectedSchoolId: string | null;
//   isAuthenticated: boolean;
//   loading: boolean;

// }

type AuthAction = 
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_SELECTED_SCHOOL'; payload: string }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_COMPETITION'; payload: Partial<Competition> }
  | { type: 'RESET_COMPETITION' };

const initialState: AuthState = {
  user: null,
  selectedSchoolId: localStorage.getItem('selectedSchoolId'),
  isAuthenticated: false,
  loading: false,
  competition: { status: 'none' },
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    // case 'LOGIN_SUCCESS':
    //   return {
    //     ...state,
    //     user: action.payload,
    //     isAuthenticated: true,
    //     loading: false,
    //   };
    case 'UPDATE_COMPETITION':
      return {
        ...state,
        competition: { ...state.competition, ...action.payload },
      };
    case 'RESET_COMPETITION':
      return {
        ...state,
        competition: { status: 'none' },
      };
    case 'LOGOUT':
      localStorage.removeItem('selectedSchoolId');
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        selectedSchoolId: null,
        competition: { status: 'none' },
      };
    // case 'SET_SELECTED_SCHOOL':
    //   localStorage.setItem('selectedSchoolId', action.payload);
    //   return {
    //     ...state,
    //     selectedSchoolId: action.payload,
    //   };
    // case 'UPDATE_USER':
    //   return {
    //     ...state,
    //     user: state.user ? { ...state.user, ...action.payload } : null,
    //   };
    // case 'SET_LOADING':
    //   return {
    //     ...state,
    //     loading: action.payload,
    //   };
    default:
      return authReducerBase(state, action);
  }
};

function authReducerBase(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
      };
    case 'SET_SELECTED_SCHOOL':
      localStorage.setItem('selectedSchoolId', action.payload);
      return {
        ...state,
        selectedSchoolId: action.payload,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    default:
      return state;
  }
}

interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setSelectedSchool: (schoolId: string) => void;
  updateUser: (updates: Partial<User>) => void;
  updateCompetition: (updates: Partial<Competition>) => void;
  resetCompetition: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const  useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// interface AuthProviderProps {
//   children: ReactNode;
// }

export const AuthProvider: React.FC<{children:ReactNode}> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = async (email: string, password: string, schoolID: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const userInfo = await api.login(email, password, schoolID);
    // console.log('User info:', userInfo);
    dispatch({ type: 'LOGIN_SUCCESS', payload: userInfo });
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const setSelectedSchool = (schoolId: string) => {
    dispatch({ type: 'SET_SELECTED_SCHOOL', payload: schoolId });
  };

  const updateUser = (updates: Partial<User>) => {
    dispatch({ type: 'UPDATE_USER', payload: updates });
  };

  const updateCompetition = (updates: Partial<Competition>) => {
    dispatch({ type: 'UPDATE_COMPETITION', payload: updates });
  };

  const resetCompetition = () => {
    dispatch({ type: 'RESET_COMPETITION' });
  };

  const value = {
    state,
    login: login,
    logout,
    setSelectedSchool,
    updateUser,
    updateCompetition,
    resetCompetition,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider> 
  );
};
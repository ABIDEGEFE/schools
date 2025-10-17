import React, { createContext, useContext, useReducer, useEffect, ReactNode, useRef } from 'react';
import { api } from '../utils/api';


export interface User {
  id: string;
  name: string;
  email: string;
  role: 'AD' | 'TC' | 'ST' | 'SA'; // Admin, Teacher, Student, Super Admin
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
  id?: string;
  status: 'none' | 'pending' | 'accepted' | 'scheduled' | 'ready';
  scheduledDate?: string;
  opponent?: {
    id: string;
    name: string;
    school: string; 
  };
  isReceiver?: boolean;
}

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
  login: (email: string, password: string, schoolID: string) => Promise<void>;
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
    // Normalize user shape to include is_licensed etc.
    const u: any = userInfo as any;
    const normalized = {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      schoolId: u.school?.id || u.schoolId || u.school,
      status: u.status,
      is_licensed: u.is_licensed ?? u.isLicensed ?? false,
      wins: u.wins ?? 0,
      profilePicture: u.profile_picture || u.profilePicture || undefined,
    };
    dispatch({ type: 'LOGIN_SUCCESS', payload: normalized as User });
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

  // Central per-user WebSocket: listen for server broadcasts (competition_update)
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<number | null>(null);
  const backoffRef = useRef<number>(1000);
  const mountedRef = useRef(true);

  useEffect(() => {
    // connect only when we have a logged-in user and a token
    const token = sessionStorage.getItem('token');
    if (!token || !state.user) {
      // ensure any existing socket is closed
      try { wsRef.current?.close(); } catch(_) {}
      wsRef.current = null;
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = `${window.location.hostname}:8000`;
    const wsUrl = `${protocol}//${host}/ws/user/?token=${encodeURIComponent(token)}`;

    // avoid duplicate sockets
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    mountedRef.current = true;

    const connect = () => {
      if (!mountedRef.current) return;
      try {
        const socket = new WebSocket(wsUrl);
        socket.onopen = () => {
          console.debug('AuthContext: WebSocket connected', wsUrl);
          backoffRef.current = 1000; // reset backoff on success
        };
        socket.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data as string);
            if (msg?.type === 'competition_update' && msg.competition) {
              console.debug('AuthContext: received competition_update message', msg);
              const comp = msg.competition as any;
              // Map server payload into our Competition shape and update context
              const opponent = comp.sender?.id === state.user?.id ? comp.receiver : comp.sender;
              const isReceiver = comp.receiver?.id === state.user?.id;
              dispatch({ type: 'UPDATE_COMPETITION', payload: {
                id: comp.id,
                status: comp.status,
                scheduledDate: comp.scheduledDate,
                opponent: opponent ? { id: opponent.id, name: opponent.name, school: opponent.school } : undefined,
                isReceiver,
              } });
            }
          } catch (err) {
            console.error('AuthContext: error parsing WS message', err, ev.data);
          }
        };
        socket.onclose = (ev) => {
          console.debug('AuthContext: WebSocket closed', ev.code, ev.reason);
          wsRef.current = null;
          // schedule reconnect if still mounted
          if (mountedRef.current) {
            const delay = Math.min(backoffRef.current, 30000);
            reconnectRef.current = window.setTimeout(() => {
              reconnectRef.current = null;
              backoffRef.current = Math.min(backoffRef.current * 1.5, 30000);
              connect();
            }, delay);
          }
        };
        socket.onerror = (ev) => {
          console.error('AuthContext: WebSocket error', ev);
          // error will typically be followed by close; let close schedule reconnect
        };
        wsRef.current = socket;
      } catch (err) {
        console.error('AuthContext: failed to open WebSocket', err);
        // schedule reconnect
        if (mountedRef.current) {
          const delay = Math.min(backoffRef.current, 30000);
          reconnectRef.current = window.setTimeout(() => {
            reconnectRef.current = null;
            backoffRef.current = Math.min(backoffRef.current * 1.5, 30000);
            connect();
          }, delay);
        }
      }
    };

    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }
      try { wsRef.current?.close(); } catch(_) {}
      wsRef.current = null;
    };
  }, [state.user?.id]);

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
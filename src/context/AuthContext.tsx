import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import {
  User,
  LoginPayload,
  RegisterPayload,
} from '../types/auth';
import { authService } from '../services/authService';
import { getAuthToken, setAuthToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  quickLoginAs: (role: 'student' | 'custodian' | 'admin') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'cre_auth_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(() => getAuthToken());
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync user state with localStorage
  const updateUser = useCallback((newUser: User | null) => {
    setUser(newUser);
    try {
      if (newUser) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
      } else {
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const currentToken = getAuthToken();
    if (!currentToken) {
      updateUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const profile = await authService.getCurrentUser();
      updateUser(profile);
      setTokenState(currentToken);
    } catch {
      // Token invalid or expired
      setAuthToken(null);
      setTokenState(null);
      updateUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [updateUser]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (payload: LoginPayload) => {
    setIsLoading(true);
    try {
      const response = await authService.login(payload);
      setTokenState(response.access_token);
      updateUser(response.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload) => {
    setIsLoading(true);
    try {
      const response = await authService.register(payload);
      setTokenState(response.access_token);
      updateUser(response.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      setAuthToken(null);
      setTokenState(null);
      updateUser(null);
      setIsLoading(false);
    }
  };

  /**
   * Helper for evaluation / testing:
   * Quick-login or provision demo persona.
   */
  const quickLoginAs = async (role: 'student' | 'custodian' | 'admin') => {
    let email = '';
    const password = 'Password123!';
    let fullName = '';
    let department = '';
    let studentId = '';

    if (role === 'student') {
      email = 'sarah.student@university.edu';
      fullName = 'Sarah Chen';
      department = 'Department of Electrical Engineering';
      studentId = 'EE-2026-441';
    } else if (role === 'custodian') {
      email = 'custodian.vance@university.edu';
      fullName = 'Dr. Vance Sterling';
      department = 'Robotics & Automation Core Facility';
    } else {
      email = 'admin@university.edu';
      fullName = 'Campus Administrator';
      department = 'Office of Research & Equipment Oversight';
    }

    try {
      await login({ email, password });
    } catch {
      // If user doesn't exist yet, register and login
      await register({
        full_name: fullName,
        email,
        password,
        department,
        student_id: studentId,
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        quickLoginAs,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ===========================================
// COMPREHENSIVE AUTHENTICATION & AUTHORIZATION SYSTEM
// ===========================================

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { sovereignApi } from '../services/apiClient';
import { RealTimeConnectionManager } from '../services/RealTimeConnection';

// ===========================================
// TYPE DEFINITIONS
// ===========================================

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  roles: Role[];
  permissions: Permission[];
  preferences: UserPreferences;
  lastLogin: string;
  isActive: boolean;
  organizationId?: string;
  department?: string;
  title?: string;
  licenseNumber?: string;
  barAdmissions?: string[];
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  level: number;
  isDefault: boolean;
}

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications: NotificationPreferences;
  dashboard: DashboardPreferences;
}

interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  desktop: boolean;
  deadlineReminders: boolean;
  collaborationUpdates: boolean;
  systemAlerts: boolean;
}

interface DashboardPreferences {
  layout: 'grid' | 'list';
  widgets: string[];
  defaultView: string;
  showWelcome: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  sessionExpiry: number | null;
  lastActivity: number;
  requiresMFA: boolean;
  mfaMethod?: 'totp' | 'sms' | 'email';
  organizationSettings?: OrganizationSettings;
}

interface OrganizationSettings {
  id: string;
  name: string;
  domain: string;
  ssoEnabled: boolean;
  mfaRequired: boolean;
  passwordPolicy: PasswordPolicy;
  sessionTimeout: number;
  allowedDomains?: string[];
  branding?: BrandingSettings;
}

interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxAge: number;
  preventReuse: number;
}

interface BrandingSettings {
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  customCss?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  mfaCode?: string;
}

interface RegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationCode?: string;
  licenseNumber?: string;
  barAdmissions?: string[];
}

// ===========================================
// AUTH ACTION TYPES
// ===========================================

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; accessToken: string; refreshToken: string; sessionExpiry: number } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'TOKEN_REFRESH'; payload: { accessToken: string; sessionExpiry: number } }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<UserPreferences> }
  | { type: 'SET_MFA_REQUIRED'; payload: { method: 'totp' | 'sms' | 'email' } }
  | { type: 'CLEAR_MFA' }
  | { type: 'UPDATE_ACTIVITY' }
  | { type: 'SET_ORGANIZATION'; payload: OrganizationSettings };

// ===========================================
// AUTH REDUCER
// ===========================================

const initialAuthState: AuthState = {
  isAuthenticated: false,
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  error: null,
  sessionExpiry: null,
  lastActivity: Date.now(),
  requiresMFA: false
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null
      };

    case 'AUTH_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        sessionExpiry: action.payload.sessionExpiry,
        isLoading: false,
        error: null,
        requiresMFA: false,
        lastActivity: Date.now()
      };

    case 'AUTH_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        sessionExpiry: null,
        isLoading: false,
        error: action.payload,
        requiresMFA: false
      };

    case 'AUTH_LOGOUT':
      return {
        ...initialAuthState,
        lastActivity: Date.now()
      };

    case 'TOKEN_REFRESH':
      return {
        ...state,
        accessToken: action.payload.accessToken,
        sessionExpiry: action.payload.sessionExpiry,
        error: null
      };

    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null
      };

    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        user: state.user
          ? {
              ...state.user,
              preferences: { ...state.user.preferences, ...action.payload }
            }
          : null
      };

    case 'SET_MFA_REQUIRED':
      return {
        ...state,
        requiresMFA: true,
        mfaMethod: action.payload.method,
        isLoading: false
      };

    case 'CLEAR_MFA':
      return {
        ...state,
        requiresMFA: false,
        mfaMethod: undefined
      };

    case 'UPDATE_ACTIVITY':
      return {
        ...state,
        lastActivity: Date.now()
      };

    case 'SET_ORGANIZATION':
      return {
        ...state,
        organizationSettings: action.payload
      };

    default:
      return state;
  }
}

// ===========================================
// AUTH CONTEXT
// ===========================================

interface AuthContextValue {
  state: AuthState;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegistrationData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  enableMFA: (method: 'totp' | 'sms' | 'email') => Promise<string>;
  verifyMFA: (code: string) => Promise<void>;
  disableMFA: (password: string) => Promise<void>;
  hasPermission: (permission: string, resource?: string) => boolean;
  hasRole: (roleName: string) => boolean;
  canAccess: (resource: string, action: string) => boolean;
  getSessionTimeRemaining: () => number;
  extendSession: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  confirmPasswordReset: (token: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ===========================================
// AUTH PROVIDER COMPONENT
// ===========================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  // ===========================================
  // INITIALIZATION & TOKEN MANAGEMENT
  // ===========================================

  useEffect(() => {
    initializeAuth();
  }, []);

  // Session timeout monitoring
  useEffect(() => {
    if (state.isAuthenticated && state.sessionExpiry) {
      const timeoutId = setTimeout(() => {
        if (Date.now() > state.sessionExpiry!) {
          logout();
        }
      }, state.sessionExpiry - Date.now());

      return () => clearTimeout(timeoutId);
    }
  }, [state.sessionExpiry]);

  // Activity monitoring
  useEffect(() => {
    if (state.isAuthenticated) {
      const handleActivity = () => dispatch({ type: 'UPDATE_ACTIVITY' });
      
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      events.forEach(event => {
        document.addEventListener(event, handleActivity, true);
      });

      return () => {
        events.forEach(event => {
          document.removeEventListener(event, handleActivity, true);
        });
      };
    }
  }, [state.isAuthenticated]);

  // Auto token refresh
  useEffect(() => {
    if (state.isAuthenticated && state.sessionExpiry) {
      const refreshTime = state.sessionExpiry - Date.now() - 300000; // Refresh 5 minutes before expiry
      
      if (refreshTime > 0) {
        const timeoutId = setTimeout(() => {
          refreshToken();
        }, refreshTime);

        return () => clearTimeout(timeoutId);
      }
    }
  }, [state.sessionExpiry]);

  async function initializeAuth() {
    const storedToken = localStorage.getItem('auth_token');
    const storedRefreshToken = localStorage.getItem('refresh_token');
    const storedUser = localStorage.getItem('auth_user');
    
    if (storedToken && storedRefreshToken && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        const sessionExpiry = parseInt(localStorage.getItem('session_expiry') || '0');
        
        // Check if token is still valid
        if (sessionExpiry > Date.now()) {
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: {
              user,
              accessToken: storedToken,
              refreshToken: storedRefreshToken,
              sessionExpiry
            }
          });

          // Load organization settings
          await loadOrganizationSettings();
        } else {
          // Try to refresh token
          await refreshToken();
        }
      } catch (error) {
        // Clear invalid stored data
        clearStoredAuth();
      }
    }
  }

  function clearStoredAuth() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('session_expiry');
  }

  // ===========================================
  // AUTHENTICATION METHODS
  // ===========================================

  async function login(credentials: LoginCredentials) {
    dispatch({ type: 'AUTH_START' });

    try {
      const response = await sovereignApi.authenticate(credentials);
      
      // Check if MFA is required
      if (response.requiresMFA) {
        dispatch({
          type: 'SET_MFA_REQUIRED',
          payload: { method: response.mfaMethod }
        });
        return;
      }

      const sessionExpiry = Date.now() + (response.expiresIn * 1000);
      
      // Store auth data
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('refresh_token', response.refreshToken);
      localStorage.setItem('auth_user', JSON.stringify(response.user));
      localStorage.setItem('session_expiry', sessionExpiry.toString());

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: response.user,
          accessToken: response.token,
          refreshToken: response.refreshToken,
          sessionExpiry
        }
      });

      // Load organization settings
      await loadOrganizationSettings();

      // Track login event
      await sovereignApi.trackEvent('user_login', {
        userId: response.user.id,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  }

  async function register(data: RegistrationData) {
    dispatch({ type: 'AUTH_START' });

    try {
      const response = await sovereignApi.register(data);
      
      // Auto-login after successful registration
      await login({
        email: data.email,
        password: data.password
      });

      // Track registration event
      await sovereignApi.trackEvent('user_registration', {
        userId: response.user.id,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  }

  async function logout() {
    try {
      // Notify server of logout
      if (state.accessToken) {
        await sovereignApi.logout();
      }

      // Track logout event
      if (state.user) {
        await sovereignApi.trackEvent('user_logout', {
          userId: state.user.id,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      clearStoredAuth();
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  }

  async function refreshToken() {
    if (!state.refreshToken) {
      await logout();
      return;
    }

    try {
      const response = await sovereignApi.refreshAuthToken();
      const sessionExpiry = Date.now() + (response.expiresIn * 1000);
      
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('session_expiry', sessionExpiry.toString());

      dispatch({
        type: 'TOKEN_REFRESH',
        payload: {
          accessToken: response.token,
          sessionExpiry
        }
      });

    } catch (error) {
      console.error('Token refresh failed:', error);
      await logout();
    }
  }

  // ===========================================
  // PROFILE & PREFERENCES
  // ===========================================

  async function updateProfile(updates: Partial<User>) {
    if (!state.user) throw new Error('User not authenticated');

    try {
      const updatedUser = await sovereignApi.updateProfile(state.user.id, updates);
      
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
      
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));

      // Track profile update
      await sovereignApi.trackEvent('profile_updated', {
        userId: state.user.id,
        fields: Object.keys(updates),
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      throw new Error('Failed to update profile');
    }
  }

  async function updatePreferences(preferences: Partial<UserPreferences>) {
    if (!state.user) throw new Error('User not authenticated');

    try {
      const updatedPreferences = await sovereignApi.updateUserPreferences(
        state.user.id,
        preferences
      );
      
      dispatch({ type: 'UPDATE_PREFERENCES', payload: updatedPreferences });
      
      // Update stored user data
      const updatedUser = {
        ...state.user,
        preferences: { ...state.user.preferences, ...updatedPreferences }
      };
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));

    } catch (error) {
      throw new Error('Failed to update preferences');
    }
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    if (!state.user) throw new Error('User not authenticated');

    try {
      await sovereignApi.changePassword({
        userId: state.user.id,
        currentPassword,
        newPassword
      });

      // Track password change
      await sovereignApi.trackEvent('password_changed', {
        userId: state.user.id,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      throw new Error('Failed to change password');
    }
  }

  // ===========================================
  // MULTI-FACTOR AUTHENTICATION
  // ===========================================

  async function enableMFA(method: 'totp' | 'sms' | 'email'): Promise<string> {
    if (!state.user) throw new Error('User not authenticated');

    try {
      const response = await sovereignApi.enableMFA(state.user.id, method);
      
      // Track MFA enablement
      await sovereignApi.trackEvent('mfa_enabled', {
        userId: state.user.id,
        method,
        timestamp: new Date().toISOString()
      });

      return response.secret || response.qrCode;
    } catch (error) {
      throw new Error('Failed to enable MFA');
    }
  }

  async function verifyMFA(code: string) {
    try {
      const response = await sovereignApi.verifyMFA(code);
      
      if (response.success) {
        dispatch({ type: 'CLEAR_MFA' });
        
        // Complete authentication flow
        const sessionExpiry = Date.now() + (response.expiresIn * 1000);
        
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('session_expiry', sessionExpiry.toString());

        dispatch({
          type: 'TOKEN_REFRESH',
          payload: {
            accessToken: response.token,
            sessionExpiry
          }
        });
      } else {
        throw new Error('Invalid MFA code');
      }
    } catch (error) {
      throw new Error('MFA verification failed');
    }
  }

  async function disableMFA(password: string) {
    if (!state.user) throw new Error('User not authenticated');

    try {
      await sovereignApi.disableMFA(state.user.id, password);
      
      // Track MFA disablement
      await sovereignApi.trackEvent('mfa_disabled', {
        userId: state.user.id,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      throw new Error('Failed to disable MFA');
    }
  }

  // ===========================================
  // PERMISSION & ROLE MANAGEMENT
  // ===========================================

  function hasPermission(permission: string, resource?: string): boolean {
    if (!state.user) return false;

    // Check user's direct permissions
    const hasDirectPermission = state.user.permissions.some(perm => {
      const permMatch = perm.name === permission || perm.id === permission;
      const resourceMatch = !resource || perm.resource === resource;
      return permMatch && resourceMatch;
    });

    if (hasDirectPermission) return true;

    // Check role-based permissions
    return state.user.roles.some(role => 
      role.permissions.includes(permission)
    );
  }

  function hasRole(roleName: string): boolean {
    if (!state.user) return false;
    
    return state.user.roles.some(role => 
      role.name === roleName || role.id === roleName
    );
  }

  function canAccess(resource: string, action: string): boolean {
    const permission = `${resource}:${action}`;
    return hasPermission(permission, resource);
  }

  // ===========================================
  // SESSION MANAGEMENT
  // ===========================================

  function getSessionTimeRemaining(): number {
    if (!state.sessionExpiry) return 0;
    return Math.max(0, state.sessionExpiry - Date.now());
  }

  async function extendSession() {
    try {
      await refreshToken();
    } catch (error) {
      throw new Error('Failed to extend session');
    }
  }

  // ===========================================
  // PASSWORD RESET
  // ===========================================

  async function resetPassword(email: string) {
    try {
      await sovereignApi.requestPasswordReset(email);
    } catch (error) {
      throw new Error('Failed to send password reset email');
    }
  }

  async function confirmPasswordReset(token: string, newPassword: string) {
    try {
      await sovereignApi.confirmPasswordReset(token, newPassword);
    } catch (error) {
      throw new Error('Failed to reset password');
    }
  }

  // ===========================================
  // ORGANIZATION SETTINGS
  // ===========================================

  async function loadOrganizationSettings() {
    if (!state.user?.organizationId) return;

    try {
      const orgSettings = await sovereignApi.getOrganizationSettings(
        state.user.organizationId
      );
      
      dispatch({ type: 'SET_ORGANIZATION', payload: orgSettings });
    } catch (error) {
      console.error('Failed to load organization settings:', error);
    }
  }

  // ===========================================
  // CONTEXT VALUE
  // ===========================================

  const contextValue: AuthContextValue = {
    state,
    login,
    register,
    logout,
    refreshToken,
    updateProfile,
    updatePreferences,
    changePassword,
    enableMFA,
    verifyMFA,
    disableMFA,
    hasPermission,
    hasRole,
    canAccess,
    getSessionTimeRemaining,
    extendSession,
    resetPassword,
    confirmPasswordReset
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// ===========================================
// CUSTOM HOOKS
// ===========================================

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useUser() {
  const { state } = useAuth();
  return state.user;
}

export function usePermissions() {
  const { hasPermission, hasRole, canAccess } = useAuth();
  return { hasPermission, hasRole, canAccess };
}

export function useSession() {
  const { state, getSessionTimeRemaining, extendSession } = useAuth();
  return {
    isAuthenticated: state.isAuthenticated,
    sessionTimeRemaining: getSessionTimeRemaining(),
    extendSession,
    lastActivity: state.lastActivity
  };
}

// ===========================================
// PROTECTED ROUTE COMPONENT
// ===========================================

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: string;
  requiredRole?: string;
  fallback?: ReactNode;
}

export function ProtectedRoute({ 
  children, 
  requiredPermission, 
  requiredRole, 
  fallback 
}: ProtectedRouteProps) {
  const { state, hasPermission, hasRole } = useAuth();

  if (!state.isAuthenticated) {
    return fallback || <div>Please log in to access this page.</div>;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return fallback || <div>You don't have permission to access this page.</div>;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return fallback || <div>You don't have the required role to access this page.</div>;
  }

  return <>{children}</>;
}

// ===========================================
// EXPORTS
// ===========================================

export type {
  User,
  Role,
  Permission,
  UserPreferences,
  AuthState,
  LoginCredentials,
  RegistrationData,
  OrganizationSettings
};
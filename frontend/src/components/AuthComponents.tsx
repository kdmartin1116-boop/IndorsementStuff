// ===========================================
// COMPREHENSIVE AUTHENTICATION UI COMPONENTS
// ===========================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { LoginCredentials, RegistrationData } from '../contexts/AuthContext';

// ===========================================
// LOGIN COMPONENT
// ===========================================

interface LoginFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}

export function LoginForm({ onSuccess, redirectTo }: LoginFormProps) {
  const { login, state } = useAuth();
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [mfaCode, setMfaCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const credentials = state.requiresMFA 
        ? { ...formData, mfaCode }
        : formData;
        
      await login(credentials);
      onSuccess?.();
      
      if (redirectTo) {
        window.location.href = redirectTo;
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleInputChange = (field: keyof LoginCredentials, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>🏛️ Sovereign Legal Platform</h2>
          <p>Secure access to your legal workspace</p>
        </div>

        {state.error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {state.error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          {!state.requiresMFA ? (
            <>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  placeholder="Enter your email"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="password-input-container">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="form-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="form-group-inline">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                  />
                  Remember me
                </label>
                <a href="/forgot-password" className="forgot-password-link">
                  Forgot password?
                </a>
              </div>
            </>
          ) : (
            <div className="mfa-section">
              <div className="mfa-info">
                <span className="mfa-icon">🔐</span>
                <h3>Multi-Factor Authentication</h3>
                <p>
                  Please enter the verification code from your{' '}
                  {state.mfaMethod === 'totp' ? 'authenticator app' :
                   state.mfaMethod === 'sms' ? 'phone' : 'email'}
                </p>
              </div>
              
              <div className="form-group">
                <label htmlFor="mfaCode">Verification Code</label>
                <input
                  id="mfaCode"
                  type="text"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  required
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="form-input mfa-input"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={state.isLoading}
            className="login-button"
          >
            {state.isLoading ? (
              <span className="loading-spinner">⏳ Signing in...</span>
            ) : state.requiresMFA ? (
              'Verify & Sign In'
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Don't have an account?{' '}
            <a href="/register" className="register-link">
              Sign up here
            </a>
          </p>
          
          <div className="security-features">
            <span className="security-badge">🔒 Enterprise Security</span>
            <span className="security-badge">⚡ SSO Ready</span>
            <span className="security-badge">📱 MFA Support</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===========================================
// REGISTRATION COMPONENT
// ===========================================

interface RegistrationFormProps {
  onSuccess?: () => void;
}

export function RegistrationForm({ onSuccess }: RegistrationFormProps) {
  const { register, state } = useAuth();
  const [formData, setFormData] = useState<RegistrationData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    organizationCode: '',
    licenseNumber: '',
    barAdmissions: []
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (!agreedToTerms) {
      alert('Please agree to the terms and conditions');
      return;
    }

    try {
      await register(formData);
      onSuccess?.();
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  const handleInputChange = (field: keyof RegistrationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const getPasswordStrengthLabel = (strength: number): string => {
    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    return labels[strength] || 'Very Weak';
  };

  const getPasswordStrengthColor = (strength: number): string => {
    const colors = ['#ff4444', '#ff8800', '#ffaa00', '#88cc00', '#44aa44'];
    return colors[strength] || '#ff4444';
  };

  return (
    <div className="registration-container">
      <div className="registration-card">
        <div className="registration-header">
          <h2>⚖️ Join Sovereign Legal Platform</h2>
          <p>Create your professional legal account</p>
        </div>

        {state.error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {state.error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="registration-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                required
                placeholder="John"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                required
                placeholder="Doe"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
              placeholder="john.doe@lawfirm.com"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-container">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                required
                placeholder="Create a strong password"
                className="form-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            
            {formData.password && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div 
                    className="strength-fill"
                    style={{
                      width: `${(passwordStrength / 5) * 100}%`,
                      backgroundColor: getPasswordStrengthColor(passwordStrength)
                    }}
                  />
                </div>
                <span 
                  className="strength-label"
                  style={{ color: getPasswordStrengthColor(passwordStrength) }}
                >
                  {getPasswordStrengthLabel(passwordStrength)}
                </span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirm your password"
              className="form-input"
            />
            {confirmPassword && formData.password !== confirmPassword && (
              <span className="error-text">Passwords do not match</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="licenseNumber">Bar License Number (Optional)</label>
            <input
              id="licenseNumber"
              type="text"
              value={formData.licenseNumber}
              onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
              placeholder="Enter your bar license number"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="organizationCode">Organization Code (Optional)</label>
            <input
              id="organizationCode"
              type="text"
              value={formData.organizationCode}
              onChange={(e) => handleInputChange('organizationCode', e.target.value)}
              placeholder="Enter organization invitation code"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                required
              />
              I agree to the{' '}
              <a href="/terms" target="_blank" className="link">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" target="_blank" className="link">
                Privacy Policy
              </a>
            </label>
          </div>

          <button
            type="submit"
            disabled={state.isLoading || !agreedToTerms}
            className="registration-button"
          >
            {state.isLoading ? (
              <span className="loading-spinner">⏳ Creating Account...</span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="registration-footer">
          <p>
            Already have an account?{' '}
            <a href="/login" className="login-link">
              Sign in here
            </a>
          </p>
          
          <div className="features-list">
            <div className="feature-item">✅ Professional legal tools</div>
            <div className="feature-item">✅ Document automation</div>
            <div className="feature-item">✅ Secure collaboration</div>
            <div className="feature-item">✅ AI-powered analysis</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===========================================
// USER PROFILE COMPONENT
// ===========================================

export function UserProfile() {
  const { state, updateProfile, updatePreferences, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState(state.user || {});

  const handleSave = async () => {
    try {
      await updateProfile(profileData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  if (!state.user) return null;

  return (
    <div className="user-profile">
      <div className="profile-header">
        <div className="avatar-container">
          {state.user.avatar ? (
            <img src={state.user.avatar} alt="Profile" className="avatar" />
          ) : (
            <div className="avatar-placeholder">
              {state.user.firstName[0]}{state.user.lastName[0]}
            </div>
          )}
        </div>
        
        <div className="user-info">
          <h2>{state.user.firstName} {state.user.lastName}</h2>
          <p className="user-email">{state.user.email}</p>
          <div className="user-roles">
            {state.user.roles.map(role => (
              <span key={role.id} className="role-badge">
                {role.name}
              </span>
            ))}
          </div>
        </div>

        <div className="profile-actions">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="edit-button"
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
          <button onClick={logout} className="logout-button">
            Sign Out
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="profile-edit-form">
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                value={profileData.firstName || ''}
                onChange={(e) => setProfileData(prev => ({ 
                  ...prev, 
                  firstName: e.target.value 
                }))}
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                value={profileData.lastName || ''}
                onChange={(e) => setProfileData(prev => ({ 
                  ...prev, 
                  lastName: e.target.value 
                }))}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-actions">
            <button onClick={handleSave} className="save-button">
              Save Changes
            </button>
          </div>
        </div>
      )}

      <div className="profile-stats">
        <div className="stat-item">
          <span className="stat-value">{state.user.permissions.length}</span>
          <span className="stat-label">Permissions</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{state.user.roles.length}</span>
          <span className="stat-label">Roles</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">
            {new Date(state.user.lastLogin).toLocaleDateString()}
          </span>
          <span className="stat-label">Last Login</span>
        </div>
      </div>
    </div>
  );
}

// ===========================================
// SESSION TIMER COMPONENT
// ===========================================

export function SessionTimer() {
  const { getSessionTimeRemaining, extendSession, logout } = useAuth();
  const [timeRemaining, setTimeRemaining] = useState(getSessionTimeRemaining());
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = getSessionTimeRemaining();
      setTimeRemaining(remaining);
      
      // Show warning when 5 minutes remaining
      setShowWarning(remaining > 0 && remaining < 300000);
    }, 1000);

    return () => clearInterval(interval);
  }, [getSessionTimeRemaining]);

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (timeRemaining <= 0) return null;

  return showWarning ? (
    <div className="session-warning">
      <div className="warning-content">
        <span className="warning-icon">⚠️</span>
        <span>Session expires in {formatTime(timeRemaining)}</span>
        <button onClick={extendSession} className="extend-button">
          Extend Session
        </button>
        <button onClick={logout} className="logout-button">
          Sign Out
        </button>
      </div>
    </div>
  ) : (
    <div className="session-timer">
      Session: {formatTime(timeRemaining)}
    </div>
  );
}

// Export all components
export default {
  LoginForm,
  RegistrationForm,
  UserProfile,
  SessionTimer
};
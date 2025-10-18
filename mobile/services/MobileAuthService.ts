// ===========================================
// MOBILE AUTHENTICATION SERVICE
// Biometric Authentication & Secure Token Management
// ===========================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Keychain from 'react-native-keychain';
import * as LocalAuthentication from 'expo-local-authentication';
import CryptoJS from 'crypto-js';

interface AuthToken {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user_id: string;
  permissions: string[];
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar_url?: string;
  last_login: number;
  preferences: {
    biometric_enabled: boolean;
    auto_lock_timeout: number;
    offline_mode: boolean;
    push_notifications: boolean;
  };
}

interface LoginCredentials {
  email: string;
  password: string;
  remember_me?: boolean;
  device_id: string;
  device_info: {
    platform: string;
    version: string;
    model?: string;
  };
}

interface BiometricConfig {
  enabled: boolean;
  type: 'fingerprint' | 'face' | 'iris' | 'none';
  fallback_to_passcode: boolean;
  require_on_app_start: boolean;
  timeout_minutes: number;
}

export class MobileAuthService {
  private static instance: MobileAuthService;
  private authToken: AuthToken | null = null;
  private userProfile: UserProfile | null = null;
  private biometricConfig: BiometricConfig | null = null;
  private lastActiveTime: number = Date.now();
  
  private readonly STORAGE_KEYS = {
    AUTH_TOKEN: '@auth_token',
    USER_PROFILE: '@user_profile',
    BIOMETRIC_CONFIG: '@biometric_config',
    DEVICE_ID: '@device_id',
    LAST_ACTIVE: '@last_active',
  };

  private readonly KEYCHAIN_SERVICE = 'IndorsementApp';
  private readonly API_BASE_URL = 'https://api.indorsement.app'; // Replace with actual URL

  private constructor() {}

  public static getInstance(): MobileAuthService {
    if (!MobileAuthService.instance) {
      MobileAuthService.instance = new MobileAuthService();
    }
    return MobileAuthService.instance;
  }

  // ===========================================
  // INITIALIZATION
  // ===========================================

  public static async initialize(): Promise<void> {
    const instance = MobileAuthService.getInstance();
    await instance.loadStoredData();
    await instance.setupBiometrics();
    console.log('🔐 Mobile auth service initialized');
  }

  private async loadStoredData(): Promise<void> {
    try {
      const [tokenData, profileData, biometricData] = await Promise.all([
        AsyncStorage.getItem(this.STORAGE_KEYS.AUTH_TOKEN),
        AsyncStorage.getItem(this.STORAGE_KEYS.USER_PROFILE),
        AsyncStorage.getItem(this.STORAGE_KEYS.BIOMETRIC_CONFIG),
      ]);

      if (tokenData) {
        this.authToken = JSON.parse(tokenData);
        
        // Check if token is expired
        if (this.authToken && this.authToken.expires_at < Date.now()) {
          await this.refreshToken();
        }
      }

      if (profileData) {
        this.userProfile = JSON.parse(profileData);
      }

      if (biometricData) {
        this.biometricConfig = JSON.parse(biometricData);
      }
    } catch (error) {
      console.error('Failed to load stored auth data:', error);
    }
  }

  private async setupBiometrics(): Promise<void> {
    try {
      const isAvailable = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      if (isAvailable && isEnrolled && !this.biometricConfig) {
        let biometricType: BiometricConfig['type'] = 'none';
        
        if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          biometricType = 'face';
        } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          biometricType = 'fingerprint';
        } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
          biometricType = 'iris';
        }

        this.biometricConfig = {
          enabled: false, // User needs to explicitly enable
          type: biometricType,
          fallback_to_passcode: true,
          require_on_app_start: true,
          timeout_minutes: 5,
        };

        await this.saveBiometricConfig();
      }
    } catch (error) {
      console.error('Failed to setup biometrics:', error);
    }
  }

  // ===========================================
  // AUTHENTICATION
  // ===========================================

  public async login(credentials: LoginCredentials): Promise<{
    success: boolean;
    token?: AuthToken;
    user?: UserProfile;
    requires_mfa?: boolean;
    error?: string;
  }> {
    try {
      const deviceId = await this.getDeviceId();
      const loginPayload = {
        ...credentials,
        device_id: deviceId,
      };

      const response = await fetch(`${this.API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Login failed',
        };
      }

      if (data.requires_mfa) {
        return {
          success: false,
          requires_mfa: true,
        };
      }

      // Store authentication data
      this.authToken = data.token;
      this.userProfile = data.user;

      await this.saveAuthData();
      this.updateLastActiveTime();

      return {
        success: true,
        token: this.authToken,
        user: this.userProfile,
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Network error occurred',
      };
    }
  }

  public async biometricLogin(): Promise<{
    success: boolean;
    user?: UserProfile;
    error?: string;
  }> {
    try {
      if (!this.biometricConfig?.enabled) {
        return {
          success: false,
          error: 'Biometric authentication not enabled',
        };
      }

      // Check if stored credentials exist
      const credentials = await Keychain.getInternetCredentials(this.KEYCHAIN_SERVICE);
      if (!credentials || credentials.password === false) {
        return {
          success: false,
          error: 'No stored credentials found',
        };
      }

      // Perform biometric authentication
      const biometricResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access your account',
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: !this.biometricConfig.fallback_to_passcode,
        cancelLabel: 'Cancel',
      });

      if (!biometricResult.success) {
        return {
          success: false,
          error: biometricResult.error || 'Biometric authentication failed',
        };
      }

      // Decrypt and use stored credentials
      const decryptedPassword = this.decryptPassword(credentials.password);
      const loginResult = await this.login({
        email: credentials.username,
        password: decryptedPassword,
        device_id: await this.getDeviceId(),
        device_info: {
          platform: Platform.OS,
          version: Platform.Version.toString(),
        },
      });

      return {
        success: loginResult.success,
        user: loginResult.user,
        error: loginResult.error,
      };
    } catch (error) {
      console.error('Biometric login error:', error);
      return {
        success: false,
        error: 'Biometric authentication failed',
      };
    }
  }

  public async logout(): Promise<void> {
    try {
      // Notify server of logout
      if (this.authToken) {
        await fetch(`${this.API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.authToken.access_token}`,
            'Content-Type': 'application/json',
          },
        });
      }

      // Clear local data
      await this.clearAuthData();
      
      console.log('🔓 User logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local data even if server request fails
      await this.clearAuthData();
    }
  }

  // ===========================================
  // TOKEN MANAGEMENT
  // ===========================================

  private async refreshToken(): Promise<boolean> {
    try {
      if (!this.authToken?.refresh_token) {
        return false;
      }

      const response = await fetch(`${this.API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: this.authToken.refresh_token,
          device_id: await this.getDeviceId(),
        }),
      });

      if (!response.ok) {
        await this.clearAuthData();
        return false;
      }

      const data = await response.json();
      this.authToken = data.token;
      await this.saveAuthData();

      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      await this.clearAuthData();
      return false;
    }
  }

  public async getValidToken(): Promise<string | null> {
    if (!this.authToken) {
      return null;
    }

    // Check if token is about to expire (refresh 5 minutes before expiry)
    const expiryBuffer = 5 * 60 * 1000; // 5 minutes
    if (this.authToken.expires_at - Date.now() < expiryBuffer) {
      const refreshed = await this.refreshToken();
      if (!refreshed) {
        return null;
      }
    }

    return this.authToken.access_token;
  }

  // ===========================================
  // BIOMETRIC MANAGEMENT
  // ===========================================

  public async enableBiometric(credentials: { email: string; password: string }): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const isAvailable = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!isAvailable || !isEnrolled) {
        return {
          success: false,
          error: 'Biometric authentication not available on this device',
        };
      }

      // Test biometric authentication
      const biometricResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verify your identity to enable biometric login',
        fallbackLabel: 'Use Passcode',
        cancelLabel: 'Cancel',
      });

      if (!biometricResult.success) {
        return {
          success: false,
          error: 'Biometric verification failed',
        };
      }

      // Encrypt and store credentials
      const encryptedPassword = this.encryptPassword(credentials.password);
      await Keychain.setInternetCredentials(
        this.KEYCHAIN_SERVICE,
        credentials.email,
        encryptedPassword
      );

      // Update biometric config
      if (this.biometricConfig) {
        this.biometricConfig.enabled = true;
        await this.saveBiometricConfig();
      }

      return { success: true };
    } catch (error) {
      console.error('Enable biometric error:', error);
      return {
        success: false,
        error: 'Failed to enable biometric authentication',
      };
    }
  }

  public async disableBiometric(): Promise<void> {
    try {
      await Keychain.resetInternetCredentials(this.KEYCHAIN_SERVICE);
      
      if (this.biometricConfig) {
        this.biometricConfig.enabled = false;
        await this.saveBiometricConfig();
      }
    } catch (error) {
      console.error('Disable biometric error:', error);
    }
  }

  public isBiometricEnabled(): boolean {
    return this.biometricConfig?.enabled ?? false;
  }

  public async isBiometricAvailable(): Promise<boolean> {
    try {
      const isAvailable = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return isAvailable && isEnrolled;
    } catch {
      return false;
    }
  }

  // ===========================================
  // SESSION MANAGEMENT
  // ===========================================

  public updateLastActiveTime(): void {
    this.lastActiveTime = Date.now();
    AsyncStorage.setItem(this.STORAGE_KEYS.LAST_ACTIVE, this.lastActiveTime.toString());
  }

  public shouldRequireBiometric(): boolean {
    if (!this.biometricConfig?.enabled || !this.biometricConfig.require_on_app_start) {
      return false;
    }

    const timeoutMs = this.biometricConfig.timeout_minutes * 60 * 1000;
    return Date.now() - this.lastActiveTime > timeoutMs;
  }

  public isAuthenticated(): boolean {
    return this.authToken !== null && this.authToken.expires_at > Date.now();
  }

  public getCurrentUser(): UserProfile | null {
    return this.userProfile;
  }

  public hasPermission(permission: string): boolean {
    return this.authToken?.permissions.includes(permission) ?? false;
  }

  // ===========================================
  // UTILITY METHODS
  // ===========================================

  private async getDeviceId(): Promise<string> {
    let deviceId = await AsyncStorage.getItem(this.STORAGE_KEYS.DEVICE_ID);
    
    if (!deviceId) {
      deviceId = this.generateDeviceId();
      await AsyncStorage.setItem(this.STORAGE_KEYS.DEVICE_ID, deviceId);
    }
    
    return deviceId;
  }

  private generateDeviceId(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    return `${Platform.OS}_${timestamp}_${random}`;
  }

  private encryptPassword(password: string): string {
    const key = this.getEncryptionKey();
    return CryptoJS.AES.encrypt(password, key).toString();
  }

  private decryptPassword(encryptedPassword: string): string {
    const key = this.getEncryptionKey();
    const bytes = CryptoJS.AES.decrypt(encryptedPassword, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  private getEncryptionKey(): string {
    // In production, use a more secure key derivation method
    return `indorsement_mobile_${Platform.OS}_${Platform.Version}`;
  }

  // ===========================================
  // DATA PERSISTENCE
  // ===========================================

  private async saveAuthData(): Promise<void> {
    try {
      if (this.authToken) {
        await AsyncStorage.setItem(
          this.STORAGE_KEYS.AUTH_TOKEN,
          JSON.stringify(this.authToken)
        );
      }

      if (this.userProfile) {
        await AsyncStorage.setItem(
          this.STORAGE_KEYS.USER_PROFILE,
          JSON.stringify(this.userProfile)
        );
      }
    } catch (error) {
      console.error('Failed to save auth data:', error);
    }
  }

  private async saveBiometricConfig(): Promise<void> {
    try {
      if (this.biometricConfig) {
        await AsyncStorage.setItem(
          this.STORAGE_KEYS.BIOMETRIC_CONFIG,
          JSON.stringify(this.biometricConfig)
        );
      }
    } catch (error) {
      console.error('Failed to save biometric config:', error);
    }
  }

  private async clearAuthData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(this.STORAGE_KEYS.AUTH_TOKEN),
        AsyncStorage.removeItem(this.STORAGE_KEYS.USER_PROFILE),
        AsyncStorage.removeItem(this.STORAGE_KEYS.LAST_ACTIVE),
      ]);

      this.authToken = null;
      this.userProfile = null;
      this.lastActiveTime = Date.now();
    } catch (error) {
      console.error('Failed to clear auth data:', error);
    }
  }

  // ===========================================
  // PUBLIC API
  // ===========================================

  public static async isAuthenticated(): Promise<boolean> {
    const instance = MobileAuthService.getInstance();
    return instance.isAuthenticated();
  }

  public static async getAuthToken(): Promise<string | null> {
    const instance = MobileAuthService.getInstance();
    return instance.getValidToken();
  }

  public static async getCurrentUser(): Promise<UserProfile | null> {
    const instance = MobileAuthService.getInstance();
    return instance.getCurrentUser();
  }

  public static async logout(): Promise<void> {
    const instance = MobileAuthService.getInstance();
    return instance.logout();
  }

  public static async enableBiometric(credentials: { email: string; password: string }): Promise<{
    success: boolean;
    error?: string;
  }> {
    const instance = MobileAuthService.getInstance();
    return instance.enableBiometric(credentials);
  }

  public static async disableBiometric(): Promise<void> {
    const instance = MobileAuthService.getInstance();
    return instance.disableBiometric();
  }

  public static isBiometricEnabled(): boolean {
    const instance = MobileAuthService.getInstance();
    return instance.isBiometricEnabled();
  }

  public static async isBiometricAvailable(): Promise<boolean> {
    const instance = MobileAuthService.getInstance();
    return instance.isBiometricAvailable();
  }

  public static updateActivity(): void {
    const instance = MobileAuthService.getInstance();
    instance.updateLastActiveTime();
  }

  public static shouldRequireBiometric(): boolean {
    const instance = MobileAuthService.getInstance();
    return instance.shouldRequireBiometric();
  }

  public static hasPermission(permission: string): boolean {
    const instance = MobileAuthService.getInstance();
    return instance.hasPermission(permission);
  }
}

export { MobileAuthService };
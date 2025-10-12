import React, { useState, createContext, useContext, useEffect } from 'react';

interface User {
    email: string;
    full_name: string;
    purpose: string;
    created_at: string;
}

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<boolean>;
    register: (email: string, password: string, fullName: string, purpose: string) => Promise<boolean>;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        // Check for stored token on app start
        const savedToken = localStorage.getItem('auth_token');
        if (savedToken) {
            setToken(savedToken);
            fetchUserProfile(savedToken);
        }
    }, []);

    const fetchUserProfile = async (authToken: string) => {
        try {
            const response = await fetch('/auth/me', {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                },
            });
            
            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
            } else {
                localStorage.removeItem('auth_token');
                setToken(null);
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
            localStorage.removeItem('auth_token');
            setToken(null);
        }
    };

    const login = async (email: string, password: string): Promise<boolean> => {
        try {
            const formData = new FormData();
            formData.append('username', email);
            formData.append('password', password);

            const response = await fetch('/auth/token', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                const authToken = data.access_token;
                
                setToken(authToken);
                localStorage.setItem('auth_token', authToken);
                
                await fetchUserProfile(authToken);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    };

    const register = async (email: string, password: string, fullName: string, purpose: string): Promise<boolean> => {
        try {
            const response = await fetch('/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                    full_name: fullName,
                    purpose,
                }),
            });

            if (response.ok) {
                // Auto-login after successful registration
                return await login(email, password);
            }
            return false;
        } catch (error) {
            console.error('Registration error:', error);
            return false;
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('auth_token');
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            register,
            logout,
            isAuthenticated: !!user,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

const LoginForm: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [purpose, setPurpose] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login, register } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            let success = false;
            
            if (isLogin) {
                success = await login(email, password);
            } else {
                if (!fullName || !purpose) {
                    setError('Please fill in all fields');
                    setIsLoading(false);
                    return;
                }
                success = await register(email, password, fullName, purpose);
            }

            if (!success) {
                setError(isLogin ? 'Invalid email or password' : 'Registration failed. Please try again.');
            }
        } catch (error) {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            maxWidth: '400px',
            margin: '0 auto',
            padding: '20px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: '#f9f9f9'
        }}>
            <h2>{isLogin ? 'Login' : 'Register'} for Legal Education Access</h2>
            
            <div style={{
                backgroundColor: '#e3f2fd',
                padding: '10px',
                marginBottom: '20px',
                borderRadius: '4px',
                fontSize: '14px'
            }}>
                <strong>Why Authentication?</strong><br />
                We require registration to ensure responsible use of legal education resources and to track usage patterns for educational improvement.
            </div>

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                    />
                </div>

                {!isLogin && (
                    <>
                        <div style={{ marginBottom: '15px' }}>
                            <label>Full Name:</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label>Purpose for accessing legal education resources:</label>
                            <select
                                value={purpose}
                                onChange={(e) => setPurpose(e.target.value)}
                                required
                                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                            >
                                <option value="">Select purpose...</option>
                                <option value="learn about consumer rights">Learn about consumer rights</option>
                                <option value="understand legal processes">Understand legal processes</option>
                                <option value="find legitimate legal help">Find legitimate legal help</option>
                                <option value="research for academic purposes">Research for academic purposes</option>
                                <option value="professional legal education">Professional legal education</option>
                                <option value="consumer protection advocacy">Consumer protection advocacy</option>
                            </select>
                        </div>
                    </>
                )}

                {error && (
                    <div style={{
                        color: 'red',
                        marginBottom: '15px',
                        padding: '8px',
                        backgroundColor: '#ffebee',
                        borderRadius: '4px'
                    }}>
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isLoading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {isLoading ? 'Please wait...' : (isLogin ? 'Login' : 'Register')}
                </button>
            </form>

            <div style={{ marginTop: '15px', textAlign: 'center' }}>
                <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#2196F3',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                    }}
                >
                    {isLogin ? 'Need to register?' : 'Already have an account?'}
                </button>
            </div>
        </div>
    );
};

export default LoginForm;
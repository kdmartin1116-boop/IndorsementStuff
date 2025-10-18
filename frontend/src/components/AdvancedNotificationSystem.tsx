import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    Bell, Settings, Filter, Search, MoreVertical, X, Check, 
    Clock, AlertTriangle, Info, CheckCircle, Calendar, User,
    Mail, MessageSquare, Phone, Smartphone, Globe, Target,
    Volume2, VolumeX, Pause, Play, RefreshCw, Download,
    Archive, Trash2, Star, Flag, Eye, EyeOff, Zap, Shield,
    BookOpen, Scale, Gavel, Award, Building, Users, FileText
} from 'lucide-react';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success' | 'legal' | 'deadline';
    priority: 'low' | 'medium' | 'high' | 'critical';
    timestamp: Date;
    read: boolean;
    starred: boolean;
    archived: boolean;
    category: string;
    source: string;
    actions?: NotificationAction[];
    metadata: {
        documentId?: string;
        userId?: string;
        deadline?: Date;
        cornellReference?: string;
        complianceScore?: number;
        jurisdiction?: string;
    };
    channels: ('push' | 'email' | 'sms' | 'in_app')[];
    delivered: boolean;
    deliveredAt?: Date;
}

interface NotificationAction {
    id: string;
    label: string;
    type: 'primary' | 'secondary' | 'danger';
    action: () => void;
}

interface NotificationRule {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    conditions: {
        documentType?: string[];
        priority?: ('low' | 'medium' | 'high' | 'critical')[];
        category?: string[];
        timeRange?: { start: string; end: string };
        keywords?: string[];
    };
    channels: ('push' | 'email' | 'sms' | 'in_app')[];
    frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
    quiet_hours: { start: string; end: string } | null;
}

interface DeadlineAlert {
    id: string;
    title: string;
    description: string;
    deadline: Date;
    documentId: string;
    documentType: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    cornellReference?: string;
    jurisdiction: string;
    status: 'upcoming' | 'due_soon' | 'overdue' | 'completed';
    reminderSchedule: ('1_week' | '3_days' | '1_day' | '2_hours' | '30_minutes')[];
    assignedTo?: string;
}

const AdvancedNotificationSystem: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
    const [deadlineAlerts, setDeadlineAlerts] = useState<DeadlineAlert[]>([]);
    const [notificationRules, setNotificationRules] = useState<NotificationRule[]>([]);
    const [activeView, setActiveView] = useState<'all' | 'unread' | 'starred' | 'archived' | 'deadlines' | 'settings'>('all');
    const [selectedFilter, setSelectedFilter] = useState<'all' | 'info' | 'warning' | 'error' | 'success' | 'legal' | 'deadline'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
    const [isNotificationsPaused, setIsNotificationsPaused] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [realTimeEnabled, setRealTimeEnabled] = useState(true);
    const audioRef = useRef<HTMLAudioElement>(null);

    // Mock notification data
    useEffect(() => {
        loadMockData();
        if (realTimeEnabled) {
            const interval = setInterval(generateRandomNotification, 10000); // Generate notification every 10 seconds
            return () => clearInterval(interval);
        }
    }, [realTimeEnabled]);

    // Filter notifications based on active view and filters
    useEffect(() => {
        let filtered = notifications;

        // Apply view filter
        switch (activeView) {
            case 'unread':
                filtered = filtered.filter(n => !n.read);
                break;
            case 'starred':
                filtered = filtered.filter(n => n.starred);
                break;
            case 'archived':
                filtered = filtered.filter(n => n.archived);
                break;
            case 'deadlines':
                filtered = filtered.filter(n => n.type === 'deadline');
                break;
        }

        // Apply type filter
        if (selectedFilter !== 'all') {
            filtered = filtered.filter(n => n.type === selectedFilter);
        }

        // Apply search filter
        if (searchQuery) {
            filtered = filtered.filter(n => 
                n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                n.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                n.category.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Sort by timestamp (newest first)
        filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        setFilteredNotifications(filtered);
    }, [notifications, activeView, selectedFilter, searchQuery]);

    const loadMockData = () => {
        // Mock notifications
        const mockNotifications: Notification[] = [
            {
                id: '1',
                title: 'Document Compliance Alert',
                message: 'Bill of Exchange #BOE-2024-001 requires Cornell validation review before processing',
                type: 'warning',
                priority: 'high',
                timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
                read: false,
                starred: false,
                archived: false,
                category: 'Legal Compliance',
                source: 'Cornell Validation Engine',
                channels: ['push', 'email', 'in_app'],
                delivered: true,
                deliveredAt: new Date(Date.now() - 5 * 60 * 1000),
                metadata: {
                    documentId: 'BOE-2024-001',
                    cornellReference: 'UCC 3-104(a)',
                    complianceScore: 78,
                    jurisdiction: 'Federal'
                }
            },
            {
                id: '2',
                title: 'Signature Deadline Approaching',
                message: 'Promissory Note #PN-2024-015 requires signatures within 24 hours',
                type: 'deadline',
                priority: 'critical',
                timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
                read: false,
                starred: true,
                archived: false,
                category: 'Deadline Management',
                source: 'Deadline Tracker',
                channels: ['push', 'email', 'sms', 'in_app'],
                delivered: true,
                deliveredAt: new Date(Date.now() - 10 * 60 * 1000),
                metadata: {
                    documentId: 'PN-2024-015',
                    deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
                    cornellReference: 'UCC 3-103(a)(7)',
                    jurisdiction: 'Multi-State'
                }
            },
            {
                id: '3',
                title: 'AI Analysis Complete',
                message: 'Legal analysis completed for Check #CHK-2024-089 with 96% confidence score',
                type: 'success',
                priority: 'medium',
                timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
                read: true,
                starred: false,
                archived: false,
                category: 'AI Processing',
                source: 'AI Legal Analysis',
                channels: ['push', 'in_app'],
                delivered: true,
                deliveredAt: new Date(Date.now() - 15 * 60 * 1000),
                metadata: {
                    documentId: 'CHK-2024-089',
                    complianceScore: 96,
                    cornellReference: 'UCC 3-104(f)'
                }
            },
            {
                id: '4',
                title: 'Blockchain Verification Failed',
                message: 'Document integrity check failed for Letter of Credit #LOC-2024-023',
                type: 'error',
                priority: 'high',
                timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
                read: false,
                starred: false,
                archived: false,
                category: 'Blockchain Security',
                source: 'Blockchain Integration',
                channels: ['push', 'email', 'in_app'],
                delivered: true,
                deliveredAt: new Date(Date.now() - 30 * 60 * 1000),
                metadata: {
                    documentId: 'LOC-2024-023',
                    jurisdiction: 'International'
                }
            },
            {
                id: '5',
                title: 'New Cornell Legal Update',
                message: 'UCC Article 3 amendments effective January 2025 - Review required for all negotiable instruments',
                type: 'legal',
                priority: 'medium',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
                read: true,
                starred: true,
                archived: false,
                category: 'Legal Updates',
                source: 'Cornell Legal Knowledge',
                channels: ['email', 'in_app'],
                delivered: true,
                deliveredAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
                metadata: {
                    cornellReference: 'UCC 3-104 (Amendment 2025-01)',
                    jurisdiction: 'Federal'
                }
            }
        ];

        // Mock deadline alerts
        const mockDeadlineAlerts: DeadlineAlert[] = [
            {
                id: 'dl1',
                title: 'Promissory Note Signature Deadline',
                description: 'All parties must sign PN-2024-015 before expiration',
                deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
                documentId: 'PN-2024-015',
                documentType: 'Promissory Note',
                priority: 'critical',
                cornellReference: 'UCC 3-103(a)(7)',
                jurisdiction: 'Federal',
                status: 'due_soon',
                reminderSchedule: ['1_week', '3_days', '1_day', '2_hours'],
                assignedTo: 'legal-team'
            },
            {
                id: 'dl2',
                title: 'Bill of Exchange Processing Deadline',
                description: 'BOE-2024-001 must be processed within compliance window',
                deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                documentId: 'BOE-2024-001',
                documentType: 'Bill of Exchange',
                priority: 'high',
                cornellReference: 'UCC 3-104(a)',
                jurisdiction: 'Multi-State',
                status: 'upcoming',
                reminderSchedule: ['1_week', '3_days', '1_day'],
                assignedTo: 'processing-team'
            }
        ];

        // Mock notification rules
        const mockRules: NotificationRule[] = [
            {
                id: 'rule1',
                name: 'Critical Legal Alerts',
                description: 'Immediate notifications for critical legal compliance issues',
                enabled: true,
                conditions: {
                    priority: ['critical', 'high'],
                    category: ['Legal Compliance', 'Deadline Management']
                },
                channels: ['push', 'email', 'sms', 'in_app'],
                frequency: 'immediate',
                quiet_hours: { start: '22:00', end: '07:00' }
            },
            {
                id: 'rule2',
                name: 'Cornell Legal Updates',
                description: 'Daily digest of Cornell legal framework updates',
                enabled: true,
                conditions: {
                    category: ['Legal Updates'],
                    keywords: ['Cornell', 'UCC', 'legal']
                },
                channels: ['email', 'in_app'],
                frequency: 'daily',
                quiet_hours: null
            }
        ];

        setNotifications(mockNotifications);
        setDeadlineAlerts(mockDeadlineAlerts);
        setNotificationRules(mockRules);
    };

    const generateRandomNotification = () => {
        if (isNotificationsPaused) return;

        const types: Notification['type'][] = ['info', 'warning', 'success', 'legal'];
        const priorities: Notification['priority'][] = ['low', 'medium', 'high'];
        const categories = ['Document Processing', 'Legal Compliance', 'AI Analysis', 'User Activity'];
        
        const randomType = types[Math.floor(Math.random() * types.length)];
        const randomPriority = priorities[Math.floor(Math.random() * priorities.length)];
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];

        const newNotification: Notification = {
            id: `notif_${Date.now()}`,
            title: `${randomCategory} Update`,
            message: `New ${randomType} notification for your review`,
            type: randomType,
            priority: randomPriority,
            timestamp: new Date(),
            read: false,
            starred: false,
            archived: false,
            category: randomCategory,
            source: 'System',
            channels: ['push', 'in_app'],
            delivered: true,
            deliveredAt: new Date(),
            metadata: {}
        };

        setNotifications(prev => [newNotification, ...prev]);
        
        if (soundEnabled && audioRef.current) {
            audioRef.current.play().catch(console.error);
        }

        // Show browser notification if supported
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(newNotification.title, {
                body: newNotification.message,
                icon: '/notification-icon.png'
            });
        }
    };

    const markAsRead = (notificationId: string) => {
        setNotifications(prev => 
            prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const toggleStar = (notificationId: string) => {
        setNotifications(prev => 
            prev.map(n => n.id === notificationId ? { ...n, starred: !n.starred } : n)
        );
    };

    const archiveNotification = (notificationId: string) => {
        setNotifications(prev => 
            prev.map(n => n.id === notificationId ? { ...n, archived: true } : n)
        );
    };

    const deleteNotification = (notificationId: string) => {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
    };

    const bulkAction = (action: 'read' | 'archive' | 'delete') => {
        const selectedIds = Array.from(selectedNotifications);
        
        switch (action) {
            case 'read':
                setNotifications(prev => 
                    prev.map(n => selectedIds.includes(n.id) ? { ...n, read: true } : n)
                );
                break;
            case 'archive':
                setNotifications(prev => 
                    prev.map(n => selectedIds.includes(n.id) ? { ...n, archived: true } : n)
                );
                break;
            case 'delete':
                setNotifications(prev => prev.filter(n => !selectedIds.includes(n.id)));
                break;
        }
        
        setSelectedNotifications(new Set());
    };

    const requestNotificationPermission = async () => {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return false;
    };

    const getNotificationIcon = (type: Notification['type']) => {
        switch (type) {
            case 'info': return <Info size={20} className="text-blue-500" />;
            case 'warning': return <AlertTriangle size={20} className="text-yellow-500" />;
            case 'error': return <AlertTriangle size={20} className="text-red-500" />;
            case 'success': return <CheckCircle size={20} className="text-green-500" />;
            case 'legal': return <Scale size={20} className="text-purple-500" />;
            case 'deadline': return <Clock size={20} className="text-orange-500" />;
            default: return <Bell size={20} className="text-gray-500" />;
        }
    };

    const getPriorityColor = (priority: Notification['priority']) => {
        switch (priority) {
            case 'critical': return 'border-l-red-500';
            case 'high': return 'border-l-orange-500';
            case 'medium': return 'border-l-yellow-500';
            case 'low': return 'border-l-blue-500';
            default: return 'border-l-gray-500';
        }
    };

    const formatTimeAgo = (timestamp: Date) => {
        const now = new Date();
        const diff = now.getTime() - timestamp.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    const unreadCount = notifications.filter(n => !n.read && !n.archived).length;

    return (
        <div className="advanced-notification-system">
            {/* Header */}
            <div className="notification-header">
                <div className="header-content">
                    <div className="header-icon">
                        <Bell size={32} />
                        {unreadCount > 0 && (
                            <div className="notification-badge">{unreadCount}</div>
                        )}
                    </div>
                    <div>
                        <h1>Advanced Notification System</h1>
                        <p>Real-time alerts, deadline management, and smart notifications with Cornell legal framework integration</p>
                    </div>
                </div>
                <div className="notification-stats">
                    <div className="stat-item">
                        <span className="stat-value">{unreadCount}</span>
                        <span className="stat-label">Unread</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{deadlineAlerts.filter(d => d.status === 'due_soon').length}</span>
                        <span className="stat-label">Due Soon</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{notifications.filter(n => n.type === 'legal').length}</span>
                        <span className="stat-label">Legal</span>
                    </div>
                </div>
            </div>

            <div className="notification-workspace">
                {/* Sidebar */}
                <div className="notification-sidebar">
                    <div className="sidebar-controls">
                        <button
                            className={`control-btn ${realTimeEnabled ? 'active' : ''}`}
                            onClick={() => setRealTimeEnabled(!realTimeEnabled)}
                            title="Real-time Notifications"
                        >
                            <Zap size={16} />
                            Real-time
                        </button>
                        <button
                            className={`control-btn ${isNotificationsPaused ? 'active' : ''}`}
                            onClick={() => setIsNotificationsPaused(!isNotificationsPaused)}
                            title="Pause Notifications"
                        >
                            {isNotificationsPaused ? <Play size={16} /> : <Pause size={16} />}
                        </button>
                        <button
                            className={`control-btn ${soundEnabled ? 'active' : ''}`}
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            title="Sound Notifications"
                        >
                            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                        </button>
                        <button
                            className="control-btn"
                            onClick={() => setShowSettings(!showSettings)}
                            title="Settings"
                        >
                            <Settings size={16} />
                        </button>
                    </div>

                    <div className="sidebar-nav">
                        <button
                            className={`nav-item ${activeView === 'all' ? 'active' : ''}`}
                            onClick={() => setActiveView('all')}
                        >
                            <Bell size={16} />
                            All Notifications
                            <span className="nav-count">{notifications.filter(n => !n.archived).length}</span>
                        </button>
                        <button
                            className={`nav-item ${activeView === 'unread' ? 'active' : ''}`}
                            onClick={() => setActiveView('unread')}
                        >
                            <Eye size={16} />
                            Unread
                            <span className="nav-count">{unreadCount}</span>
                        </button>
                        <button
                            className={`nav-item ${activeView === 'starred' ? 'active' : ''}`}
                            onClick={() => setActiveView('starred')}
                        >
                            <Star size={16} />
                            Starred
                            <span className="nav-count">{notifications.filter(n => n.starred && !n.archived).length}</span>
                        </button>
                        <button
                            className={`nav-item ${activeView === 'deadlines' ? 'active' : ''}`}
                            onClick={() => setActiveView('deadlines')}
                        >
                            <Clock size={16} />
                            Deadlines
                            <span className="nav-count">{deadlineAlerts.filter(d => d.status !== 'completed').length}</span>
                        </button>
                        <button
                            className={`nav-item ${activeView === 'archived' ? 'active' : ''}`}
                            onClick={() => setActiveView('archived')}
                        >
                            <Archive size={16} />
                            Archived
                            <span className="nav-count">{notifications.filter(n => n.archived).length}</span>
                        </button>
                    </div>

                    <div className="sidebar-filters">
                        <h4>Filter by Type</h4>
                        <div className="filter-buttons">
                            {(['all', 'info', 'warning', 'error', 'success', 'legal', 'deadline'] as const).map(type => (
                                <button
                                    key={type}
                                    className={`filter-btn ${selectedFilter === type ? 'active' : ''}`}
                                    onClick={() => setSelectedFilter(type)}
                                >
                                    {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="notification-main">
                    {/* Toolbar */}
                    <div className="notification-toolbar">
                        <div className="toolbar-left">
                            <div className="search-container">
                                <Search size={16} />
                                <input
                                    type="text"
                                    placeholder="Search notifications..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="search-input"
                                />
                            </div>
                        </div>
                        <div className="toolbar-right">
                            {selectedNotifications.size > 0 && (
                                <div className="bulk-actions">
                                    <span className="selection-count">
                                        {selectedNotifications.size} selected
                                    </span>
                                    <button
                                        className="bulk-btn"
                                        onClick={() => bulkAction('read')}
                                    >
                                        <Check size={14} />
                                        Mark Read
                                    </button>
                                    <button
                                        className="bulk-btn"
                                        onClick={() => bulkAction('archive')}
                                    >
                                        <Archive size={14} />
                                        Archive
                                    </button>
                                    <button
                                        className="bulk-btn danger"
                                        onClick={() => bulkAction('delete')}
                                    >
                                        <Trash2 size={14} />
                                        Delete
                                    </button>
                                </div>
                            )}
                            <button
                                className="action-btn"
                                onClick={markAllAsRead}
                                disabled={unreadCount === 0}
                            >
                                <Check size={16} />
                                Mark All Read
                            </button>
                            <button
                                className="action-btn"
                                onClick={generateRandomNotification}
                            >
                                <RefreshCw size={16} />
                                Test Notification
                            </button>
                        </div>
                    </div>

                    {/* Notification List */}
                    <div className="notification-list">
                        {filteredNotifications.length === 0 ? (
                            <div className="empty-state">
                                <Bell size={48} />
                                <h3>No notifications found</h3>
                                <p>You're all caught up! No notifications match your current filters.</p>
                            </div>
                        ) : (
                            filteredNotifications.map(notification => (
                                <div
                                    key={notification.id}
                                    className={`notification-item ${notification.read ? 'read' : 'unread'} ${getPriorityColor(notification.priority)}`}
                                    onClick={() => markAsRead(notification.id)}
                                >
                                    <div className="notification-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={selectedNotifications.has(notification.id)}
                                            onChange={(e) => {
                                                const newSelected = new Set(selectedNotifications);
                                                if (e.target.checked) {
                                                    newSelected.add(notification.id);
                                                } else {
                                                    newSelected.delete(notification.id);
                                                }
                                                setSelectedNotifications(newSelected);
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>

                                    <div className="notification-icon">
                                        {getNotificationIcon(notification.type)}
                                    </div>

                                    <div className="notification-content">
                                        <div className="notification-header-row">
                                            <h4 className="notification-title">{notification.title}</h4>
                                            <div className="notification-meta">
                                                <span className="notification-time">
                                                    {formatTimeAgo(notification.timestamp)}
                                                </span>
                                                <span className={`priority-badge ${notification.priority}`}>
                                                    {notification.priority}
                                                </span>
                                            </div>
                                        </div>

                                        <p className="notification-message">{notification.message}</p>

                                        <div className="notification-details">
                                            <span className="notification-category">{notification.category}</span>
                                            <span className="notification-source">from {notification.source}</span>
                                            {notification.metadata.cornellReference && (
                                                <span className="cornell-ref">
                                                    <BookOpen size={12} />
                                                    {notification.metadata.cornellReference}
                                                </span>
                                            )}
                                        </div>

                                        {notification.metadata.complianceScore && (
                                            <div className="compliance-indicator">
                                                <div className="compliance-bar">
                                                    <div 
                                                        className="compliance-fill"
                                                        style={{ width: `${notification.metadata.complianceScore}%` }}
                                                    />
                                                </div>
                                                <span className="compliance-score">
                                                    {notification.metadata.complianceScore}% Compliant
                                                </span>
                                            </div>
                                        )}

                                        <div className="notification-channels">
                                            {notification.channels.map(channel => (
                                                <span key={channel} className={`channel-badge ${channel}`}>
                                                    {channel === 'push' && <Smartphone size={10} />}
                                                    {channel === 'email' && <Mail size={10} />}
                                                    {channel === 'sms' && <MessageSquare size={10} />}
                                                    {channel === 'in_app' && <Bell size={10} />}
                                                    {channel.replace('_', ' ')}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="notification-actions">
                                        <button
                                            className={`action-icon ${notification.starred ? 'starred' : ''}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleStar(notification.id);
                                            }}
                                            title="Star"
                                        >
                                            <Star size={16} />
                                        </button>
                                        <button
                                            className="action-icon"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                archiveNotification(notification.id);
                                            }}
                                            title="Archive"
                                        >
                                            <Archive size={16} />
                                        </button>
                                        <button
                                            className="action-icon danger"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteNotification(notification.id);
                                            }}
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Deadline Alerts Panel */}
                {activeView === 'deadlines' && (
                    <div className="deadline-panel">
                        <div className="panel-header">
                            <h3>Upcoming Deadlines</h3>
                            <span className="deadline-count">
                                {deadlineAlerts.filter(d => d.status !== 'completed').length} active
                            </span>
                        </div>
                        <div className="deadline-list">
                            {deadlineAlerts.map(alert => (
                                <div key={alert.id} className={`deadline-item ${alert.status}`}>
                                    <div className="deadline-icon">
                                        <Calendar size={20} />
                                    </div>
                                    <div className="deadline-content">
                                        <h4>{alert.title}</h4>
                                        <p>{alert.description}</p>
                                        <div className="deadline-meta">
                                            <span className="deadline-date">
                                                Due: {alert.deadline.toLocaleDateString()} at {alert.deadline.toLocaleTimeString()}
                                            </span>
                                            <span className="deadline-document">
                                                Document: {alert.documentId}
                                            </span>
                                            {alert.cornellReference && (
                                                <span className="cornell-ref">
                                                    <Scale size={12} />
                                                    {alert.cornellReference}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="deadline-priority">
                                        <span className={`priority-indicator ${alert.priority}`}>
                                            {alert.priority}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Audio element for notification sounds */}
            <audio ref={audioRef} preload="auto">
                <source src="/notification-sound.mp3" type="audio/mpeg" />
                <source src="/notification-sound.wav" type="audio/wav" />
            </audio>
        </div>
    );
};

export default AdvancedNotificationSystem;
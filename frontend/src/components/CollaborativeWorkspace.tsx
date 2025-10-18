import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    Users, MessageSquare, Share2, Eye, Edit3, Lock, Unlock,
    UserPlus, UserMinus, Crown, Shield, CheckCircle, XCircle,
    Clock, Archive, Download, Upload, RefreshCw, Search,
    Filter, MoreVertical, Star, Flag, AlertTriangle, Info,
    Send, Reply, Forward, AtSign, Hash, Calendar, FileText,
    Video, Phone, Settings, Bell, Globe, Zap, Award, Target,
    GitBranch, GitMerge, GitPullRequest, History, Database,
    Layers, Grid, List, Map, Bookmark, Tag, Folder, Copy,
    Trash2, ArrowRight, ArrowLeft, ChevronDown, ChevronUp,
    Plus, Minus, Check, X, Pause, Play, RotateCcw, Save,
    Scale, BookOpen, Gavel, Building, UserCheck, FileCheck
} from 'lucide-react';

interface User {
    id: string;
    name: string;
    email: string;
    avatar: string;
    role: 'admin' | 'editor' | 'reviewer' | 'viewer';
    status: 'online' | 'away' | 'busy' | 'offline';
    lastActive: Date;
    permissions: Permission[];
    departmentId?: string;
    title?: string;
    jurisdiction?: string;
}

interface Permission {
    id: string;
    name: string;
    description: string;
    scope: 'document' | 'workspace' | 'system';
    actions: ('read' | 'write' | 'delete' | 'share' | 'approve')[];
}

interface Workspace {
    id: string;
    name: string;
    description: string;
    type: 'legal' | 'financial' | 'compliance' | 'general';
    visibility: 'public' | 'private' | 'restricted';
    createdAt: Date;
    createdBy: string;
    members: WorkspaceMember[];
    documents: WorkspaceDocument[];
    settings: WorkspaceSettings;
    statistics: WorkspaceStats;
}

interface WorkspaceMember {
    userId: string;
    role: 'owner' | 'admin' | 'editor' | 'reviewer' | 'viewer';
    joinedAt: Date;
    permissions: string[];
    lastAccess: Date;
}

interface WorkspaceDocument {
    id: string;
    name: string;
    type: 'bill_of_exchange' | 'promissory_note' | 'check' | 'letter_of_credit' | 'contract' | 'other';
    status: 'draft' | 'review' | 'approved' | 'rejected' | 'archived';
    version: number;
    createdAt: Date;
    createdBy: string;
    lastModified: Date;
    lastModifiedBy: string;
    collaborators: string[];
    comments: Comment[];
    approvalWorkflow: ApprovalWorkflow;
    cornellCompliance: {
        score: number;
        references: string[];
        issues: ComplianceIssue[];
    };
    realTimeEditors: string[];
    lockStatus: {
        isLocked: boolean;
        lockedBy?: string;
        lockedAt?: Date;
    };
}

interface Comment {
    id: string;
    authorId: string;
    content: string;
    timestamp: Date;
    position: { x: number; y: number } | null;
    documentSection?: string;
    parentId?: string;
    replies: Comment[];
    resolved: boolean;
    type: 'general' | 'suggestion' | 'approval' | 'legal_review';
    tags: string[];
    priority: 'low' | 'medium' | 'high' | 'critical';
}

interface ApprovalWorkflow {
    id: string;
    name: string;
    steps: ApprovalStep[];
    currentStep: number;
    status: 'pending' | 'in_progress' | 'approved' | 'rejected';
    requiredApprovals: number;
    receivedApprovals: ApprovalDecision[];
}

interface ApprovalStep {
    id: string;
    name: string;
    description: string;
    approvers: string[];
    requiredApprovals: number;
    allowParallel: boolean;
    timeLimit?: number;
    cornellValidation: boolean;
}

interface ApprovalDecision {
    stepId: string;
    approverId: string;
    decision: 'approve' | 'reject' | 'request_changes';
    comment: string;
    timestamp: Date;
    cornellCompliance?: {
        validated: boolean;
        references: string[];
        issues: string[];
    };
}

interface ComplianceIssue {
    id: string;
    severity: 'error' | 'warning' | 'info';
    message: string;
    section: string;
    cornellReference: string;
    suggestedFix?: string;
}

interface WorkspaceSettings {
    allowGuestAccess: boolean;
    requireApproval: boolean;
    enableRealTimeCollab: boolean;
    autoSaveInterval: number;
    retentionPolicy: number;
    notificationSettings: {
        comments: boolean;
        approvals: boolean;
        documentChanges: boolean;
        mentions: boolean;
    };
}

interface WorkspaceStats {
    totalDocuments: number;
    activeCollaborators: number;
    documentsInReview: number;
    avgApprovalTime: number;
    complianceScore: number;
}

interface Activity {
    id: string;
    type: 'document_created' | 'document_edited' | 'comment_added' | 'approval_request' | 'user_joined' | 'workflow_completed';
    userId: string;
    documentId?: string;
    workspaceId: string;
    timestamp: Date;
    details: any;
    visibility: 'public' | 'team' | 'private';
}

const CollaborativeWorkspace: React.FC = () => {
    const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [selectedDocument, setSelectedDocument] = useState<WorkspaceDocument | null>(null);
    const [activeView, setActiveView] = useState<'overview' | 'documents' | 'members' | 'activity' | 'settings'>('overview');
    const [showDocumentDetails, setShowDocumentDetails] = useState(false);
    const [realTimeConnections, setRealTimeConnections] = useState<Map<string, string[]>>(new Map());
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [showApprovalWorkflow, setShowApprovalWorkflow] = useState(false);
    const [activityFeed, setActivityFeed] = useState<Activity[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'review' | 'approved'>('all');
    const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
    const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
    const wsRef = useRef<WebSocket | null>(null);

    // Mock data initialization
    useEffect(() => {
        loadMockData();
        initializeRealTimeConnection();
        
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    const loadMockData = () => {
        // Mock users
        const mockUsers: User[] = [
            {
                id: 'user1',
                name: 'Sarah Mitchell',
                email: 'sarah.mitchell@legalcorp.com',
                avatar: '/avatar1.jpg',
                role: 'admin',
                status: 'online',
                lastActive: new Date(),
                title: 'Senior Legal Counsel',
                jurisdiction: 'Federal',
                permissions: [],
                departmentId: 'legal'
            },
            {
                id: 'user2',
                name: 'James Rodriguez',
                email: 'j.rodriguez@legalcorp.com',
                avatar: '/avatar2.jpg',
                role: 'editor',
                status: 'online',
                lastActive: new Date(Date.now() - 5 * 60 * 1000),
                title: 'Compliance Officer',
                jurisdiction: 'Multi-State',
                permissions: [],
                departmentId: 'compliance'
            },
            {
                id: 'user3',
                name: 'Emily Chen',
                email: 'emily.chen@legalcorp.com',
                avatar: '/avatar3.jpg',
                role: 'reviewer',
                status: 'away',
                lastActive: new Date(Date.now() - 15 * 60 * 1000),
                title: 'Legal Analyst',
                jurisdiction: 'State',
                permissions: [],
                departmentId: 'legal'
            },
            {
                id: 'user4',
                name: 'Michael Johnson',
                email: 'm.johnson@legalcorp.com',
                avatar: '/avatar4.jpg',
                role: 'viewer',
                status: 'offline',
                lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
                title: 'Paralegal',
                jurisdiction: 'Local',
                permissions: [],
                departmentId: 'support'
            }
        ];

        // Mock current user
        setCurrentUser(mockUsers[0]);
        setUsers(mockUsers);

        // Mock workspaces
        const mockWorkspaces: Workspace[] = [
            {
                id: 'ws1',
                name: 'Cornell Legal Compliance Hub',
                description: 'Primary workspace for Cornell Law framework compliance and document processing',
                type: 'legal',
                visibility: 'private',
                createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                createdBy: 'user1',
                members: [
                    { userId: 'user1', role: 'owner', joinedAt: new Date(), permissions: [], lastAccess: new Date() },
                    { userId: 'user2', role: 'editor', joinedAt: new Date(), permissions: [], lastAccess: new Date() },
                    { userId: 'user3', role: 'reviewer', joinedAt: new Date(), permissions: [], lastAccess: new Date() }
                ],
                documents: [
                    {
                        id: 'doc1',
                        name: 'Promissory Note Template - UCC 3-104 Compliant',
                        type: 'promissory_note',
                        status: 'review',
                        version: 3,
                        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                        createdBy: 'user1',
                        lastModified: new Date(Date.now() - 30 * 60 * 1000),
                        lastModifiedBy: 'user2',
                        collaborators: ['user1', 'user2', 'user3'],
                        comments: [],
                        realTimeEditors: ['user2'],
                        lockStatus: { isLocked: false },
                        cornellCompliance: {
                            score: 92,
                            references: ['UCC 3-104(a)', 'UCC 3-103(a)(7)', 'UCC 3-106'],
                            issues: []
                        },
                        approvalWorkflow: {
                            id: 'wf1',
                            name: 'Standard Legal Review',
                            steps: [
                                {
                                    id: 'step1',
                                    name: 'Initial Review',
                                    description: 'Legal compliance and Cornell validation',
                                    approvers: ['user3'],
                                    requiredApprovals: 1,
                                    allowParallel: false,
                                    cornellValidation: true
                                },
                                {
                                    id: 'step2',
                                    name: 'Senior Approval',
                                    description: 'Final approval from senior counsel',
                                    approvers: ['user1'],
                                    requiredApprovals: 1,
                                    allowParallel: false,
                                    cornellValidation: false
                                }
                            ],
                            currentStep: 0,
                            status: 'in_progress',
                            requiredApprovals: 2,
                            receivedApprovals: []
                        }
                    },
                    {
                        id: 'doc2',
                        name: 'Bill of Exchange - International Trade',
                        type: 'bill_of_exchange',
                        status: 'draft',
                        version: 1,
                        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                        createdBy: 'user2',
                        lastModified: new Date(Date.now() - 45 * 60 * 1000),
                        lastModifiedBy: 'user2',
                        collaborators: ['user2'],
                        comments: [],
                        realTimeEditors: [],
                        lockStatus: { isLocked: false },
                        cornellCompliance: {
                            score: 78,
                            references: ['UCC 3-104(a)', 'UCC 3-109'],
                            issues: [
                                {
                                    id: 'issue1',
                                    severity: 'warning',
                                    message: 'Missing required signature field',
                                    section: 'Section 4.2',
                                    cornellReference: 'UCC 3-401(a)',
                                    suggestedFix: 'Add designated signature line with title'
                                }
                            ]
                        },
                        approvalWorkflow: {
                            id: 'wf2',
                            name: 'Draft Review',
                            steps: [],
                            currentStep: 0,
                            status: 'pending',
                            requiredApprovals: 0,
                            receivedApprovals: []
                        }
                    }
                ],
                settings: {
                    allowGuestAccess: false,
                    requireApproval: true,
                    enableRealTimeCollab: true,
                    autoSaveInterval: 30,
                    retentionPolicy: 365,
                    notificationSettings: {
                        comments: true,
                        approvals: true,
                        documentChanges: true,
                        mentions: true
                    }
                },
                statistics: {
                    totalDocuments: 2,
                    activeCollaborators: 3,
                    documentsInReview: 1,
                    avgApprovalTime: 2.5,
                    complianceScore: 85
                }
            }
        ];

        // Mock comments
        const mockComments: Comment[] = [
            {
                id: 'comment1',
                authorId: 'user3',
                content: 'This promissory note template looks excellent! The Cornell compliance score is impressive. Just need to verify the UCC 3-106 reference formatting.',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
                position: { x: 250, y: 150 },
                documentSection: 'Section 2.1',
                replies: [
                    {
                        id: 'reply1',
                        authorId: 'user2',
                        content: 'Thanks Emily! I\'ll double-check the UCC 3-106 formatting against the latest Cornell guidelines.',
                        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
                        position: null,
                        replies: [],
                        resolved: false,
                        type: 'general',
                        tags: [],
                        priority: 'medium'
                    }
                ],
                resolved: false,
                type: 'legal_review',
                tags: ['ucc', 'compliance'],
                priority: 'medium'
            },
            {
                id: 'comment2',
                authorId: 'user1',
                content: '@james Please ensure all signature fields comply with UCC 3-401(a) requirements before final approval.',
                timestamp: new Date(Date.now() - 45 * 60 * 1000),
                position: null,
                documentSection: 'Section 4.2',
                replies: [],
                resolved: false,
                type: 'approval',
                tags: ['signature', 'ucc-3-401'],
                priority: 'high'
            }
        ];

        // Mock activity feed
        const mockActivity: Activity[] = [
            {
                id: 'activity1',
                type: 'document_edited',
                userId: 'user2',
                documentId: 'doc1',
                workspaceId: 'ws1',
                timestamp: new Date(Date.now() - 30 * 60 * 1000),
                details: { changes: 'Updated signature section' },
                visibility: 'team'
            },
            {
                id: 'activity2',
                type: 'comment_added',
                userId: 'user3',
                documentId: 'doc1',
                workspaceId: 'ws1',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
                details: { commentId: 'comment1' },
                visibility: 'team'
            },
            {
                id: 'activity3',
                type: 'approval_request',
                userId: 'user1',
                documentId: 'doc1',
                workspaceId: 'ws1',
                timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
                details: { workflowStep: 'Initial Review' },
                visibility: 'team'
            }
        ];

        setWorkspaces(mockWorkspaces);
        setActiveWorkspace(mockWorkspaces[0]);
        setComments(mockComments);
        setActivityFeed(mockActivity);
    };

    const initializeRealTimeConnection = () => {
        // Mock WebSocket connection for real-time collaboration
        const mockConnect = () => {
            setTimeout(() => {
                // Simulate real-time editor presence
                setRealTimeConnections(new Map([
                    ['doc1', ['user2', 'user3']],
                    ['doc2', ['user2']]
                ]));
            }, 1000);
        };

        mockConnect();
    };

    const getUserById = (userId: string): User | undefined => {
        return users.find(u => u.id === userId);
    };

    const addComment = () => {
        if (!newComment.trim() || !selectedDocument || !currentUser) return;

        const comment: Comment = {
            id: `comment_${Date.now()}`,
            authorId: currentUser.id,
            content: newComment,
            timestamp: new Date(),
            position: null,
            documentSection: 'General',
            replies: [],
            resolved: false,
            type: 'general',
            tags: [],
            priority: 'medium'
        };

        setComments(prev => [comment, ...prev]);
        setNewComment('');

        // Add activity
        const activity: Activity = {
            id: `activity_${Date.now()}`,
            type: 'comment_added',
            userId: currentUser.id,
            documentId: selectedDocument.id,
            workspaceId: activeWorkspace?.id || '',
            timestamp: new Date(),
            details: { commentId: comment.id },
            visibility: 'team'
        };

        setActivityFeed(prev => [activity, ...prev]);
    };

    const approveDocument = (decision: 'approve' | 'reject' | 'request_changes', comment: string) => {
        if (!selectedDocument || !currentUser || !activeWorkspace) return;

        const approvalDecision: ApprovalDecision = {
            stepId: selectedDocument.approvalWorkflow.steps[selectedDocument.approvalWorkflow.currentStep]?.id || '',
            approverId: currentUser.id,
            decision,
            comment,
            timestamp: new Date(),
            cornellCompliance: {
                validated: true,
                references: selectedDocument.cornellCompliance.references,
                issues: []
            }
        };

        // Update document workflow
        const updatedDocument = {
            ...selectedDocument,
            approvalWorkflow: {
                ...selectedDocument.approvalWorkflow,
                receivedApprovals: [...selectedDocument.approvalWorkflow.receivedApprovals, approvalDecision],
                status: decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'in_progress'
            }
        };

        if (decision === 'approve') {
            updatedDocument.status = 'approved';
        } else if (decision === 'reject') {
            updatedDocument.status = 'rejected';
        }

        // Update workspace documents
        const updatedWorkspace = {
            ...activeWorkspace,
            documents: activeWorkspace.documents.map(doc => 
                doc.id === selectedDocument.id ? updatedDocument : doc
            )
        };

        setActiveWorkspace(updatedWorkspace);
        setSelectedDocument(updatedDocument);

        // Add activity
        const activity: Activity = {
            id: `activity_${Date.now()}`,
            type: 'approval_request',
            userId: currentUser.id,
            documentId: selectedDocument.id,
            workspaceId: activeWorkspace.id,
            timestamp: new Date(),
            details: { decision, comment },
            visibility: 'team'
        };

        setActivityFeed(prev => [activity, ...prev]);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'draft': return <Edit3 size={16} className="text-gray-500" />;
            case 'review': return <Clock size={16} className="text-yellow-500" />;
            case 'approved': return <CheckCircle size={16} className="text-green-500" />;
            case 'rejected': return <XCircle size={16} className="text-red-500" />;
            default: return <FileText size={16} className="text-gray-500" />;
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'owner':
            case 'admin': return <Crown size={16} className="text-yellow-500" />;
            case 'editor': return <Edit3 size={16} className="text-blue-500" />;
            case 'reviewer': return <Eye size={16} className="text-green-500" />;
            case 'viewer': return <Eye size={16} className="text-gray-500" />;
            default: return <Users size={16} className="text-gray-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'online': return 'bg-green-500';
            case 'away': return 'bg-yellow-500';
            case 'busy': return 'bg-red-500';
            case 'offline': return 'bg-gray-500';
            default: return 'bg-gray-500';
        }
    };

    const filteredDocuments = activeWorkspace?.documents.filter(doc => {
        const matchesSearch = searchQuery === '' || 
            doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.type.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesFilter = filterStatus === 'all' || doc.status === filterStatus;
        
        return matchesSearch && matchesFilter;
    }) || [];

    if (!activeWorkspace) {
        return (
            <div className="collaborative-workspace">
                <div className="workspace-header">
                    <div className="header-content">
                        <div className="header-icon">
                            <Users size={32} />
                        </div>
                        <div>
                            <h1>Collaborative Workspace</h1>
                            <p>Multi-user collaboration with real-time document sharing and Cornell legal framework integration</p>
                        </div>
                    </div>
                </div>
                
                <div className="workspace-loading">
                    <RefreshCw size={48} className="animate-spin" />
                    <h3>Loading Workspace...</h3>
                    <p>Initializing collaborative environment</p>
                </div>
            </div>
        );
    }

    return (
        <div className="collaborative-workspace">
            {/* Header */}
            <div className="workspace-header">
                <div className="header-content">
                    <div className="header-icon">
                        <Users size={32} />
                    </div>
                    <div>
                        <h1>{activeWorkspace.name}</h1>
                        <p>{activeWorkspace.description}</p>
                    </div>
                </div>
                
                <div className="workspace-stats">
                    <div className="stat-item">
                        <FileText size={20} />
                        <span className="stat-value">{activeWorkspace.statistics.totalDocuments}</span>
                        <span className="stat-label">Documents</span>
                    </div>
                    <div className="stat-item">
                        <Users size={20} />
                        <span className="stat-value">{activeWorkspace.statistics.activeCollaborators}</span>
                        <span className="stat-label">Collaborators</span>
                    </div>
                    <div className="stat-item">
                        <Clock size={20} />
                        <span className="stat-value">{activeWorkspace.statistics.documentsInReview}</span>
                        <span className="stat-label">In Review</span>
                    </div>
                    <div className="stat-item">
                        <Scale size={20} />
                        <span className="stat-value">{activeWorkspace.statistics.complianceScore}%</span>
                        <span className="stat-label">Cornell Compliance</span>
                    </div>
                </div>
            </div>

            <div className="workspace-layout">
                {/* Sidebar Navigation */}
                <div className="workspace-sidebar">
                    <div className="sidebar-nav">
                        <button
                            className={`nav-item ${activeView === 'overview' ? 'active' : ''}`}
                            onClick={() => setActiveView('overview')}
                        >
                            <Grid size={16} />
                            Overview
                        </button>
                        <button
                            className={`nav-item ${activeView === 'documents' ? 'active' : ''}`}
                            onClick={() => setActiveView('documents')}
                        >
                            <FileText size={16} />
                            Documents
                            <span className="nav-count">{activeWorkspace.documents.length}</span>
                        </button>
                        <button
                            className={`nav-item ${activeView === 'members' ? 'active' : ''}`}
                            onClick={() => setActiveView('members')}
                        >
                            <Users size={16} />
                            Members
                            <span className="nav-count">{activeWorkspace.members.length}</span>
                        </button>
                        <button
                            className={`nav-item ${activeView === 'activity' ? 'active' : ''}`}
                            onClick={() => setActiveView('activity')}
                        >
                            <History size={16} />
                            Activity
                        </button>
                        <button
                            className={`nav-item ${activeView === 'settings' ? 'active' : ''}`}
                            onClick={() => setActiveView('settings')}
                        >
                            <Settings size={16} />
                            Settings
                        </button>
                    </div>

                    {/* Online Members */}
                    <div className="online-members">
                        <h4>Online Now</h4>
                        <div className="member-list">
                            {activeWorkspace.members
                                .map(member => getUserById(member.userId))
                                .filter((user): user is User => user !== undefined && user.status === 'online')
                                .map(user => (
                                <div key={user.id} className="member-item online">
                                    <div className="member-avatar">
                                        <img src={user.avatar} alt={user.name} />
                                        <div className={`status-indicator ${getStatusColor(user.status)}`} />
                                    </div>
                                    <div className="member-info">
                                        <span className="member-name">{user.name}</span>
                                        <span className="member-title">{user.title}</span>
                                    </div>
                                    {getRoleIcon(activeWorkspace.members.find(m => m.userId === user.id)?.role || 'viewer')}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="workspace-main">
                    {activeView === 'overview' && (
                        <div className="overview-content">
                            <div className="overview-grid">
                                {/* Recent Documents */}
                                <div className="overview-card">
                                    <div className="card-header">
                                        <h3>Recent Documents</h3>
                                        <button className="btn-secondary" onClick={() => setActiveView('documents')}>
                                            View All
                                        </button>
                                    </div>
                                    <div className="document-preview-list">
                                        {activeWorkspace.documents.slice(0, 3).map(doc => (
                                            <div key={doc.id} className="document-preview-item" onClick={() => setSelectedDocument(doc)}>
                                                <div className="document-icon">
                                                    {getStatusIcon(doc.status)}
                                                </div>
                                                <div className="document-info">
                                                    <h4>{doc.name}</h4>
                                                    <p>Modified by {getUserById(doc.lastModifiedBy)?.name} • {new Date(doc.lastModified).toLocaleDateString()}</p>
                                                </div>
                                                <div className="document-meta">
                                                    <div className="compliance-score">
                                                        <Scale size={14} />
                                                        {doc.cornellCompliance.score}%
                                                    </div>
                                                    {doc.realTimeEditors.length > 0 && (
                                                        <div className="live-editors">
                                                            <div className="live-indicator" />
                                                            {doc.realTimeEditors.length}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Activity Feed */}
                                <div className="overview-card">
                                    <div className="card-header">
                                        <h3>Recent Activity</h3>
                                        <button className="btn-secondary" onClick={() => setActiveView('activity')}>
                                            View All
                                        </button>
                                    </div>
                                    <div className="activity-preview-list">
                                        {activityFeed.slice(0, 5).map(activity => (
                                            <div key={activity.id} className="activity-preview-item">
                                                <div className="activity-icon">
                                                    {activity.type === 'document_edited' && <Edit3 size={16} />}
                                                    {activity.type === 'comment_added' && <MessageSquare size={16} />}
                                                    {activity.type === 'approval_request' && <CheckCircle size={16} />}
                                                </div>
                                                <div className="activity-content">
                                                    <p>
                                                        <strong>{getUserById(activity.userId)?.name}</strong>
                                                        {activity.type === 'document_edited' && ' edited document'}
                                                        {activity.type === 'comment_added' && ' added a comment'}
                                                        {activity.type === 'approval_request' && ' requested approval'}
                                                    </p>
                                                    <span className="activity-time">
                                                        {new Date(activity.timestamp).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Cornell Compliance Overview */}
                                <div className="overview-card">
                                    <div className="card-header">
                                        <h3>Cornell Compliance Overview</h3>
                                        <div className="compliance-overall">
                                            <Scale size={20} />
                                            {activeWorkspace.statistics.complianceScore}%
                                        </div>
                                    </div>
                                    <div className="compliance-breakdown">
                                        {activeWorkspace.documents.map(doc => (
                                            <div key={doc.id} className="compliance-item">
                                                <span className="document-name">{doc.name}</span>
                                                <div className="compliance-bar">
                                                    <div 
                                                        className="compliance-fill"
                                                        style={{ width: `${doc.cornellCompliance.score}%` }}
                                                    />
                                                </div>
                                                <span className="compliance-score">{doc.cornellCompliance.score}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeView === 'documents' && (
                        <div className="documents-content">
                            {/* Documents Toolbar */}
                            <div className="documents-toolbar">
                                <div className="toolbar-left">
                                    <div className="search-container">
                                        <Search size={16} />
                                        <input
                                            type="text"
                                            placeholder="Search documents..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="search-input"
                                        />
                                    </div>
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value as any)}
                                        className="status-filter"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="draft">Draft</option>
                                        <option value="review">In Review</option>
                                        <option value="approved">Approved</option>
                                    </select>
                                </div>
                                <div className="toolbar-right">
                                    <button className="btn-primary">
                                        <Plus size={16} />
                                        New Document
                                    </button>
                                    <button className="btn-secondary">
                                        <Upload size={16} />
                                        Import
                                    </button>
                                </div>
                            </div>

                            {/* Documents Grid */}
                            <div className="documents-grid">
                                {filteredDocuments.map(doc => (
                                    <div 
                                        key={doc.id} 
                                        className={`document-card ${selectedDocument?.id === doc.id ? 'selected' : ''}`}
                                        onClick={() => {
                                            setSelectedDocument(doc);
                                            setShowDocumentDetails(true);
                                        }}
                                    >
                                        <div className="document-header">
                                            <div className="document-type">
                                                {getStatusIcon(doc.status)}
                                                <span className={`status-badge ${doc.status}`}>
                                                    {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                                                </span>
                                            </div>
                                            <div className="document-actions">
                                                {doc.lockStatus.isLocked && (
                                                    <Lock size={14} title={`Locked by ${getUserById(doc.lockStatus.lockedBy || '')?.name}`} />
                                                )}
                                                {doc.realTimeEditors.length > 0 && (
                                                    <div className="live-indicator" title="Being edited" />
                                                )}
                                            </div>
                                        </div>

                                        <div className="document-content">
                                            <h4 className="document-title">{doc.name}</h4>
                                            <p className="document-meta">
                                                Version {doc.version} • {doc.type.replace('_', ' ')}
                                            </p>
                                            
                                            <div className="document-stats">
                                                <div className="stat">
                                                    <Users size={14} />
                                                    <span>{doc.collaborators.length}</span>
                                                </div>
                                                <div className="stat">
                                                    <MessageSquare size={14} />
                                                    <span>{doc.comments.length}</span>
                                                </div>
                                                <div className="stat">
                                                    <Scale size={14} />
                                                    <span>{doc.cornellCompliance.score}%</span>
                                                </div>
                                            </div>

                                            <div className="collaborators">
                                                {doc.collaborators.slice(0, 3).map(userId => {
                                                    const user = getUserById(userId);
                                                    return user ? (
                                                        <div key={userId} className="collaborator-avatar">
                                                            <img src={user.avatar} alt={user.name} title={user.name} />
                                                        </div>
                                                    ) : null;
                                                })}
                                                {doc.collaborators.length > 3 && (
                                                    <div className="collaborator-more">
                                                        +{doc.collaborators.length - 3}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="document-footer">
                                                <span className="last-modified">
                                                    Modified {new Date(doc.lastModified).toLocaleDateString()}
                                                </span>
                                                {doc.cornellCompliance.issues.length > 0 && (
                                                    <div className="compliance-issues">
                                                        <AlertTriangle size={14} />
                                                        {doc.cornellCompliance.issues.length} issues
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeView === 'members' && (
                        <div className="members-content">
                            <div className="members-toolbar">
                                <h3>Team Members ({activeWorkspace.members.length})</h3>
                                <button className="btn-primary">
                                    <UserPlus size={16} />
                                    Invite Member
                                </button>
                            </div>

                            <div className="members-grid">
                                {activeWorkspace.members.map(member => {
                                    const user = getUserById(member.userId);
                                    if (!user) return null;

                                    return (
                                        <div key={member.userId} className="member-card">
                                            <div className="member-header">
                                                <div className="member-avatar-large">
                                                    <img src={user.avatar} alt={user.name} />
                                                    <div className={`status-indicator ${getStatusColor(user.status)}`} />
                                                </div>
                                                <div className="member-actions">
                                                    <button className="action-btn">
                                                        <MoreVertical size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="member-details">
                                                <h4>{user.name}</h4>
                                                <p className="member-email">{user.email}</p>
                                                <p className="member-title">{user.title}</p>
                                                
                                                <div className="member-role">
                                                    {getRoleIcon(member.role)}
                                                    <span className={`role-badge ${member.role}`}>
                                                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                                    </span>
                                                </div>

                                                <div className="member-stats">
                                                    <div className="stat-row">
                                                        <span>Joined:</span>
                                                        <span>{new Date(member.joinedAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="stat-row">
                                                        <span>Last Active:</span>
                                                        <span>{new Date(member.lastAccess).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="stat-row">
                                                        <span>Jurisdiction:</span>
                                                        <span>{user.jurisdiction}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {activeView === 'activity' && (
                        <div className="activity-content">
                            <div className="activity-header">
                                <h3>Workspace Activity</h3>
                                <div className="activity-filters">
                                    <button className="filter-btn active">All</button>
                                    <button className="filter-btn">Documents</button>
                                    <button className="filter-btn">Comments</button>
                                    <button className="filter-btn">Approvals</button>
                                </div>
                            </div>

                            <div className="activity-timeline">
                                {activityFeed.map(activity => (
                                    <div key={activity.id} className="activity-item">
                                        <div className="activity-avatar">
                                            <img src={getUserById(activity.userId)?.avatar} alt="" />
                                        </div>
                                        <div className="activity-content">
                                            <div className="activity-header">
                                                <span className="activity-author">
                                                    {getUserById(activity.userId)?.name}
                                                </span>
                                                <span className="activity-action">
                                                    {activity.type === 'document_edited' && 'edited a document'}
                                                    {activity.type === 'comment_added' && 'added a comment'}
                                                    {activity.type === 'approval_request' && 'requested approval'}
                                                </span>
                                                <span className="activity-time">
                                                    {new Date(activity.timestamp).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="activity-details">
                                                {activity.documentId && (
                                                    <span className="activity-document">
                                                        on {activeWorkspace.documents.find(d => d.id === activity.documentId)?.name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Document Details Panel */}
                {showDocumentDetails && selectedDocument && (
                    <div className="document-details-panel">
                        <div className="panel-header">
                            <h3>{selectedDocument.name}</h3>
                            <button
                                className="close-btn"
                                onClick={() => setShowDocumentDetails(false)}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="panel-content">
                            {/* Document Info */}
                            <div className="document-info-section">
                                <div className="info-grid">
                                    <div className="info-item">
                                        <span className="info-label">Status:</span>
                                        <span className={`status-badge ${selectedDocument.status}`}>
                                            {selectedDocument.status.charAt(0).toUpperCase() + selectedDocument.status.slice(1)}
                                        </span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Version:</span>
                                        <span>{selectedDocument.version}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Cornell Compliance:</span>
                                        <div className="compliance-display">
                                            <Scale size={14} />
                                            <span>{selectedDocument.cornellCompliance.score}%</span>
                                        </div>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Last Modified:</span>
                                        <span>{new Date(selectedDocument.lastModified).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Cornell References */}
                            <div className="cornell-references-section">
                                <h4>Cornell Legal References</h4>
                                <div className="references-list">
                                    {selectedDocument.cornellCompliance.references.map((ref, index) => (
                                        <div key={index} className="reference-item">
                                            <BookOpen size={14} />
                                            <span>{ref}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Compliance Issues */}
                            {selectedDocument.cornellCompliance.issues.length > 0 && (
                                <div className="compliance-issues-section">
                                    <h4>Compliance Issues</h4>
                                    <div className="issues-list">
                                        {selectedDocument.cornellCompliance.issues.map(issue => (
                                            <div key={issue.id} className={`issue-item ${issue.severity}`}>
                                                <div className="issue-header">
                                                    {issue.severity === 'error' && <XCircle size={16} />}
                                                    {issue.severity === 'warning' && <AlertTriangle size={16} />}
                                                    {issue.severity === 'info' && <Info size={16} />}
                                                    <span className="issue-message">{issue.message}</span>
                                                </div>
                                                <div className="issue-details">
                                                    <span className="issue-section">{issue.section}</span>
                                                    <span className="issue-reference">{issue.cornellReference}</span>
                                                </div>
                                                {issue.suggestedFix && (
                                                    <div className="issue-fix">
                                                        <strong>Suggested Fix:</strong> {issue.suggestedFix}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Comments Section */}
                            <div className="comments-section">
                                <h4>Comments ({comments.length})</h4>
                                
                                {/* Add Comment */}
                                <div className="add-comment">
                                    <div className="comment-input-container">
                                        <textarea
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder="Add a comment..."
                                            className="comment-input"
                                        />
                                        <button
                                            className="send-comment-btn"
                                            onClick={addComment}
                                            disabled={!newComment.trim()}
                                        >
                                            <Send size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Comments List */}
                                <div className="comments-list">
                                    {comments.map(comment => (
                                        <div key={comment.id} className={`comment-item ${comment.type}`}>
                                            <div className="comment-avatar">
                                                <img src={getUserById(comment.authorId)?.avatar} alt="" />
                                            </div>
                                            <div className="comment-content">
                                                <div className="comment-header">
                                                    <span className="comment-author">
                                                        {getUserById(comment.authorId)?.name}
                                                    </span>
                                                    <span className="comment-time">
                                                        {new Date(comment.timestamp).toLocaleString()}
                                                    </span>
                                                    {comment.priority !== 'medium' && (
                                                        <span className={`priority-indicator ${comment.priority}`}>
                                                            {comment.priority}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="comment-text">{comment.content}</p>
                                                {comment.documentSection && (
                                                    <div className="comment-section">
                                                        <FileText size={12} />
                                                        {comment.documentSection}
                                                    </div>
                                                )}
                                                {comment.tags.length > 0 && (
                                                    <div className="comment-tags">
                                                        {comment.tags.map(tag => (
                                                            <span key={tag} className="comment-tag">
                                                                #{tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="comment-actions">
                                                    <button className="comment-action-btn">
                                                        <Reply size={12} />
                                                        Reply
                                                    </button>
                                                    {!comment.resolved && (
                                                        <button className="comment-action-btn">
                                                            <Check size={12} />
                                                            Resolve
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Approval Workflow */}
                            {selectedDocument.approvalWorkflow.steps.length > 0 && (
                                <div className="approval-workflow-section">
                                    <div className="workflow-header">
                                        <h4>Approval Workflow</h4>
                                        <span className={`workflow-status ${selectedDocument.approvalWorkflow.status}`}>
                                            {selectedDocument.approvalWorkflow.status.replace('_', ' ').toUpperCase()}
                                        </span>
                                    </div>

                                    <div className="workflow-steps">
                                        {selectedDocument.approvalWorkflow.steps.map((step, index) => (
                                            <div 
                                                key={step.id} 
                                                className={`workflow-step ${index === selectedDocument.approvalWorkflow.currentStep ? 'current' : ''} ${index < selectedDocument.approvalWorkflow.currentStep ? 'completed' : ''}`}
                                            >
                                                <div className="step-indicator">
                                                    {index < selectedDocument.approvalWorkflow.currentStep ? (
                                                        <CheckCircle size={16} />
                                                    ) : index === selectedDocument.approvalWorkflow.currentStep ? (
                                                        <Clock size={16} />
                                                    ) : (
                                                        <div className="step-number">{index + 1}</div>
                                                    )}
                                                </div>
                                                <div className="step-content">
                                                    <h5>{step.name}</h5>
                                                    <p>{step.description}</p>
                                                    <div className="step-approvers">
                                                        {step.approvers.map(approverId => {
                                                            const approver = getUserById(approverId);
                                                            return approver ? (
                                                                <div key={approverId} className="approver-item">
                                                                    <img src={approver.avatar} alt={approver.name} />
                                                                    <span>{approver.name}</span>
                                                                </div>
                                                            ) : null;
                                                        })}
                                                    </div>
                                                    {step.cornellValidation && (
                                                        <div className="cornell-validation-required">
                                                            <Scale size={14} />
                                                            Cornell validation required
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Approval Actions */}
                                    {currentUser && selectedDocument.approvalWorkflow.currentStep < selectedDocument.approvalWorkflow.steps.length && (
                                        <div className="approval-actions">
                                            <button
                                                className="btn-success"
                                                onClick={() => approveDocument('approve', 'Document approved - meets Cornell compliance requirements')}
                                            >
                                                <CheckCircle size={16} />
                                                Approve
                                            </button>
                                            <button
                                                className="btn-warning"
                                                onClick={() => approveDocument('request_changes', 'Please address compliance issues before resubmission')}
                                            >
                                                <AlertTriangle size={16} />
                                                Request Changes
                                            </button>
                                            <button
                                                className="btn-danger"
                                                onClick={() => approveDocument('reject', 'Document does not meet legal requirements')}
                                            >
                                                <XCircle size={16} />
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CollaborativeWorkspace;
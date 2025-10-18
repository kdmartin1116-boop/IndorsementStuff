import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
    Search, Filter, BookOpen, FileText, Users, Calendar, Tag,
    TrendingUp, BarChart3, Globe, Map, Layers, Grid, List,
    Star, Bookmark, Clock, Eye, Download, Share2, Copy,
    ChevronDown, ChevronUp, MoreVertical, X, Check, Plus,
    ArrowRight, ArrowLeft, RefreshCw, Settings, Zap, Target,
    Brain, Cpu, Database, Network, Sparkles, Lightbulb,
    Scale, Gavel, Shield, Award, Building, Flag, Hash,
    AlertTriangle, Info, CheckCircle, XCircle, MessageSquare,
    Edit3, Lock, Unlock, Archive, Trash2, History, GitBranch,
    Folder, FolderOpen, File, Image, Video, Audio, Code,
    Link, ExternalLink, Mail, Phone, MapPin, Globe2,
    Shuffle, RotateCcw, Save, Upload, Sliders, Activity
} from 'lucide-react';

interface SearchResult {
    id: string;
    title: string;
    content: string;
    excerpt: string;
    type: 'document' | 'user' | 'workspace' | 'comment' | 'activity' | 'legal_reference';
    documentType?: 'bill_of_exchange' | 'promissory_note' | 'check' | 'letter_of_credit' | 'contract' | 'other';
    relevanceScore: number;
    lastModified: Date;
    author: string;
    workspaceId?: string;
    tags: string[];
    metadata: {
        wordCount?: number;
        cornellReferences?: string[];
        complianceScore?: number;
        jurisdiction?: string;
        fileSize?: number;
        fileFormat?: string;
        location?: string;
        department?: string;
        priority?: 'low' | 'medium' | 'high' | 'critical';
    };
    highlights: SearchHighlight[];
    similarDocuments?: string[];
    relatedTopics?: string[];
}

interface SearchHighlight {
    field: string;
    fragments: string[];
    score: number;
}

interface SearchFilter {
    type: 'document_type' | 'date_range' | 'author' | 'workspace' | 'tag' | 'compliance_score' | 'jurisdiction';
    value: any;
    label: string;
    active: boolean;
}

interface SearchSuggestion {
    id: string;
    query: string;
    type: 'recent' | 'popular' | 'recommended' | 'autocomplete';
    frequency?: number;
    lastUsed?: Date;
    category?: string;
}

interface SemanticCluster {
    id: string;
    name: string;
    description: string;
    documents: string[];
    concepts: string[];
    centerPoint: number[];
    color: string;
    size: number;
}

interface SearchAnalytics {
    totalQueries: number;
    avgResponseTime: number;
    popularQueries: Array<{ query: string; count: number }>;
    searchTrends: Array<{ date: Date; queries: number; avgRelevance: number }>;
    userBehavior: {
        clickThroughRate: number;
        avgResultsViewed: number;
        refinementRate: number;
    };
    contentGaps: Array<{ topic: string; queryCount: number; resultQuality: number }>;
}

interface SavedSearch {
    id: string;
    name: string;
    query: string;
    filters: SearchFilter[];
    createdAt: Date;
    lastUsed: Date;
    frequency: number;
    notifications: boolean;
    shared: boolean;
}

const AdvancedSearchDiscovery: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchMode, setSearchMode] = useState<'simple' | 'advanced' | 'semantic' | 'visual'>('simple');
    const [activeFilters, setActiveFilters] = useState<SearchFilter[]>([]);
    const [availableFilters, setAvailableFilters] = useState<SearchFilter[]>([]);
    const [searchSuggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
    const [semanticClusters, setSemanticClusters] = useState<SemanticCluster[]>([]);
    const [searchAnalytics, setSearchAnalytics] = useState<SearchAnalytics | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'grid' | 'timeline' | 'network'>('list');
    const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'author' | 'compliance'>('relevance');
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
    const [searchScope, setSearchScope] = useState<'all' | 'workspace' | 'documents' | 'legal'>('all');
    const searchInputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<NodeJS.Timeout>();

    // Mock data initialization
    useEffect(() => {
        loadMockData();
        loadSearchHistory();
    }, []);

    // Debounced search
    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (searchQuery.trim()) {
            debounceRef.current = setTimeout(() => {
                performSearch(searchQuery);
                generateSuggestions(searchQuery);
            }, 300);
        } else {
            setSearchResults([]);
            setShowSuggestions(false);
        }

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [searchQuery]);

    const loadMockData = () => {
        // Mock search results
        const mockResults: SearchResult[] = [
            {
                id: 'result1',
                title: 'Promissory Note Template - UCC 3-104 Compliant',
                content: 'This comprehensive promissory note template ensures full compliance with UCC Article 3, Section 104 requirements for negotiable instruments. The document includes all mandatory elements including unconditional promise to pay, specific amount, payable to order or bearer, and signature requirements.',
                excerpt: 'Comprehensive promissory note template ensuring full compliance with UCC Article 3...',
                type: 'document',
                documentType: 'promissory_note',
                relevanceScore: 0.95,
                lastModified: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                author: 'Sarah Mitchell',
                workspaceId: 'ws1',
                tags: ['ucc', 'promissory-note', 'template', 'legal-compliance'],
                metadata: {
                    wordCount: 1250,
                    cornellReferences: ['UCC 3-104(a)', 'UCC 3-103(a)(7)', 'UCC 3-106'],
                    complianceScore: 94,
                    jurisdiction: 'Federal',
                    fileSize: 45000,
                    fileFormat: 'PDF'
                },
                highlights: [
                    {
                        field: 'content',
                        fragments: ['UCC Article 3, Section 104 requirements', 'negotiable instruments', 'unconditional promise to pay'],
                        score: 0.9
                    }
                ],
                similarDocuments: ['result2', 'result4'],
                relatedTopics: ['negotiable instruments', 'UCC compliance', 'legal templates']
            },
            {
                id: 'result2',
                title: 'Bill of Exchange - International Trade Compliance',
                content: 'International bill of exchange template compliant with UCC 3-104(a) and international trade law. Includes drawer, drawee, and payee specifications with Cornell legal framework validation.',
                excerpt: 'International bill of exchange template compliant with UCC 3-104(a)...',
                type: 'document',
                documentType: 'bill_of_exchange',
                relevanceScore: 0.88,
                lastModified: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                author: 'James Rodriguez',
                workspaceId: 'ws1',
                tags: ['bill-of-exchange', 'international', 'trade', 'ucc'],
                metadata: {
                    wordCount: 980,
                    cornellReferences: ['UCC 3-104(a)', 'UCC 3-109', 'UCC 3-110'],
                    complianceScore: 87,
                    jurisdiction: 'International',
                    fileSize: 38000,
                    fileFormat: 'DOCX'
                },
                highlights: [
                    {
                        field: 'content',
                        fragments: ['bill of exchange', 'UCC 3-104(a)', 'international trade law'],
                        score: 0.85
                    }
                ],
                similarDocuments: ['result1', 'result3'],
                relatedTopics: ['international trade', 'bills of exchange', 'Cornell validation']
            },
            {
                id: 'result3',
                title: 'Cornell Legal Knowledge Base - UCC Article 3 Commentary',
                content: 'Comprehensive commentary on UCC Article 3 provisions related to negotiable instruments, including recent amendments and court interpretations. Essential reference for legal professionals.',
                excerpt: 'Comprehensive commentary on UCC Article 3 provisions related to negotiable instruments...',
                type: 'legal_reference',
                relevanceScore: 0.82,
                lastModified: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                author: 'Cornell Law School',
                tags: ['ucc', 'legal-reference', 'commentary', 'negotiable-instruments'],
                metadata: {
                    wordCount: 15000,
                    cornellReferences: ['UCC 3-101 through 3-605'],
                    jurisdiction: 'Federal',
                    fileSize: 125000,
                    fileFormat: 'HTML'
                },
                highlights: [
                    {
                        field: 'content',
                        fragments: ['UCC Article 3 provisions', 'negotiable instruments', 'court interpretations'],
                        score: 0.8
                    }
                ],
                relatedTopics: ['UCC Article 3', 'negotiable instruments law', 'legal commentary']
            },
            {
                id: 'result4',
                title: 'Check Processing Workflow - Banking Compliance',
                content: 'Automated check processing workflow ensuring compliance with UCC 3-104(f) and federal banking regulations. Includes endorsement validation and Cornell legal framework integration.',
                excerpt: 'Automated check processing workflow ensuring compliance with UCC 3-104(f)...',
                type: 'document',
                documentType: 'check',
                relevanceScore: 0.75,
                lastModified: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                author: 'Emily Chen',
                workspaceId: 'ws2',
                tags: ['check-processing', 'banking', 'workflow', 'ucc'],
                metadata: {
                    wordCount: 2100,
                    cornellReferences: ['UCC 3-104(f)', 'UCC 3-201', 'UCC 3-401'],
                    complianceScore: 92,
                    jurisdiction: 'Federal',
                    fileSize: 67000,
                    fileFormat: 'PDF'
                },
                highlights: [
                    {
                        field: 'content',
                        fragments: ['check processing', 'UCC 3-104(f)', 'endorsement validation'],
                        score: 0.72
                    }
                ],
                similarDocuments: ['result1', 'result5'],
                relatedTopics: ['check processing', 'banking compliance', 'endorsement rules']
            },
            {
                id: 'result5',
                title: 'Letter of Credit Analysis - Commercial Law Review',
                content: 'In-depth analysis of letter of credit requirements under UCC Article 5 and international commercial law. Includes Cornell legal framework compliance assessment.',
                excerpt: 'In-depth analysis of letter of credit requirements under UCC Article 5...',
                type: 'document',
                documentType: 'letter_of_credit',
                relevanceScore: 0.68,
                lastModified: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
                author: 'Michael Johnson',
                workspaceId: 'ws1',
                tags: ['letter-of-credit', 'commercial-law', 'ucc-5', 'analysis'],
                metadata: {
                    wordCount: 3200,
                    cornellReferences: ['UCC 5-101', 'UCC 5-102', 'UCC 5-108'],
                    complianceScore: 89,
                    jurisdiction: 'Multi-State',
                    fileSize: 89000,
                    fileFormat: 'DOCX'
                },
                highlights: [
                    {
                        field: 'content',
                        fragments: ['letter of credit', 'UCC Article 5', 'commercial law'],
                        score: 0.65
                    }
                ],
                relatedTopics: ['letters of credit', 'commercial banking', 'UCC Article 5']
            }
        ];

        // Mock available filters
        const mockFilters: SearchFilter[] = [
            {
                type: 'document_type',
                value: 'promissory_note',
                label: 'Promissory Notes',
                active: false
            },
            {
                type: 'document_type',
                value: 'bill_of_exchange',
                label: 'Bills of Exchange',
                active: false
            },
            {
                type: 'document_type',
                value: 'check',
                label: 'Checks',
                active: false
            },
            {
                type: 'compliance_score',
                value: { min: 90, max: 100 },
                label: 'High Compliance (90%+)',
                active: false
            },
            {
                type: 'date_range',
                value: { start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), end: new Date() },
                label: 'Last 7 Days',
                active: false
            },
            {
                type: 'jurisdiction',
                value: 'Federal',
                label: 'Federal Jurisdiction',
                active: false
            }
        ];

        // Mock semantic clusters
        const mockClusters: SemanticCluster[] = [
            {
                id: 'cluster1',
                name: 'UCC Article 3 Compliance',
                description: 'Documents related to UCC Article 3 negotiable instruments compliance',
                documents: ['result1', 'result2', 'result3'],
                concepts: ['negotiable instruments', 'UCC compliance', 'legal requirements'],
                centerPoint: [0.8, 0.6, 0.9],
                color: '#4CAF50',
                size: 3
            },
            {
                id: 'cluster2',
                name: 'International Trade Documents',
                description: 'Documents related to international commercial transactions',
                documents: ['result2', 'result5'],
                concepts: ['international trade', 'commercial law', 'cross-border transactions'],
                centerPoint: [0.6, 0.8, 0.4],
                color: '#2196F3',
                size: 2
            },
            {
                id: 'cluster3',
                name: 'Banking Operations',
                description: 'Documents related to banking processes and compliance',
                documents: ['result4', 'result5'],
                concepts: ['banking compliance', 'processing workflows', 'financial operations'],
                centerPoint: [0.4, 0.5, 0.7],
                color: '#FF9800',
                size: 2
            }
        ];

        // Mock search analytics
        const mockAnalytics: SearchAnalytics = {
            totalQueries: 1247,
            avgResponseTime: 0.34,
            popularQueries: [
                { query: 'UCC Article 3', count: 89 },
                { query: 'promissory note', count: 67 },
                { query: 'bill of exchange', count: 54 },
                { query: 'Cornell compliance', count: 43 },
                { query: 'negotiable instruments', count: 38 }
            ],
            searchTrends: [
                { date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), queries: 45, avgRelevance: 0.82 },
                { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), queries: 52, avgRelevance: 0.85 },
                { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), queries: 38, avgRelevance: 0.79 },
                { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), queries: 61, avgRelevance: 0.87 },
                { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), queries: 48, avgRelevance: 0.83 },
                { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), queries: 56, avgRelevance: 0.88 },
                { date: new Date(), queries: 29, avgRelevance: 0.91 }
            ],
            userBehavior: {
                clickThroughRate: 0.73,
                avgResultsViewed: 4.2,
                refinementRate: 0.34
            },
            contentGaps: [
                { topic: 'UCC Article 4A', queryCount: 23, resultQuality: 0.45 },
                { topic: 'Electronic signatures', queryCount: 18, resultQuality: 0.52 },
                { topic: 'International arbitration', queryCount: 15, resultQuality: 0.38 }
            ]
        };

        // Mock saved searches
        const mockSavedSearches: SavedSearch[] = [
            {
                id: 'saved1',
                name: 'High Compliance Promissory Notes',
                query: 'promissory note UCC 3-104',
                filters: [
                    { type: 'document_type', value: 'promissory_note', label: 'Promissory Notes', active: true },
                    { type: 'compliance_score', value: { min: 90, max: 100 }, label: 'High Compliance', active: true }
                ],
                createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                lastUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                frequency: 12,
                notifications: true,
                shared: false
            },
            {
                id: 'saved2',
                name: 'Recent Legal Updates',
                query: 'Cornell legal framework updates',
                filters: [
                    { type: 'date_range', value: { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date() }, label: 'Last 30 Days', active: true }
                ],
                createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
                lastUsed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                frequency: 8,
                notifications: true,
                shared: true
            }
        ];

        setSearchResults(mockResults);
        setAvailableFilters(mockFilters);
        setSemanticClusters(mockClusters);
        setSearchAnalytics(mockAnalytics);
        setSavedSearches(mockSavedSearches);
    };

    const loadSearchHistory = () => {
        const history = [
            'UCC Article 3 compliance',
            'promissory note template',
            'bill of exchange requirements',
            'Cornell legal framework',
            'negotiable instruments law'
        ];
        setSearchHistory(history);
    };

    const performSearch = useCallback((query: string) => {
        setIsSearching(true);
        
        // Simulate API call delay
        setTimeout(() => {
            // Mock search implementation
            const filteredResults = searchResults.filter(result => 
                result.title.toLowerCase().includes(query.toLowerCase()) ||
                result.content.toLowerCase().includes(query.toLowerCase()) ||
                result.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
            );

            // Apply active filters
            let filtered = filteredResults;
            activeFilters.forEach(filter => {
                if (filter.active) {
                    switch (filter.type) {
                        case 'document_type':
                            filtered = filtered.filter(r => r.documentType === filter.value);
                            break;
                        case 'compliance_score':
                            filtered = filtered.filter(r => {
                                const score = r.metadata.complianceScore || 0;
                                return score >= filter.value.min && score <= filter.value.max;
                            });
                            break;
                        case 'jurisdiction':
                            filtered = filtered.filter(r => r.metadata.jurisdiction === filter.value);
                            break;
                    }
                }
            });

            // Sort results
            filtered.sort((a, b) => {
                switch (sortBy) {
                    case 'relevance':
                        return b.relevanceScore - a.relevanceScore;
                    case 'date':
                        return b.lastModified.getTime() - a.lastModified.getTime();
                    case 'compliance':
                        return (b.metadata.complianceScore || 0) - (a.metadata.complianceScore || 0);
                    default:
                        return 0;
                }
            });

            setSearchResults(filtered);
            setIsSearching(false);

            // Add to search history
            if (!searchHistory.includes(query)) {
                setSearchHistory(prev => [query, ...prev.slice(0, 9)]);
            }
        }, 300);
    }, [searchResults, activeFilters, sortBy, searchHistory]);

    const generateSuggestions = useCallback((query: string) => {
        const suggestions: SearchSuggestion[] = [
            {
                id: 'suggest1',
                query: `${query} UCC compliance`,
                type: 'autocomplete',
                category: 'Legal'
            },
            {
                id: 'suggest2',
                query: `${query} template`,
                type: 'autocomplete',
                category: 'Documents'
            },
            {
                id: 'suggest3',
                query: `Cornell ${query}`,
                type: 'autocomplete',
                category: 'Legal Framework'
            }
        ];

        setSuggestions(suggestions);
        setShowSuggestions(true);
    }, []);

    const applyFilter = (filter: SearchFilter) => {
        setActiveFilters(prev => 
            prev.map(f => 
                f.type === filter.type && f.value === filter.value 
                    ? { ...f, active: !f.active }
                    : f
            )
        );
    };

    const clearAllFilters = () => {
        setActiveFilters(prev => prev.map(f => ({ ...f, active: false })));
    };

    const saveCurrentSearch = () => {
        if (!searchQuery.trim()) return;

        const newSavedSearch: SavedSearch = {
            id: `saved_${Date.now()}`,
            name: `Search: ${searchQuery}`,
            query: searchQuery,
            filters: activeFilters.filter(f => f.active),
            createdAt: new Date(),
            lastUsed: new Date(),
            frequency: 1,
            notifications: false,
            shared: false
        };

        setSavedSearches(prev => [newSavedSearch, ...prev]);
    };

    const getResultIcon = (result: SearchResult) => {
        switch (result.type) {
            case 'document':
                switch (result.documentType) {
                    case 'promissory_note': return <FileText className="text-blue-500" size={20} />;
                    case 'bill_of_exchange': return <Scale className="text-purple-500" size={20} />;
                    case 'check': return <CheckCircle className="text-green-500" size={20} />;
                    case 'letter_of_credit': return <Building className="text-orange-500" size={20} />;
                    default: return <File className="text-gray-500" size={20} />;
                }
            case 'legal_reference': return <BookOpen className="text-purple-500" size={20} />;
            case 'user': return <Users className="text-blue-500" size={20} />;
            case 'workspace': return <Folder className="text-yellow-500" size={20} />;
            case 'comment': return <MessageSquare className="text-green-500" size={20} />;
            case 'activity': return <Activity className="text-indigo-500" size={20} />;
            default: return <File className="text-gray-500" size={20} />;
        }
    };

    const formatFileSize = (bytes: number) => {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    };

    const highlightText = (text: string, highlights: string[]) => {
        if (!highlights || highlights.length === 0) return text;
        
        let highlightedText = text;
        highlights.forEach(highlight => {
            const regex = new RegExp(`(${highlight})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<mark class="search-highlight">$1</mark>');
        });
        
        return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />;
    };

    return (
        <div className="advanced-search-discovery">
            {/* Header */}
            <div className="search-header">
                <div className="header-content">
                    <div className="header-icon">
                        <Search size={32} />
                        <Sparkles size={16} className="sparkle-icon" />
                    </div>
                    <div>
                        <h1>Advanced Search & Discovery</h1>
                        <p>AI-powered semantic search with document similarity matching and intelligent content discovery across all Cornell legal documents</p>
                    </div>
                </div>
                
                {searchAnalytics && (
                    <div className="search-stats">
                        <div className="stat-item">
                            <Database size={20} />
                            <span className="stat-value">{searchAnalytics.totalQueries.toLocaleString()}</span>
                            <span className="stat-label">Total Queries</span>
                        </div>
                        <div className="stat-item">
                            <Zap size={20} />
                            <span className="stat-value">{searchAnalytics.avgResponseTime.toFixed(2)}s</span>
                            <span className="stat-label">Avg Response</span>
                        </div>
                        <div className="stat-item">
                            <Target size={20} />
                            <span className="stat-value">{Math.round(searchAnalytics.userBehavior.clickThroughRate * 100)}%</span>
                            <span className="stat-label">Click Rate</span>
                        </div>
                        <div className="stat-item">
                            <Brain size={20} />
                            <span className="stat-value">{semanticClusters.length}</span>
                            <span className="stat-label">AI Clusters</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="search-workspace">
                {/* Search Bar & Controls */}
                <div className="search-controls">
                    <div className="search-input-container">
                        <div className="search-input-wrapper">
                            <Search size={20} className="search-icon" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search documents, legal references, users, and more..."
                                className="search-input"
                                onFocus={() => setShowSuggestions(true)}
                            />
                            {isSearching && <RefreshCw size={16} className="loading-icon animate-spin" />}
                            {searchQuery && (
                                <button
                                    className="clear-search-btn"
                                    onClick={() => {
                                        setSearchQuery('');
                                        setSearchResults([]);
                                        setShowSuggestions(false);
                                    }}
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        {/* Search Suggestions */}
                        {showSuggestions && searchSuggestions.length > 0 && (
                            <div className="search-suggestions">
                                {searchSuggestions.map(suggestion => (
                                    <button
                                        key={suggestion.id}
                                        className="suggestion-item"
                                        onClick={() => {
                                            setSearchQuery(suggestion.query);
                                            setShowSuggestions(false);
                                        }}
                                    >
                                        <Search size={14} />
                                        <span className="suggestion-text">{suggestion.query}</span>
                                        <span className="suggestion-category">{suggestion.category}</span>
                                    </button>
                                ))}
                                
                                {/* Recent Searches */}
                                {searchHistory.length > 0 && (
                                    <div className="suggestion-section">
                                        <div className="suggestion-section-header">
                                            <Clock size={12} />
                                            <span>Recent Searches</span>
                                        </div>
                                        {searchHistory.slice(0, 3).map((query, index) => (
                                            <button
                                                key={index}
                                                className="suggestion-item recent"
                                                onClick={() => {
                                                    setSearchQuery(query);
                                                    setShowSuggestions(false);
                                                }}
                                            >
                                                <History size={14} />
                                                <span>{query}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Search Mode Selector */}
                    <div className="search-mode-selector">
                        <button
                            className={`mode-btn ${searchMode === 'simple' ? 'active' : ''}`}
                            onClick={() => setSearchMode('simple')}
                        >
                            <Search size={16} />
                            Simple
                        </button>
                        <button
                            className={`mode-btn ${searchMode === 'advanced' ? 'active' : ''}`}
                            onClick={() => setSearchMode('advanced')}
                        >
                            <Sliders size={16} />
                            Advanced
                        </button>
                        <button
                            className={`mode-btn ${searchMode === 'semantic' ? 'active' : ''}`}
                            onClick={() => setSearchMode('semantic')}
                        >
                            <Brain size={16} />
                            Semantic
                        </button>
                        <button
                            className={`mode-btn ${searchMode === 'visual' ? 'active' : ''}`}
                            onClick={() => setSearchMode('visual')}
                        >
                            <Network size={16} />
                            Visual
                        </button>
                    </div>

                    {/* Quick Actions */}
                    <div className="search-actions">
                        <button
                            className="action-btn"
                            onClick={saveCurrentSearch}
                            disabled={!searchQuery.trim()}
                        >
                            <Bookmark size={16} />
                            Save Search
                        </button>
                        <button
                            className="action-btn"
                            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                        >
                            <Settings size={16} />
                            Options
                        </button>
                    </div>
                </div>

                {/* Advanced Options Panel */}
                {showAdvancedOptions && (
                    <div className="advanced-options-panel">
                        <div className="options-grid">
                            <div className="option-group">
                                <label>Search Scope</label>
                                <select
                                    value={searchScope}
                                    onChange={(e) => setSearchScope(e.target.value as any)}
                                    className="scope-select"
                                >
                                    <option value="all">All Content</option>
                                    <option value="documents">Documents Only</option>
                                    <option value="legal">Legal References</option>
                                    <option value="workspace">Current Workspace</option>
                                </select>
                            </div>

                            <div className="option-group">
                                <label>Sort By</label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as any)}
                                    className="sort-select"
                                >
                                    <option value="relevance">Relevance</option>
                                    <option value="date">Last Modified</option>
                                    <option value="author">Author</option>
                                    <option value="compliance">Compliance Score</option>
                                </select>
                            </div>

                            <div className="option-group">
                                <label>View Mode</label>
                                <div className="view-mode-buttons">
                                    <button
                                        className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                                        onClick={() => setViewMode('list')}
                                    >
                                        <List size={16} />
                                    </button>
                                    <button
                                        className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                        onClick={() => setViewMode('grid')}
                                    >
                                        <Grid size={16} />
                                    </button>
                                    <button
                                        className={`view-btn ${viewMode === 'timeline' ? 'active' : ''}`}
                                        onClick={() => setViewMode('timeline')}
                                    >
                                        <Calendar size={16} />
                                    </button>
                                    <button
                                        className={`view-btn ${viewMode === 'network' ? 'active' : ''}`}
                                        onClick={() => setViewMode('network')}
                                    >
                                        <Network size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="search-layout">
                    {/* Filters Sidebar */}
                    <div className="filters-sidebar">
                        <div className="filters-header">
                            <h3>Filters</h3>
                            {activeFilters.some(f => f.active) && (
                                <button className="clear-filters-btn" onClick={clearAllFilters}>
                                    Clear All
                                </button>
                            )}
                        </div>

                        <div className="filters-list">
                            {/* Document Type Filters */}
                            <div className="filter-group">
                                <h4>Document Type</h4>
                                {availableFilters
                                    .filter(f => f.type === 'document_type')
                                    .map(filter => (
                                    <label key={filter.value} className="filter-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={filter.active}
                                            onChange={() => applyFilter(filter)}
                                        />
                                        <span>{filter.label}</span>
                                    </label>
                                ))}
                            </div>

                            {/* Compliance Score Filters */}
                            <div className="filter-group">
                                <h4>Cornell Compliance</h4>
                                {availableFilters
                                    .filter(f => f.type === 'compliance_score')
                                    .map(filter => (
                                    <label key={filter.label} className="filter-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={filter.active}
                                            onChange={() => applyFilter(filter)}
                                        />
                                        <span>{filter.label}</span>
                                    </label>
                                ))}
                            </div>

                            {/* Jurisdiction Filters */}
                            <div className="filter-group">
                                <h4>Jurisdiction</h4>
                                {availableFilters
                                    .filter(f => f.type === 'jurisdiction')
                                    .map(filter => (
                                    <label key={filter.value} className="filter-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={filter.active}
                                            onChange={() => applyFilter(filter)}
                                        />
                                        <span>{filter.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Saved Searches */}
                        <div className="saved-searches">
                            <h4>Saved Searches</h4>
                            <div className="saved-searches-list">
                                {savedSearches.map(saved => (
                                    <button
                                        key={saved.id}
                                        className="saved-search-item"
                                        onClick={() => {
                                            setSearchQuery(saved.query);
                                            setActiveFilters(saved.filters);
                                        }}
                                    >
                                        <Bookmark size={14} />
                                        <div className="saved-search-info">
                                            <span className="saved-search-name">{saved.name}</span>
                                            <span className="saved-search-meta">
                                                Used {saved.frequency} times
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Semantic Clusters */}
                        {searchMode === 'semantic' && (
                            <div className="semantic-clusters">
                                <h4>AI-Discovered Topics</h4>
                                <div className="clusters-list">
                                    {semanticClusters.map(cluster => (
                                        <div
                                            key={cluster.id}
                                            className="cluster-item"
                                            style={{ borderLeftColor: cluster.color }}
                                        >
                                            <div className="cluster-header">
                                                <Brain size={14} style={{ color: cluster.color }} />
                                                <span className="cluster-name">{cluster.name}</span>
                                                <span className="cluster-size">{cluster.size}</span>
                                            </div>
                                            <p className="cluster-description">{cluster.description}</p>
                                            <div className="cluster-concepts">
                                                {cluster.concepts.slice(0, 3).map(concept => (
                                                    <span key={concept} className="concept-tag">
                                                        {concept}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Results Area */}
                    <div className="results-area">
                        {/* Results Header */}
                        <div className="results-header">
                            <div className="results-info">
                                <span className="results-count">
                                    {searchResults.length} results {searchQuery && `for "${searchQuery}"`}
                                </span>
                                {isSearching && <span className="searching-indicator">Searching...</span>}
                            </div>
                            <div className="results-controls">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as any)}
                                    className="sort-dropdown"
                                >
                                    <option value="relevance">Sort by Relevance</option>
                                    <option value="date">Sort by Date</option>
                                    <option value="author">Sort by Author</option>
                                    <option value="compliance">Sort by Compliance</option>
                                </select>
                            </div>
                        </div>

                        {/* Results List */}
                        {viewMode === 'list' && (
                            <div className="results-list">
                                {searchResults.length === 0 && searchQuery ? (
                                    <div className="no-results">
                                        <Search size={48} />
                                        <h3>No results found</h3>
                                        <p>Try adjusting your search terms or filters</p>
                                        <div className="search-suggestions-empty">
                                            <p>Popular searches:</p>
                                            {searchAnalytics?.popularQueries.slice(0, 3).map(popular => (
                                                <button
                                                    key={popular.query}
                                                    className="popular-query-btn"
                                                    onClick={() => setSearchQuery(popular.query)}
                                                >
                                                    {popular.query}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    searchResults.map(result => (
                                        <div
                                            key={result.id}
                                            className={`result-item ${selectedResult?.id === result.id ? 'selected' : ''}`}
                                            onClick={() => setSelectedResult(result)}
                                        >
                                            <div className="result-header">
                                                <div className="result-icon">
                                                    {getResultIcon(result)}
                                                </div>
                                                <div className="result-title-section">
                                                    <h4 className="result-title">
                                                        {highlightText(result.title, result.highlights.flatMap(h => h.fragments))}
                                                    </h4>
                                                    <div className="result-meta">
                                                        <span className="result-type">{result.type}</span>
                                                        {result.documentType && (
                                                            <span className="result-doc-type">
                                                                {result.documentType.replace('_', ' ')}
                                                            </span>
                                                        )}
                                                        <span className="result-author">by {result.author}</span>
                                                        <span className="result-date">
                                                            {result.lastModified.toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="result-actions">
                                                    <div className="relevance-score">
                                                        <Target size={14} />
                                                        {Math.round(result.relevanceScore * 100)}%
                                                    </div>
                                                    {result.metadata.complianceScore && (
                                                        <div className="compliance-score">
                                                            <Scale size={14} />
                                                            {result.metadata.complianceScore}%
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="result-content">
                                                <p className="result-excerpt">
                                                    {highlightText(result.excerpt, result.highlights.flatMap(h => h.fragments))}
                                                </p>
                                                
                                                <div className="result-metadata">
                                                    {result.metadata.wordCount && (
                                                        <span className="metadata-item">
                                                            <FileText size={12} />
                                                            {result.metadata.wordCount.toLocaleString()} words
                                                        </span>
                                                    )}
                                                    {result.metadata.fileSize && (
                                                        <span className="metadata-item">
                                                            <Archive size={12} />
                                                            {formatFileSize(result.metadata.fileSize)}
                                                        </span>
                                                    )}
                                                    {result.metadata.jurisdiction && (
                                                        <span className="metadata-item">
                                                            <Globe size={12} />
                                                            {result.metadata.jurisdiction}
                                                        </span>
                                                    )}
                                                </div>

                                                {result.tags.length > 0 && (
                                                    <div className="result-tags">
                                                        {result.tags.slice(0, 4).map(tag => (
                                                            <span key={tag} className="result-tag">
                                                                #{tag}
                                                            </span>
                                                        ))}
                                                        {result.tags.length > 4 && (
                                                            <span className="more-tags">
                                                                +{result.tags.length - 4} more
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                {result.metadata.cornellReferences && (
                                                    <div className="cornell-references">
                                                        <BookOpen size={12} />
                                                        <span className="references-label">Cornell References:</span>
                                                        <div className="references-list">
                                                            {result.metadata.cornellReferences.slice(0, 3).map(ref => (
                                                                <span key={ref} className="cornell-ref">
                                                                    {ref}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="result-footer">
                                                    <div className="result-actions-buttons">
                                                        <button className="action-btn-small">
                                                            <Eye size={14} />
                                                            View
                                                        </button>
                                                        <button className="action-btn-small">
                                                            <Share2 size={14} />
                                                            Share
                                                        </button>
                                                        <button className="action-btn-small">
                                                            <Bookmark size={14} />
                                                            Save
                                                        </button>
                                                    </div>
                                                    
                                                    {result.similarDocuments && result.similarDocuments.length > 0 && (
                                                        <div className="similar-docs">
                                                            <Link size={12} />
                                                            <span>{result.similarDocuments.length} similar documents</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Network View for Semantic Mode */}
                        {viewMode === 'network' && searchMode === 'semantic' && (
                            <div className="network-view">
                                <div className="network-header">
                                    <h3>Semantic Relationship Network</h3>
                                    <p>Explore connections between documents based on AI-discovered semantic relationships</p>
                                </div>
                                <div className="network-canvas">
                                    <div className="network-placeholder">
                                        <Network size={64} />
                                        <h4>Interactive Semantic Network</h4>
                                        <p>Documents and concepts clustered by semantic similarity</p>
                                        <div className="network-legend">
                                            {semanticClusters.map(cluster => (
                                                <div key={cluster.id} className="legend-item">
                                                    <div 
                                                        className="legend-color" 
                                                        style={{ backgroundColor: cluster.color }}
                                                    />
                                                    <span>{cluster.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdvancedSearchDiscovery;
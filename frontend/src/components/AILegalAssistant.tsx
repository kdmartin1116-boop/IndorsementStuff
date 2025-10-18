// ===========================================
// AI LEGAL ASSISTANT
// Intelligent Legal Support & Automation
// ===========================================

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AILegalResearchEngine } from '../services/ai/AILegalResearchEngine';
import { LegalNLPEngine } from '../services/ai/LegalNLPEngine';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: Array<{
    type: 'document' | 'research' | 'analysis';
    data: any;
  }>;
}

interface AITask {
  id: string;
  type: 'research' | 'analysis' | 'drafting' | 'review';
  status: 'pending' | 'processing' | 'completed' | 'error';
  title: string;
  description: string;
  result?: any;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

interface AICapability {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'research' | 'analysis' | 'drafting' | 'review';
  action: () => void;
}

export const AILegalAssistant: React.FC = () => {
  const [researchEngine] = useState(() => 
    new AILegalResearchEngine({
      apiEndpoint: process.env.REACT_APP_LEGAL_API_ENDPOINT || 'https://api.legalresearch.com/v1',
      apiKey: process.env.REACT_APP_LEGAL_API_KEY || 'demo-key',
      cacheEnabled: true
    })
  );

  const [nlpEngine] = useState(() => 
    new LegalNLPEngine({
      modelEndpoint: process.env.REACT_APP_NLP_ENDPOINT || 'https://api.legalnlp.com/v1',
      apiKey: process.env.REACT_APP_NLP_API_KEY || 'demo-key'
    })
  );

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: '👋 Hello! I\'m your AI Legal Assistant. I can help you with legal research, document analysis, contract review, and much more. How can I assist you today?',
      timestamp: new Date()
    }
  ]);

  const [userInput, setUserInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTasks, setActiveTasks] = useState<AITask[]>([]);
  const [selectedCapability, setSelectedCapability] = useState<string | null>(null);
  const [uploadedDocument, setUploadedDocument] = useState<string>('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const aiCapabilities: AICapability[] = [
    {
      id: 'case-research',
      name: 'Case Law Research',
      description: 'Find relevant cases and legal precedents',
      icon: '⚖️',
      category: 'research',
      action: () => handleCapabilityAction('case-research')
    },
    {
      id: 'statute-analysis',
      name: 'Statute Analysis',
      description: 'Interpret and analyze statutory provisions',
      icon: '📜',
      category: 'research',
      action: () => handleCapabilityAction('statute-analysis')
    },
    {
      id: 'document-analysis',
      name: 'Document Analysis',
      description: 'Analyze legal documents for key terms and issues',
      icon: '📄',
      category: 'analysis',
      action: () => handleCapabilityAction('document-analysis')
    },
    {
      id: 'contract-review',
      name: 'Contract Review',
      description: 'Review contracts for risks and compliance',
      icon: '📋',
      category: 'review',
      action: () => handleCapabilityAction('contract-review')
    },
    {
      id: 'citation-check',
      name: 'Citation Validation',
      description: 'Validate and correct legal citations',
      icon: '📝',
      category: 'review',
      action: () => handleCapabilityAction('citation-check')
    },
    {
      id: 'legal-drafting',
      name: 'Legal Drafting',
      description: 'Generate legal documents and templates',
      icon: '✍️',
      category: 'drafting',
      action: () => handleCapabilityAction('legal-drafting')
    },
    {
      id: 'argument-analysis',
      name: 'Argument Analysis',
      description: 'Analyze and strengthen legal arguments',
      icon: '🎯',
      category: 'analysis',
      action: () => handleCapabilityAction('argument-analysis')
    },
    {
      id: 'compliance-check',
      name: 'Compliance Check',
      description: 'Check documents for regulatory compliance',
      icon: '✅',
      category: 'review',
      action: () => handleCapabilityAction('compliance-check')
    }
  ];

  // ===========================================
  // CHAT FUNCTIONALITY
  // ===========================================

  const handleSendMessage = useCallback(async () => {
    if (!userInput.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: userInput,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsProcessing(true);

    try {
      const response = await processUserMessage(userInput);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.content,
        timestamp: new Date(),
        attachments: response.attachments
      };

      setChatMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `I apologize, but I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or rephrase your request.`,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  }, [userInput, isProcessing]);

  const processUserMessage = async (message: string): Promise<{
    content: string;
    attachments?: any[];
  }> => {
    // Analyze user intent
    const intent = await analyzeUserIntent(message);

    switch (intent.type) {
      case 'research':
        return await handleResearchRequest(message, intent);
      case 'analysis':
        return await handleAnalysisRequest(message, intent);
      case 'drafting':
        return await handleDraftingRequest(message, intent);
      case 'review':
        return await handleReviewRequest(message, intent);
      default:
        return await handleGeneralQuery(message);
    }
  };

  const analyzeUserIntent = async (message: string): Promise<{
    type: 'research' | 'analysis' | 'drafting' | 'review' | 'general';
    confidence: number;
    entities: any[];
  }> => {
    // Simple intent classification based on keywords
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('find') || lowerMessage.includes('research') || lowerMessage.includes('case') || lowerMessage.includes('precedent')) {
      return { type: 'research', confidence: 0.8, entities: [] };
    } else if (lowerMessage.includes('analyze') || lowerMessage.includes('review') || lowerMessage.includes('check')) {
      return { type: 'analysis', confidence: 0.7, entities: [] };
    } else if (lowerMessage.includes('draft') || lowerMessage.includes('write') || lowerMessage.includes('create')) {
      return { type: 'drafting', confidence: 0.7, entities: [] };
    } else if (lowerMessage.includes('validate') || lowerMessage.includes('correct') || lowerMessage.includes('citation')) {
      return { type: 'review', confidence: 0.6, entities: [] };
    }

    return { type: 'general', confidence: 0.5, entities: [] };
  };

  // ===========================================
  // REQUEST HANDLERS
  // ===========================================

  const handleResearchRequest = async (_message: string, _intent: any): Promise<{
    content: string;
    attachments?: any[];
  }> => {
    try {
      const searchResults = await researchEngine.conductComprehensiveResearch({
        queryText: _message,
        maxResults: 10
      });

      const content = `🔍 I found ${searchResults.resultCount} relevant legal authorities for your research:

**Cases Found:** ${searchResults.cases.length}
**Statutes Found:** ${searchResults.statutes.length}
**Precedents:** ${searchResults.precedents.length}

${searchResults.cases.slice(0, 3).map(case_ => 
  `📋 **${case_.title}**\n   ${case_.citation} - ${case_.court} (${case_.year})\n   ${case_.summary.substring(0, 150)}...`
).join('\n\n')}

${searchResults.cases.length > 3 ? `\n*Showing top 3 of ${searchResults.cases.length} cases found.*` : ''}

Would you like me to dive deeper into any specific case or search for additional authorities?`;

      return {
        content,
        attachments: [{
          type: 'research',
          data: searchResults
        }]
      };

    } catch (error) {
      return {
        content: 'I encountered an issue with your research request. Please try rephrasing your query or check the legal research service status.'
      };
    }
  };

  const handleAnalysisRequest = async (_message: string, _intent: any): Promise<{
    content: string;
    attachments?: any[];
  }> => {
    if (!uploadedDocument) {
      return {
        content: '📄 To analyze a document, please upload or paste the document content first. You can use the document upload area below or simply paste the text in our conversation.'
      };
    }

    try {
      const analysis = await nlpEngine.analyzeDocument(uploadedDocument, 'brief');
      
      const content = `📊 **Document Analysis Complete**

**Document Type:** ${analysis.documentType}
**Key Legal Issues:** ${analysis.legalIssues.map((issue: any) => issue.issue).join(', ')}
**Risk Level:** ${analysis.riskAssessment.riskLevel}

**Key Terms Found:**
${analysis.keyTerms.slice(0, 5).map((term: any) => 
  `• ${term.term} (${term.frequency} occurrences)`
).join('\n')}

**Risk Factors:**
${analysis.riskAssessment.riskFactors.map((factor: any) => `• ${factor}`).join('\n')}

Would you like me to provide more detailed analysis on any specific aspect?`;

      return {
        content,
        attachments: [{
          type: 'analysis',
          data: analysis
        }]
      };

    } catch (error) {
      return {
        content: 'I encountered an issue analyzing the document. Please ensure the document content is valid and try again.'
      };
    }
  };

  const handleDraftingRequest = async (_message: string, _intent: any): Promise<{
    content: string;
    attachments?: any[];
  }> => {
    return {
      content: `✍️ I can help you draft various legal documents! Here are some options:

**Available Document Types:**
• Contracts and Agreements
• Legal Briefs and Motions
• Demand Letters
• Cease and Desist Letters
• Non-Disclosure Agreements
• Terms of Service
• Privacy Policies

Please specify:
1. What type of document you need
2. The parties involved
3. Key terms or requirements
4. Jurisdiction (if applicable)

For example: "Draft a consulting agreement between ABC Corp and John Smith for SEO services in California"`
    };
  };

  const handleReviewRequest = async (message: string, _intent: any): Promise<{
    content: string;
    attachments?: any[];
  }> => {
    if (message.toLowerCase().includes('citation')) {
      return {
        content: '📝 **Citation Validation Service**\n\nPlease provide the legal citation you\'d like me to validate. I can check:\n\n• Proper format and structure\n• Bluebook compliance\n• Citation accuracy\n• Suggested corrections\n\nExample: "Validate this citation: 347 U.S. 483"'
      };
    }

    return {
      content: '✅ **Document Review Services**\n\nI can review documents for:\n\n• Legal compliance\n• Risk assessment\n• Missing clauses\n• Problematic terms\n• Citation accuracy\n• Contract completeness\n\nPlease upload or paste the document you\'d like me to review.'
    };
  };

  const handleGeneralQuery = async (_message: string): Promise<{
    content: string;
    attachments?: any[];
  }> => {
    const responses = [
      `I'm here to help with your legal work! I can assist with research, document analysis, drafting, and review. What specific legal task can I help you with?`,
      `As your AI legal assistant, I can help you find case law, analyze documents, draft legal content, and validate citations. What would you like to work on?`,
      `I'm equipped to handle various legal tasks including research, analysis, and drafting. Feel free to ask me about specific legal questions or upload documents for review.`
    ];

    return {
      content: responses[Math.floor(Math.random() * responses.length)]
    };
  };

  // ===========================================
  // CAPABILITY ACTIONS
  // ===========================================

  const handleCapabilityAction = (capabilityId: string) => {
    setSelectedCapability(capabilityId);
    
    const capability = aiCapabilities.find(cap => cap.id === capabilityId);
    if (capability) {
      const message: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `🎯 **${capability.name}** selected!\n\n${capability.description}\n\nHow can I help you with ${capability.name.toLowerCase()}? Please provide details about what you need.`,
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, message]);
    }
  };

  const createTask = (type: AITask['type'], title: string, description: string): AITask => {
    const task: AITask = {
      id: Date.now().toString(),
      type,
      status: 'pending',
      title,
      description,
      createdAt: new Date()
    };

    setActiveTasks(prev => [...prev, task]);
    return task;
  };

  // ===========================================
  // EFFECTS
  // ===========================================

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ===========================================
  // RENDER
  // ===========================================

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - AI Capabilities */}
      <div className="w-80 bg-white shadow-lg border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-2">🧠 AI Legal Assistant</h2>
          <p className="text-sm text-gray-600">Intelligent legal support powered by AI</p>
        </div>

        {/* AI Capabilities */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            AI Capabilities
          </h3>
          
          <div className="space-y-2">
            {aiCapabilities.map((capability) => (
              <button
                key={capability.id}
                onClick={capability.action}
                className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                  selectedCapability === capability.id
                    ? 'bg-blue-50 border-blue-200 text-blue-900'
                    : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <span className="text-lg">{capability.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{capability.name}</div>
                    <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {capability.description}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Active Tasks */}
        {activeTasks.length > 0 && (
          <div className="border-t border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Active Tasks
            </h3>
            <div className="space-y-2">
              {activeTasks.slice(-3).map((task) => (
                <div key={task.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{task.title}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      task.status === 'completed' ? 'bg-green-100 text-green-800' :
                      task.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                      task.status === 'error' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{task.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-3xl p-4 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-500 mb-2">Attachments:</div>
                      {message.attachments.map((attachment, index) => (
                        <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                          {attachment.type}: {typeof attachment.data === 'object' ? JSON.stringify(attachment.data).substring(0, 100) + '...' : attachment.data}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className={`text-xs mt-2 ${
                    message.type === 'user' ? 'text-blue-200' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-gray-600">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Document Upload Area */}
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📄 Document for Analysis (Optional)
              </label>
              <textarea
                value={uploadedDocument}
                onChange={(e) => setUploadedDocument(e.target.value)}
                placeholder="Paste document content here for analysis..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex space-x-4">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me about legal research, document analysis, drafting, or any legal question..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isProcessing}
              />
              <button
                onClick={handleSendMessage}
                disabled={isProcessing || !userInput.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isProcessing ? 'Processing...' : 'Send'}
              </button>
            </div>
            
            <div className="mt-2 text-xs text-gray-500 text-center">
              💡 Try: "Find cases about employment discrimination" or "Analyze this contract for risks"
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AILegalAssistant;
// ===========================================
// AI LEGAL SUITE ROUTER
// Navigation Hub for All AI Legal Features
// ===========================================

import React, { useState } from 'react';
import AILegalResearch from './AILegalResearch';
import AILegalAssistant from './AILegalAssistant';

interface AIFeature {
  id: string;
  name: string;
  description: string;
  icon: string;
  component: React.ComponentType;
  category: 'research' | 'assistant' | 'analysis' | 'drafting';
  featured: boolean;
}

export const AILegalSuite: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<string>('dashboard');

  const aiFeatures: AIFeature[] = [
    {
      id: 'research',
      name: 'Legal Research Engine',
      description: 'Advanced case law research, statute analysis, and precedent discovery',
      icon: '🔍',
      component: AILegalResearch,
      category: 'research',
      featured: true
    },
    {
      id: 'assistant',
      name: 'AI Legal Assistant',
      description: 'Intelligent conversational AI for legal support and automation',
      icon: '🧠',
      component: AILegalAssistant,
      category: 'assistant',
      featured: true
    }
  ];

  const featuredFeatures = aiFeatures.filter(feature => feature.featured);

  const renderDashboard = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🧠 AI Legal Intelligence Suite
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Harness the power of artificial intelligence for comprehensive legal research, 
            document analysis, and intelligent legal assistance
          </p>
        </div>

        {/* AI Capabilities Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            {
              icon: '⚖️',
              title: 'Case Law Analysis',
              description: 'AI-powered analysis of legal precedents and holdings',
              metric: '10M+ Cases'
            },
            {
              icon: '📜',
              title: 'Statute Interpretation',
              description: 'Intelligent interpretation of statutory provisions',
              metric: '50+ Jurisdictions'
            },
            {
              icon: '📄',
              title: 'Document Intelligence',
              description: 'Advanced NLP for legal document analysis',
              metric: '99% Accuracy'
            },
            {
              icon: '✍️',
              title: 'Legal Drafting',
              description: 'AI-assisted legal document generation',
              metric: '100+ Templates'
            }
          ].map((capability, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="text-3xl mb-4">{capability.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{capability.title}</h3>
              <p className="text-gray-600 text-sm mb-3">{capability.description}</p>
              <div className="text-blue-600 font-medium text-sm">{capability.metric}</div>
            </div>
          ))}
        </div>

        {/* Featured AI Tools */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            🚀 AI-Powered Legal Tools
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {featuredFeatures.map((feature) => (
              <div
                key={feature.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
                onClick={() => setActiveFeature(feature.id)}
              >
                <div className="p-8">
                  <div className="flex items-center mb-6">
                    <div className="text-4xl mr-4">{feature.icon}</div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {feature.name}
                      </h3>
                      <div className="text-sm text-blue-600 uppercase tracking-wide font-medium">
                        {feature.category}
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Feature Highlights */}
                  <div className="space-y-3 mb-6">
                    {feature.id === 'research' && (
                      <>
                        <div className="flex items-center text-sm text-gray-700">
                          <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                          Comprehensive case law database
                        </div>
                        <div className="flex items-center text-sm text-gray-700">
                          <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                          AI-powered relevance scoring
                        </div>
                        <div className="flex items-center text-sm text-gray-700">
                          <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                          Citation validation & analysis
                        </div>
                      </>
                    )}
                    
                    {feature.id === 'assistant' && (
                      <>
                        <div className="flex items-center text-sm text-gray-700">
                          <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                          Conversational AI interface
                        </div>
                        <div className="flex items-center text-sm text-gray-700">
                          <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                          Document analysis & review
                        </div>
                        <div className="flex items-center text-sm text-gray-700">
                          <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                          Legal drafting assistance
                        </div>
                      </>
                    )}
                  </div>

                  <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 group-hover:shadow-lg">
                    Launch {feature.name} →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Technology Stack */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
            🔬 Advanced AI Technology Stack
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl mb-4">🧬</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Natural Language Processing</h3>
              <p className="text-gray-600 text-sm">
                Advanced NLP models specifically trained on legal text and precedents
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-4">🔮</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Machine Learning</h3>
              <p className="text-gray-600 text-sm">
                Predictive models for case outcomes and legal trend analysis
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-4">⚡</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-time Processing</h3>
              <p className="text-gray-600 text-sm">
                Lightning-fast analysis and research with real-time results
              </p>
            </div>
          </div>
        </div>

        {/* Usage Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Legal Documents Analyzed', value: '50,000+', icon: '📊' },
            { label: 'Cases Researched', value: '125,000+', icon: '⚖️' },
            { label: 'Citations Validated', value: '25,000+', icon: '📝' },
            { label: 'Hours Saved', value: '10,000+', icon: '⏱️' }
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold text-blue-600 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Transform Your Legal Practice?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Experience the future of legal technology with our comprehensive AI suite
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setActiveFeature('research')}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Start Legal Research 🔍
            </button>
            <button
              onClick={() => setActiveFeature('assistant')}
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Chat with AI Assistant 🧠
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderActiveFeature = () => {
    const feature = aiFeatures.find(f => f.id === activeFeature);
    if (!feature) return null;

    const Component = feature.component;
    return (
      <div className="relative">
        {/* Back Navigation */}
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={() => setActiveFeature('dashboard')}
            className="bg-white shadow-lg rounded-lg px-4 py-2 flex items-center text-gray-700 hover:text-gray-900 transition-colors"
          >
            ← Back to AI Suite
          </button>
        </div>
        <Component />
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      {activeFeature === 'dashboard' ? renderDashboard() : renderActiveFeature()}
    </div>
  );
};

export default AILegalSuite;
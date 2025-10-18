// ===========================================
// AI LEGAL RESEARCH INTERFACE
// Advanced Research & Analysis Dashboard
// ===========================================

import React, { useState, useCallback, useEffect } from 'react';
import { 
  AILegalResearchEngine, 
  ResearchQuery, 
  ResearchResult, 
  LegalCase, 
  DocumentAnalysis,
  CitationValidation 
} from '../services/ai/AILegalResearchEngine';

interface SearchFilters {
  jurisdiction: string[];
  practiceArea: string[];
  dateRange: {
    start: string;
    end: string;
  };
  courtLevel: string[];
  precedentialValue: string[];
  includeSecondary: boolean;
  maxResults: number;
}

const defaultFilters: SearchFilters = {
  jurisdiction: [],
  practiceArea: [],
  dateRange: {
    start: '',
    end: ''
  },
  courtLevel: [],
  precedentialValue: [],
  includeSecondary: false,
  maxResults: 50
};

export const AILegalResearch: React.FC = () => {
  const [researchEngine] = useState(() => 
    new AILegalResearchEngine({
      apiEndpoint: process.env.REACT_APP_LEGAL_API_ENDPOINT || 'https://api.legalresearch.com/v1',
      apiKey: process.env.REACT_APP_LEGAL_API_KEY || 'demo-key',
      cacheEnabled: true
    })
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [searchResults, setSearchResults] = useState<ResearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'document' | 'citation'>('search');
  const [documentContent, setDocumentContent] = useState('');
  const [documentAnalysis, setDocumentAnalysis] = useState<DocumentAnalysis | null>(null);
  const [citationToValidate, setCitationToValidate] = useState('');
  const [citationValidation, setCitationValidation] = useState<CitationValidation | null>(null);
  const [selectedCase, setSelectedCase] = useState<LegalCase | null>(null);

  // ===========================================
  // SEARCH FUNCTIONALITY
  // ===========================================

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const query: ResearchQuery = {
        queryText: searchQuery,
        jurisdiction: filters.jurisdiction.length > 0 ? filters.jurisdiction : undefined,
        practiceArea: filters.practiceArea.length > 0 ? filters.practiceArea : undefined,
        dateRange: filters.dateRange.start && filters.dateRange.end ? filters.dateRange : undefined,
        courtLevel: filters.courtLevel.length > 0 ? filters.courtLevel : undefined,
        precedentialValue: filters.precedentialValue.length > 0 ? filters.precedentialValue : undefined,
        includeSecondary: filters.includeSecondary,
        maxResults: filters.maxResults
      };

      const results = await researchEngine.conductComprehensiveResearch(query);
      setSearchResults(results);
      
    } catch (error) {
      console.error('Search failed:', error);
      alert(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, filters, researchEngine]);

  const handleDocumentAnalysis = useCallback(async () => {
    if (!documentContent.trim()) return;

    setIsSearching(true);
    try {
      const analysis = await researchEngine.analyzeDocument(documentContent, 'brief');
      setDocumentAnalysis(analysis);
    } catch (error) {
      console.error('Document analysis failed:', error);
      alert(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSearching(false);
    }
  }, [documentContent, researchEngine]);

  const handleCitationValidation = useCallback(async () => {
    if (!citationToValidate.trim()) return;

    setIsSearching(true);
    try {
      const validation = await researchEngine.validateCitation(citationToValidate);
      setCitationValidation(validation);
    } catch (error) {
      console.error('Citation validation failed:', error);
      alert(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSearching(false);
    }
  }, [citationToValidate, researchEngine]);

  // ===========================================
  // RENDER COMPONENTS
  // ===========================================

  const renderSearchInterface = () => (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">🔍 Legal Research Query</h3>
        <div className="flex gap-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter your legal research question..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? '🔍 Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">⚙️ Search Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Jurisdiction Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Jurisdiction</label>
            <select 
              multiple
              value={filters.jurisdiction}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                jurisdiction: Array.from(e.target.selectedOptions, option => option.value)
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="federal">Federal</option>
              <option value="supreme-court">U.S. Supreme Court</option>
              <option value="circuit-1">1st Circuit</option>
              <option value="circuit-2">2nd Circuit</option>
              <option value="circuit-9">9th Circuit</option>
              <option value="state-ca">California</option>
              <option value="state-ny">New York</option>
              <option value="state-tx">Texas</option>
            </select>
          </div>

          {/* Practice Area Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Practice Area</label>
            <select 
              multiple
              value={filters.practiceArea}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                practiceArea: Array.from(e.target.selectedOptions, option => option.value)
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="constitutional">Constitutional Law</option>
              <option value="criminal">Criminal Law</option>
              <option value="civil-rights">Civil Rights</option>
              <option value="contract">Contract Law</option>
              <option value="tort">Tort Law</option>
              <option value="administrative">Administrative Law</option>
              <option value="tax">Tax Law</option>
              <option value="corporate">Corporate Law</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, start: e.target.value }
                }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, end: e.target.value }
                }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Court Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Court Level</label>
            <select 
              multiple
              value={filters.courtLevel}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                courtLevel: Array.from(e.target.selectedOptions, option => option.value)
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="supreme">Supreme Court</option>
              <option value="appellate">Appellate</option>
              <option value="district">District Court</option>
              <option value="state-supreme">State Supreme</option>
              <option value="state-appellate">State Appellate</option>
            </select>
          </div>

          {/* Max Results */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Max Results</label>
            <select
              value={filters.maxResults}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                maxResults: parseInt(e.target.value)
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value={25}>25 Results</option>
              <option value={50}>50 Results</option>
              <option value={100}>100 Results</option>
              <option value={200}>200 Results</option>
            </select>
          </div>

          {/* Include Secondary Sources */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="includeSecondary"
              checked={filters.includeSecondary}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                includeSecondary: e.target.checked
              }))}
              className="mr-2"
            />
            <label htmlFor="includeSecondary" className="text-sm font-medium text-gray-700">
              Include Secondary Sources
            </label>
          </div>
        </div>
      </div>

      {/* Search Results */}
      {searchResults && (
        <div className="space-y-6">
          {/* Results Summary */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">📊 Research Results</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Cases:</span> {searchResults.cases.length}
              </div>
              <div>
                <span className="font-medium">Statutes:</span> {searchResults.statutes.length}
              </div>
              <div>
                <span className="font-medium">Precedents:</span> {searchResults.precedents.length}
              </div>
              <div>
                <span className="font-medium">Time:</span> {searchResults.executionTime}ms
              </div>
            </div>
            
            {/* Analysis Insights */}
            {searchResults.analysisInsights.keyThemes.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-blue-900 mb-2">🎯 Key Themes:</h4>
                <div className="flex flex-wrap gap-2">
                  {searchResults.analysisInsights.keyThemes.map((theme, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cases */}
          {searchResults.cases.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">⚖️ Case Law Results</h3>
              <div className="space-y-4">
                {searchResults.cases.slice(0, 10).map((case_, index) => (
                  <div 
                    key={case_.id} 
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedCase(case_)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-blue-900">{case_.title}</h4>
                      <span className="text-sm text-gray-500">
                        Relevance: {case_.relevanceScore?.toFixed(2) || 'N/A'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">{case_.citation}</span> • 
                      <span className="ml-1">{case_.court}</span> • 
                      <span className="ml-1">{case_.year}</span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">{case_.summary}</p>
                    <div className="mt-2 flex gap-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        case_.precedentialValue === 'binding' ? 'bg-green-100 text-green-800' :
                        case_.precedentialValue === 'persuasive' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {case_.precedentialValue}
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {case_.jurisdiction}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Statutes */}
          {searchResults.statutes.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">📜 Relevant Statutes</h3>
              <div className="space-y-4">
                {searchResults.statutes.slice(0, 5).map((statute, index) => (
                  <div key={statute.id} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">{statute.title}</h4>
                    <div className="text-sm text-gray-600 mb-2">
                      {statute.code} § {statute.section} • {statute.jurisdiction}
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-3">{statute.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Precedents */}
          {searchResults.precedents.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">🎯 Legal Precedents</h3>
              <div className="space-y-4">
                {searchResults.precedents.slice(0, 5).map((precedent, index) => (
                  <div key={precedent.precedentId} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">{precedent.rule}</h4>
                    <div className="text-sm text-gray-600 mb-2">
                      Strength: <span className={`font-medium ${
                        precedent.strength === 'strong' ? 'text-green-600' :
                        precedent.strength === 'moderate' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>{precedent.strength}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Source Cases: {precedent.sourceCases.length}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderDocumentAnalysis = () => (
    <div className="space-y-6">
      {/* Document Input */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">📄 Document Analysis</h3>
        <textarea
          value={documentContent}
          onChange={(e) => setDocumentContent(e.target.value)}
          placeholder="Paste your legal document content here for analysis..."
          rows={10}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={handleDocumentAnalysis}
          disabled={isSearching || !documentContent.trim()}
          className="mt-4 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSearching ? '📊 Analyzing...' : 'Analyze Document'}
        </button>
      </div>

      {/* Analysis Results */}
      {documentAnalysis && (
        <div className="space-y-6">
          {/* Key Terms */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">🔑 Key Legal Terms</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documentAnalysis.keyTerms.slice(0, 10).map((term, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3">
                  <div className="font-semibold">{term.term}</div>
                  <div className="text-sm text-gray-600">
                    Frequency: {term.frequency} • Significance: {term.legalSignificance}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legal Issues */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">⚖️ Identified Legal Issues</h3>
            <div className="space-y-3">
              {documentAnalysis.legalIssues.map((issue, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3">
                  <div className="font-semibold">{issue.issue}</div>
                  <div className="text-sm text-gray-600">
                    Confidence: {(issue.confidence * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Assessment */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">⚠️ Risk Assessment</h3>
            <div className={`p-4 rounded-lg mb-4 ${
              documentAnalysis.riskAssessment.riskLevel === 'high' ? 'bg-red-50 text-red-800' :
              documentAnalysis.riskAssessment.riskLevel === 'medium' ? 'bg-yellow-50 text-yellow-800' :
              'bg-green-50 text-green-800'
            }`}>
              <div className="font-semibold">Risk Level: {documentAnalysis.riskAssessment.riskLevel.toUpperCase()}</div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Risk Factors:</h4>
              <ul className="list-disc list-inside text-sm text-gray-700">
                {documentAnalysis.riskAssessment.riskFactors.map((factor, index) => (
                  <li key={index}>{factor}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderCitationValidation = () => (
    <div className="space-y-6">
      {/* Citation Input */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">📝 Citation Validation</h3>
        <div className="flex gap-4">
          <input
            type="text"
            value={citationToValidate}
            onChange={(e) => setCitationToValidate(e.target.value)}
            placeholder="Enter legal citation to validate (e.g., 347 U.S. 483)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && handleCitationValidation()}
          />
          <button
            onClick={handleCitationValidation}
            disabled={isSearching || !citationToValidate.trim()}
            className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? '🔍 Validating...' : 'Validate'}
          </button>
        </div>
      </div>

      {/* Validation Results */}
      {citationValidation && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">✅ Validation Results</h3>
          
          <div className={`p-4 rounded-lg mb-4 ${
            citationValidation.isValid ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            <div className="font-semibold">
              {citationValidation.isValid ? '✅ Valid Citation' : '❌ Invalid Citation'}
            </div>
            <div className="text-sm mt-1">
              Bluebook Compliant: {citationValidation.bluebookCompliance ? 'Yes' : 'No'}
            </div>
          </div>

          {citationValidation.correctedCitation && (
            <div className="mb-4">
              <h4 className="font-medium mb-2">Suggested Correction:</h4>
              <div className="bg-blue-50 p-3 rounded-lg text-blue-800">
                {citationValidation.correctedCitation}
              </div>
            </div>
          )}

          {citationValidation.issues && citationValidation.issues.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium mb-2">Issues Found:</h4>
              <ul className="list-disc list-inside text-sm text-red-700">
                {citationValidation.issues.map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {citationValidation.suggestions && citationValidation.suggestions.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Suggestions:</h4>
              <ul className="list-disc list-inside text-sm text-gray-700">
                {citationValidation.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ===========================================
  // MAIN RENDER
  // ===========================================

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🧠 AI Legal Research Engine</h1>
          <p className="text-gray-600">Advanced legal research, document analysis, and citation validation</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'search', name: 'Legal Research', icon: '🔍' },
                { id: 'document', name: 'Document Analysis', icon: '📄' },
                { id: 'citation', name: 'Citation Validation', icon: '📝' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon} {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'search' && renderSearchInterface()}
        {activeTab === 'document' && renderDocumentAnalysis()}
        {activeTab === 'citation' && renderCitationValidation()}

        {/* Case Detail Modal */}
        {selectedCase && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900">{selectedCase.title}</h2>
                <button
                  onClick={() => setSelectedCase(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">Citation:</h3>
                  <p className="text-gray-700">{selectedCase.citation}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold">Court & Year:</h3>
                  <p className="text-gray-700">{selectedCase.court} ({selectedCase.year})</p>
                </div>
                
                <div>
                  <h3 className="font-semibold">Summary:</h3>
                  <p className="text-gray-700">{selectedCase.summary}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold">Holding:</h3>
                  <p className="text-gray-700">{selectedCase.holding}</p>
                </div>
                
                {selectedCase.keyFacts.length > 0 && (
                  <div>
                    <h3 className="font-semibold">Key Facts:</h3>
                    <ul className="list-disc list-inside text-gray-700">
                      {selectedCase.keyFacts.map((fact, index) => (
                        <li key={index}>{fact}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {selectedCase.legalIssues.length > 0 && (
                  <div>
                    <h3 className="font-semibold">Legal Issues:</h3>
                    <ul className="list-disc list-inside text-gray-700">
                      {selectedCase.legalIssues.map((issue, index) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AILegalResearch;
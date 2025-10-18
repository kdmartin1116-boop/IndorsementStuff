// ===========================================
// LEGAL NLP & DOCUMENT INTELLIGENCE
// Natural Language Processing for Legal Content
// ===========================================

interface LegalEntity {
  text: string;
  type: 'PERSON' | 'ORGANIZATION' | 'LOCATION' | 'DATE' | 'MONEY' | 'CASE_CITATION' | 'STATUTE' | 'COURT' | 'JURISDICTION';
  confidence: number;
  startIndex: number;
  endIndex: number;
  metadata?: {
    [key: string]: any;
  };
}

interface LegalConcept {
  concept: string;
  category: 'LEGAL_PRINCIPLE' | 'PROCEDURE' | 'REMEDY' | 'STANDARD' | 'DOCTRINE' | 'TEST';
  confidence: number;
  context: string;
  relatedCases?: string[];
  relatedStatutes?: string[];
}

interface ContractClause {
  type: string;
  content: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  suggestions: string[];
  precedents: string[];
  standardLanguage?: string;
}

interface LegalArgumentStructure {
  claim: string;
  rule: string;
  application: string;
  conclusion: string;
  strength: number;
  weaknesses: string[];
  supportingAuthorities: string[];
  counterArguments: string[];
}

interface DocumentClassification {
  documentType: string;
  confidence: number;
  subType?: string;
  jurisdiction?: string;
  practiceArea: string[];
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  requiredActions: string[];
}

interface LegalSentiment {
  overall: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'MIXED';
  confidence: number;
  aspects: Array<{
    aspect: string;
    sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    confidence: number;
  }>;
  tone: 'FORMAL' | 'INFORMAL' | 'AGGRESSIVE' | 'DIPLOMATIC' | 'TECHNICAL';
}

interface LegalComplexity {
  score: number; // 0-100
  factors: Array<{
    factor: string;
    impact: number;
    description: string;
  }>;
  readabilityMetrics: {
    fleschKincaid: number;
    averageSentenceLength: number;
    averageWordsPerSentence: number;
    legalTermDensity: number;
  };
  simplificationSuggestions: string[];
}

export class LegalNLPEngine {
  private modelEndpoint: string;
  private apiKey: string;
  private cache: Map<string, any> = new Map();

  constructor(config: {
    modelEndpoint: string;
    apiKey: string;
  }) {
    this.modelEndpoint = config.modelEndpoint;
    this.apiKey = config.apiKey;
  }

  // ===========================================
  // ENTITY RECOGNITION
  // ===========================================

  async extractLegalEntities(text: string): Promise<LegalEntity[]> {
    const cacheKey = `entities_${this.hashText(text)}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const entities = await this.callNLPModel('extract_entities', {
        text,
        entity_types: [
          'PERSON', 'ORGANIZATION', 'LOCATION', 'DATE', 'MONEY',
          'CASE_CITATION', 'STATUTE', 'COURT', 'JURISDICTION'
        ],
        context: 'legal'
      });

      const enrichedEntities = await this.enrichEntities(entities);
      
      this.cache.set(cacheKey, enrichedEntities);
      return enrichedEntities;

    } catch (error) {
      console.error('Entity extraction failed:', error);
      return this.fallbackEntityExtraction(text);
    }
  }

  async extractLegalConcepts(text: string): Promise<LegalConcept[]> {
    try {
      const concepts = await this.callNLPModel('extract_concepts', {
        text,
        domain: 'legal',
        include_context: true,
        min_confidence: 0.7
      });

      return concepts.map((concept: any) => ({
        concept: concept.text,
        category: concept.category,
        confidence: concept.confidence,
        context: concept.context,
        relatedCases: concept.related_cases || [],
        relatedStatutes: concept.related_statutes || []
      }));

    } catch (error) {
      console.error('Concept extraction failed:', error);
      return [];
    }
  }

  // ===========================================
  // DOCUMENT CLASSIFICATION
  // ===========================================

  async classifyDocument(text: string): Promise<DocumentClassification> {
    try {
      const classification = await this.callNLPModel('classify_document', {
        text,
        classification_types: [
          'document_type', 'sub_type', 'jurisdiction', 
          'practice_area', 'urgency', 'required_actions'
        ]
      });

      return {
        documentType: classification.document_type,
        confidence: classification.confidence,
        subType: classification.sub_type,
        jurisdiction: classification.jurisdiction,
        practiceArea: classification.practice_areas || [],
        urgency: classification.urgency || 'MEDIUM',
        requiredActions: classification.required_actions || []
      };

    } catch (error) {
      console.error('Document classification failed:', error);
      return this.fallbackClassification(text);
    }
  }

  async analyzeLegalSentiment(text: string): Promise<LegalSentiment> {
    try {
      const sentiment = await this.callNLPModel('analyze_sentiment', {
        text,
        domain: 'legal',
        include_aspects: true,
        include_tone: true
      });

      return {
        overall: sentiment.overall_sentiment,
        confidence: sentiment.confidence,
        aspects: sentiment.aspects || [],
        tone: sentiment.tone || 'FORMAL'
      };

    } catch (error) {
      console.error('Sentiment analysis failed:', error);
      return {
        overall: 'NEUTRAL',
        confidence: 0.5,
        aspects: [],
        tone: 'FORMAL'
      };
    }
  }

  // ===========================================
  // CONTRACT ANALYSIS
  // ===========================================

  async analyzeContractClauses(contractText: string): Promise<ContractClause[]> {
    try {
      const clauses = await this.callNLPModel('analyze_contract', {
        text: contractText,
        analysis_types: ['clause_identification', 'risk_assessment', 'suggestions'],
        include_precedents: true
      });

      return clauses.map((clause: any) => ({
        type: clause.clause_type,
        content: clause.content,
        riskLevel: clause.risk_level,
        suggestions: clause.suggestions || [],
        precedents: clause.precedents || [],
        standardLanguage: clause.standard_language
      }));

    } catch (error) {
      console.error('Contract analysis failed:', error);
      return [];
    }
  }

  async validateContractTerms(contractText: string): Promise<{
    validTerms: string[];
    problematicTerms: Array<{
      term: string;
      issue: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH';
      suggestion: string;
    }>;
    missingTerms: string[];
    complianceIssues: string[];
  }> {
    try {
      const validation = await this.callNLPModel('validate_contract', {
        text: contractText,
        validation_types: ['terms', 'compliance', 'completeness'],
        jurisdiction: 'US' // Could be dynamic
      });

      return {
        validTerms: validation.valid_terms || [],
        problematicTerms: validation.problematic_terms || [],
        missingTerms: validation.missing_terms || [],
        complianceIssues: validation.compliance_issues || []
      };

    } catch (error) {
      console.error('Contract validation failed:', error);
      return {
        validTerms: [],
        problematicTerms: [],
        missingTerms: [],
        complianceIssues: []
      };
    }
  }

  // ===========================================
  // LEGAL ARGUMENT ANALYSIS
  // ===========================================

  async analyzeLegalArgument(argumentText: string): Promise<LegalArgumentStructure> {
    try {
      const analysis = await this.callNLPModel('analyze_argument', {
        text: argumentText,
        framework: 'IRAC', // Issue, Rule, Application, Conclusion
        include_strength_assessment: true,
        include_counter_arguments: true
      });

      return {
        claim: analysis.claim || '',
        rule: analysis.rule || '',
        application: analysis.application || '',
        conclusion: analysis.conclusion || '',
        strength: analysis.strength_score || 0,
        weaknesses: analysis.weaknesses || [],
        supportingAuthorities: analysis.supporting_authorities || [],
        counterArguments: analysis.counter_arguments || []
      };

    } catch (error) {
      console.error('Legal argument analysis failed:', error);
      return this.fallbackArgumentAnalysis(argumentText);
    }
  }

  async suggestArgumentImprovements(argument: LegalArgumentStructure): Promise<{
    strengtheningSuggestions: string[];
    additionalAuthorities: string[];
    addressWeaknesses: string[];
    rhetoricalImprovements: string[];
  }> {
    try {
      const suggestions = await this.callNLPModel('improve_argument', {
        argument,
        improvement_types: ['strengthening', 'authorities', 'weaknesses', 'rhetoric']
      });

      return {
        strengtheningSuggestions: suggestions.strengthening || [],
        additionalAuthorities: suggestions.authorities || [],
        addressWeaknesses: suggestions.weaknesses || [],
        rhetoricalImprovements: suggestions.rhetoric || []
      };

    } catch (error) {
      console.error('Argument improvement failed:', error);
      return {
        strengtheningSuggestions: [],
        additionalAuthorities: [],
        addressWeaknesses: [],
        rhetoricalImprovements: []
      };
    }
  }

  // ===========================================
  // DOCUMENT COMPLEXITY ANALYSIS
  // ===========================================

  async analyzeLegalComplexity(text: string): Promise<LegalComplexity> {
    try {
      const complexity = await this.callNLPModel('analyze_complexity', {
        text,
        include_readability: true,
        include_suggestions: true
      });

      return {
        score: complexity.complexity_score,
        factors: complexity.complexity_factors || [],
        readabilityMetrics: {
          fleschKincaid: complexity.flesch_kincaid || 0,
          averageSentenceLength: complexity.avg_sentence_length || 0,
          averageWordsPerSentence: complexity.avg_words_per_sentence || 0,
          legalTermDensity: complexity.legal_term_density || 0
        },
        simplificationSuggestions: complexity.simplification_suggestions || []
      };

    } catch (error) {
      console.error('Complexity analysis failed:', error);
      return this.fallbackComplexityAnalysis(text);
    }
  }

  async simplifyLegalText(text: string, targetAudience: 'GENERAL_PUBLIC' | 'LEGAL_PROFESSIONAL' | 'CLIENT'): Promise<{
    simplifiedText: string;
    changes: Array<{
      original: string;
      simplified: string;
      reason: string;
    }>;
    readabilityImprovement: number;
  }> {
    try {
      const simplification = await this.callNLPModel('simplify_text', {
        text,
        target_audience: targetAudience,
        preserve_meaning: true,
        track_changes: true
      });

      return {
        simplifiedText: simplification.simplified_text,
        changes: simplification.changes || [],
        readabilityImprovement: simplification.readability_improvement || 0
      };

    } catch (error) {
      console.error('Text simplification failed:', error);
      return {
        simplifiedText: text,
        changes: [],
        readabilityImprovement: 0
      };
    }
  }

  // ===========================================
  // LEGAL CITATION EXTRACTION & VALIDATION
  // ===========================================

  async extractCitations(text: string): Promise<Array<{
    citation: string;
    type: 'CASE' | 'STATUTE' | 'REGULATION' | 'SECONDARY';
    confidence: number;
    context: string;
    startIndex: number;
    endIndex: number;
  }>> {
    try {
      const citations = await this.callNLPModel('extract_citations', {
        text,
        citation_types: ['CASE', 'STATUTE', 'REGULATION', 'SECONDARY'],
        include_context: true
      });

      return citations.map((citation: any) => ({
        citation: citation.text,
        type: citation.type,
        confidence: citation.confidence,
        context: citation.context,
        startIndex: citation.start_index,
        endIndex: citation.end_index
      }));

    } catch (error) {
      console.error('Citation extraction failed:', error);
      return this.fallbackCitationExtraction(text);
    }
  }

  // ===========================================
  // LEGAL DOCUMENT GENERATION
  // ===========================================

  async generateLegalDraft(params: {
    documentType: string;
    parties: string[];
    keyTerms: { [key: string]: string };
    jurisdiction: string;
    templatePreferences?: string[];
  }): Promise<{
    draft: string;
    suggestions: string[];
    requiredReview: string[];
    placeholders: string[];
  }> {
    try {
      const draft = await this.callNLPModel('generate_document', {
        document_type: params.documentType,
        parties: params.parties,
        key_terms: params.keyTerms,
        jurisdiction: params.jurisdiction,
        template_preferences: params.templatePreferences,
        include_suggestions: true
      });

      return {
        draft: draft.generated_text,
        suggestions: draft.suggestions || [],
        requiredReview: draft.required_review || [],
        placeholders: draft.placeholders || []
      };

    } catch (error) {
      console.error('Document generation failed:', error);
      throw error;
    }
  }

  // ===========================================
  // UTILITY METHODS
  // ===========================================

  private async callNLPModel(endpoint: string, data: any): Promise<any> {
    const response = await fetch(`${this.modelEndpoint}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`NLP API call failed: ${response.status}`);
    }

    return response.json();
  }

  private async enrichEntities(entities: any[]): Promise<LegalEntity[]> {
    return entities.map(entity => ({
      text: entity.text,
      type: entity.type,
      confidence: entity.confidence,
      startIndex: entity.start_index,
      endIndex: entity.end_index,
      metadata: entity.metadata || {}
    }));
  }

  private fallbackEntityExtraction(text: string): LegalEntity[] {
    const entities: LegalEntity[] = [];
    
    // Simple regex-based fallback for basic entities
    const citationPattern = /\d+\s+[A-Z][a-z]+\.?\s+\d+/g;
    const matches = text.matchAll(citationPattern);
    
    for (const match of matches) {
      if (match.index !== undefined) {
        entities.push({
          text: match[0],
          type: 'CASE_CITATION',
          confidence: 0.7,
          startIndex: match.index,
          endIndex: match.index + match[0].length
        });
      }
    }

    return entities;
  }

  private fallbackClassification(text: string): DocumentClassification {
    // Simple keyword-based fallback classification
    const keywords = text.toLowerCase();
    
    let documentType = 'UNKNOWN';
    let practiceArea: string[] = [];

    if (keywords.includes('contract') || keywords.includes('agreement')) {
      documentType = 'CONTRACT';
      practiceArea.push('CONTRACT_LAW');
    } else if (keywords.includes('motion') || keywords.includes('petition')) {
      documentType = 'MOTION';
      practiceArea.push('LITIGATION');
    } else if (keywords.includes('brief')) {
      documentType = 'BRIEF';
      practiceArea.push('LITIGATION');
    }

    return {
      documentType,
      confidence: 0.6,
      practiceArea,
      urgency: 'MEDIUM',
      requiredActions: []
    };
  }

  private fallbackArgumentAnalysis(text: string): LegalArgumentStructure {
    // Basic fallback argument structure
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    return {
      claim: sentences[0] || '',
      rule: sentences[1] || '',
      application: sentences.slice(2, -1).join('. ') || '',
      conclusion: sentences[sentences.length - 1] || '',
      strength: 0.5,
      weaknesses: ['Analysis requires manual review'],
      supportingAuthorities: [],
      counterArguments: []
    };
  }

  private fallbackComplexityAnalysis(text: string): LegalComplexity {
    const words = text.split(/\s+/).length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const avgWordsPerSentence = words / sentences;
    
    // Simple complexity score based on average sentence length
    const complexityScore = Math.min(100, Math.max(0, (avgWordsPerSentence - 10) * 5));

    return {
      score: complexityScore,
      factors: [
        {
          factor: 'Average sentence length',
          impact: complexityScore * 0.6,
          description: `Sentences average ${avgWordsPerSentence.toFixed(1)} words`
        }
      ],
      readabilityMetrics: {
        fleschKincaid: 50 - complexityScore * 0.3,
        averageSentenceLength: avgWordsPerSentence,
        averageWordsPerSentence: avgWordsPerSentence,
        legalTermDensity: 0.1
      },
      simplificationSuggestions: complexityScore > 70 ? ['Consider shorter sentences', 'Reduce technical jargon'] : []
    };
  }

  private fallbackCitationExtraction(text: string): Array<{
    citation: string;
    type: 'CASE' | 'STATUTE' | 'REGULATION' | 'SECONDARY';
    confidence: number;
    context: string;
    startIndex: number;
    endIndex: number;
  }> {
    const citations: any[] = [];
    const citationPattern = /\d+\s+[A-Z][a-z]+\.?\s+\d+/g;
    
    let match;
    while ((match = citationPattern.exec(text)) !== null) {
      citations.push({
        citation: match[0],
        type: 'CASE',
        confidence: 0.7,
        context: text.substring(Math.max(0, match.index - 50), match.index + match[0].length + 50),
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
    }

    return citations;
  }

  private hashText(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }
}

export const createLegalNLPEngine = (config: {
  modelEndpoint: string;
  apiKey: string;
}): LegalNLPEngine => {
  return new LegalNLPEngine(config);
};

export { 
  LegalEntity, 
  LegalConcept, 
  ContractClause, 
  LegalArgumentStructure, 
  DocumentClassification, 
  LegalSentiment, 
  LegalComplexity 
};
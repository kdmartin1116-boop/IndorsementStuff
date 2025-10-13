# LocalAgentCore

This package contains the core business logic for the Sovereign Financial Cockpit application. It is a collection of modules, each responsible for a specific set of tasks related to document analysis, processing, and generation.

## Modules

- **ContradictionDetector**: Analyzes legal documents to identify contradictory or potentially unlawful terms.
- **DebtDischargeKit**: Provides tools for generating debt discharge instruments and flagging fraudulent terms in financial documents.
- **DispatchDaemon**: Manages the dispatching and tracking of generated documents.
- **InstrumentAnnotator**: Parses and annotates financial instruments, such as bills and contracts.
- **InstrumentClassifier**: Classifies financial instruments based on their content.
- **JurisdictionMapper**: Maps legal and financial terms to their respective jurisdictions.
- **LegalLexicon**: A dictionary of legal terms, their definitions, and relationships.
- **NationalityReclaimer**: Assists in the process of reclaiming one's status as a State National.
- **RemedyCompiler**: Compiles legal remedies based on identified violations and jurisdictional rules.
- **Signature**: Handles the digital signing of documents.
- **TrustSetupWizard**: A tool to assist in the creation of legal trusts.
- **utils**: A collection of utility functions used across the various modules.

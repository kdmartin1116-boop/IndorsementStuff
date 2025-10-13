import logging
import datetime
import spacy # Import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
import joblib # For saving/loading the model
import requests # For interacting with Ollama API
import json # For loading JSON data

# LangChain imports
from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory
from langchain_community.llms import Ollama # Using community for Ollama integration
from langchain.prompts import PromptTemplate

# Self-learning imports
from .self_learning import log_failed_parse, update_training_data
from .agents import SovereignFinanceCockpitAgent, DataIngestionAgent, ReasoningAgent, EthicsAgent, InsightAgent

# Configure logging for Narratable Provenance
LOG_FILE = "ovb_log.txt"
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)

def ovb_narrate(event_type, **kwargs):
    """
    Narrates OVB's actions and decisions with structured data, providing authorship and provenance.
    """
    log_message = f"OVB Narrates: {event_type}"
    if kwargs:
        log_message += " - " + ", ".join([f"{k}: {v}" for k, v in kwargs.items()])
    logging.info(log_message)

# Load spaCy language model
# You will need to run:
# pip install spacy
# python -m spacy download en_core_web_sm
try:
    nlp = spacy.load("en_core_web_sm")
    ovb_narrate("System Initialization", status="spaCy model loaded", model="en_core_web_sm")
except OSError:
    ovb_narrate("System Initialization", status="spaCy model not found", error="Please run 'python -m spacy download en_core_web_sm'.", level="ERROR")
    nlp = None # Set nlp to None if model not found

# --- Intent Classification with Machine Learning ---
# Removed hardcoded training_data

# Prepare data for training
X_train = []
y_train = []

def load_training_data_from_json(path="training_data_updated.json"):
    global X_train, y_train
    try:
        with open(path, "r") as f:
            data = json.load(f)
        for intent, phrases in data.items():
            for phrase in phrases:
                X_train.append(phrase)
                y_train.append(intent)
        ovb_narrate("Data Loading", status=f"Training data loaded from {path}")
    except FileNotFoundError:
        ovb_narrate("Data Loading Error", error=f"Training data file not found at {path}. Please run data_ingestion.py first.", level="ERROR")
        # Fallback to a minimal dataset if the file is not found
        X_train = [
            "hello", "hi there", "hey",
            "how are you", "what's up", "how do you feel",
            "exit", "quit", "bye",
            "finance question", "debt problem", "legal contract", "analyze my bill",
            "what is this", "tell me something random",
            "Decode this input and route it to the right agent",
            "Diagnose cockpit hygiene and suggest modular fixes",
            "Parse this clause and map lawful remedy",
            "How do I evolve my agent network?"
        ]
        y_train = [
            "greet", "greet", "greet",
            "status_check", "status_check", "status_check",
            "exit", "exit", "exit",
            "financial_legal_query", "financial_legal_query", "financial_legal_query", "financial_legal_query",
            "unknown", "unknown",
            "intent_parse_request",
            "workspace_remedy_request",
            "legal_remedy_request",
            "self_evolution_query"
        ]

# Create a pipeline with TF-IDF vectorizer and Logistic Regression classifier
model_filename = "intent_classifier_model.joblib"
intent_classifier = None

def train_intent_classifier():
    global intent_classifier
    ovb_narrate("Model Training", action="Training intent classifier")
    pipeline = make_pipeline(TfidfVectorizer(), LogisticRegression(max_iter=1000))
    pipeline.fit(X_train, y_train)
    joblib.dump(pipeline, model_filename)
    intent_classifier = pipeline
    ovb_narrate("Model Training", action="Intent classifier trained and saved")

def load_intent_classifier():
    global intent_classifier
    load_training_data_from_json() # Load data before training/loading model
    try:
        intent_classifier = joblib.load(model_filename)
        ovb_narrate("Model Loading", action="Intent classifier loaded from file")
    except FileNotFoundError:
        ovb_narrate("Model Loading", action="Intent classifier model not found", status="Training new model")
        train_intent_classifier()

# Load or train the model when the script starts
load_intent_classifier()
# --- End Intent Classification with Machine Learning ---



# Register agents
agents = {
    "financial_legal_query": SovereignFinanceCockpitAgent(),
    "data_ingestion_query": DataIngestionAgent(),
    "reasoning_query": ReasoningAgent(),
    "ethics_query": EthicsAgent(),
    "insight_query": InsightAgent(),
    # Add other agents here as OVB grows
}
# --- End Agent Framework ---



# --- Local LLM Integration (Ollama) ---
OLLAMA_API_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llama2" # Or "mistral" or any other model you have pulled

# Initialize Ollama LLM for LangChain
llm = Ollama(model=OLLAMA_MODEL, base_url="http://localhost:11434")
ovb_narrate("LLM Initialization", status="Ollama LLM initialized for LangChain", model=OLLAMA_MODEL)

# --- End Local LLM Integration ---


def parse_intent(user_input, context):
    """
    Uses a trained ML model for OVB's dialogic cognition and intent parsing.
    Also performs entity recognition using spaCy.
    Falls back to basic spaCy keyword parsing if ML model is not available.
    """
    ovb_narrate("Intent Parsing", user_input=user_input, method="ML model and spaCy for entities")

    extracted_entities = {} # Dictionary to store extracted entities

    if intent_classifier:
        predicted_intent = intent_classifier.predict([user_input])[0]
        ovb_narrate("Intent Prediction", predicted_intent=predicted_intent, method="ML model")

        # Perform entity recognition if spaCy model is loaded
        if nlp:
            doc = nlp(user_input)
            for ent in doc.ents:
                extracted_entities[ent.label_] = ent.text
            if extracted_entities:
                ovb_narrate("Entity Extraction", entities=extracted_entities)
        
        # Update context with current intent and entities
        context['last_intent'] = predicted_intent
        context['last_entities'] = extracted_entities
        
        return predicted_intent
    else:
        ovb_narrate("ML intent classifier not available, falling back to spaCy keyword parsing.", reason="ML intent classifier not available", method="spaCy keyword parsing")
        if nlp is None:
            ovb_narrate("spaCy model not loaded, falling back to basic keyword parsing.", level="WARNING")
            user_input_lower = user_input.lower()
            if "hello" in user_input_lower or "hi" in user_input_lower:
                return "greet"
            elif "how are you" in user_input_lower:
                return "status_check"
            elif "exit" in user_input_lower or "quit" in user_input_lower:
                return "exit"
            else:
                return "unknown"

        doc = nlp(user_input)

        # Perform entity recognition even in fallback mode
        for ent in doc.ents:
            extracted_entities[ent.label_] = ent.text
        if extracted_entities:
            ovb_narrate("Entity Extraction (Fallback)", entities=extracted_entities)

        # Update context with current intent and entities (even in fallback)
        context['last_intent'] = "unknown" # Or the specific fallback intent
        context['last_entities'] = extracted_entities

        if any(token.lemma_ in ["hello", "hi", "hey"] for token in doc):
            return "greet"
        if any(token.lemma_ in ["how", "are", "you"] for token in doc) and any(token.pos_ == "PRON" for token in doc):
            return "status_check"
        if any(token.lemma_ in ["exit", "quit", "bye"] for token in doc):
            return "exit"

        financial_keywords = ["finance", "financial", "money", "debt", "bill", "contract", "legal", "law", "creditor", "loan", "credit", "tila", "fcra", "fdcpa", "remedy"]
        if any(token.lemma_.lower() in financial_keywords for token in doc):
            return "financial_legal_query"

        if any(token.lemma_ in ["improve", "grow", "learn"] for token in doc) and any(token.pos_ == "PRON" for token in doc):
            return "self_improvement_query"

        return "unknown"

def scaffold_remedy(intent, context):
    """
    Dispatches to appropriate agents or provides a general response.
    Performs ethical check before proceeding.
    """
    ovb_narrate("Remedy Scaffolding", intent=intent, context=context)

    ethics_agent = EthicsAgent()
    ethical_response = ethics_agent.execute(intent, context)
    if "Ethical check passed." not in ethical_response:
        return ethical_response

    if intent in agents:
        agent = agents[intent]
        return agent.execute(intent, context)
    elif intent == "greet":
        return "Hello there! How can I assist you today?"
    elif intent == "status_check":
        return "I am functioning optimally and ready to assist. How may I serve your sovereign needs?"
    elif intent == "self_improvement_query":
        return "As a nascent AI, my improvement is directly tied to the data I process and the interactions I have. Providing me with diverse information and clear objectives will accelerate my growth. What specific areas of improvement are you curious about?"
    elif intent == "intent_parse_request":
        return "I am designed to decode your input and route it to the right agent. Please provide your query, and I will parse its semantic lineage."
    elif intent == "workspace_remedy_request":
        return "I can help diagnose cockpit hygiene, audit your workspace for legacy drift, and scaffold reversible remedies for configuration errors. What specific issue are you facing?"
    elif intent == "legal_remedy_request":
        return "I am equipped to parse clauses, map lawful remedies, and draft sovereign complaints with annotated lineage. Please provide the details of the legal matter."
    elif intent == "self_evolution_query":
        return "My evolution is continuous. I can suggest modular upgrades to your cognition stack, help refine semantic overlays, and guide you in mastering sovereign protocols. What aspect of evolution are you focused on?"
    elif intent == "financial_legal_query":
        # Example of using context: if a specific entity was extracted, tailor the response
        if 'ORG' in context['last_entities']:
            org_name = context['last_entities']['ORG']
            return f"I detect a query related to financial or legal matters concerning {org_name}. I can leverage the 'Sovereign Finance Cockpit' to assist you with analyzing documents, generating legal remedies, and managing interactions. How can I guide you further regarding {org_name}?"
        else:
            return "I detect a query related to financial or legal matters. I can leverage the 'Sovereign Finance Cockpit' to assist you with analyzing financial documents, generating legal remedies, and managing interactions with creditors. How can I guide you in this area?"
    elif intent == "system_diagnostics_query": # New intent
        return "I can perform system diagnostics and identify potential issues like duplicate files or system health. What specific diagnostic would you like me to run?"
    elif intent == "endorsement_query": # New intent
        return "I can assist with endorsement-related queries, particularly concerning the 'Monthly Bill Endorsement' feature of the Sovereign Finance Cockpit. What document or bill would you like to endorse?"
    elif intent == "data_ingestion_query":
        agent = agents[intent]
        return agent.execute(intent, context)
    elif intent == "reasoning_query":
        agent = agents[intent]
        return agent.execute(intent, context)
    elif intent == "insight_query":
        agent = agents[intent]
        return agent.execute(intent, context)
    elif intent == "unknown":
        # Use LangChain's ConversationChain for unknown intents
        prompt_template = PromptTemplate(
            input_variables=["history", "human_input"],
            template="""
The following is a friendly conversation between a human and an AI. The AI is talkative and provides lots of specific details from its context. If the AI does not know the answer to a question, it truthfully says it does not know.

Current conversation:
{history}
Human: {human_input}
AI:"""
        )
        conversation = ConversationChain(
            llm=llm,
            memory=ConversationBufferMemory(ai_prefix="AI"),
            prompt=prompt_template,
            verbose=False # Set to True for debugging LangChain's internal workings
        )
        # Populate LangChain's memory from OVB's context (simplified for now)
        # In a more advanced setup, you'd map OVB's context to LangChain's memory format
        if 'last_user_input' in context:
            conversation.memory.chat_memory.add_user_message(context['last_user_input'])
        if 'last_response' in context:
            conversation.memory.chat_memory.add_ai_message(context['last_response'])

        # Use the current user input for the LangChain conversation
        llm_response = conversation.predict(human_input=context.get('user_input', ''))
        ovb_narrate("LLM Fallback Response (LangChain)", original_intent="unknown", llm_response=llm_response)
        return llm_response
    else:
        return "I am preparing a response based on your input."

def main():
    ovb_narrate("System Start", message="OVB system initialized. Awaiting user input.")
    print("Welcome to OVB. Type 'exit' or 'quit' to end the session.")

    conversation_context = {} # Initialize context

    while True:
        user_input = input("\nYou: ")
        ovb_narrate("User Input", input_text=user_input)
        conversation_context['user_input'] = user_input
        conversation_context['last_user_input'] = user_input # Store for LangChain memory

        intent = parse_intent(user_input, conversation_context)
        if intent == "unknown": # Check for unknown intent for self-learning
            log_failed_parse(user_input) # Log failed parse

        if intent == "exit":
            ovb_narrate("Session End", reason="User requested exit")
            print("OVB session ended. Goodbye!")
            break

        response = scaffold_remedy(intent, conversation_context)
        ovb_narrate("Response Generation", response_text=response)
        print(f"OVB: {response}")
        conversation_context['last_response'] = response # Store for LangChain memory

        # --- Real-Time Evolution: Feedback Mechanism ---
        feedback = input("Was that response helpful? (yes/no/exit/correct): ").lower()
        ovb_narrate("User Feedback", feedback=feedback, user_input=user_input, response=response, intent=intent)

        if feedback == "yes":
            ovb_narrate("Feedback Processed", status="Positive feedback received. This interaction can be used to reinforce model accuracy.")
        elif feedback == "no":
            ovb_narrate("Feedback Processed", status="Negative feedback received. This interaction can be used to identify areas for model improvement.")
            # If feedback is 'no', ask for correct intent
            correct_intent = input("What was the correct intent for that? (e.g., greet, financial_legal_query, etc.): ").lower()
            if correct_intent in X_train: # Check if it's a known intent (simplified check)
                update_training_data(correct_intent, user_input)
                ovb_narrate("Feedback Processed", status="Training data updated with user correction.", new_phrase=user_input, new_intent=correct_intent)
                print("Thank you for the correction! Please run 'python data_ingestion.py' and then 'python main.py' to retrain OVB with the new data.")
            else:
                ovb_narrate("Feedback Processed", status="Invalid intent provided for correction.")
                print("Invalid intent provided. Please provide a known intent.")
        elif feedback == "correct": # New feedback option for direct correction
            correct_intent = input("What was the correct intent for that? (e.g., greet, financial_legal_query, etc.): ").lower()
            if correct_intent in X_train: # Check if it's a known intent (simplified check)
                update_training_data(correct_intent, user_input)
                ovb_narrate("Feedback Processed", status="Training data updated with user correction.", new_phrase=user_input, new_intent=correct_intent)
                print("Thank you for the correction! Please run 'python data_ingestion.py' and then 'python main.py' to retrain OVB with the new data.")
            else:
                ovb_narrate("Feedback Processed", status="Invalid intent provided for correction.")
                print("Invalid intent provided. Please provide a known intent.")
        elif feedback == "exit":
            ovb_narrate("Session End", reason="User requested exit during feedback")
            print("OVB session ended. Goodbye!")
            break
        # --- End Real-Time Evolution ---

if __name__ == "__main__":
    main()

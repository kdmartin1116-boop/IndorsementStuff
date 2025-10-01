import json
import os

def load_jurisdictions():
    """
    Loads the jurisdictions from the json file.
    """
    dir_path = os.path.dirname(os.path.realpath(__file__))
    with open(os.path.join(dir_path, '..', 'data', 'jurisdictions.json'), 'r') as f:
        return json.load(f)

def map_jurisdiction(text):
    """
    Analyzes a text and maps the jurisdiction based on keywords.
    """
    jurisdictions = load_jurisdictions()
    found_jurisdictions = []
    
    if "common law" in text.lower():
        found_jurisdictions.append(jurisdictions["common_law"])
    if "admiralty" in text.lower() or "maritime" in text.lower():
        found_jurisdictions.append(jurisdictions["admiralty_maritime"])
    if "equity" in text.lower():
        found_jurisdictions.append(jurisdictions["equity"])
        
    if not found_jurisdictions:
        return {"message": "No specific jurisdiction mentioned. Defaulting to common law.", "jurisdictions": [jurisdictions["common_law"]]}
        
    return {"jurisdictions": found_jurisdictions}

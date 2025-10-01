import json
import os

def load_unlawful_terms():
    """
    Loads the unlawful terms from the json file.
    """
    dir_path = os.path.dirname(os.path.realpath(__file__))
    with open(os.path.join(dir_path, '..', 'data', 'unlawful_terms.json'), 'r') as f:
        return json.load(f)

def detect_contradictions(text):
    """
    Detects contradictions in a given text.
    """
    unlawful_terms = load_unlawful_terms()
    contradictions = []
    for term, alternative in unlawful_terms.items():
        if term.lower() in text.lower():
            contradictions.append({
                "unlawful_term": term,
                "lawful_alternative": alternative
            })
    return contradictions

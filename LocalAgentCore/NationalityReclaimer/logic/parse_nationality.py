def parse_nationality(user_input):
    unlawful_terms = ["U.S. citizen", "resident", "person", "individual"]
    lawful_terms = {
        "Texan": "Texan National",
        "Florida": "Floridian National",
        "California": "Californian National"
    }
    contradictions = []
    for term in unlawful_terms:
        if term.lower() in user_input.lower():
            contradictions.append(term)
    suggested = []
    for key, value in lawful_terms.items():
        if key.lower() in user_input.lower():
            suggested.append(value)
    return {
        "contradictions": contradictions,
        "suggested_nationalities": suggested
    }
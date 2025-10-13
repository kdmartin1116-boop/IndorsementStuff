import pytest
from packages.LocalAgentCore.ContradictionDetector.logic.detect import detect_contradictions

def test_detect_single_contradiction():
    """Tests that a single known unlawful term is detected."""
    text = "This agreement requires the resident to pay all taxes."
    expected = [{
        "unlawful_term": "resident",
        "lawful_alternative": "inhabitant"
    }]
    assert detect_contradictions(text) == expected

def test_no_contradictions():
    """Tests that no contradictions are found in clean text."""
    text = "This is a perfectly valid sentence."
    assert detect_contradictions(text) == []

def test_detect_multiple_contradictions():
    """Tests that multiple different unlawful terms are detected."""
    text = "The resident must submit an application as a person."
    result = detect_contradictions(text)
    assert len(result) == 2
    # Check for presence of both terms, order doesn't matter
    terms_found = {item['unlawful_term'] for item in result}
    assert "resident" in terms_found
    assert "person" in terms_found

def test_case_insensitivity():
    """Tests that detection is case-insensitive."""
    text = "This RESIDENT must pay."
    expected = [{
        "unlawful_term": "resident",
        "lawful_alternative": "inhabitant"
    }]
    assert detect_contradictions(text) == expected

from datetime import date
import os
import sys

# Add the logic directory to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'NationalityReclaimer', 'logic')))

from generate_affidavit import generate_affidavit

def load_template(template_name):
    """
    Loads a template from the templates directory.
    """
    dir_path = os.path.dirname(os.path.realpath(__file__))
    with open(os.path.join(dir_path, '..', 'templates', template_name), 'r') as f:
        return f.read()

def compile_remedy(full_name, birth_location, nationality):
    """
    Compiles the remedy package, including the affidavit, cover letter, and endorsement.
    """
    affidavit = generate_affidavit(nationality, full_name, birth_location)
    
    cover_letter_template = load_template('cover_letter.txt')
    cover_letter = cover_letter_template.format(full_name=full_name)
    
    endorsement_template = load_template('endorsement.txt')
    today = date.today().strftime("%B %d, %Y")
    endorsement = endorsement_template.format(date=today)
    
    return {
        "affidavit": affidavit,
        "cover_letter": cover_letter,
        "endorsement": endorsement
    }

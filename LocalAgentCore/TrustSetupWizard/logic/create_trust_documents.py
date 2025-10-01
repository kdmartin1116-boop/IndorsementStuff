from datetime import date
import os

def load_template(template_name):
    """
    Loads a template from the templates directory.
    """
    dir_path = os.path.dirname(os.path.realpath(__file__))
    with open(os.path.join(dir_path, '..', 'templates', template_name), 'r') as f:
        return f.read()

def create_trust_documents(trust_type, settlor_name, trustee_name, beneficiaries, trust_property):
    """
    Creates the trust documents for a given trust type.
    """
    today = date.today()
    
    trust_agreement_template = load_template('trust_agreement.txt')
    trust_agreement = trust_agreement_template.format(
        date=today.day,
        month=today.strftime("%B"),
        year=today.year,
        settlor_name=settlor_name,
        trustee_name=trustee_name
    )
    
    declaration_of_trust_template = load_template('declaration_of_trust.txt')
    declaration_of_trust = declaration_of_trust_template.format(
        settlor_name=settlor_name,
        settlor_address="[Settlor Address]",
        trust_property=trust_property
    )
    
    return {
        "trust_agreement": trust_agreement,
        "declaration_of_trust": declaration_of_trust
    }

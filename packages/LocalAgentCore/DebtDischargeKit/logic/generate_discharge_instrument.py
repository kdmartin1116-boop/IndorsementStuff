def generate_discharge_instrument(full_name, statement_id, amount, creditor):
    return f"""
    Lawful Tender Endorsement

    I, {full_name}, hereby conditionally accept the claim referenced as {statement_id} for value and proof of claim. I demand verified accounting, lawful money, and full disclosure under penalty of perjury.

    Amount: {amount}
    Creditor: {creditor}

    This endorsement is made under UCC 3-104, 3-305, and 3-501. I reserve all rights under UCC 1-308.

    Signed in authorship and remedy,
    {full_name}
    """

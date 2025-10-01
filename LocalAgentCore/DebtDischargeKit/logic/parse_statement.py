def parse_statement(text):
    flags = []
    if "$" in text:
        flags.append("Federal Reserve Notes — securities, not lawful money")
    if "amount due" in text.lower():
        flags.append("Presumption of debt — challenge with verified claim")
    if "account number" in text.lower():
        flags.append("Corporate tracking ID — not lawful obligation")
    return flags

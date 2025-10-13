def tag_zones(layout):
    tags = {}
    for zone, lines in layout.items():
        tags[zone] = []
        for line in lines:
            if "amount due" in line.lower():
                tags[zone].append({"type": "debt_presumption", "text": line})
            if "account number" in line.lower():
                tags[zone].append({"type": "tracking_id", "text": line})
            if "$" in line:
                tags[zone].append({"type": "currency", "text": line})
    return tags

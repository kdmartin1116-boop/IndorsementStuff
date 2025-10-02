def suggest_endorsements(tags):
    placements = []
    if "bottom" in tags:
        placements.append({
            "zone": "bottom",
            "action": "Place UCC 1-308 reservation and conditional acceptance here."
        })
    if "top" in tags:
        placements.append({
            "zone": "top",
            "action": "Affirm jurisdiction and lawful name here."
        })
    return placements

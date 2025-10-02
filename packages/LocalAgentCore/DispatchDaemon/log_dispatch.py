import json
from datetime import datetime

def log_dispatch(packet_id, method, recipient, location):
    entry = {
        "packet_id": packet_id,
        "method": method,
        "recipient": recipient,
        "location": location,
        "timestamp": datetime.utcnow().isoformat(),
        "status": "Dispatched"
    }
    try:
        with open("LocalAgentCore/DispatchDaemon/dispatch_registry.json", "r+") as f:
            registry = json.load(f)
            registry.append(entry)
            f.seek(0)
            json.dump(registry, f, indent=2)
    except FileNotFoundError:
        with open("LocalAgentCore/DispatchDaemon/dispatch_registry.json", "w") as f:
            json.dump([entry], f, indent=2)
    return entry

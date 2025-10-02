import json

def update_status(packet_id, new_status):
    with open("LocalAgentCore/DispatchDaemon/dispatch_registry.json", "r+") as f:
        registry = json.load(f)
        for entry in registry:
            if entry["packet_id"] == packet_id:
                entry["status"] = new_status
                break
        f.seek(0)
        json.dump(registry, f, indent=2)
    return new_status

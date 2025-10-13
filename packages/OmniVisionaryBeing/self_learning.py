import json
from datetime import datetime

def log_failed_parse(input_text):
    with open("failed_parses.log", "a") as f:
        f.write(f"{datetime.now()} | {input_text}\n")

def update_training_data(intent, new_phrase):
    with open("training_data.json", "r") as f:
        data = json.load(f)

    if intent not in data or intent in ["greet", "exit"]:
        print("🚫 Restricted intent. Manual approval required.")
        return

    if new_phrase not in data[intent]:
        data[intent].append(new_phrase)
        with open("training_data.json", "w") as f:
            json.dump(data, f, indent=2)
        print(f"✅ Added '{new_phrase}' to '{intent}'")

def narrate_update(intent, phrase):
    print(f"📜 OVB has learned: '{phrase}' as part of '{intent}' intent.")
    print("🔒 Sovereign restrictions enforced. Core intents remain locked.")


"""
Quick test to verify the API is serving updated terminology
"""
import requests
import json

def verify_api_updates():
    print("🔍 VERIFYING API UPDATES AT LOCALHOST:8000")
    print("=" * 50)
    
    try:
        # Test the OpenAPI spec
        response = requests.get("http://localhost:8000/openapi.json")
        if response.status_code == 200:
            api_spec = response.json()
            
            print("✅ API TITLE:", api_spec.get("info", {}).get("title", "NOT FOUND"))
            print("✅ API DESCRIPTION:", api_spec.get("info", {}).get("description", "NOT FOUND"))
            print("✅ API VERSION:", api_spec.get("info", {}).get("version", "NOT FOUND"))
            
            print("\n📋 AVAILABLE ENDPOINTS:")
            paths = api_spec.get("paths", {})
            for path in sorted(paths.keys()):
                methods = list(paths[path].keys())
                print(f"   {path} [{', '.join(methods).upper()}]")
            
            # Check for specific updated endpoints
            if "/parse-negotiable-instrument" in paths:
                print("\n✅ SUCCESS: New endpoint '/parse-negotiable-instrument' found")
            else:
                print("\n❌ WARNING: New endpoint '/parse-negotiable-instrument' not found")
                
            if "/parse-sovereign-instrument" in paths:
                print("❌ WARNING: Old endpoint '/parse-sovereign-instrument' still exists")
            else:
                print("✅ SUCCESS: Old endpoint '/parse-sovereign-instrument' removed")
                
        else:
            print(f"❌ ERROR: API not responding. Status code: {response.status_code}")
            
    except Exception as e:
        print(f"❌ ERROR: Could not connect to API: {e}")
        print("Make sure the server is running on localhost:8000")

if __name__ == "__main__":
    verify_api_updates()
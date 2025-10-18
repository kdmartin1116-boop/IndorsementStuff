"""
Test script to demonstrate the Enhanced Endorsement API functionality
"""
import requests
import json
import time

def test_api_endpoints():
    """Test all available API endpoints"""
    base_url = "http://localhost:8000"
    
    print("🚀 Testing Enhanced Endorsement API")
    print("=" * 50)
    
    # Test 1: Root endpoint
    try:
        response = requests.get(f"{base_url}/")
        print(f"✅ Root endpoint: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"❌ Root endpoint failed: {e}")
    
    print()
    
    # Test 2: Hello endpoint
    try:
        response = requests.get(f"{base_url}/hello")
        print(f"✅ Hello endpoint: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"❌ Hello endpoint failed: {e}")
    
    print()
    
    # Test 3: API documentation
    try:
        response = requests.get(f"{base_url}/docs")
        print(f"✅ API docs available: {response.status_code}")
        print(f"   FastAPI documentation is accessible at {base_url}/docs")
    except Exception as e:
        print(f"❌ API docs failed: {e}")
    
    print()
    
    # Test 4: Check available routes
    try:
        response = requests.get(f"{base_url}/openapi.json")
        if response.status_code == 200:
            api_spec = response.json()
            paths = list(api_spec.get('paths', {}).keys())
            print(f"✅ Available API endpoints:")
            for path in sorted(paths):
                print(f"   📍 {path}")
    except Exception as e:
        print(f"❌ OpenAPI spec failed: {e}")

if __name__ == "__main__":
    # Wait a moment for server to start
    time.sleep(2)
    test_api_endpoints()
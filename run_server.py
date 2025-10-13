#!/usr/bin/env python3
import sys
import os
import uvicorn

# Add the current directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

# Change working directory to the script location
os.chdir(current_dir)

if __name__ == "__main__":
    print(f"Starting server from: {current_dir}")
    print(f"Python path includes: {current_dir}")
    
    # Import the app after setting up the path
    from backend.main import app
    
    uvicorn.run(app, host="127.0.0.1", port=8002, reload=False)
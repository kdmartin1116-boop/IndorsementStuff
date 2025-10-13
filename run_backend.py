import sys
import os
from pathlib import Path

# Add project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# Now try to start the server
import uvicorn

if __name__ == "__main__":
    # Change to project directory
    os.chdir(project_root)
    
    # Import the app from backend.main
    try:
        from backend.main import app
        print("Successfully imported FastAPI app")
        
        # Start the server
        uvicorn.run(app, host="127.0.0.1", port=8000, reload=False)
    except Exception as e:
        print(f"Error: {e}")
        print(f"Current dir: {os.getcwd()}")
        print(f"Python path: {sys.path}")
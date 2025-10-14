import os

class Config:
    """Configuration settings for the application."""

    DEBUG = os.environ.get("DEBUG", True)
    """Enable or disable debug mode."""

    HOST = os.environ.get("HOST", "0.0.0.0")
    """The host to run the application on."""

    PORT = int(os.environ.get("PORT", 60000))
    """The port to run the application on."""

    STATIC_FOLDER = os.environ.get("STATIC_FOLDER", "frontend/dist")
    """The folder containing static files."""

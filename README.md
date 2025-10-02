# Sovereign Financial Cockpit

## Disclaimer

**This repository is for educational and informational purposes only. The information provided here does not constitute legal advice. The process of changing your legal status is complex and has significant legal and financial implications. We strongly recommend that you consult with a qualified legal professional to discuss your specific situation and to ensure you are in compliance with all applicable laws and regulations.**

## Project Goal

This project aims to provide a starting point for United States citizens who are interested in understanding the process of correcting their status to that of a State National. We provide educational resources and a collaborative space for sharing information.

## Project Structure

This project is a monorepo containing the following components:

*   `frontend/`: A React-based web application that provides the user interface.
*   `backend/`: A Python-based backend that provides the API for the frontend.
*   `LocalAgentCore/`: A Python library containing the core business logic of the application.
*   `sovereign-financial-cockpit-old/`: The previous version of this project.

## Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/en/) (v18 or later)
*   [Python](https://www.python.org/downloads/) (v3.10 or later)

### Backend Setup

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Create a virtual environment:
    ```bash
    python -m venv .venv
    ```
3.  Activate the virtual environment:
    *   On macOS and Linux:
        ```bash
        source .venv/bin/activate
        ```
    *   On Windows:
        ```bash
        .venv\Scripts\activate
        ```
4.  Install the dependencies:
    ```bash
    pip install -r requirements.txt
    ```
5.  Run the backend server:
    ```bash
    uvicorn main:app --reload
    ```

### Frontend Setup

1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install the dependencies:
    ```bash
    npm install
    ```
3.  Run the frontend development server:
    ```bash
    npm run dev
    ```

## Security

This project deals with sensitive information, so it's important to follow security best practices. Here are some recommendations:

*   **Environment Variables:** Use a `.env` file to store sensitive information like API keys and secrets. The `.gitignore` file is already configured to ignore `.env` files.
*   **Input Sanitization:** The backend uses `secure_filename` to sanitize filenames. The `BillParser` uses regular expressions to extract data from uploaded files. While this is relatively safe, it's always a good practice to validate and sanitize all user inputs to prevent injection attacks.
*   **Authentication and Authorization:** The current version of the application does not have any authentication or authorization. If you plan to add user accounts or other sensitive features, you should implement a robust authentication and authorization system.
*   **Dependencies:** Keep your dependencies up to date to avoid known vulnerabilities. You can use tools like `pip-audit` for Python and `npm audit` for Node.js to check for vulnerabilities in your dependencies.

## Contributing

We welcome contributions to this project. Please read our `CODE_OF_CONDUCT.md` before contributing.

# Sovereign Financial Cockpit

## Disclaimer

**This repository is for educational and informational purposes only. The information provided here does not constitute legal advice. The process of changing your legal status is complex and has significant legal and financial implications. We strongly recommend that you consult with a qualified legal professional to discuss your specific situation and to ensure you are in compliance with all applicable laws and regulations.**

## Project Goal

This project aims to provide a starting point for United States citizens who are interested in understanding the process of correcting their status to that of a State National. We provide educational resources and a collaborative space for sharing information.

## Project Structure

This project is a monorepo containing the following components:

*   `frontend/`: A React-based web application that provides the user interface.
*   `backend/`: A Python-based API server built with FastAPI.
*   `packages/`: A collection of shared Python packages containing the core business logic.
    *   `packages/LocalAgentCore`: Contains modules for document analysis, contradiction detection, and instrument generation.
    *   `packages/AutoTender`: Contains modules for automated tendering processes.
*   `docs/`: Contains educational and informational documents.

## Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/en/) (v18 or later)
*   [Python](https://www.python.org/downloads/) (v3.9 or later)
*   [Poetry](https://python-poetry.org/docs/#installation) for Python package management.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-name>
    ```

2.  **Install Backend Dependencies:**
    From the project root directory, install the Python dependencies using Poetry.
    ```bash
    poetry install
    ```

3.  **Install Frontend Dependencies:**
    Navigate to the `frontend` directory and use `npm`.
    ```bash
    cd frontend
    npm install
    ```

4.  **Generate Private Key:**
    From the project root directory, run the following command to generate a private key for signing endorsements. This is only required once.
    ```bash
    poetry run python scripts/generate_key.py
    ```

5.  **Setup Pre-Commit Hooks:**
    From the project root directory, install the git hooks to automatically lint and format your code before committing.
    ```bash
    poetry run pre-commit install
    ```

## Development

To run the application, you will need to run the backend and frontend servers in separate terminals.

### Running the Backend

From the project root directory, run the following command to start the FastAPI server:
```bash
poetry run uvicorn backend.main:app --reload
```
The API will be available at `http://127.0.0.1:8000`.

### Running the Frontend

Navigate to the `frontend` directory and run the development server:
```bash
cd frontend
npm run dev
```
The web application will be available at `http://localhost:5173` (or another port if 5173 is in use).

## Available Scripts

### Backend (from root directory)

*   **Run tests:**
    ```bash
    poetry run pytest
    ```
*   **Check for linting errors:**
    ```bash
    poetry run flake8 backend packages
    ```
*   **Apply formatting:**
    ```bash
    poetry run black backend packages
    ```

### Frontend (from `frontend/` directory)

*   **Start development server:** `npm run dev`
*   **Create a production build:** `npm run build`
*   **Run tests:** `npm run test`
*   **Check for linting errors:** `npm run lint`
*   **Apply formatting:** `npm run format`

## Security

This project deals with sensitive information, so it's important to follow security best practices. Here are some recommendations:

*   **Environment Variables:** Use a `.env` file to store sensitive information like API keys and secrets. The `.gitignore` file is already configured to ignore `.env` files.
*   **Input Sanitization:** The backend uses `secure_filename` to sanitize filenames. The `BillParser` uses regular expressions to extract data from uploaded files. While this is relatively safe, it's always a good practice to validate and sanitize all user inputs to prevent injection attacks.
*   **Authentication and Authorization:** The current version of the application does not have any authentication or authorization. If you plan to add user accounts or other sensitive features, you should implement a robust authentication and authorization system.
*   **Dependencies:** Keep your dependencies up to date to avoid known vulnerabilities. You can use tools like `pip-audit` for Python and `npm audit` for Node.js to check for vulnerabilities in your dependencies.

## Contributing

We welcome contributions to this project. Please read our `CODE_OF_CONDUCT.md` before contributing.
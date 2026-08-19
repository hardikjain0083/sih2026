# SuRaksha MAPS - Legal Metrology Compliance Engine

SuRaksha MAPS is an AI-powered compliance engine that automatically cross-checks e-commerce product listings (text descriptions) against their physical product labels (images) to detect fraudulent claims and missing mandatory declarations as per the **Legal Metrology (Packaged Commodities) Rules, 2011**.

## 🔑 Where to Edit API Keys

Before running the project, you **must** configure your API keys and database connection string.

1. Locate the file named `backend/.env` (if running locally) or `.env` at the root directory (if running via Docker). If it doesn't exist, simply rename the provided `.env.example` file to `.env`.
2. Open the `.env` file in your editor.
3. Update the following values:

```env
# 1. MongoDB Atlas Connection String
# Replace USER, PASSWORD, and cluster details with your MongoDB Atlas credentials.
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/suraksha?retryWrites=true&w=majority

# 2. Hugging Face Access Token
# Get a free token from https://huggingface.co/settings/tokens (Ensure it has read access)
HF_TOKEN=hf_YOUR_HUGGINGFACE_TOKEN

# 3. Security Key
# A random string used for internal security.
SECRET_KEY=change-this-to-a-random-string
```

---

## 🚀 How to Run the Project

You can run this project in two ways: using **Docker (Recommended)** or **Running Locally (Manual Setup)**.

### Method 1: Using Docker (Fastest & Easiest)

**Prerequisites:** Ensure you have [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

1. Ensure your `.env` file is present in the root directory (next to `docker-compose.yml`) and contains your API keys.
2. Open a terminal in the root directory of the project.
3. Run the automated deployment script:
   ```bash
   bash deploy.sh
   ```
   *(If you are on Windows PowerShell and bash isn't working, you can simply run: `docker-compose up --build -d`)*
4. **Access the application:**
   - **Frontend Dashboard:** [http://localhost](http://localhost)
   - **Backend API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

To stop the Docker containers later, run `docker-compose down`.

---

### Method 2: Running Locally (Manual Setup)

If you wish to develop or modify the code without Docker, you will need to run the Frontend and Backend separately.

#### 1. Start the Backend (FastAPI)
Open a terminal in the project root:
```powershell
# Navigate to the backend folder
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
.\venv\Scripts\activate
# On Mac/Linux:
# source venv/bin/activate

# Install all Python dependencies
pip install -r requirements.txt

# Install Playwright browsers (required for headless web scraping)
playwright install chromium

# Download the spaCy NLP model (required for deterministic text extraction)
python -m spacy download en_core_web_sm

# Start the FastAPI server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
The Backend API will now be running at `http://localhost:8000`.

#### 2. Start the Frontend (React + Vite)
Open a **new** terminal in the project root:
```powershell
# Navigate to the frontend folder
cd frontend

# Install Node dependencies
npm install

# Start the Vite development server
npm run dev
```
The Frontend Dashboard will now be running at `http://localhost:5173` (or the port Vite assigns in your terminal).

---

## 🧪 Testing the Engine (Demo Mode)

If you haven't set up Hugging Face or MongoDB yet, or if you want to test the UI instantly during a presentation without waiting for live scraping and AI inference delays:

1. Open the Frontend dashboard in your browser.
2. Toggle the **"Enable Mock Demo Mode (Instant)"** switch ON (located beneath the scan button).
3. Click **Initiate Scan**.
4. The system will instantly bypass all external APIs and return a complete, highly-detailed mock compliance report demonstrating the exact structure, rules, and UI behavior of a real scan.

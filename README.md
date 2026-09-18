# Visionote 📝

Visionote is a modern sticky notes platform built with a **FastAPI** backend, **MongoDB Atlas** database, and a **React (Vite) + Tailwind CSS** frontend.

---

## 📌 Prerequisites

Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (version 18 or higher)
- [Python](https://www.python.org/) (version 3.10 or higher)
- MongoDB Atlas account (or MongoDB instance)

---

## 🚀 Getting Started (Step-by-Step)

Follow these steps to set up and run Visionote on your local machine:

### 1. Backend Setup

Open your terminal and run the following commands:

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create a virtual environment (if not already created)
# On Windows:
python -m venv vnote-env
.\vnote-env\Scripts\Activate.ps1

# On macOS/Linux:
python3 -m venv vnote-env
source vnote-env/bin/activate

# 3. Install required Python packages
pip install -r requirements.txt

# 4. (Optional) Set up your .env file
# A default .env is provided, or copy from template:
# cp .env.example .env

# 5. Start the FastAPI backend server
uvicorn app.main:app --reload --port 8000
```

> **Backend is running at:**
> - API Base URL: `http://localhost:8000`
> - Interactive API Docs (Swagger UI): `http://localhost:8000/docs`

---

### 2. Frontend Setup

Open a **new terminal window** and run the following commands:

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. (Optional) Set up your .env file
# A default .env is provided, or copy from template:
# cp .env.example .env

# 4. Start the Vite development server
npm run dev
```

> **Frontend is running at:**
> - Web Application: `http://localhost:5173`

---

## ⚙️ Environment Configuration

Default configuration files are already set up for localhost:

### Backend (`backend/.env`)
```env
MONGODB_URL=mongodb+srv://visionotee_db_user:<db_password>@visionote.f78fhql.mongodb.net/?retryWrites=true&w=majority
DATABASE_NAME=visionote-db
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:8000
```

---

## 📖 How to Use

1. Open `http://localhost:5173` in your browser.
2. Click **Get Started** / **Sign In** to create an account (or log in).
3. Open your **Workspace** to create, color-code, pin, edit, and organize sticky notes.

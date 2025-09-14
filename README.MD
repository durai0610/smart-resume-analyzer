# Smart Resume Analyzer 🧠

A full-stack web application that uses a large language model (LLM) to analyze and provide feedback on resumes. Users can upload a PDF, and the application extracts key information, provides a rating, suggests improvements, and recommends skills to learn.

The project is built with a **FastAPI** backend, a **React** frontend, and utilizes the **Google Gemini API** for AI analysis.

---

## 🚀 Features

* **PDF Parsing**: Extracts raw text data from uploaded PDF resumes.
* **AI-Powered Analysis**: Uses the Gemini API to intelligently extract structured data and provide a comprehensive analysis.
* **Resume Scoring**: Generates a professional rating from 1 to 10.
* **Actionable Feedback**: Provides detailed suggestions for improvement areas and relevant skills to upskill.
* **History**: Stores and displays a history of all analyzed resumes.
* **Responsive Design**: A clean, modern UI that works seamlessly on all devices.

---

## 💻 Tech Stack

**Frontend**:
* **React**: A JavaScript library for building user interfaces.
* **Axios**: For making API requests to the backend.
* **React Icons**: For professional and clean icons.
* **CSS**: For styling and responsive design with media queries.

**Backend**:
* **FastAPI**: A modern, high-performance web framework for building APIs with Python.
* **PyMuPDF (fitz)**: For efficient PDF text extraction.
* **LangChain**: To simplify interaction with the Gemini LLM.
* **PostgreSQL** & **psycopg2**: A powerful relational database for storing resume data.
* **python-dotenv**: To manage environment variables.

**AI & Deployment**:
* **Google Gemini API**: The core AI model for resume analysis.
* **Render**: For hosting the FastAPI backend.
* **Vercel**: For hosting the React frontend.

---

## ⚙️ How to Run Locally

### Prerequisites
* Python 3.8+
* Node.js & npm
* A Google Gemini API Key
* A running PostgreSQL database

### Step 1: Clone the Repository
```bash
git clone [https://github.com/](https://github.com/)[YourUsername]/smart-resume-analyzer.git
cd smart-resume-analyzer
```

### Step 2: Set Up the Backend
1. Navigate to the backend directory:
```bash
cd backend
```

2. Install the dependencies:
```bash
pip install -r requirements.txt
```

3. Create a .env file and add your Gemini API key:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL=postgresql://user:password@host:port/database_name
```

4. Run the FastAPI server:
```bash
uvicorn main:app --reload
```

The backend will run on http://localhost:8000.

### Step 3: Set Up the Frontend

1. Open a new terminal and navigate to the frontend directory:
```bash
cd ../frontend
```

2. Install the dependencies:
```bash
npm install
```

3. Create a .env.development file and point it to your backend:
```bash
REACT_APP_API_URL=http://localhost:8000
```

4. Run the React development server:
```bash
npm start
```

The frontend will open in your browser at http://localhost:3000
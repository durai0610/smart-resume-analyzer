import os
import fitz # PyMuPDF
import json
import datetime
import re
from psycopg2.extras import DictCursor
import psycopg2

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from database import get_db_cursor, create_table

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI()

origins = [
    "http://localhost:3000",
    "https://smart-resume-analyzer-2hy6k0v62-durai0610s-projects.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Gemini LLM
gemini_api_key = os.getenv("GEMINI_API_KEY")
if not gemini_api_key:
    raise ValueError("GEMINI_API_KEY not found in .env file")

llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash-latest", google_api_key=gemini_api_key)


# --- Pydantic models ---
class ResumeSummary(BaseModel):
    id: int
    filename: str
    name: str | None = None
    email: str | None = None
    phone: str | None = None


class ResumeDetail(BaseModel):
    id: int
    filename: str
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    extracted_data: dict
    llm_analysis: dict


# --- Helper functions ---
def extract_text_from_pdf(file: UploadFile) -> str:
    """Extract text from PDF."""
    try:
        doc = fitz.open(stream=file.file.read(), filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        return text
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading PDF: {str(e)}")


def clean_llm_response(response_content: str) -> str:
    """
    Extracts valid JSON from LLM output, removing extra characters and markdown fences.
    """
    if not response_content:
        return ""
    
    # Use regex to find and extract content within a JSON block.
    match = re.search(r'```json\s*(.*?)\s*```', response_content, re.DOTALL | re.IGNORECASE)
    if match:
        content = match.group(1)
    else:
        content = response_content

    # Find the first { and last } to isolate the main JSON object
    json_start = content.find('{')
    json_end = content.rfind('}')
    if json_start != -1 and json_end != -1 and json_start < json_end:
        isolated_json = content[json_start : json_end + 1]
    else:
        return "" # Return empty string if no valid JSON block found

    # Remove trailing commas before brackets/braces
    isolated_json = re.sub(r',\s*([\]}])', r'\1', isolated_json)
    
    return isolated_json


# --- API Endpoints ---
@app.on_event("startup")
def on_startup():
    """Create database tables on application startup."""
    create_table()


@app.post("/api/upload")
async def upload_resume(file: UploadFile = File(...), db_cursor: tuple = Depends(get_db_cursor)):
    # Initialize variables to prevent UnboundLocalError
    raw_content_extraction = None
    raw_content_analysis = None
    structured_data = {}
    llm_analysis = {}
    cleaned_json_string = "" # Initialize here

    cur, conn = db_cursor

    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")

    raw_text = extract_text_from_pdf(file)

    # --- LLM extraction ---
    # Use ChatPromptTemplate with SystemMessage to separate instructions from user input.
    extraction_prompt = ChatPromptTemplate.from_messages([
        SystemMessage(content="""You are an expert at extracting information from resumes. Extract the following information as strict JSON only, no extra text, and no markdown.
Your entire output must be a single, valid JSON object. Do not include any introductory text, explanations, or closing remarks.

JSON Format to extract:
{
    "name": "...",
    "email": "...",
    "phone": "...",
    "skills": ["...", "..."],
    "education": [{"degree": "...", "university": "...", "years": "...", "courses": []}],
    "work_experience": [{"title": "...", "company": "...", "years": "...", "achievements": []}]
}
"""),
        HumanMessage(content="Resume Text:\n{resume_text}")
    ])
    try:
        structured_data_response = await llm.ainvoke(extraction_prompt.format_messages(resume_text=raw_text))
        raw_content_extraction = structured_data_response.content
        cleaned_json_string = clean_llm_response(raw_content_extraction)
        structured_data = json.loads(cleaned_json_string)
    except json.JSONDecodeError as e:
        # A more specific error for bad JSON from the LLM
        return {
            "message": "Resume uploaded and processed successfully",
            "analysis": {
                "error": f"LLM extraction failed: Invalid JSON. {str(e)}",
                "raw": raw_content_extraction or "No raw output available"
            }
        }
    except Exception as e:
        # Catch other unexpected errors during LLM extraction
        return {
            "message": "Resume uploaded and processed successfully",
            "analysis": {
                "error": f"LLM extraction failed: {str(e)}",
                "raw": raw_content_extraction or "No raw output available"
            }
        }

    # --- LLM analysis ---
    analysis_prompt = ChatPromptTemplate.from_messages([
        SystemMessage(content="""You are a professional career coach. Based on the provided resume JSON, provide a new JSON with:
1. resume_rating (1-10),
2. improvement_areas (text),
3. upskill_suggestions (list of 3-5 {"skill": "...", "explanation": "..."}).

Your entire output must be a single, valid JSON object. Do not include any introductory text, explanations, or closing remarks.
"""),
        HumanMessage(content="Resume JSON:\n{structured_json}")
    ])
    try:
        analysis_response = await llm.ainvoke(analysis_prompt.format_messages(structured_json=json.dumps(structured_data)))
        raw_content_analysis = analysis_response.content
        cleaned_analysis = clean_llm_response(raw_content_analysis)
        llm_analysis = json.loads(cleaned_analysis)
    except Exception as e:
        llm_analysis = {"error": f"LLM analysis failed: {str(e)}", "raw": raw_content_analysis or "No raw output"}

    # --- Save to PostgreSQL ---
    try:
        cur.execute(
            "INSERT INTO resumes_v2 (filename, uploaded_at, name, email, phone, extracted_data, llm_analysis) VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id",
            (
                file.filename,
                datetime.datetime.now(),
                structured_data.get("name"),
                structured_data.get("email"),
                structured_data.get("phone"),
                json.dumps(structured_data),
                json.dumps(llm_analysis),
            )
        )
        conn.commit()
    except (Exception, psycopg2.Error) as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    return {
        "message": "Resume uploaded and processed successfully",
        "analysis": {
            "extracted_data": structured_data,
            "llm_analysis": llm_analysis
        }
    }


@app.get("/api/resumes", response_model=list[ResumeSummary])
async def get_resumes(db_cursor: tuple = Depends(get_db_cursor)):
    cur, conn = db_cursor
    try:
        cur.execute("SELECT id, filename, name, email, phone FROM resumes_v2 ORDER BY uploaded_at DESC")
        rows = cur.fetchall()
        return [dict(row) for row in rows]
    except (Exception, psycopg2.Error) as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/api/resumes/{resume_id}", response_model=ResumeDetail)
async def get_resume_detail(resume_id: int, db_cursor: tuple = Depends(get_db_cursor)):
    cur, conn = db_cursor
    try:
        cur.execute("SELECT * FROM resumes_v2 WHERE id = %s", (resume_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Resume not found")
        resume_dict = dict(row)
        # --- FIX: Removed json.loads() calls here ---
        resume_dict["extracted_data"] = resume_dict.get("extracted_data") or {}
        resume_dict["llm_analysis"] = resume_dict.get("llm_analysis") or {}
        return ResumeDetail(**resume_dict)
    except (Exception, psycopg2.Error) as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
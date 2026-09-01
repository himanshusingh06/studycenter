import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import engine, Base
import app.models  # Ensures all models are registered with SQLAlchemy metadata

# Auto-create tables for seamless development out of the box
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded static files (photos & documents)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include Routers
from app.modules import (
    auth, users, students, fees, payments, 
    attendance, reports, uploads, audit
)

api_prefix = settings.API_V1_STR
app.include_router(auth.router, prefix=api_prefix)
app.include_router(users.router, prefix=api_prefix)
app.include_router(students.router, prefix=api_prefix)
app.include_router(fees.router, prefix=api_prefix)
app.include_router(payments.router, prefix=api_prefix)
app.include_router(attendance.router, prefix=api_prefix)
app.include_router(reports.router, prefix=api_prefix)
app.include_router(uploads.router, prefix=api_prefix)
app.include_router(audit.router, prefix=api_prefix)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

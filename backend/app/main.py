# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .auth.routes import router as auth_router
from .learner.routes import router as learner_router

app = FastAPI(title="Nkateko API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",       # Vite default port
        "http://localhost:5174",       # your current Vite port
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "*"                            # temporary wildcard (remove in production)
    ],
    allow_credentials=True,
    allow_methods=["*"],               # allow GET, POST, OPTIONS, etc.
    allow_headers=["*"],               # allow Content-Type, Authorization, etc.
)

# Include routers
app.include_router(auth_router)
app.include_router(learner_router)

@app.get("/")
def root():
    return {"message": "Nkateko API is running"}
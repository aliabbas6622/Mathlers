from fastapi import FastAPI
from api.v1.routes import questions, matches, users

app = FastAPI(title="Mathlers Platform API", version="1.0.0")

# Versioned API routes
app.include_router(questions.router, prefix="/api/v1/questions", tags=["Questions"])
app.include_router(matches.router, prefix="/api/v1/matches", tags=["Matches"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])

@app.get("/health")
def health_check():
    return {"status": "operational", "version": "v1"}

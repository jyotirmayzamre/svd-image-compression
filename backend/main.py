from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.svd_routes import router as svd_router

app = FastAPI(title="SVD Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(svd_router, prefix="/api", tags=["SVD"])
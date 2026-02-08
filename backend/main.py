from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.svd_routes import router as svd_router
from pyinstrument import Profiler
from fastapi import Request

app = FastAPI(title="SVD Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.middleware("http")
async def pyinstrument_middleware(request: Request, call_next):
    if request.url.path != "/api/svd":
        return await call_next(request)

    profiler = Profiler(async_mode="enabled")
    profiler.start()

    response = await call_next(request)

    profiler.stop()

    html = profiler.output_html()

    with open("svd_profile.html", "w") as f:
        f.write(html)

    return response

@app.middleware("http")
async def add_cross_origin_isolation_headers(request, call_next):
    response = await call_next(request)
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
    response.headers["Cross-Origin-Embedder-Policy"] = "require-corp"
    return response


app.include_router(svd_router, prefix="/api", tags=["SVD"])
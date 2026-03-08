from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer

from routers.learning import router as learning_router
import services.recommender as recommender_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load sentence-transformers model once at startup
    # all-MiniLM-L6-v2 is ~80MB, loads in ~2-3s on first run (downloads then caches)
    print("Loading sentence-transformers model...")
    model = SentenceTransformer("all-MiniLM-L6-v2")
    recommender_service.set_model(model)
    print("Model loaded and ready.")
    yield
    # Nothing to clean up


app = FastAPI(title="LearnFlow API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://localhost:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(learning_router)


@app.get("/health")
async def health():
    return {"status": "ok"}

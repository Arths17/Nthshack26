import os
import sys

ROOT = os.path.dirname(os.path.dirname(__file__))
BACKEND_DIR = os.path.join(ROOT, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# Import the FastAPI app object from backend.server
from server import app  # backend/server.py defines `app = FastAPI(...)`

# Vercel's Python runtime will detect `app` as the ASGI application to run.

/**
 * BACKEND CORS FIX REQUIRED
 * 
 * Add this to the top of eu.py after the imports section:
 */

// ──────────────────────────────────────────────────────────────────
// PASTE THIS AFTER YOUR EXISTING IMPORTS IN eu.py:
// ──────────────────────────────────────────────────────────────────

from fastapi.middleware.cors import CORSMiddleware

// Then add this right AFTER: app = FastAPI(...)
// and BEFORE any route definitions:

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:3000",
        "*",  # Allow all for development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

// ──────────────────────────────────────────────────────────────────
// EXACT LOCATION IN eu.py FILE:
// ──────────────────────────────────────────────────────────────────

import os, json, pickle, joblib, requests, itertools, warnings
import numpy as np
import pandas as pd
from neuralforecast import NeuralForecast
from sklearn.exceptions import InconsistentVersionWarning
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
import uvicorn
# ↓ ADD THIS LINE ↓
from fastapi.middleware.cors import CORSMiddleware

warnings.filterwarnings("ignore", category=InconsistentVersionWarning)

# ... all the constants and model loading code ...

# ──────────────────────────────────────────────────────────────────
# FASTAPI APP
# ──────────────────────────────────────────────────────────────────

app = FastAPI(
    title="EU SDG Forecasting API",
    description=_SWAGGER_DESC,
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ↓ ADD THIS MIDDLEWARE BLOCK ↓
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ↓ Then all your routes start here (@app.get, @app.post, etc.) ↓

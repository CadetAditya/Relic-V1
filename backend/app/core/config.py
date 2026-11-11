"""
Backend Core Configuration for RELIC API.
Loads paths, constants, and settings for FastAPI and the ML inference engine.
"""

from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "RELIC Cybercrime ATM Prediction API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Path resolution relative to workspace root
    BASE_DIR: Path = Path(__file__).resolve().parents[3]
    DATA_DIR: Path = BASE_DIR / "data"
    RAW_DIR: Path = DATA_DIR / "raw"
    PROCESSED_DIR: Path = DATA_DIR / "processed"
    OUTPUTS_DIR: Path = DATA_DIR / "outputs"
    
    # Data & Model Files
    MODEL_PATH: Path = OUTPUTS_DIR / "random_forest_model.joblib"
    ACCOUNTS_FILE: Path = RAW_DIR / "accounts.csv"
    ATM_LOCATIONS_FILE: Path = RAW_DIR / "atm_locations.csv"
    COMPLAINTS_FILE: Path = RAW_DIR / "complaints.csv"
    TRANSACTIONS_FILE: Path = RAW_DIR / "transactions.csv"
    WITHDRAWALS_FILE: Path = RAW_DIR / "withdrawals.csv"
    METRICS_FILE: Path = OUTPUTS_DIR / "evaluation_metrics.json"
    FEATURE_IMPORTANCE_FILE: Path = OUTPUTS_DIR / "feature_importance.csv"

    # Calibration weights
    CAL_WEIGHT_RF: float = 0.45
    CAL_WEIGHT_SPATIAL: float = 0.25
    CAL_WEIGHT_USAGE: float = 0.20
    CAL_WEIGHT_LAST_ATM: float = 0.10

    # CORS settings
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "*"
    ]

    class Config:
        case_sensitive = True

settings = Settings()


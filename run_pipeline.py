"""
Backward-compatible wrapper for RELIC ML Master Pipeline Runner.
Redirects to ml/train.py
"""

import sys
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ml.train import run_full_pipeline

if __name__ == "__main__":
    run_full_pipeline()

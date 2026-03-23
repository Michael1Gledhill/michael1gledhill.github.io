from __future__ import annotations

import sys
from pathlib import Path


# In some CI environments pytest can pick a rootdir that doesn't include the
# repository root on sys.path, which breaks imports like `from backend.app...`.
# Force-add the repo root to sys.path for reliable test collection.
REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

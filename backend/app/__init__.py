"""Campus Resource Exchange Backend Application Package."""
import sys
from pathlib import Path

# Ensure the backend directory is in sys.path so 'app....' imports resolve
# whether uvicorn is launched from the project root or the /backend directory.
_backend_dir = str(Path(__file__).resolve().parent.parent)
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

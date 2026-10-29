"""
Live HTTP Verification Script for Campus Resource Exchange Backend.
Starts Uvicorn in a background thread and performs real HTTP requests to verify endpoints.
"""
import sys
import time
import threading
import urllib.request
import urllib.error
import json
from pathlib import Path

# Add backend directory to path
backend_dir = str(Path(__file__).resolve().parent.parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import uvicorn
from app.main import app

def run_server():
    config = uvicorn.Config(app, host="127.0.0.1", port=8000, log_level="warning")
    server = uvicorn.Server(config)
    server.run()

def test_endpoint(name, url, expected_status=200):
    req = urllib.request.Request(url, headers={"User-Agent": "VerificationScript/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = resp.read()
            print(f"PASS: {name} [{url}] -> Status {resp.status}, Content-Length {len(data)}")
            try:
                parsed = json.loads(data)
                print(f"      Body preview: {json.dumps(parsed, indent=None)[:120]}...")
            except Exception:
                pass
            return True, resp.status
    except urllib.error.HTTPError as e:
        print(f"HTTPError: {name} [{url}] -> Status {e.code}")
        return False, e.code
    except Exception as e:
        print(f"FAIL: {name} [{url}] -> Error: {e}")
        return False, None

def main():
    print("Starting Uvicorn server in background thread...")
    t = threading.Thread(target=run_server, daemon=True)
    t.start()
    time.sleep(2)  # Wait for server to bind

    endpoints = [
        ("Root JSON", "http://127.0.0.1:8000/"),
        ("Swagger UI (/docs)", "http://127.0.0.1:8000/docs"),
        ("OpenAPI JSON Schema", "http://127.0.0.1:8000/openapi.json"),
        ("Health Check (/api/v1/health)", "http://127.0.0.1:8000/api/v1/health"),
        ("Health Check (/health)", "http://127.0.0.1:8000/health"),
        ("Docs (/api/v1/docs redirect)", "http://127.0.0.1:8000/api/v1/docs"),
        ("OpenAPI (/api/v1/openapi.json redirect)", "http://127.0.0.1:8000/api/v1/openapi.json"),
        ("Eligibility Requirements", "http://127.0.0.1:8000/api/v1/eligibility/requirements"),
    ]

    all_ok = True
    for name, url in endpoints:
        ok, status = test_endpoint(name, url)
        if not ok:
            all_ok = False

    print("\nEndpoint Verification Summary:")
    print("ALL TESTS PASSED" if all_ok else "SOME TESTS FAILED")
    return 0 if all_ok else 1

if __name__ == "__main__":
    sys.exit(main())

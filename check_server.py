import requests
import sys

URL = "http://127.0.0.1:8000"

print(f"Checking server at {URL}...")

try:
    # Check Health
    print("1. Ping Health Endpoint...")
    resp = requests.get(f"{URL}/health", timeout=5)
    print(f"   Status: {resp.status_code}")
    print(f"   Response: {resp.text}")
    
    if resp.status_code != 200:
        print("   ERROR: Health check failed!")
        sys.exit(1)
        
    # Check Chat Header (Method Not Allowed is expected for GET, confirms route exists)
    print("\n2. Checking API Route Accessibility...")
    resp = requests.get(f"{URL}/api/chat", timeout=5)
    print(f"   Status: {resp.status_code} (405 Expected for GET)")
    
    print("\n✅ Server appears to be running and accessible.")

except requests.exceptions.ConnectionError:
    print("\n❌ CONNECTION ERROR: Could not connect to the server.")
    print("   Is 'app.py' running?")
    print("   Did you restart it after the last changes?")
except Exception as e:
    print(f"\n❌ ERROR: {e}")

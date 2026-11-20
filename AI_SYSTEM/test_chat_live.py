import urllib.request
import json
import time

print("--- 1. TEST DIRECT CALL TO AI SERVICE (PORT 8000) ---")
ai_url = "http://127.0.0.1:8000/api/v1/ask"
payload_ai = json.dumps({
    "question": "Shop có bán Windows 11 không, giá thế nào?",
    "history": []
}).encode("utf-8")

start = time.time()
try:
    req = urllib.request.Request(ai_url, data=payload_ai, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        print(f"Status: {resp.status} in {time.time() - start:.2f}s")
        print("Intent:", data.get("intent"))
        print("Product IDs:", data.get("product_ids"))
        print("Answer:\n", data.get("answer"))
except Exception as e:
    print("AI Direct Error:", e)

print("\n--- 2. TEST CALL VIA NESTJS BACKEND (PORT 611) ---")
session_url = "http://localhost:611/chat/session"
send_url = "http://localhost:611/chat/send"

try:
    req_s = urllib.request.Request(session_url, data=b"{}", headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req_s, timeout=10) as resp:
        s_data = json.loads(resp.read().decode("utf-8"))
        session_id = s_data.get("sessionId")
        print(f"Created Session ID: {session_id}")

    payload_nest = json.dumps({
        "sessionId": session_id,
        "content": "Shop có bán Windows 11 không, giá thế nào?"
    }).encode("utf-8")

    start = time.time()
    req_nest = urllib.request.Request(send_url, data=payload_nest, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req_nest, timeout=120) as resp:
        nest_data = json.loads(resp.read().decode("utf-8"))
        print(f"NestJS Status: {resp.status} in {time.time() - start:.2f}s")
        print("NestJS Response:", json.dumps(nest_data, indent=2, ensure_ascii=False))
except Exception as e:
    print("NestJS Error:", e)

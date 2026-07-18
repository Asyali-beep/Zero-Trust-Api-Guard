import time
import secrets
from fastapi import FastAPI, Header, HTTPException, Request, Depends
from pydantic import BaseModel
from starlette.middleware.sessions import SessionMiddleware
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    SessionMiddleware, secret_key="super_secret_python_key"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def rate_limit(req: Request):
    session = req.session
    if "request_history" not in session:
        session["request_history"] = []

    current_time = time.time()
    time_window = 10.0
    max_requests = 5

    history = session["request_history"]
    history = [t for t in history if (current_time - t) < time_window]

    if len(history) >= max_requests:
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again later.")

    history.append(current_time)
    session["request_history"] = history

class Payload(BaseModel):
    action: str
    order_id: int

@app.post("/api/guard/verify-session", dependencies=[Depends(rate_limit)])
def verify_session(req: Request):
    req.session["user_active"] = True
    req.session["user_id"] = 42

    if not req.session.get("user_active"):
        raise HTTPException(status_code=403, detail="Forbidden")

    return {"status": "active"}

@app.get("/api/guard/generate-nonce", dependencies=[Depends(rate_limit)])
def generate_nonce(req: Request, x_custom_auth: str = Header(default=None)):
    if x_custom_auth != 'Basic ZHVtbXk6cGFzc3dvcmQ=':
        raise HTTPException(status_code=401, detail="Unauthorized signature")

    nonce = secrets.token_hex(128)
    req.session["api_nonce"] = nonce

    return {
        "api_guard": nonce,
        "user_authentication": "Bearer dummy_user_token_123"
    }

@app.post("/api/guard/execute", dependencies=[Depends(rate_limit)])
def execute_request(req: Request, payload: Payload, x_csrf_nonce: str = Header(default=None), x_custom_auth: str = Header(default=None)):
    if x_custom_auth != 'Basic ZHVtbXk6cGFzc3dvcmQ=':
        raise HTTPException(status_code=401, detail="Unauthorized signature")

    stored_nonce = req.session.get("api_nonce")
    
    if not x_csrf_nonce or not stored_nonce or stored_nonce != x_csrf_nonce:
        raise HTTPException(status_code=403, detail="Invalid or expired nonce")

    del req.session["api_nonce"]

    if payload.action == 'approve_order':
        return {
            "status": "success",
            "message": f"Order {payload.order_id} approved securely via Python."
        }
    
    raise HTTPException(status_code=400, detail="Bad request")

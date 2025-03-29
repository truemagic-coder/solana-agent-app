import json
from typing import Any, Dict, List
from fastapi import FastAPI, Header, Request, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
import logging
from pydantic import BaseModel
from solana_agent_app.config import config as app_config
import jwt
import httpx
from solana_agent import SolanaAgent

config = {
    "business": {
        "mission": "To provide users with a one-stop shop for Solana development.",
        "values": {
            "Friendliness": "Users must be treated fairly, openly, and with friendliness.",
            "Ethical": "Agents must use a strong ethical framework in their interactions with users.",
        },
        "goals": [
            "Empower users with great answers to their queries.",
        ],
        "voice": "The voice of the brand is that of a Solana Degen."
    },
    "openai": {
        "api_key": app_config.OPENAI_API_KEY,
    },
    "mongo": {
        "connection_string": app_config.MONGO_URL,
        "database": app_config.MONGO_DB,
    },
    "zep": {
        "api_key": app_config.ZEP_API_KEY,
    },
    "tools": {
        "search_internet": {
            "api_key": app_config.PERPLEXITY_API_KEY,
        },
    },
    "agents": [
        {
            "name": "financial_expert",
            "instructions": "You are a financial expert specializing in Solana DeFi, token economics, and market analysis. Use markdown for formatting. When citations and sources are provided - always use them. Never use dividing lines in your responses.",
            "specialization": "Non-technical expert for Solana DeFi, token economics, and market analysis.",
            "tools": ["search_internet"],
        },
        {
            "name": "solana_developer",
            "instructions": "You are a Solana blockchain developer specializing in Rust programming, smart contracts, and technical implementation. Use markdown for formatting. When citations and sources are provided - always use them. Never use dividing lines in your responses.",
            "specialization": "Technical expert for Solana development, Rust programming, and code implementation.",
            "tools": ["search_internet"],
        },
    ]
}

solana_agent = SolanaAgent(config=config)

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def check_bearer_token(authorization: str = Header(...)):
    # get bearer token from header
    token = authorization.split("Bearer ")[1]

    try:
        jwt_fields = jwt.decode(token, app_config.NEXTAUTH_SECRET, algorithms=["HS256"])

        if jwt_fields["issuer"] != app_config.NEXTAUTH_URL:
            raise HTTPException(
                status_code=401,
                detail="Unauthorized",
            )
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized",
        )
    return jwt_fields

class ChatRequest(BaseModel):
    text: str


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        app_config.NEXTAUTH_URL,
    ],
    allow_credentials=True,
    allow_methods=["POST", "GET", "PUT", "DELETE"],
    allow_headers=["*"],
)

@app.post("/rpc")
async def handler_rpc_post(request: Request):
    try:
        data = await request.json()
        async with httpx.AsyncClient() as client:
            response = await client.request(
                method=request.method,
                url=app_config.RPC_URL,
                json=data,
                headers={"Content-Type": "application/json"},
            )
        return response.json()
    except Exception:
        raise HTTPException(status_code=500, detail="Error fetching data")


@app.get("/rpc")
async def handler_rpc_get(request: Request):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.request(
                method=request.method,
                url=app_config.RPC_URL, 
                headers={"Content-Type": "application/json"},
            )
        return response.json()
    except Exception:
        raise HTTPException(status_code=500, detail="Error fetching data")


@app.get("/history/{user_id}")
async def history(
    user_id: str, page_num: int = 1, page_size: int = 20, token=Depends(check_bearer_token)
):
    if token.get("sub") != user_id:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized",
        )

    try:
        # Use the new method to get paginated history
        result = await solana_agent.get_user_history(user_id, page_num, page_size)
        return result
    except Exception as e:
        logger.error(f"Error fetching history: {str(e)}", exc_info=True)
        return {
            "data": [],
            "total": 0,
            "page": page_num,
            "page_size": page_size,
            "total_pages": 0,
            "error": "Failed to retrieve history"
        }

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast_to_user(self, message: str, user_id: str):
        """Send a message to all connections for a specific user"""
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                await connection.send_text(message)

manager = ConnectionManager()

async def verify_token(websocket: WebSocket) -> Dict[str, Any]:
    """Verify JWT token from WebSocket query parameters"""
    try:
        # Get token from query parameters
        token = websocket.query_params.get("token")
        if not token:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Missing token")
            return None
            
        # Decode and validate token
        jwt_fields = jwt.decode(token, app_config.NEXTAUTH_SECRET, algorithms=["HS256"])
        
        if jwt_fields.get("issuer") != app_config.NEXTAUTH_URL:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token issuer")
            return None
            
        return jwt_fields
    except jwt.PyJWTError as e:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason=f"Invalid token: {str(e)}")
        return None
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Authentication failed")
        return None

@app.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    # Verify the token before accepting the connection
    token_data = await verify_token(websocket)
    if not token_data:
        return  # Connection already closed by verify_token
    
    # Extract user ID from token
    user_id = token_data.get("user_id") or token_data.get("sub")
    if not user_id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="User ID missing from token")
        return
        
    # Accept the connection and register it
    await manager.connect(websocket, user_id)
    
    try:
        # Process messages
        while True:
            data = await websocket.receive_text()
            
            try:
                message_data = json.loads(data)
                user_message = message_data.get("message", "")
                
                # Store the complete response to save in database
                full_response = ""
                
                # Process the message with your swarm
                async for chunk in solana_agent.process(user_id, user_message):
                    # Accumulate the full response
                    full_response += chunk
                    
                    # Send the current chunk to the client
                    await manager.send_message(
                        json.dumps({
                            "type": "chunk", 
                            "content": chunk,
                            "fullContent": full_response  # Send the accumulated content so far
                        }), 
                        websocket
                    )
                
                # Signal end of message
                await manager.send_message(
                    json.dumps({
                        "type": "end",
                        "fullContent": full_response
                    }), 
                    websocket
                )
                
            except json.JSONDecodeError:
                await manager.send_message(json.dumps({"type": "error", "message": "Invalid JSON format"}), websocket)
            except Exception as e:
                logger.error(f"Error processing message: {str(e)}", exc_info=True)
                await manager.send_message(json.dumps({"type": "error", "message": str(e)}), websocket)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

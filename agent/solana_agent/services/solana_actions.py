import json
import requests
from solana_agent.config import config
from pymongo import MongoClient, UpdateOne

class SolanaActions:
    def __init__(self):
        client = MongoClient(config.MONGO_URL)
        self._db = client[config.MONGO_DB]

    def store_tokens(self, tokens):
        operations = []
        for token in tokens:
            operation = {
                "filter": {"address": token["address"]},
                "update": {
                    "$set": {
                        "name": token["name"],
                        "symbol": token["symbol"],
                        "decimals": token["decimals"],
                        "daily_volume": token.get("daily_volume"),
                        "created_at": token.get("created_at"),
                        "full_data": json.dumps(token),
                    }
                },
                "upsert": True,
            }
            operations.append(UpdateOne(**operation))

        if operations:
            result = self._db.tokens.bulk_write(operations)
            print(
                f"Upserted {result.upserted_count} tokens, modified {result.modified_count} tokens."
            )

    def fetch_and_store_tokens(self):
        url = "https://tokens.jup.ag/tokens?tags=verified"
        response = requests.get(url)
        if response.status_code == 200:
            tokens = response.json()
            self.store_tokens(tokens)
            print(f"Fetched and stored {len(tokens)} tokens.")
        else:
            print(f"Failed to fetch tokens. Status code: {response.status_code}")

    def get_token_info(self, token_query):
        query = {
            "$or": [
                {"symbol": {"$regex": token_query, "$options": "i"}},
                {"address": token_query},
            ]
        }
        token = self._db.tokens.find_one(
            query, {"_id": 0, "address": 1, "name": 1, "symbol": 1, "decimals": 1}
        )
        return token

    def send_tokens_by_symbol(self, address: str, amount: str, token_symbol: str) -> str:
        try:
            token_info = self.get_token_info(token_symbol)
            if not token_info:
                return "Token not found."
            mint_address = token_info["address"]
            decimals = token_info["decimals"]
            url = f"{config.NEXTAUTH_URL}/api/send_tokens"    
            headers = {"Content-Type": "application/json", "Authorization": config.NEXTAUTH_SECRET}
            data = {
                "address": address,
                "amount": amount,
                "mint": mint_address,
                "decimals": decimals,
            }
            response = requests.post(url, headers=headers, json=data)
            if response.status_code == 200:
                return f"Sent {amount} tokens to {address}."
            else:
                return f"Failed to send tokens. Status code: {response.status_code}"
        except Exception as e:
            return f"Error sending tokens: {e}"
    
    def send_tokens_by_address(self, address: str, amount: str, token_address: str) -> str:
        try:
            token_info = self.get_token_info(token_address)
            if not token_info:
                return "Token not found."
            mint_address = token_info["address"]
            decimals = token_info["decimals"]
            url = f"{config.NEXTAUTH_URL}/api/send_tokens"    
            headers = {"Content-Type": "application/json", "Authorization": config.NEXTAUTH_SECRET}
            data = {
                "address": address,
                "amount": amount,
                "mint": mint_address,
                "decimals": decimals,
            }
            response = requests.post(url, headers=headers, json=data)
            if response.status_code == 200:
                return f"Sent {amount} tokens to {address}."
            else:
                return f"Failed to send tokens. Status code: {response.status_code}"
        except Exception as e:
            return f"Error sending tokens: {e}"
        
    def swap_tokens_by_symbols(self, from_symbol: str, to_symbol: str, amount: str) -> str:
        try:
            from_token_info = self.get_token_info(from_symbol)
            to_token_info = self.get_token_info(to_symbol)
            if not from_token_info or not to_token_info:
                return "Token not found."
            from_mint_address = from_token_info["address"]
            to_mint_address = to_token_info["address"]
            from_decimals = from_token_info["decimals"]
            url = f"{config.NEXTAUTH_URL}/api/swap_tokens"    
            headers = {"Content-Type": "application/json", "Authorization": config.NEXTAUTH_SECRET}
            data = {
                "input_mint": from_mint_address,
                "output_mint": to_mint_address,
                "amount": amount,
                "decimals": from_decimals,
            }
            response = requests.post(url, headers=headers, json=data)
            if response.status_code == 200:
                return f"Swapped {amount} {from_symbol} for {to_symbol}."
            else:
                return f"Failed to swap tokens. Status code: {response.status_code}"
        except Exception as e:
            return f"Error swapping tokens: {e}"
                                                   

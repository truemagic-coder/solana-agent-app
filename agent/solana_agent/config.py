import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    MONGO_URL = os.getenv("MONGO_URL")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    NEXTAUTH_SECRET = os.getenv("NEXTAUTH_SECRET")
    NEXTAUTH_URL = os.getenv("NEXTAUTH_URL")
    MONGO_DB = os.getenv("MONGO_DB")

config = Config()
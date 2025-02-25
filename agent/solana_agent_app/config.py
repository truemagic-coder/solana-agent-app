import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    MONGO_URL = os.getenv("MONGO_URL")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    NEXTAUTH_SECRET = os.getenv("NEXTAUTH_SECRET")
    NEXTAUTH_URL = os.getenv("NEXTAUTH_URL")
    MONGO_DB = os.getenv("MONGO_DB")
    ZEP_API_KEY = os.getenv("ZEP_API_KEY")
    PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")
    GROK_API_KEY = os.getenv("GROK_API_KEY")
    HELIUS_RPC_URL = os.getenv("HELIUS_RPC_URL")
    PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
    PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


config = Config()

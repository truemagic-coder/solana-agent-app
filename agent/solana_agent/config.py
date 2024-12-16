import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    MONGO_URL = os.getenv("MONGO_URL")
    REDIS_URL = os.getenv("REDIS_URL")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    NEXTAUTH_SECRET = os.getenv("NEXTAUTH_SECRET")
    NEXTAUTH_URL = os.getenv("NEXTAUTH_URL")
    MONGO_DB = os.getenv("MONGO_DB")
    TWITTER_BEARER_TOKEN = os.getenv("TWITTER_BEARER_TOKEN")
    TWITTER_CONSUMER_KEY = os.getenv("TWITTER_CONSUMER_KEY")
    TWITTER_CONSUMER_SECRET = os.getenv("TWITTER_CONSUMER_SECRET")
    TWITTER_ACCESS_TOKEN = os.getenv("TWITTER_ACCESS_TOKEN")
    TWITTER_ACCESS_SECRET = os.getenv("TWITTER_ACCESS_SECRET")


config = Config()

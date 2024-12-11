from cyberchipped import AI, MongoDatabase
from solana_agent.config import config
from typing import AsyncGenerator
from pymongo import MongoClient

client = MongoClient(config.MONGO_URL)
db = client[config.MONGO_DB]


class ChatService:
    def __init__(self):
        self._database = None
        self._ai = None
        self._instructions = """
            You are a Solana AI Agent.
        """
        self.user_id = None

    @property
    def database(self):
        if self._database is None:
            self._database = MongoDatabase(config.MONGO_URL, config.MONGO_DB)
        return self._database

    @property
    def ai(self):
        if self._ai is None:
            ai = AI(
                api_key=config.OPENAI_API_KEY,
                name="Solana Agent",
                model="gpt-4o",
                instructions=self._instructions,
                database=self.database,
            )

            # add tools here!
            # params must be strings and must return a string
            @ai.add_tool
            def hello_world() -> str:
                return "Hello, World!"

            self._ai = ai
        return self._ai

    async def generate_response(
        self, user_id: str, message: str
    ) -> AsyncGenerator[str, None]:
        self.user_id = user_id
        async with self.ai:
            async for text in self.ai.text(user_id, message):
                yield text


chat_service = ChatService()

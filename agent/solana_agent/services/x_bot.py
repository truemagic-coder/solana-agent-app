import asyncio
import traceback
from pymongo import MongoClient
from tweepy import API, Client
from tweepy.models import User
from solana_agent.services.chat_service import ChatService
from solana_agent.config import config
import datetime

chat_service = ChatService()

# Initialize MongoDB client
client = MongoClient(config.MONGO_URL)
db = client[config.MONGO_DB]


class XBot:
    def __init__(self, client: Client, api: API):
        self.client = client
        self.api = api
        self.me: User = api.verify_credentials()
        self.rate_limits = db.rate_limits
        self.tweets = db.tweets
        self.initialized = False

    async def get_rate_limits(self):
        now = datetime.datetime.now(datetime.timezone.utc)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        rate_limits = self.rate_limits.find_one({"month": month_start})
        if not rate_limits:
            rate_limits = {
                "month": month_start,
                "post_count": 0,
                "read_count": 0,
                "last_mention_id": None,
            }
            self.rate_limits.insert_one(rate_limits)
        return rate_limits

    async def update_rate_limits(
        self, post_count=0, read_count=0, last_mention_id=None
    ):
        now = datetime.datetime.now(datetime.timezone.utc)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        update = {"$inc": {}}
        if post_count:
            update["$inc"]["post_count"] = post_count
        if read_count:
            update["$inc"]["read_count"] = read_count
        if last_mention_id:
            update["$set"] = {"last_mention_id": last_mention_id}
        self.rate_limits.update_one({"month": month_start}, update, upsert=True)

    async def save_tweet(self, mention, response):
        tweet_data = {
            "mention_id": mention.id,
            "mention_text": mention.text,
            "response_id": response.data["id"],
            "response_text": response.data["text"],
            "created_at": datetime.datetime.utcnow(),
        }
        self.tweets.insert_one(tweet_data)

    async def process_tweet(self, tweet):
        try:
            if tweet.referenced_tweets and any(t.type == "replied_to" for t in tweet.referenced_tweets):
                return

            if tweet.author_id == self.me.id:
                return

            print(f"Processing tweet: ID={tweet.id}, Author ID={tweet.author_id}")
            print(f"Tweet text: {tweet.text}")

            full_response = ""
            async for text in chat_service.generate_response(str(tweet.id), tweet.text):
                full_response += text

            print("Full response:", full_response)

            if full_response == "F":
                return

            rate_limits = await self.get_rate_limits()
            if rate_limits["post_count"] >= 2900:  # Leave some buffer
                print("Monthly post limit approaching. Skipping reply.")
                return

            # Truncate the response if it's too long for a tweet
            truncated_response = full_response[:280]  # Twitter's character limit

            print(f"Attempting to reply to tweet {tweet.id}")
            print(f"Reply text: {truncated_response}")

            response = self.client.create_tweet(
                text=f"{truncated_response}",
                in_reply_to_tweet_id=tweet.id,
            )
            await self.update_rate_limits(post_count=1)
            await self.save_tweet(tweet, response)
            print(f"Successfully replied to tweet {tweet.id}")
            print(f"Response from create_tweet: {response}")
        except Exception as e:
            print(f"Error processing tweet: {str(e)}")
            print("Full traceback:")
            traceback.print_exc()


    async def check_mentions(self):
        try:
            rate_limits = await self.get_rate_limits()
            if rate_limits["read_count"] >= 9900:  # Leave some buffer
                print("Monthly read limit approaching. Skipping mention check.")
                return

            kwargs = {
                "id": self.me.id,
                "max_results": 5,
                "expansions": "author_id,referenced_tweets.id",
                "tweet_fields": "author_id,id,text",
                "user_fields": "id,username",
            }
            if rate_limits["last_mention_id"]:
                kwargs["since_id"] = rate_limits["last_mention_id"]

            response = self.client.get_users_mentions(**kwargs)
            await self.update_rate_limits(read_count=5)

            if response.data:
                for tweet in reversed(response.data):
                    if self.initialized:
                        await self.process_tweet(tweet)
                    await self.update_rate_limits(last_mention_id=tweet.id)

            if not self.initialized:
                self.initialized = True
                print("XBot initialized. Now responding to new mentions.")

        except Exception as e:
            print(f"Error checking mentions: {e}")
            traceback.print_exc()

    async def run(self, interval=300):  # Check every 5 minutes
        while True:
            await self.check_mentions()
            await asyncio.sleep(interval)

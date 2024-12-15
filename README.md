# Solana Agent

[![Solana Swarm](https://cdn.cometheart.com/solana-agent-logo.jpg)](https://solana-agent.com)

## Why Solana Agent

### Batteries Included
* Based on CyberChipped - a Python OpenAI Assistant Framework
* Provides conversational memory, parallel function calling, smart automatic tool choice, and message history using MongoDB
* Utilizes FastAPI and Next.js - the most popular and supported web frameworks 
* Quickly add custom functions to your AI agent in a few lines of code
* Solana Actions: 
    * SOL/SPL transfers via Helius
    * Swaps via Jupiter
    * Wallet creation via Lit (coming soon...)
* Social Integrations: 
    * X (coming soon...)

### Better than Eliza
* Solana Agent requires no-code changes, only adding simple environment variables, and MongoDB/Redis to work out of the box for a complete AI Agent with real-time chat
* Solana Agent's conversational history is superior to RAG for user interactivity, tool usage, and agent memory/recall/context
* Solana Agent's parallel tool calling and automatic AI tool choice is superior than using any LLM completion API with tool usage from any provider
* Solana Agent is an opinionated framework with one way to do things to keep things simple
* Solana Agent is written in Python the most popular language on GitHub and in the AI field

## Local Dev

###  Run locally on Mac or Linux
* Clone this repo - `git clone https://github.com/truemagic-coder/solana-agent`
* Ensure the latest LTS Node is installed with yarn
* Ensure Python 3.12.7 is installed with poetry
* Ensure Docker and Docker Compose are installed
* `docker-compose up -d`
* Rename `.env.sample` to `.env` in `site` and `agent`
* Get and set the PRIVATE_KEY (in base58 string format) in the `site` folder for `.env` file - if you want Solana Actions like sending tokens and swapping
* Get and set the OPENAI_API_KEY var in the `agent` folder for `.env` file - [OpenAI API Keys](https://platform.openai.com/api-keys)
* Get and set the HELIUS_API_KEY and HELIUS_RPC_URL in both folders `.env` files - [Helius](https://helius.dev)
* Set all the secrets to match between the `.env` files and make them `uuidv4`s or other strong keys
* Open two terminal windows
* `Terminal 1`: `cd site && yarn install && yarn dev`
* `Terminal 2`: `cd agent && poetry install && bash ./dev.sh`
* Open your browser to `http://localhost:3000`

## Deploy

### Deploy to Heroku or Dokku
* Provision a MongoDB and Redis database
* Get one domains with two sub-domains - one for the `site` and one for the `agent`
* Add the proper env vars on Heroku or Dokku to your apps
* Add your proper remotes in each folder locally (each folder `site` and `agent` should be their own repos - `git init`)
* For each folder (`site` and `agent`) git commit and git push to the main branch

## Advanced Topics

### Agent Functions
* Use expressive snake-case names for the functions with expressive param names (if required)
* Functions only take `str` params and must output a `str` (string)
* Functions must be fully sync - you cannot use async libraries or methods - example: using `requests` not `httpx` (sync vs async)
* Don't make tool outputs (strings) too large as when calling multiple calls in parallel has a size limit (combined)
* Keep in mind the 128k model token input limit when processing data especially from APIs
* OpenAI `gpt-4o` is recommended over `gpt-4o-mini` simply for AI IQ but if cost is a concern then mini may work for your agent usage

## Production Apps
* [WB AI Agent](https://ai.walletbubbles.com)

## Contributing
Contributions to Solana Agent are welcome! Please feel free to submit a Pull Request.

## License
This project is licensed under the MIT License - see the LICENSE file for details.

# Solana Agent Example App

[![Solana Agent](https://dl.walletbubbles.com/solana-agent-logo.png?width=200)](https://solana-agent.com)

## Why Solana Agent App

### Batteries Included
* Provides conversational memory, parallel function calling, smart automatic tool choice, and message history using MongoDB
* Utilizes FastAPI and Next.js - the most popular and supported web frameworks 
* Quickly add custom functions to your AI agent in a few lines of code
* Supports Solana/SPL transfers and Jupiter Swapping via Next.js (soon just Python...)

## Local Dev

###  Run locally on Mac or Linux
* Clone this repo - `git clone https://github.com/truemagic-coder/solana-agent-app`
* Ensure the latest LTS Node is installed with yarn
* Ensure Python 3.12.8 is installed with poetry
* Ensure Docker and Docker Compose are installed
* `docker-compose up -d`
* Rename `.env.sample` to `.env` in `site` and `agent`
* Get and set the PRIVATE_KEY (in base58 string format) in the `site` folder for `.env` file - if you want Solana Actions like sending tokens and swapping with funds from this wallet
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
* Make sure to ps:scale `worker` and `scheduler` to 1 (web should already be 1)

## Advanced Topics

### Agent Functions
* Use expressive snake-case names for the functions with expressive param names (if required)
* Functions only take `str` params and must output a `str` (string)
* Functions must be fully sync - you cannot use async libraries or methods - example: using `requests` not `httpx` (sync vs async)
* Don't make tool outputs (strings) too large as when calling multiple calls in parallel has a size limit (combined)
* Keep in mind the 128k model token input limit when processing data especially from APIs

## Production Apps
* [Solana Agent Copilot](https://ai.solana-agent.com)

## Solana Agent AI Framework
* [Solana Agent](https://github.com/truemagic-coder/solana-agent)

## Contributing
Contributions to Solana Agent Example App are welcome! Please feel free to submit a Pull Request.

## License
This project is licensed under the MIT License - see the LICENSE file for details.

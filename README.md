# Solana Agent Example App

[![Solana Agent](https://dl.walletbubbles.com/solana-agent-logo.png?width=200)](https://solana-agent.com)

## Batteries Included
* Provides a sample and working implementation for Solana Agent
* Login via your Solana wallet via Helius
* Utilizes FastAPI and Next.js - the most popular and supported web frameworks 

## Local Dev

###  Run locally on Mac or Linux
* Clone this repo - `git clone https://github.com/truemagic-coder/solana-agent-app`
* Ensure the latest LTS Node is installed with yarn
* Ensure Python 3.13.2 is installed with poetry
* Ensure Docker and Docker Compose are installed
* `docker-compose up -d`
* Rename `.env.sample` to `.env` in `site` and `agent`
* Get and set the OPENAI_API_KEY var in the `agent` folder for `.env` file - [OpenAI API Key](https://platform.openai.com/api-keys)
* Get and set the ZEP_API_KEY in the `agent` folder for `.env` file - [Zep](https://getzep.com)
* Get and set the RPC_URL in the `agent` folder for the `.env` file - [Helius](https://helius.dev)
* Set all the secrets to match between the `.env` files and make them `uuidv4`s or other strong keys - [UUID Generator](https://www.uuidgenerator.net)
* Open two terminal windows
* `Terminal 1`: `cd site && yarn install && yarn dev`
* `Terminal 2`: `cd agent && poetry install && bash ./dev.sh`
* Open your browser to `http://localhost:3000`

## Deploy

### Deploy to Heroku or Dokku
* Provision a MongoDB database
* Get one domains with two sub-domains - one for the `site` and one for the `agent`
* Add the proper env vars on Heroku or Dokku to your apps
* Add your proper remotes in each folder locally (each folder `site` and `agent` should be their own repos - `git init`)
* For each folder (`site` and `agent`) git commit and git push to the main branch

## Solana Agent AI Framework
* [Solana Agent](https://github.com/truemagic-coder/solana-agent)

## Contributing
Contributions to Solana Agent Example App are welcome! Please feel free to submit a Pull Request.

## License
This project is licensed under the MIT License - see the LICENSE file for details.

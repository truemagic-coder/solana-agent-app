poetry run uvicorn solana_agent.main:app --reload --port=8080 --timeout-graceful-shutdown 30 --workers 1

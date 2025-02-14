poetry run uvicorn solana_agent_app.main:app --reload --port=8080 --timeout-graceful-shutdown 30 --workers 1

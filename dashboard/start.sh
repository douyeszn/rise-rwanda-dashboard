#!/bin/bash
# RISE Analytics Dashboard — start backend + frontend

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Starting RISE Analytics backend on http://localhost:8000 ..."
cd "$SCRIPT_DIR/backend"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

echo "Starting frontend on http://localhost:5173 ..."
source ~/.nvm/nvm.sh
nvm use 20.20.2 --silent
cd "$SCRIPT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "Dashboard: http://localhost:5173"
echo "API docs:  http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait

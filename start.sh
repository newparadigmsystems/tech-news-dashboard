#!/usr/bin/env bash

# TechRadar - Tech News Aggregator & Substack Research Dashboard
# Launcher script for macOS / Local Dev

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=========================================================="
echo "  📡 Starting TechRadar - Research & News Aggregator"
echo "=========================================================="

# 1. Check Python Virtualenv
if [ ! -d "backend/venv" ]; then
    echo "⚠️  Python virtualenv not found. Creating backend/venv..."
    python3 -m venv backend/venv
    backend/venv/bin/pip install -r backend/requirements.txt
fi

# 2. Check Frontend Node Modules
if [ ! -d "frontend/node_modules" ]; then
    echo "⚠️  Frontend node_modules not found. Installing dependencies..."
    cd frontend && npm install && cd ..
fi

# Trap to kill both servers on exit (Ctrl+C)
cleanup() {
    echo ""
    echo "🛑 Shutting down TechRadar servers..."
    kill "$BACKEND_PID" 2>/dev/null || true
    kill "$FRONTEND_PID" 2>/dev/null || true
    wait "$BACKEND_PID" 2>/dev/null || true
    wait "$FRONTEND_PID" 2>/dev/null || true
    echo "✅ Stopped."
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 3. Start Backend (FastAPI on Port 8000)
echo "🚀 Starting FastAPI backend on http://127.0.0.1:8000..."
cd backend
./venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!
cd ..

# 4. Start Frontend (Vite on Port 5173)
echo "⚡ Starting Vite frontend on http://localhost:5173..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "=========================================================="
echo "  ✅ TechRadar is running!"
echo "  🌐 Dashboard: http://localhost:5173"
echo "  📚 API Docs:  http://127.0.0.1:8000/docs"
echo "=========================================================="
echo "  Press Ctrl+C to stop both servers."
echo ""

# Wait for both processes
wait "$BACKEND_PID" "$FRONTEND_PID"

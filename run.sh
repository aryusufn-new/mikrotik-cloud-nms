#!/usr/bin/env bash
# MikroTik Cloud NMS - One-click launch script
set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "=== Memulai MikroTik Cloud NMS ==="
echo "Lokasi: $PROJECT_DIR"

# 1. Setup Backend Virtualenv
if [ ! -d "$PROJECT_DIR/backend/venv" ]; then
    echo "Membuat virtual environment Python..."
    python3 -m venv "$PROJECT_DIR/backend/venv"
    source "$PROJECT_DIR/backend/venv/bin/activate"
    echo "Menginstall dependensi backend..."
    pip install --upgrade pip
    pip install -r "$PROJECT_DIR/backend/requirements.txt"
else
    source "$PROJECT_DIR/backend/venv/bin/activate"
fi

# 2. Check Frontend Node Modules
if [ ! -d "$PROJECT_DIR/frontend/node_modules" ]; then
    echo "Menginstall dependensi frontend..."
    cd "$PROJECT_DIR/frontend" && npm install
fi

# 3. Jalankan Backend & Frontend
echo ""
echo "🚀 Menjalankan Backend FastAPI di http://127.0.0.1:8000"
cd "$PROJECT_DIR/backend"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

echo "🚀 Menjalankan Frontend Vite di http://127.0.0.1:5173"
cd "$PROJECT_DIR/frontend"
npm run dev -- --host 0.0.0.0 --port 5173 &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM EXIT

echo ""
echo "=========================================================="
echo "✨ MikroTik Cloud NMS siap digunakan!"
echo "➡️  Frontend UI: http://localhost:5173"
echo "➡️  API Docs:    http://localhost:8000/docs"
echo "=========================================================="
echo "Tekan [Ctrl+C] untuk menghentikan server."

wait


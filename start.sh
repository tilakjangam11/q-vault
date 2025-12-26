#!/bin/bash
# Q-Vault Startup Script
# This script starts both backend and frontend servers

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🔐 Q-Vault - Quantum-Safe Encryption Platform"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if ports are already in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Port $1 is already in use. Attempting to free it...${NC}"
        lsof -ti:$1 | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Shutting down Q-Vault...${NC}"
    
    # Kill background processes
    if [ ! -z "$BACKEND_PID" ]; then
        echo "Stopping backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        echo "Stopping frontend (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    
    # Final cleanup of any lingering processes
    pkill -f "spring-boot:run" 2>/dev/null || true
    pkill -f "qvault-backend" 2>/dev/null || true
    
    echo -e "${GREEN}✅ Q-Vault stopped successfully${NC}"
    exit 0
}

# Set trap for cleanup
trap cleanup SIGINT SIGTERM

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v java &> /dev/null; then
    echo -e "${RED}❌ Java is not installed. Please install Java 17+${NC}"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites OK${NC}"
echo ""

# Check ports
check_port 8080
check_port 5173

# Start Backend
echo "🚀 Starting Backend..."
cd "$SCRIPT_DIR/qvault-backend"

if [ ! -f "firebase-service-account.json" ]; then
    echo -e "${RED}❌ Firebase service account not found!${NC}"
    echo "Please copy your Firebase service account JSON to:"
    echo "  qvault-backend/firebase-service-account.json"
    exit 1
fi

mvn spring-boot:run -q &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
for i in {1..30}; do
    if curl -s http://localhost:8080/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend started on http://localhost:8080${NC}"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Backend failed to start within 30 seconds${NC}"
        exit 1
    fi
done

echo ""

# Start Frontend
echo "🚀 Starting Frontend..."
cd "$SCRIPT_DIR/qvault-frontend"

if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --silent
fi

npm run dev &
FRONTEND_PID=$!

sleep 3
echo -e "${GREEN}✅ Frontend started on http://localhost:5173${NC}"
echo ""
echo "=============================================="
echo -e "${GREEN}🎉 Q-Vault is ready!${NC}"
echo ""
echo "   Dashboard: http://localhost:5173"
echo "   API:       http://localhost:8080"
echo "   H2 Console: http://localhost:8080/h2-console"
echo ""
echo "Press Ctrl+C to stop all servers"
echo "=============================================="
echo ""

# Wait for processes
wait

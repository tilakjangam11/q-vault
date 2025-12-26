#!/bin/bash

# Q-Vault Development Startup Script

set -e

echo "🚀 Starting Q-Vault Development Environment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Java
if ! command -v java &> /dev/null; then
    echo -e "${RED}❌ Java not found. Please install Java 17+${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Java found:${NC} $(java -version 2>&1 | head -n 1)"

# Check Node
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js found:${NC} $(node -version)"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker not found. You'll need PostgreSQL installed locally${NC}"
else
    echo -e "${GREEN}✅ Docker found${NC}"
    
    # Check if postgres container exists
    if docker ps -a | grep -q qvault-postgres; then
        echo -e "${GREEN}✅ PostgreSQL container exists${NC}"
        
        # Start if not running
        if ! docker ps | grep -q qvault-postgres; then
            echo "🔄 Starting PostgreSQL container..."
            docker start qvault-postgres
        else
            echo -e "${GREEN}✅ PostgreSQL already running${NC}"
        fi
    else
        echo "🔄 Creating PostgreSQL container..."
        docker run --name qvault-postgres \
          -e POSTGRES_DB=qvault \
          -e POSTGRES_USER=qvault_user \
          -e POSTGRES_PASSWORD=qvault_password \
          -p 5432:5432 \
          -d postgres:14-alpine
        
        echo -e "${GREEN}✅ PostgreSQL container created and started${NC}"
    fi
fi

echo ""
echo "📝 Checking configuration..."

# Check Firebase backend credentials
if [ ! -f "qvault-backend/firebase-service-account.json" ]; then
    echo -e "${YELLOW}⚠️  Firebase backend credentials not found${NC}"
    echo "   Please create qvault-backend/firebase-service-account.json"
    echo "   See FIREBASE_SETUP.md for instructions"
fi

# Check Firebase frontend config
if grep -q "YOUR_API_KEY" "qvault-frontend/src/config/firebase.js" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Firebase frontend config not updated${NC}"
    echo "   Please update qvault-frontend/src/config/firebase.js"
    echo "   See FIREBASE_SETUP.md for instructions"
fi

echo ""
echo "🔧 Starting services..."
echo ""

# Start backend in background
echo "📦 Starting backend..."
cd qvault-backend
./mvnw spring-boot:run > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

echo -e "${GREEN}✅ Backend starting (PID: $BACKEND_PID)${NC}"
echo "   Logs: tail -f backend.log"

# Wait a bit for backend to start
echo "⏳ Waiting for backend to initialize..."
sleep 5

# Start frontend in background
echo "🎨 Starting frontend..."
cd qvault-frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo -e "${GREEN}✅ Frontend starting (PID: $FRONTEND_PID)${NC}"
echo "   Logs: tail -f frontend.log"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ Q-Vault is starting!${NC}"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📍 URLs:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:8080"
echo ""
echo "📋 Process IDs:"
echo "   Backend:  $BACKEND_PID"
echo "   Frontend: $FRONTEND_PID"
echo ""
echo "📝 View logs:"
echo "   Backend:  tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "🛑 To stop services:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo "   Or run: ./stop-dev.sh"
echo ""
echo "⏳ Services are initializing... Please wait 10-15 seconds"
echo "   Then open http://localhost:5173 in your browser"
echo ""

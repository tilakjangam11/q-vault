#!/bin/bash

# Q-Vault Development Stop Script

echo "🛑 Stopping Q-Vault services..."

# Find and kill backend (Spring Boot)
BACKEND_PID=$(ps aux | grep 'spring-boot:run' | grep -v grep | awk '{print $2}')
if [ ! -z "$BACKEND_PID" ]; then
    echo "Stopping backend (PID: $BACKEND_PID)..."
    kill $BACKEND_PID
    echo "✅ Backend stopped"
else
    echo "ℹ️  Backend not running"
fi

# Find and kill frontend (Vite)
FRONTEND_PID=$(ps aux | grep 'vite' | grep -v grep | awk '{print $2}')
if [ ! -z "$FRONTEND_PID" ]; then
    echo "Stopping frontend (PID: $FRONTEND_PID)..."
    kill $FRONTEND_PID
    echo "✅ Frontend stopped"
else
    echo "ℹ️  Frontend not running"
fi

# Optionally stop Docker PostgreSQL
read -p "Stop PostgreSQL container? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker stop qvault-postgres 2>/dev/null && echo "✅ PostgreSQL stopped" || echo "ℹ️  PostgreSQL not running"
fi

echo ""
echo "✅ All services stopped"

#!/bin/bash
# Q-Vault Stop Script
# This script stops all running Q-Vault processes

echo "🛑 Stopping Q-Vault..."
echo ""

# Kill Maven/Spring Boot processes
echo "Stopping backend..."
pkill -f "spring-boot:run" 2>/dev/null || true
pkill -f "qvault-backend" 2>/dev/null || true
pkill -f "QVaultApplication" 2>/dev/null || true

# Kill Vite/Node processes for frontend
echo "Stopping frontend..."
pkill -f "vite" 2>/dev/null || true

# Free up ports
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# Remove any H2 lock files
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
find "$SCRIPT_DIR/qvault-backend/data" -name "*.lock.db" -delete 2>/dev/null || true

echo ""
echo "✅ Q-Vault stopped successfully"
echo ""
echo "To start again, run: ./start.sh"

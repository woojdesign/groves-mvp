#!/bin/bash

# Grove MVP - Development Startup Script
# Runs both frontend and backend dev servers inside Docker container

echo "🌲 Starting Grove MVP Development Environment..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're inside Docker
if [ -f /.dockerenv ]; then
    echo -e "${GREEN}✓${NC} Running inside Docker container"
else
    echo -e "${YELLOW}⚠${NC}  Not running in Docker - this script is meant for container use"
    echo "   Run: docker-compose up -d && docker exec -it grove-mvp-dev bash"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Function to check if port is in use
check_port() {
    nc -z localhost $1 2>/dev/null
    return $?
}

# Check if PostgreSQL is ready
echo -e "${BLUE}→${NC} Checking PostgreSQL..."
until pg_isready -h postgres -U postgres > /dev/null 2>&1; do
    echo "   Waiting for PostgreSQL to be ready..."
    sleep 2
done
echo -e "${GREEN}✓${NC} PostgreSQL is ready"

# Check if Redis is ready
echo -e "${BLUE}→${NC} Checking Redis..."
until redis-cli -h redis ping > /dev/null 2>&1; do
    echo "   Waiting for Redis to be ready..."
    sleep 2
done
echo -e "${GREEN}✓${NC} Redis is ready"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}→${NC} Installing frontend dependencies..."
    npm install
fi

if [ ! -d "grove-backend/node_modules" ]; then
    echo -e "${BLUE}→${NC} Installing backend dependencies..."
    cd grove-backend && npm install && cd ..
fi

# Run Prisma migrations
echo -e "${BLUE}→${NC} Running database migrations..."
cd grove-backend
npx prisma generate > /dev/null 2>&1
npx prisma migrate deploy > /dev/null 2>&1
cd ..
echo -e "${GREEN}✓${NC} Database migrations complete"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}🚀 Starting Development Servers...${NC}"
echo ""

# Create log directory
mkdir -p logs

# Start backend in background
echo -e "${BLUE}→${NC} Starting Backend (NestJS)..."
cd grove-backend
npm run start:dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
echo "   Waiting for backend to start..."
sleep 5
until check_port 4000; do
    sleep 1
done
echo -e "${GREEN}✓${NC} Backend running on http://0.0.0.0:4000"
echo "   Logs: tail -f logs/backend.log"

# Start frontend in background
echo -e "${BLUE}→${NC} Starting Frontend (Vite)..."
npm run dev > logs/frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to be ready
echo "   Waiting for frontend to start..."
sleep 3
until check_port 5173; do
    sleep 1
done
echo -e "${GREEN}✓${NC} Frontend running on http://0.0.0.0:5173"
echo "   Logs: tail -f logs/frontend.log"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✨ Grove MVP is running!${NC}"
echo ""
echo "Access from your host machine:"
echo "  • Frontend:  http://localhost:5173"
echo "  • Backend:   http://localhost:4000/api"
echo "  • Health:    http://localhost:4000/api/health"
echo "  • PostgreSQL: localhost:5433"
echo "  • Redis:      localhost:6379"
echo ""
echo "Inside container:"
echo "  • Frontend:  http://localhost:5173"
echo "  • Backend:   http://localhost:4000/api"
echo ""
echo "Logs:"
echo "  • Backend:  tail -f logs/backend.log"
echo "  • Frontend: tail -f logs/frontend.log"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Trap Ctrl+C to cleanup
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo "✓ Servers stopped"
    exit 0
}

trap cleanup INT TERM

# Keep script running and show logs
tail -f logs/frontend.log logs/backend.log

# Wait for background processes
wait

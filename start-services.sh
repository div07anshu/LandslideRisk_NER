#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Starting LandslideRisk NER Services${NC}\n"

# Check if backend is already running
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${GREEN}✓ Backend already running on port 8000${NC}"
else
    echo -e "${YELLOW}→ Starting backend on port 8000...${NC}"
    cd ai_services
    source venv/bin/activate 2>/dev/null || true
    uvicorn app.main:app --reload --port 8000 &
    BACKEND_PID=$!
    cd ..
    sleep 2
    echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"
fi

# Check if frontend is already running
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${GREEN}✓ Frontend already running on port 5173${NC}"
elif lsof -Pi :5174 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${GREEN}✓ Frontend already running on port 5174${NC}"
else
    echo -e "${YELLOW}→ Starting frontend...${NC}"
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    sleep 2
    echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"
fi

echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ All services are running!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "\n📍 Services:"
echo -e "   ${YELLOW}Backend:${NC}  http://localhost:8000"
echo -e "   ${YELLOW}Frontend:${NC} http://localhost:5173 (or 5174)"
echo -e "\n💡 To stop services, run: ${YELLOW}./stop-services.sh${NC}\n"

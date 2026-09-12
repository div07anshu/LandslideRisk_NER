#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📊 LandslideRisk NER Services Status${NC}\n"

# Check backend
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
    BACKEND_PID=$(lsof -ti:8000)
    echo -e "${GREEN}✓ Backend:${NC}  Running on port 8000 (PID: $BACKEND_PID)"
    echo -e "           http://localhost:8000"
else
    echo -e "${RED}✗ Backend:${NC}  Not running"
fi

# Check frontend
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null ; then
    FRONTEND_PID=$(lsof -ti:5173)
    echo -e "${GREEN}✓ Frontend:${NC} Running on port 5173 (PID: $FRONTEND_PID)"
    echo -e "           http://localhost:5173"
elif lsof -Pi :5174 -sTCP:LISTEN -t >/dev/null ; then
    FRONTEND_PID=$(lsof -ti:5174)
    echo -e "${GREEN}✓ Frontend:${NC} Running on port 5174 (PID: $FRONTEND_PID)"
    echo -e "           http://localhost:5174"
else
    echo -e "${RED}✗ Frontend:${NC} Not running"
fi

echo ""

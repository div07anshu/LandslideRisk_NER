#!/bin/bash

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🛑 Stopping LandslideRisk NER Services${NC}\n"

# Stop backend (port 8000)
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}→ Stopping backend on port 8000...${NC}"
    lsof -ti:8000 | xargs kill -9 2>/dev/null
    echo -e "${RED}✓ Backend stopped${NC}"
else
    echo -e "  Backend not running"
fi

# Stop frontend (port 5173)
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}→ Stopping frontend on port 5173...${NC}"
    lsof -ti:5173 | xargs kill -9 2>/dev/null
    echo -e "${RED}✓ Frontend stopped (port 5173)${NC}"
fi

# Stop frontend (port 5174)
if lsof -Pi :5174 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}→ Stopping frontend on port 5174...${NC}"
    lsof -ti:5174 | xargs kill -9 2>/dev/null
    echo -e "${RED}✓ Frontend stopped (port 5174)${NC}"
fi

echo -e "\n${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${RED}✓ All services stopped${NC}"
echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

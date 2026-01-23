#!/bin/bash
# Simple K6 Test Runner
# Usage: ./run.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 K6 Performance Test Runner${NC}"
echo "================================"

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo -e "${RED}❌ k6 is not installed or not in PATH${NC}"
    echo "Please install k6: https://k6.io/docs/getting-started/installation/"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found${NC}"
    echo "Please create a .env file with your configuration"
    exit 1
fi

# Load environment variables
set -a
source .env
set +a

# Check required variables
if [ -z "$BEARER_TOKEN" ]; then
    echo -e "${RED}❌ BEARER_TOKEN not set in .env file${NC}"
    exit 1
fi

if [ -z "$BASE_URL" ]; then
    echo -e "${RED}❌ BASE_URL not set in .env file${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Configuration loaded${NC}"
echo "📍 Target: $BASE_URL"
echo "👥 VUs: ${K6_VUS:-'stages'}"
echo "⏱  Duration: ${K6_DURATION:-$K6_STAGES}"
echo ""

# Change to scripts directory
cd scripts

# Run the test
echo -e "${YELLOW}🏃 Starting K6 test for fetch-users endpoint...${NC}"
k6 run fetch-users-test.js --env BEARER_TOKEN=$BEARER_TOKEN

echo ""
echo -e "${GREEN}✅ Test completed!${NC}"
echo "📄 Check summary.html for detailed results"
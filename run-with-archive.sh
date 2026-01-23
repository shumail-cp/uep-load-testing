#!/bin/bash
# Enhanced Test Report Management Script
# This script creates timestamped reports and maintains an index

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Generate timestamp for report folder
TIMESTAMP=$(date '+%Y-%m-%d_%H-%M-%S')
TEST_DATE=$(date '+%Y-%m-%d %H:%M:%S UTC')

# Create reports directory structure
REPORTS_DIR="./test-reports"
REPORT_FOLDER="${REPORTS_DIR}/${TIMESTAMP}"

echo -e "${BLUE}📊 Creating timestamped report folder: ${REPORT_FOLDER}${NC}"
mkdir -p "$REPORT_FOLDER"

# Load environment variables to get test configuration but preserve CLI overrides
if [ -f ".env" ]; then
  # Load .env without overwriting existing variables
  set -a
  while IFS= read -r line || [ -n "$line" ]; do
    line="$(echo "$line" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
    case "$line" in
      ""|\#*) continue ;;
    esac
    if [[ "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]]; then
      key="${line%%=*}"
      value="${line#*=}"
      if [[ "$value" =~ ^\".*\"$ ]] || [[ "$value" =~ ^\'.*\'$ ]]; then
        value="${value:1:-1}"
      fi
      if [ -z "${!key+x}" ]; then
        export "$key=$value"
      fi
    fi
  done < .env
  set +a
fi

# Handle mutually exclusive K6 options and determine test configuration
if [ -n "$K6_DURATION" ] && [ "$K6_DURATION" != "" ] && [ -z "$K6_STAGES" ]; then
    # Duration mode - clear stages
    export K6_STAGES=""
    TEST_CONFIG="VUs: ${K6_VUS:-1}, Duration: $K6_DURATION"
    TEST_TYPE="duration"
elif [ -n "$K6_STAGES" ] && [ "$K6_STAGES" != "" ]; then
    # Stages mode - clear duration
    export K6_DURATION=""
    TEST_CONFIG="Stages: $K6_STAGES"
    TEST_TYPE="stages"
else
    # Default configuration
    export K6_DURATION="${K6_DURATION:-30s}"
    export K6_STAGES=""
    TEST_CONFIG="VUs: ${K6_VUS:-1}, Duration: ${K6_DURATION:-30s}"
    TEST_TYPE="default"
fi

# Run the actual k6 test
echo -e "${YELLOW}🏃 Running K6 test...${NC}"
./run.sh

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ] || [ $EXIT_CODE -eq 99 ]; then
    # Exit code 99 means thresholds breached but test completed successfully
    echo -e "${GREEN}✅ Test completed successfully (Exit Code: $EXIT_CODE)${NC}"
    
    # Copy reports to timestamped folder
    if [ -f "scripts/summary.html" ]; then
        cp scripts/summary.html "$REPORT_FOLDER/"
        echo -e "${GREEN}📄 HTML report copied to $REPORT_FOLDER${NC}"
    fi
    
    if [ -f "scripts/summary.json" ]; then
        cp scripts/summary.json "$REPORT_FOLDER/"
        echo -e "${GREEN}📄 JSON report copied to $REPORT_FOLDER${NC}"
    fi
    
    if [ -f "scripts/summary.txt" ]; then
        cp scripts/summary.txt "$REPORT_FOLDER/"
        echo -e "${GREEN}📄 Text report copied to $REPORT_FOLDER${NC}"
    fi
    
    # Create enhanced metadata file
    cat > "$REPORT_FOLDER/test-metadata.json" << EOF
{
  "timestamp": "$TIMESTAMP",
  "testDate": "$TEST_DATE",
  "testName": "${TEST_NAME:-uep-api-performance}",
  "environment": "${TEST_ENV:-staging}",
  "baseUrl": "${BASE_URL}",
  "testType": "$TEST_TYPE",
  "configuration": "$TEST_CONFIG",
  "stages": "${K6_STAGES:-}",
  "vus": "${K6_VUS:-}",
  "duration": "${K6_DURATION:-}",
  "exitCode": $EXIT_CODE,
  "thresholds": {
    "p95ResponseTime": "${K6_THRESHOLDS_P95:-5000}ms",
    "errorRate": "${K6_THRESHOLDS_ERROR_RATE:-0.10}",
    "checkRate": "${K6_THRESHOLDS_CHECK_RATE:-0.90}"
  }
}
EOF
    
    echo -e "${GREEN}📝 Test metadata created${NC}"
    
    # Update the main index
    echo -e "${BLUE}🔄 Updating reports index...${NC}"
    ./update-reports-index.sh
    
    echo -e "${GREEN}🎉 Report archived successfully at: $REPORT_FOLDER${NC}"
    echo -e "${BLUE}🌐 View all reports at: ${REPORTS_DIR}/index.html${NC}"
    
else
    echo -e "${RED}❌ Test failed with exit code $EXIT_CODE${NC}"
    echo -e "${YELLOW}⚠️ Report not archived due to test failure${NC}"
    exit $EXIT_CODE
fi
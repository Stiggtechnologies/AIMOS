#!/bin/bash

# Admin Seed Endpoint Test Script
# Usage: ./test-admin-seed.sh [seed_name] [sql_file]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SUPABASE_URL="${SUPABASE_URL:-}"
ADMIN_KEY="${ADMIN_SEED_KEY:-}"
SEED_NAME="${1:-Test Seed $(date +%Y%m%d_%H%M%S)}"
SQL_FILE="${2:-seed_bundle.example.sql}"

echo -e "${BLUE}=================================${NC}"
echo -e "${BLUE}  Admin Seed Endpoint Test${NC}"
echo -e "${BLUE}=================================${NC}"
echo ""

# Check Supabase URL
if [ -z "$SUPABASE_URL" ]; then
  echo -e "${RED}❌ Error: SUPABASE_URL not set${NC}"
  echo "Set it with: export SUPABASE_URL=https://your-project.supabase.co"
  exit 1
fi

echo -e "${GREEN}✓${NC} Supabase URL: $SUPABASE_URL"

# Check Admin Key
if [ -z "$ADMIN_KEY" ]; then
  echo -e "${RED}❌ Error: ADMIN_SEED_KEY not set${NC}"
  echo "Set it with: export ADMIN_SEED_KEY=your-admin-key"
  exit 1
fi

echo -e "${GREEN}✓${NC} Admin key: ${ADMIN_KEY:0:10}..."

# Check SQL file
if [ ! -f "$SQL_FILE" ]; then
  echo -e "${RED}❌ Error: SQL file not found: $SQL_FILE${NC}"
  exit 1
fi

echo -e "${GREEN}✓${NC} SQL file: $SQL_FILE ($(wc -l < "$SQL_FILE") lines)"
echo ""

# Check if jq is available
if ! command -v jq &> /dev/null; then
  echo -e "${YELLOW}⚠️  Warning: jq not found (output will not be formatted)${NC}"
  USE_JQ=false
else
  USE_JQ=true
fi

echo -e "${BLUE}Seed Name:${NC} $SEED_NAME"
echo ""

# Prepare request
echo -e "${BLUE}Reading SQL content...${NC}"
SQL_CONTENT=$(cat "$SQL_FILE")
SQL_SIZE=$(echo "$SQL_CONTENT" | wc -c)
echo -e "${GREEN}✓${NC} SQL content size: $SQL_SIZE bytes"
echo ""

# Build JSON payload
if [ "$USE_JQ" = true ]; then
  PAYLOAD=$(jq -n \
    --arg name "$SEED_NAME" \
    --arg sql "$SQL_CONTENT" \
    '{seed_name: $name, sql_content: $sql}')
else
  # Manual JSON escaping (basic)
  SQL_ESCAPED=$(echo "$SQL_CONTENT" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | awk '{printf "%s\\n", $0}')
  PAYLOAD="{\"seed_name\":\"$SEED_NAME\",\"sql_content\":\"$SQL_ESCAPED\"}"
fi

# Send request
echo -e "${BLUE}Sending request to admin-seed endpoint...${NC}"
echo ""

START_TIME=$(date +%s%3N)

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  "$SUPABASE_URL/functions/v1/admin-seed" \
  -H "Content-Type: application/json" \
  -H "x-admin-key: $ADMIN_KEY" \
  -d "$PAYLOAD")

END_TIME=$(date +%s%3N)
DURATION=$((END_TIME - START_TIME))

# Split response body and status code
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo -e "${BLUE}Response (${DURATION}ms):${NC}"
echo ""

# Format response
if [ "$USE_JQ" = true ]; then
  FORMATTED=$(echo "$BODY" | jq '.')
else
  FORMATTED="$BODY"
fi

echo "$FORMATTED"
echo ""

# Parse status
if [ "$USE_JQ" = true ]; then
  STATUS=$(echo "$BODY" | jq -r '.status // "unknown"')
else
  STATUS="unknown"
fi

# Display result
if [ "$HTTP_CODE" = "200" ]; then
  if [ "$STATUS" = "applied" ]; then
    echo -e "${GREEN}=================================${NC}"
    echo -e "${GREEN}✅ Seed Applied Successfully${NC}"
    echo -e "${GREEN}=================================${NC}"
    exit 0
  elif [ "$STATUS" = "skipped" ]; then
    echo -e "${YELLOW}=================================${NC}"
    echo -e "${YELLOW}⏭️  Seed Already Applied${NC}"
    echo -e "${YELLOW}=================================${NC}"
    echo ""
    echo "This seed has already been applied."
    echo "Use a different seed_name to deploy new data."
    exit 0
  else
    echo -e "${YELLOW}=================================${NC}"
    echo -e "${YELLOW}⚠️  Unknown Status: $STATUS${NC}"
    echo -e "${YELLOW}=================================${NC}"
    exit 1
  fi
elif [ "$HTTP_CODE" = "403" ]; then
  echo -e "${RED}=================================${NC}"
  echo -e "${RED}❌ Forbidden - Invalid Admin Key${NC}"
  echo -e "${RED}=================================${NC}"
  echo ""
  echo "Check your ADMIN_SEED_KEY environment variable."
  exit 1
elif [ "$HTTP_CODE" = "400" ]; then
  echo -e "${RED}=================================${NC}"
  echo -e "${RED}❌ Bad Request${NC}"
  echo -e "${RED}=================================${NC}"
  echo ""
  echo "Check your request parameters."
  exit 1
elif [ "$HTTP_CODE" = "500" ]; then
  echo -e "${RED}=================================${NC}"
  echo -e "${RED}❌ Seed Failed - Transaction Rolled Back${NC}"
  echo -e "${RED}=================================${NC}"
  echo ""
  echo "Check the error detail in the response above."
  exit 1
else
  echo -e "${RED}=================================${NC}"
  echo -e "${RED}❌ Unexpected HTTP Code: $HTTP_CODE${NC}"
  echo -e "${RED}=================================${NC}"
  exit 1
fi

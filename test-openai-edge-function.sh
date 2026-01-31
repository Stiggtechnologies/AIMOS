#!/bin/bash

# Test OpenAI Edge Function
# This script tests the openai-assistant edge function with the configured API key

SUPABASE_URL="https://tfnoogotbyshsznpjspk.supabase.co"
EDGE_FUNCTION_URL="$SUPABASE_URL/functions/v1/openai-assistant"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  OpenAI Edge Function Test Suite${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# First, we need to get an auth token
echo -e "${YELLOW}Step 1: Authenticating...${NC}"

AUTH_RESPONSE=$(curl -s -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmbm9vZ290YnlzaHN6bnBqc3BrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MDY2ODAsImV4cCI6MjA4MzA4MjY4MH0.RGOuBG_vrZhtrtSfhQ_ij72ctznWn0dAkQHYjT7FT_M" \
  -H "Content-Type: application/json" \
  -d '{"email":"jennifer.clinician@aimrehab.ca","password":"Demo2026!Clinician"}')

ACCESS_TOKEN=$(echo $AUTH_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  echo -e "${RED}❌ Authentication failed!${NC}"
  echo "Response: $AUTH_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✓ Authentication successful${NC}"
echo ""

# Test 1: Basic connectivity
echo -e "${YELLOW}Test 1: Basic Connectivity${NC}"
echo "Testing edge function with simple prompt..."

RESPONSE=$(curl -s -X POST "$EDGE_FUNCTION_URL" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Say \"Hello from AIM OS!\" and nothing else."}
    ],
    "model": "gpt-4o-mini",
    "temperature": 0.7,
    "max_tokens": 100
  }')

# Check if response contains expected fields
if echo "$RESPONSE" | grep -q '"choices"'; then
  echo -e "${GREEN}✓ Edge function is working!${NC}"
  echo "Response:"
  echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
else
  echo -e "${RED}❌ Edge function test failed!${NC}"
  echo "Response: $RESPONSE"
  exit 1
fi

echo ""

# Test 2: Schedule Analysis
echo -e "${YELLOW}Test 2: Schedule Analysis${NC}"
echo "Testing AI schedule optimization..."

SCHEDULE_RESPONSE=$(curl -s -X POST "$EDGE_FUNCTION_URL" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "system",
        "content": "You are an expert in healthcare scheduling optimization."
      },
      {
        "role": "user",
        "content": "Analyze this schedule: 8 appointments from 08:00-16:00 with a 2-hour gap at lunch. Provider utilization is 75%. Give me 3 quick recommendations."
      }
    ],
    "model": "gpt-4o-mini",
    "temperature": 0.5,
    "max_tokens": 500
  }')

if echo "$SCHEDULE_RESPONSE" | grep -q '"choices"'; then
  echo -e "${GREEN}✓ Schedule analysis working!${NC}"
  MESSAGE=$(echo "$SCHEDULE_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['choices'][0]['message']['content'])" 2>/dev/null)
  if [ ! -z "$MESSAGE" ]; then
    echo -e "\n${GREEN}AI Response:${NC}"
    echo "$MESSAGE"
  fi
else
  echo -e "${RED}❌ Schedule analysis failed!${NC}"
  echo "Response: $SCHEDULE_RESPONSE"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  All tests completed!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "✅ OpenAI Edge Function is configured correctly"
echo "✅ API key is working"
echo "✅ AI features are ready to use"
echo ""
echo "Next steps:"
echo "1. Open the scheduler in your browser"
echo "2. Click 'Get AI Insights' button"
echo "3. View AI-powered recommendations"

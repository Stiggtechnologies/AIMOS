#!/bin/bash

# Quick script to create the user profile

SUPABASE_URL="https://optlghedswctsklcxlkn.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wdGxnaGVkc3djdHNrbGN4bGtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxOTYyNjEsImV4cCI6MjA4Mzc3MjI2MX0.E-1lkqbOgdGy6yY5-7vTvF_GswpUnU5YvJvwqECT0t0"

echo "Creating user profile..."

# Get user ID
USER_ID=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/get_user_id_by_email" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"email_input":"orville@aimrehab.ca"}' 2>&1)

echo "User ID: $USER_ID"

# Get first clinic ID
CLINIC_ID=$(curl -s "${SUPABASE_URL}/rest/v1/clinics?select=id&limit=1" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

echo "Clinic ID: $CLINIC_ID"

# Create profile (this will likely fail due to RLS, but worth trying)
curl -X POST "${SUPABASE_URL}/rest/v1/user_profiles" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{
    \"email\": \"orville@aimrehab.ca\",
    \"first_name\": \"Orville\",
    \"last_name\": \"Davis\",
    \"role\": \"executive\",
    \"primary_clinic_id\": \"${CLINIC_ID}\",
    \"phone\": \"780-215-2887\",
    \"is_active\": true
  }"

echo ""
echo "Done. Try logging in at: https://aimos-ebon.vercel.app"
echo "Email: orville@aimrehab.ca"
echo "Password: AIM2026!Executive"

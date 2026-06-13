#!/usr/bin/env bash
set -euo pipefail

# Deploy Azure TTS Edge Function to Supabase.
# Prerequisites:
#   1. supabase login   (or export SUPABASE_ACCESS_TOKEN)
#   2. export AZURE_SPEECH_KEY=...
#   3. export AZURE_SPEECH_REGION=eastus   # your Azure region

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v npx >/dev/null 2>&1; then
  echo "npx is required."
  exit 1
fi

PROJECT_REF="${SUPABASE_PROJECT_REF:-cgvzeydhhkwosphixznd}"

echo "Linking project ${PROJECT_REF}..."
npx supabase link --project-ref "$PROJECT_REF"

if [[ -z "${AZURE_SPEECH_KEY:-}" || -z "${AZURE_SPEECH_REGION:-}" ]]; then
  echo "ERROR: Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION before running this script."
  echo "  export AZURE_SPEECH_KEY=your-key"
  echo "  export AZURE_SPEECH_REGION=eastus"
  exit 1
fi

echo "Setting Edge Function secrets..."
npx supabase secrets set \
  AZURE_SPEECH_KEY="$AZURE_SPEECH_KEY" \
  AZURE_SPEECH_REGION="$AZURE_SPEECH_REGION"

echo "Deploying tts function..."
npx supabase functions deploy tts --project-ref "$PROJECT_REF"

echo "Done. Run supabase/apply_azure_tts.sql in the SQL Editor if not applied yet."

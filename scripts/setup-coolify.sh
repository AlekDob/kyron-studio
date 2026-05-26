#!/usr/bin/env bash
# Crea le 2 Application Coolify per Studio (frontend) + studio-server (backend agentico).
# Prereq: token Coolify in COOLIFY_TOKEN, DNS gia' configurati, repo pushati.
#
# Uso:
#   export COOLIFY_TOKEN=...
#   bash scripts/setup-coolify.sh
#
# Brain: decision-012 + decision-013 + feature-031-studio-admin-hub.

set -euo pipefail

: "${COOLIFY_TOKEN:?Set COOLIFY_TOKEN before running}"

BASE="http://178.105.157.128:8000/api/v1"
H="Authorization: Bearer $COOLIFY_TOKEN"

# UUID discoverati 2026-05-26 (vedi diary)
PROJECT_KYRON_WEB="s14mp1co1rduj3mw9rmk6w7n"
ENV_PRODUCTION="tjh2hv26nk9vx0w8wgreijez"
DEST_COOLIFY="z9979g3fe26g9mgo9np791mh"
GITHUB_APP="k5sl66xbvy758o80js0per6h"   # coolify-kyron

echo "==> Create Application: studio (Next.js frontend)"
curl -fsS -X POST "$BASE/applications/private-github-app" \
  -H "$H" -H "Content-Type: application/json" \
  -d "$(cat <<JSON
{
  "project_uuid": "$PROJECT_KYRON_WEB",
  "environment_uuid": "$ENV_PRODUCTION",
  "destination_uuid": "$DEST_COOLIFY",
  "github_app_uuid": "$GITHUB_APP",
  "name": "studio",
  "description": "Studio admin hub - Next.js 16 a studio.kyronedu.it (feature 031)",
  "git_repository": "AlekDob/kyron",
  "git_branch": "main",
  "git_commit_sha": "HEAD",
  "base_directory": "/studio",
  "build_pack": "dockerfile",
  "dockerfile_location": "/Dockerfile",
  "ports_exposes": "3010",
  "domains": "https://studio.kyronedu.it",
  "instant_deploy": false
}
JSON
)"
echo

echo "==> Create Application: studio-server (Hono + AI SDK)"
echo "    NOTA: questo richiede che il repo studio-server sia stato pushato su"
echo "    AlekDob/studio-server. Se non e' ancora pushato, salta questo passo."
curl -fsS -X POST "$BASE/applications/private-github-app" \
  -H "$H" -H "Content-Type: application/json" \
  -d "$(cat <<JSON
{
  "project_uuid": "$PROJECT_KYRON_WEB",
  "environment_uuid": "$ENV_PRODUCTION",
  "destination_uuid": "$DEST_COOLIFY",
  "github_app_uuid": "$GITHUB_APP",
  "name": "studio-server",
  "description": "Studio Futuro horizontal agentic backend (decision-013)",
  "git_repository": "AlekDob/studio-server",
  "git_branch": "main",
  "git_commit_sha": "HEAD",
  "base_directory": "/",
  "build_pack": "dockerfile",
  "dockerfile_location": "/Dockerfile",
  "ports_exposes": "8790",
  "domains": "https://studio-server.kyronedu.it",
  "instant_deploy": false
}
JSON
)"
echo
echo "==> Applications created. Ricorda di settare le env vars via Coolify UI o /api/v1/applications/<uuid>/envs prima del deploy."

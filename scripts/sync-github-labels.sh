#!/usr/bin/env bash
# Create or update GitHub labels used by /triage and /wayfinder.
# Source of names: .github/labels.yml
set -euo pipefail

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI is required" >&2
  exit 1
fi

upsert() {
  local name="$1" color="$2" desc="$3"
  if gh label list --limit 100 --json name --jq '.[].name' | grep -Fxq "$name"; then
    printf 'update %s\n' "$name"
    gh label edit "$name" --color "$color" --description "$desc"
  else
    printf 'create %s\n' "$name"
    gh label create "$name" --color "$color" --description "$desc"
  fi
}

upsert "bug" "d73a4a" "Something isn't working"
upsert "enhancement" "a2eeef" "New feature or request"
upsert "needs-triage" "FBCA04" "Maintainer needs to evaluate this issue"
upsert "needs-info" "D876E3" "Waiting on reporter for more information"
upsert "ready-for-agent" "0E8A16" "Fully specified, ready for an AFK agent"
upsert "ready-for-human" "1D76DB" "Requires human implementation"
upsert "wontfix" "ffffff" "This will not be worked on"
upsert "wayfinder:map" "5319E7" "Wayfinder map issue"
upsert "wayfinder:research" "C5DEF5" "Wayfinder research ticket"
upsert "wayfinder:prototype" "C5DEF5" "Wayfinder prototype ticket"
upsert "wayfinder:grilling" "C5DEF5" "Wayfinder grilling ticket"
upsert "wayfinder:task" "C5DEF5" "Wayfinder task ticket"

echo "done"

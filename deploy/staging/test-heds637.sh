#!/usr/bin/env bash
set -euo pipefail

root=$(cd "$(dirname "$0")/../.." && pwd)

cd "$root"
npx vitest --run \
  tests/unit/siAccessControl.spec.js \
  tests/unit/siAcademicYearContext.spec.js \
  tests/unit/siDashboardAggregation.spec.js \
  tests/unit/siPlanningDataQuality.spec.js \
  tests/unit/siPlanningQualityScope.spec.js \
  tests/unit/siPostulationCatalog.spec.js \
  tests/unit/siPostulationSecurity.spec.js \
  tests/unit/siTeacherIdentity.spec.js \
  tests/unit/siWorkloadIdentity.spec.js

ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps \
  'sudo -n docker exec -i pfpheds-staging-db-1 psql -X -v ON_ERROR_STOP=1 -U postgres -d staging' \
  < "$root/supabase/tests/si_postulation_votes_isolation.sql"

node "$root/deploy/staging/verify-heds637-si-smoke.mjs"

#!/usr/bin/env bash
set -euo pipefail

root=$(git rev-parse --show-toplevel)
release_dir=$(mktemp -d "${TMPDIR:-/tmp}/pfpheds-si-release.XXXXXX")

case "$release_dir" in
  */pfpheds-si-release.*) ;;
  *)
    printf 'Unexpected temporary directory: %s\n' "$release_dir" >&2
    exit 2
    ;;
esac

cleanup() {
  test -d "$release_dir" || return 0
  find "$release_dir" -depth -delete
}
trap cleanup EXIT

git checkout-index --all --prefix="$release_dir/"
ln -s "$root/node_modules" "$release_dir/node_modules"
if [ -d "$root/backend/node_modules" ]; then
  ln -s "$root/backend/node_modules" "$release_dir/backend/node_modules"
fi

(
  cd "$release_dir"
  npx vitest --run tests/unit/siPlanningRemediation.spec.js
  npx eslint \
    src/composables/useActiveAcademicYearContext.js \
    src/config/siAccess.js \
    src/domain/si/planningRemediation.js \
    src/service/siPlanningQueryService.js \
    src/service/siPlanningRemediationService.js \
    src/views/admin/soins-infirmiers/PlanningRemediationView.vue \
    src/router/routes/admin.js \
    src/config/adminMenu.js \
    deploy/staging/verify-si-planning-course-remediation.mjs \
    deploy/staging/verify-si-planning-remediation-authorization.mjs
  npm run build
)

(
  cd "$release_dir/backend"
  node --test test/siPlanningRemediation.test.js
)

printf 'STAGED_RELEASE=valid\nPRODUCTION_TOUCHED=false\n'

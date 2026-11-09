#!/bin/bash
# Applique les migrations Supabase de la PR #237 (rapatriement du travail Codex).
#
# Par défaut : simulation en lecture seule (contrôles + plan), aucune écriture.
#   scripts/supabase/apply-release-237-migrations.sh                 # simulation prod
#   scripts/supabase/apply-release-237-migrations.sh --target test   # simulation TEST
#   scripts/supabase/apply-release-237-migrations.sh --apply         # application prod
#
# Garde-fous : identité de la base, empreintes des migrations revues, espace disque,
# état cohérent de chaque migration, confirmation tapée, sauvegarde pg_dump vérifiée,
# une transaction par migration avec arrêt à la première erreur.
set -euo pipefail

target=prod
mode=dry-run
while [ $# -gt 0 ]; do
  case "$1" in
    --apply) mode=apply ;;
    --target) target=${2:?}; shift ;;
    *) printf 'Option inconnue : %s\n' "$1" >&2; exit 2 ;;
  esac
  shift
done

case "$target" in
  prod) container=supabase-db-1; database=postgres; data_path=/opt/supabase/data; confirm_word=APPLIQUER-PROD ;;
  test) container=pfpheds-staging-db-1; database=staging; data_path=/; confirm_word=APPLIQUER-TEST ;;
  *) printf 'Cible inconnue : %s (prod ou test)\n' "$target" >&2; exit 2 ;;
esac

host=${PFPHEDS_VPS_HOST:-heds-vps}
backup_dir=${BACKUP_DIR:-/srv/heds-data/backups/pfpheds-db}
min_free_gib=4
# Seuil abaissable uniquement pour une simulation (test du script lui-même).
if [ -n "${MIN_FREE_GIB:-}" ]; then
  [ "$mode" = dry-run ] || { printf 'MIN_FREE_GIB est réservé à la simulation.\n' >&2; exit 2; }
  min_free_gib=$MIN_FREE_GIB
fi
root=$(cd "$(dirname "$0")/../.." && pwd)
markers="$root/scripts/supabase/release-237-migration-markers.sql"
stamp=$(date +%Y%m%d-%H%M%S)

# Ordre d'application : ordre chronologique des fichiers.
migrations=(
  20260921101848_deterministic_gamification_totals.sql
  20260921103000_prevent_retroactive_gamification_rewards.sql
  20260921104004_historical_gamification_badge_import.sql
  20260921105000_extend_historical_badge_import_report.sql
  20260921105500_enforce_historical_badge_provenance.sql
  20260921110054_gamification_pilot_runs.sql
  20260921124044_complete_gamification_action_engine.sql
  20260921131444_administer_gamification_lifecycle.sql
  20260921145302_align_challenges_badges_action_catalog.sql
  20260922094338_gamification_data_quality_controls.sql
  20260922150638_gamification_admin_console.sql
  20260922174340_audit_rejected_gamification_events.sql
  20260923121500_gamification_rollout_controls.sql
  20260923123500_require_active_gamification_rollout_profile.sql
  20260923124000_add_profile_language_and_canton_of_origin.sql
  20260928073218_prevent_assigned_students_from_voting.sql
  20260928114500_return_new_badges_in_action_response.sql
  20260929094941_secure_si_postulation_votes.sql
  20260929180605_secure_si_rm_assignment.sql
  20260930060553_secure_si_planning_remediation.sql
  20260930065312_align_si_course_remediation_evidence.sql
  20260930121711_alpinphysio_admin_hub.sql
  20260930141639_fix_user_track_roles_rls_recursion.sql
  20261103085335_fix_user_track_roles_recursive_policies.sql
  20261109090000_gamification_season_reset.sql
  20261109100000_balanced_house_assignment.sql
)

remote() { ssh -o BatchMode=yes -o StrictHostKeyChecking=yes "$host" "$@"; }
psql_remote() {
  remote "sudo -n docker exec -i $container psql -X -v ON_ERROR_STOP=1 -U postgres -d $database $*"
}
fail() { printf 'ARRÊT : %s\n' "$1" >&2; exit 1; }
step() { printf '\n== %s\n' "$1"; }

step "Fichiers locaux"
test -f "$markers" || fail "fichier de contrôle absent : $markers"
for file in "${migrations[@]}"; do
  test -f "$root/supabase/migrations/$file" || fail "migration absente : $file"
done
if ! git -C "$root" diff --quiet HEAD -- supabase/migrations scripts/supabase; then
  fail "modifications non commitées dans supabase/migrations ou scripts/supabase"
fi
# Les migrations destructives doivent correspondre exactement à la version revue.
python3 -I - "$root" <<'PY' || fail "empreinte d'une migration destructive différente de la version autorisée"
import hashlib, json, sys, pathlib
root = pathlib.Path(sys.argv[1])
allow = json.loads((root / 'supabase/schema-guard-allowlist.json').read_text())
bad = [e['path'] for e in allow['files']
       if (root / e['path']).exists()
       and hashlib.sha256((root / e['path']).read_bytes()).hexdigest() != e['sha256']]
for path in bad: print(f'  empreinte invalide : {path}', file=sys.stderr)
sys.exit(1 if bad else 0)
PY
printf 'OK : %s migrations, empreintes conformes à la liste blanche.\n' "${#migrations[@]}"

step "Identité de la base ($target)"
identity=$(psql_remote "-At -c 'select current_database()'")
[ "$identity" = "$database" ] || fail "base inattendue : '$identity' (attendu : $database)"
if [ "$target" = prod ] && [ "$identity" = staging ]; then fail "la cible prod pointe vers staging"; fi
db_bytes=$(psql_remote "-At -c 'select pg_database_size(current_database())'")
printf 'OK : %s dans %s sur %s (%s Mo).\n' "$identity" "$container" "$host" "$((db_bytes / 1048576))"

step "Espace disque"
data_free=$(remote "df -B1 --output=avail $data_path | tail -1" | tr -d ' ')
backup_free=$(remote "p=$backup_dir; while [ ! -e \"\$p\" ]; do p=\$(dirname \"\$p\"); done; df -B1 --output=avail \"\$p\" | tail -1" | tr -d ' ')
printf 'Libre pour PostgreSQL (%s) : %s Gio\n' "$data_path" "$((data_free / 1073741824))"
printf 'Libre pour la sauvegarde (%s) : %s Gio\n' "$backup_dir" "$((backup_free / 1073741824))"
[ "$data_free" -ge $((min_free_gib * 1073741824)) ] \
  || fail "moins de $min_free_gib Gio libres pour PostgreSQL : libérer de la place avant toute migration"
[ "$backup_free" -ge $((db_bytes * 2)) ] || fail "pas assez de place pour la sauvegarde dans $backup_dir"

step "État des migrations"
to_apply=()
while read -r file ratio; do
  present=${ratio%/*}; expected=${ratio#*/}
  if [ "$present" = "$expected" ]; then
    printf '  présente   %s\n' "$file"
  elif [ "$present" = 0 ]; then
    printf '  à appliquer %s\n' "$file"
    to_apply+=("$file")
  else
    fail "état partiel ($ratio) pour $file : intervention manuelle requise"
  fi
done < <(psql_remote "-At -F ' '" < "$markers" | grep -vE '^(BEGIN|COMMIT)$')

if [ ${#to_apply[@]} -eq 0 ]; then
  printf '\nRien à appliquer : la base %s est déjà à jour.\n' "$target"
  exit 0
fi
# Une migration absente ne doit pas précéder une migration déjà présente.
# Exceptions : correctifs indépendants déjà appliqués en avance sur prod (colonnes de profil,
# récursion RLS de user_track_roles). Ils ne dépendent d'aucune autre migration de la release,
# et AlpinPhysio ne réécrit pas les règles qu'ils corrigent.
independent=(
  20260923124000_add_profile_language_and_canton_of_origin.sql
  20260930141639_fix_user_track_roles_rls_recursion.sql
  20261103085335_fix_user_track_roles_recursive_policies.sql
)
last_present=""
for file in "${migrations[@]}"; do
  [[ " ${independent[*]} " == *" $file "* ]] && continue
  if [[ ! " ${to_apply[*]} " == *" $file "* ]]; then last_present=$file; fi
done
if [ -n "$last_present" ] && [[ "${to_apply[0]}" < "$last_present" ]]; then
  fail "ordre incohérent : ${to_apply[0]} est absente alors que $last_present est présente"
fi

if [ "$mode" = dry-run ]; then
  printf '\nSimulation : %s migration(s) seraient appliquées. Relancer avec --apply.\n' "${#to_apply[@]}"
  exit 0
fi

step "Confirmation"
[ -t 0 ] || fail "confirmation interactive requise (lancer depuis un terminal)"
read -r -p "Tapez $confirm_word pour appliquer ${#to_apply[@]} migration(s) sur $target : " answer
[ "$answer" = "$confirm_word" ] || fail "confirmation refusée"

step "Sauvegarde"
backup="$backup_dir/before-release-237-$target-$stamp.dump"
remote "sudo -n bash -s -- '$container' '$database' '$backup_dir' '$backup'" <<'REMOTE'
set -euo pipefail
container=$1; database=$2; dir=$3; backup=$4
install -d -m 700 "$dir"
test ! -e "$backup"
docker exec "$container" pg_dump -U postgres -d "$database" -Fc > "$backup"
test -s "$backup"
docker exec -i "$container" pg_restore --list < "$backup" > /dev/null
chmod 600 "$backup"
sha256sum "$backup" > "$backup.sha256"
REMOTE
printf 'OK : %s\n' "$backup"

step "Application"
for file in "${to_apply[@]}"; do
  printf '  %s ... ' "$file"
  if psql_remote "-q -1" < "$root/supabase/migrations/$file" > /dev/null; then
    printf 'ok\n'
  else
    printf 'ÉCHEC\n'
    printf 'La transaction de %s est annulée ; les migrations précédentes restent appliquées.\n' "$file" >&2
    printf 'Sauvegarde avant intervention : %s\n' "$backup" >&2
    exit 1
  fi
done
psql_remote "-q -c \"notify pgrst, 'reload schema';\"" > /dev/null

step "Vérification"
incomplete=$(psql_remote "-At -F ' '" < "$markers" | grep -vE '^(BEGIN|COMMIT)$' \
  | awk '{ split($2, a, "/"); if (a[1] != a[2]) print }')
[ -z "$incomplete" ] || fail "migrations incomplètes après application : $incomplete"

printf '\nENVIRONMENT=%s\nAPPLIED=%s\nDB_BACKUP=%s\n' "$target" "${#to_apply[@]}" "$backup"

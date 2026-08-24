param(
    [Parameter(Mandatory = $true)]
    [string]$SSHHost,
    [Parameter(Mandatory = $true)]
    [string]$SSHKey,
    [string]$Image = "supabase/postgres:15.6.1.101"
)

$ErrorActionPreference = "Stop"
$containerName = "heds-schema-restore-$PID-$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())"
$databasePassword = "ephemeral_schema_test_only"
$root = (Resolve-Path (Join-Path $PSScriptRoot "../..")).Path
$baselineDirectory = Join-Path $root "supabase/baseline"
$stack = Get-Content (Join-Path $baselineDirectory "stack.json") -Raw | ConvertFrom-Json

ssh -i $SSHKey -o BatchMode=yes $SSHHost "docker run -d --rm --name $containerName -e POSTGRES_PASSWORD=$databasePassword -e POSTGRES_DB=baseline $Image"
if ($LASTEXITCODE -ne 0) { throw "Création du conteneur PostgreSQL éphémère échouée." }

try {
    # L'image Supabase redémarre PostgreSQL une fois pendant son initialisation.
    Start-Sleep -Seconds 25

    $disableInternalEventTriggers = @'
do $$
declare current_event_name text;
begin
  for current_event_name in select evtname from pg_event_trigger loop
    execute format('alter event trigger %I disable', current_event_name);
  end loop;
end
$$;
'@
    $disableInternalEventTriggers | ssh -i $SSHKey -o BatchMode=yes $SSHHost "docker exec -e PGPASSWORD=$databasePassword -i $containerName psql -q -v ON_ERROR_STOP=1 -U supabase_admin -d baseline"
    if ($LASTEXITCODE -ne 0) { throw "Préparation de la stack éphémère échouée." }

    Get-Content (Join-Path $baselineDirectory "internal-dependencies.sql") -Raw |
        ssh -i $SSHKey -o BatchMode=yes $SSHHost "docker exec -e PGPASSWORD=$databasePassword -i $containerName psql -q -v ON_ERROR_STOP=1 -U supabase_admin -d baseline"
    if ($LASTEXITCODE -ne 0) { throw "Restauration des dépendances internes échouée." }

    Get-Content (Join-Path $baselineDirectory "public-schema.sql") -Raw |
        ssh -i $SSHKey -o BatchMode=yes $SSHHost "docker exec -e PGPASSWORD=$databasePassword -i $containerName psql -q -v ON_ERROR_STOP=1 -U supabase_admin -d baseline"
    if ($LASTEXITCODE -ne 0) { throw "Restauration de la baseline publique échouée." }

    $verificationSql = @'
select json_build_object(
  'relations', (select count(1) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in ('r','p','v','m','S','f')),
  'policies', (select count(1) from pg_policies where schemaname='public'),
  'triggers', (select count(1) from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and not t.tgisinternal)
);
'@
    $resultText = ($verificationSql | ssh -i $SSHKey -o BatchMode=yes $SSHHost "docker exec -e PGPASSWORD=$databasePassword -i $containerName psql -U supabase_admin -d baseline -At") -join ""
    if ($LASTEXITCODE -ne 0) { throw "Vérification de la restauration échouée." }
    $result = $resultText | ConvertFrom-Json

    foreach ($property in @('relations', 'policies', 'triggers')) {
        if ([int]$result.$property -ne [int]$stack.objectCounts.$property) {
            throw "Restauration incohérente pour $property : $($result.$property) au lieu de $($stack.objectCounts.$property)."
        }
    }

    Write-Host "Restauration éphémère validée: $resultText"
}
finally {
    ssh -i $SSHKey -o BatchMode=yes $SSHHost "docker stop $containerName >/dev/null 2>&1 || true" | Out-Null
}

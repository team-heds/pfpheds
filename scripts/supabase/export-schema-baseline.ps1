param(
    [Parameter(Mandatory = $true)]
    [string]$SSHHost,
    [Parameter(Mandatory = $true)]
    [string]$SSHKey,
    [string]$OutputDirectory = "supabase/baseline"
)

$ErrorActionPreference = "Stop"

function Invoke-Remote([string]$Command) {
    $result = ssh -i $SSHKey -o BatchMode=yes $SSHHost $Command
    if ($LASTEXITCODE -ne 0) { throw "Commande distante en lecture seule échouée." }
    return @($result)
}

function Write-Utf8NoBom([string]$Path, [string]$Content) {
    [System.IO.File]::WriteAllText($Path, $Content, [System.Text.UTF8Encoding]::new($false))
}

$container = @(Invoke-Remote "docker ps --filter name=supabase-db --format '{{.Names}}'")[0]
if ([string]::IsNullOrWhiteSpace($container)) { throw "Conteneur PostgreSQL Supabase introuvable." }

New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$dumpPath = Join-Path $OutputDirectory "public-schema.sql"
$catalogPath = Join-Path $OutputDirectory "catalog.json"
$stackPath = Join-Path $OutputDirectory "stack.json"
$internalDependenciesPath = Join-Path $OutputDirectory "internal-dependencies.sql"

$dump = Invoke-Remote "docker exec $container pg_dump -U postgres -d postgres --schema-only --schema=public --no-owner --no-comments"
$dumpText = (($dump -join "`n").TrimEnd() + "`n")
# Une base PostgreSQL/Supabase neuve possède déjà le schéma public. Conserver le
# CREATE SCHEMA produit par pg_dump empêcherait un replay propre sur cette base.
$dumpText = $dumpText -replace '(?m)^CREATE SCHEMA public;\r?\n', ''
Write-Utf8NoBom $dumpPath $dumpText

$extensionRows = @'
select e.extname||'|'||n.nspname||'|'||coalesce(v.relocatable,false)::text
from pg_extension e
join pg_namespace n on n.oid=e.extnamespace
left join pg_available_extension_versions v on v.name=e.extname and v.version=e.extversion
where n.nspname='public'
order by e.extname;
'@ | ssh -i $SSHKey -o BatchMode=yes $SSHHost "docker exec -i $container psql -U postgres -d postgres -At"
if ($LASTEXITCODE -ne 0) { throw "Export des extensions publiques échoué." }

$extensionBootstrap = foreach ($row in @($extensionRows)) {
    $parts = $row -split '\|', 3
    $extensionName = $parts[0].Replace("'", "''")
    $quotedExtensionName = '"' + $extensionName + '"'
    $relocatable = $parts[2] -eq 'true'
    $relocationClause = if ($relocatable) {
        "execute 'alter extension $quotedExtensionName set schema public';"
    } else {
        "raise exception 'Extension $extensionName déjà installée hors de public et non déplaçable';"
    }
@"
do `$baseline`$
begin
  if not exists (select 1 from pg_extension where extname = '$extensionName') then
    execute 'create extension $quotedExtensionName with schema public';
  elsif not exists (
    select 1 from pg_extension e join pg_namespace n on n.oid=e.extnamespace
    where e.extname='$extensionName' and n.nspname='public'
  ) then
    $relocationClause
  end if;
end
`$baseline`$;
"@
}

$internalDependencySql = @'
select pg_get_functiondef(signature::regprocedure) || E';\n'
from unnest(array[
  'auth.jwt()',
  'auth.role()',
  'auth.uid()',
  'auth.uuid_eq_text(uuid,text)'
]) as signature;
'@ | ssh -i $SSHKey -o BatchMode=yes $SSHHost "docker exec -i $container psql -U postgres -d postgres -At"
if ($LASTEXITCODE -ne 0) { throw "Export des dépendances internes échoué." }

$storageDependencySql = @'
select format(
  'alter table storage.buckets add column if not exists %I %s%s%s;',
  a.attname,
  pg_catalog.format_type(a.atttypid,a.atttypmod),
  case when d.adbin is null then '' else ' default '||pg_get_expr(d.adbin,d.adrelid) end,
  case when a.attnotnull then ' not null' else '' end
)
from pg_attribute a
left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum
where a.attrelid='storage.buckets'::regclass and a.attnum>0 and not a.attisdropped
order by a.attnum;
'@ | ssh -i $SSHKey -o BatchMode=yes $SSHHost "docker exec -i $container psql -U postgres -d postgres -At"
if ($LASTEXITCODE -ne 0) { throw "Export des dépendances Storage échoué." }
$internalDependenciesText = @"
-- Dépendance applicative située dans le schéma Supabase interne auth.
-- À appliquer uniquement sur une stack éphémère/neuve avant public-schema.sql.
$($extensionBootstrap -join "`n")
$($storageDependencySql -join "`n")
$($internalDependencySql -join "`n")
"@
Write-Utf8NoBom $internalDependenciesPath ($internalDependenciesText.TrimEnd() + "`n")

$catalogSql = @'
select jsonb_pretty(jsonb_build_object(
  'relations', coalesce((select jsonb_agg(jsonb_build_object(
    'name', c.relname,
    'kind', case c.relkind when 'r' then 'table' when 'p' then 'partitioned_table' when 'v' then 'view' when 'm' then 'materialized_view' when 'S' then 'sequence' when 'f' then 'foreign_table' else c.relkind::text end,
    'rlsEnabled', c.relrowsecurity,
    'forceRls', c.relforcerowsecurity
  ) order by c.relname) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in ('r','p','v','m','S','f')), '[]'::jsonb),
  'functions', coalesce((select jsonb_agg(jsonb_build_object(
    'name', p.proname,
    'arguments', pg_get_function_identity_arguments(p.oid),
    'securityDefiner', p.prosecdef,
    'extensionOwned', exists(select 1 from pg_depend d where d.classid='pg_proc'::regclass and d.objid=p.oid and d.deptype='e')
  ) order by p.proname, pg_get_function_identity_arguments(p.oid)) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'), '[]'::jsonb),
  'policies', coalesce((select jsonb_agg(to_jsonb(p) order by p.tablename,p.policyname) from pg_policies p where p.schemaname='public'), '[]'::jsonb),
  'triggers', coalesce((select jsonb_agg(jsonb_build_object('table', c.relname, 'name', t.tgname, 'definition', pg_get_triggerdef(t.oid, true)) order by c.relname,t.tgname) from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and not t.tgisinternal), '[]'::jsonb),
  'tableGrants', coalesce((select jsonb_agg(to_jsonb(g) order by g.table_name,g.grantee,g.privilege_type) from information_schema.role_table_grants g where g.table_schema='public'), '[]'::jsonb),
  'routineGrants', coalesce((select jsonb_agg(to_jsonb(g) order by g.routine_name,g.grantee,g.privilege_type) from information_schema.role_routine_grants g where g.routine_schema='public'), '[]'::jsonb),
  'foreignKeys', coalesce((select jsonb_agg(jsonb_build_object('name', con.conname, 'table', src.relname, 'references', dst.relname, 'definition', pg_get_constraintdef(con.oid, true)) order by src.relname,con.conname) from pg_constraint con join pg_class src on src.oid=con.conrelid join pg_namespace n on n.oid=src.relnamespace join pg_class dst on dst.oid=con.confrelid where n.nspname='public' and con.contype='f'), '[]'::jsonb),
  'viewDependencies', coalesce((select jsonb_agg(distinct jsonb_build_object('view', v.relname, 'dependsOnSchema', dn.nspname, 'dependsOn', d.relname)) from pg_rewrite rw join pg_class v on v.oid=rw.ev_class join pg_namespace vn on vn.oid=v.relnamespace join pg_depend dep on dep.objid=rw.oid join pg_class d on d.oid=dep.refobjid join pg_namespace dn on dn.oid=d.relnamespace where vn.nspname='public' and v.relkind in ('v','m') and dep.deptype='n'), '[]'::jsonb)
));
'@

$catalog = $catalogSql | ssh -i $SSHKey -o BatchMode=yes $SSHHost "docker exec -i $container psql -U postgres -d postgres -At"
if ($LASTEXITCODE -ne 0) { throw "Export du catalogue PostgreSQL échoué." }
$catalogText = (($catalog -join "`n").Trim() + "`n")
[void]($catalogText | ConvertFrom-Json)
Write-Utf8NoBom $catalogPath $catalogText

$catalogObject = $catalogText | ConvertFrom-Json
$serverVersion = (("show server_version;" | ssh -i $SSHKey -o BatchMode=yes $SSHHost "docker exec -i $container psql -U postgres -d postgres -At") -join '').Trim()
$restContainer = @(Invoke-Remote "docker ps --filter name=supabase-rest --format '{{.Names}}'")[0]
$pgrstSchemas = ((Invoke-Remote "docker inspect $restContainer --format '{{range .Config.Env}}{{println .}}{{end}}' | grep '^PGRST_DB_SCHEMAS='" ) -join '') -replace '^PGRST_DB_SCHEMAS=', ''
$images = Invoke-Remote "docker ps --filter name=supabase --format '{{.Names}}|{{.Image}}'"
$gateway = if ($images -match 'supabase-caddy') { 'caddy' } elseif ($images -match 'envoy') { 'envoy' } else { 'unknown' }

$stack = [ordered]@{
    exportedAt = (Get-Date).ToUniversalTime().ToString('o')
    source = 'self-hosted-production-read-only'
    postgresVersion = $serverVersion
    gateway = $gateway
    exposedSchemas = @($pgrstSchemas -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ })
    internalSchemas = @('auth', 'realtime', 'storage')
    publicExtensions = @($extensionRows)
    images = @($images)
    dumpSha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $dumpPath).Hash.ToLowerInvariant()
    catalogSha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $catalogPath).Hash.ToLowerInvariant()
    internalDependenciesSha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $internalDependenciesPath).Hash.ToLowerInvariant()
    objectCounts = [ordered]@{
        relations = @($catalogObject.relations).Count
        functions = @($catalogObject.functions).Count
        policies = @($catalogObject.policies).Count
        triggers = @($catalogObject.triggers).Count
        tableGrants = @($catalogObject.tableGrants).Count
        routineGrants = @($catalogObject.routineGrants).Count
        foreignKeys = @($catalogObject.foreignKeys).Count
        viewDependencies = @($catalogObject.viewDependencies).Count
    }
}
Write-Utf8NoBom $stackPath (($stack | ConvertTo-Json -Depth 8) + "`n")

Write-Host "Baseline exportée sans données dans $OutputDirectory"
Write-Host "SHA-256: $($stack.dumpSha256)"

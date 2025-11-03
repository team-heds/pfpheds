$SSH_KEY = "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt"
$SSH_HOST = "ubuntu@83.228.204.5"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   CORRECTION PERMISSIONS SUPABASE" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Test connexion
Write-Host "`nTest de connexion SSH..." -ForegroundColor Yellow
$sshTest = ssh -i $SSH_KEY $SSH_HOST "echo OK" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR: Impossible de se connecter" -ForegroundColor Red
    exit 1
}
Write-Host "Connexion OK" -ForegroundColor Green

# Verification Supabase
Write-Host "`nVerification Supabase..." -ForegroundColor Yellow
$containerCount = ssh -i $SSH_KEY $SSH_HOST "docker ps --filter name=supabase-db --format '{{.Names}}' | wc -l"
if ([int]$containerCount -eq 0) {
    Write-Host "ERREUR: Supabase DB non actif" -ForegroundColor Red
    exit 1
}
Write-Host "Supabase DB actif" -ForegroundColor Green

# Verification table user_profiles
Write-Host "`nVerification table user_profiles..." -ForegroundColor Yellow
$tableExists = ssh -i $SSH_KEY $SSH_HOST "docker exec supabase-db psql -U postgres -d postgres -t -c `"SELECT COUNT(*) FROM information_schema.tables WHERE table_name='user_profiles';`""

if ([int]$tableExists -gt 0) {
    Write-Host "Table user_profiles existe deja" -ForegroundColor Green
} else {
    Write-Host "Table user_profiles n'existe pas - elle sera creee" -ForegroundColor Yellow
}

# Verification politiques RLS
Write-Host "`nVerification politiques RLS..." -ForegroundColor Yellow
$policiesCount = ssh -i $SSH_KEY $SSH_HOST "docker exec supabase-db psql -U postgres -d postgres -t -c `"SELECT COUNT(*) FROM pg_policies WHERE tablename='user_profiles';`""
Write-Host "Politiques RLS actuelles: $policiesCount" -ForegroundColor Cyan

# Verification trigger
Write-Host "`nVerification trigger..." -ForegroundColor Yellow
$triggerExists = ssh -i $SSH_KEY $SSH_HOST "docker exec supabase-db psql -U postgres -d postgres -t -c `"SELECT COUNT(*) FROM pg_trigger WHERE tgname='on_auth_user_created';`""

if ([int]$triggerExists -gt 0) {
    Write-Host "Trigger existe deja" -ForegroundColor Green
} else {
    Write-Host "Trigger n'existe pas - il sera cree" -ForegroundColor Yellow
}

# Demande de confirmation
Write-Host "`n=============================================" -ForegroundColor Yellow
Write-Host "ACTIONS QUI SERONT EFFECTUEES:" -ForegroundColor Yellow
Write-Host "- Activer RLS sur user_profiles" -ForegroundColor White
Write-Host "- Creer/Mettre a jour les politiques RLS" -ForegroundColor White
Write-Host "- Creer le trigger automatique si absent" -ForegroundColor White
Write-Host "=============================================" -ForegroundColor Yellow

Write-Host "`nVoulez-vous continuer? (o/n)" -ForegroundColor Cyan
$confirm = Read-Host

if ($confirm -ne 'o') {
    Write-Host "Operation annulee" -ForegroundColor Yellow
    exit 0
}

# Creation du script SQL de correction
Write-Host "`nCreation du script de correction..." -ForegroundColor Yellow

$sqlScript = @"
-- Activer RLS sur user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Supprimer anciennes policies si elles existent
DROP POLICY IF EXISTS "Enable read access for all users" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;

-- Creer les nouvelles policies
CREATE POLICY "Enable read access for all users"
  ON public.user_profiles
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable insert for authenticated users only"
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Creer la fonction trigger si elle n'existe pas
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS `$`$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Nouvel utilisateur'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
`$`$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer ancien trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Creer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Donner les permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.user_profiles TO anon, authenticated;
"@

# Sauvegarder le script localement
$sqlScript | Out-File -FilePath ".\temp_fix_permissions.sql" -Encoding UTF8

# Copier sur le serveur
Write-Host "Copie du script sur le serveur..." -ForegroundColor Yellow
scp -i $SSH_KEY ".\temp_fix_permissions.sql" "${SSH_HOST}:/tmp/fix_permissions.sql"

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR: Echec de la copie" -ForegroundColor Red
    Remove-Item ".\temp_fix_permissions.sql" -Force
    exit 1
}

# Executer le script
Write-Host "`nApplication des corrections..." -ForegroundColor Yellow
$result = ssh -i $SSH_KEY $SSH_HOST "cat /tmp/fix_permissions.sql | docker exec -i supabase-db psql -U postgres -d postgres" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "Corrections appliquees avec succes!" -ForegroundColor Green
} else {
    Write-Host "ERREUR lors de l'application" -ForegroundColor Red
    Write-Host "Details: $result" -ForegroundColor Yellow
}

# Nettoyage
Write-Host "`nNettoyage..." -ForegroundColor Yellow
Remove-Item ".\temp_fix_permissions.sql" -Force
ssh -i $SSH_KEY $SSH_HOST "rm -f /tmp/fix_permissions.sql"

# Verifications finales
Write-Host "`n=============================================" -ForegroundColor Cyan
Write-Host "   VERIFICATIONS FINALES" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

$finalPolicies = ssh -i $SSH_KEY $SSH_HOST "docker exec supabase-db psql -U postgres -d postgres -t -c `"SELECT COUNT(*) FROM pg_policies WHERE tablename='user_profiles';`""
Write-Host "Politiques RLS: $finalPolicies" -ForegroundColor $(if ([int]$finalPolicies -ge 3) { "Green" } else { "Yellow" })

$finalTrigger = ssh -i $SSH_KEY $SSH_HOST "docker exec supabase-db psql -U postgres -d postgres -t -c `"SELECT COUNT(*) FROM pg_trigger WHERE tgname='on_auth_user_created';`""
Write-Host "Trigger: $(if ([int]$finalTrigger -gt 0) { 'OK' } else { 'MANQUANT' })" -ForegroundColor $(if ([int]$finalTrigger -gt 0) { "Green" } else { "Red" })

Write-Host "`n=============================================" -ForegroundColor Green
Write-Host "   TERMINE!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

Write-Host "`nVous pouvez maintenant tester l'inscription!" -ForegroundColor Yellow
Write-Host "Si ca ne fonctionne toujours pas, verifiez les logs:" -ForegroundColor White
Write-Host "  ssh ... 'docker logs supabase-auth --tail 50'" -ForegroundColor Gray

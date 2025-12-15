$SSH_KEY = "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt"
$SSH_HOST = "ubuntu@83.228.204.5"

Write-Host "`n=== POLITIQUES RLS DE StudentsPhysio ===" -ForegroundColor Cyan

# Creer le script SQL
$sqlScript = @"
-- Verifier si RLS est actif
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'StudentsPhysio';

-- Lister les politiques
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'StudentsPhysio';
"@

# Sauvegarder temporairement
$sqlScript | Out-File -FilePath ".\temp_rls.sql" -Encoding UTF8

# Copier sur le serveur
scp -i $SSH_KEY ".\temp_rls.sql" "${SSH_HOST}:/tmp/check_rls.sql"

# Executer
$result = ssh -i $SSH_KEY $SSH_HOST "cat /tmp/check_rls.sql | docker exec -i supabase-db-1 psql -U postgres -d postgres"
Write-Host $result

# Nettoyer
Remove-Item ".\temp_rls.sql" -ErrorAction SilentlyContinue
ssh -i $SSH_KEY $SSH_HOST "rm -f /tmp/check_rls.sql"

Write-Host "`nTermine!" -ForegroundColor Green

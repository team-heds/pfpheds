import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkRoles() {
  console.log('🔍 Checking for EnseignantSoins...');

  // Check role column
  const { data: byRole, error: errRole } = await supabase
    .from('user_profiles')
    .select('email, role')
    .eq('role', 'EnseignantSoins');
    
  if (errRole) console.error('Error checking role column:', errRole.message);
  else console.log(`Found ${byRole.length} users with role='EnseignantSoins'`);

  // Check permissions column
  const { data: byPerms, error: errPerms } = await supabase
    .from('user_profiles')
    .select('email, permissions')
    .contains('permissions', ['EnseignantSoins']);

  if (errPerms) console.error('Error checking permissions column:', errPerms.message);
  else console.log(`Found ${byPerms.length} users with permissions containing 'EnseignantSoins'`);
  
  // List all distinct roles to see what's used
  const { data: allRoles } = await supabase.from('user_profiles').select('role');
  const distinctRoles = [...new Set(allRoles?.map(r => r.role))];
  console.log('Distinct roles found:', distinctRoles);
}

checkRoles();

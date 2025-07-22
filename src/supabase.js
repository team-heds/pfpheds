import { createClient } from '@supabase/supabase-js'

// Remplace ces valeurs par celles de ton projet Supabase (onglet Project Settings > API)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY

console.log('SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL)


export const supabase = createClient(supabaseUrl, supabaseKey)



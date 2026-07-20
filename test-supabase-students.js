import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

async function main() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const supabase = createClient(url, key);
  
  const { data, error } = await supabase.from('students').select('*').limit(1);
  console.log('Select Data:', data);
  console.log('Select Error:', error);
}
main();

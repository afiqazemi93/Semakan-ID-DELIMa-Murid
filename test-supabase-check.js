import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

async function main() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    console.log('Missing credentials');
    return;
  }
  
  console.log('URL:', url.substring(0, 15) + '...');
  console.log('Key:', key.substring(0, 15) + '...');
  
  const supabase = createClient(url, key);
  
  const { data, error } = await supabase.from('app_settings').select('*').maybeSingle();
  console.log('Data:', data);
  console.log('Error:', error);
}
main();

const {
  createClient
} = supabase;

const SUPABASE_URL = 'https://epnbxbamyrpbgapkkjsf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwbmJ4YmFteXJwYmdhcGtranNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NzAyNjksImV4cCI6MjA2NjQ0NjI2OX0.6R0yesNLI9GJlFGOFV-Ekx6Xkwboc0mWnWiYBv9WDNI';

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

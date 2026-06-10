import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder');

export const checkUsernameUnique = async (username) => {
  if (supabaseUrl === undefined || supabaseUrl === '') {
    // If we're mocking, just return true
    return true;
  }
  
  try {
    // Attempt to query a users table (this assumes a users table exists with a username column)
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single();
      
    if (error && error.code === 'PGRST116') {
      // PGRST116 means zero rows returned (which is good, username is unique)
      return true;
    }
    
    return !data; // if data exists, username is not unique
  } catch (err) {
    console.error("Error checking username uniqueness:", err);
    return false;
  }
};

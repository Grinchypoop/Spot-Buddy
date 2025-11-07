const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase;

function getSupabaseClient() {
  if (!supabase) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

async function initializeDatabase() {
  try {
    const supabase = getSupabaseClient();

    // Test connection
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Database connection error:', error);
    } else {
      console.log('Database initialized successfully');
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}

module.exports = {
  getSupabaseClient,
  initializeDatabase,
};

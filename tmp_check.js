const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://aputbupvixzmryzosvnr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwdXRidXB2aXh6bXJ5em9zdm5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMjg3MzMsImV4cCI6MjA4OTgwNDczM30.0yuHB3Kdok7D5T1cLw_qOg0qM0VxPbuHHufNMcRcvZ0'
);

async function check() {
  const { data: players, error } = await supabase
    .from('players')
    .select('*');

  if (error) {
    console.log('Error:', error.message);
  } else {
    console.log('Players found:', players.length);
    const jonathan = players.find(p => p.username.toLowerCase().includes('jonathan'));
    console.log('Jonathan:', jonathan);
  }
}

check();

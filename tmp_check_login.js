const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://aputbupvixzmryzosvnr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwdXRidXB2aXh6bXJ5em9zdm5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMjg3MzMsImV4cCI6MjA4OTgwNDczM30.0yuHB3Kdok7D5T1cLw_qOg0qM0VxPbuHHufNMcRcvZ0'
);

async function check() {
  const { data: jonathanData, error: jonErr } = await supabase
    .from('players')
    .select('*')
    .eq('username', 'jonathan');
    
  console.log('Jonathan data:', jonathanData, 'Error:', jonErr?.message);

  const { data: tutucaData, error: tutErr } = await supabase
    .from('players')
    .select('*')
    .eq('username', 'Tutuca');
    
  console.log('Tutuca data:', tutucaData, 'Error:', tutErr?.message);
}

check();

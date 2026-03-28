const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://aputbupvixzmryzosvnr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwdXRidXB2aXh6bXJ5em9zdm5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMjg3MzMsImV4cCI6MjA4OTgwNDczM30.0yuHB3Kdok7D5T1cLw_qOg0qM0VxPbuHHufNMcRcvZ0'
);

async function check() {
  const { data: players } = await supabase.from('players').select('id, username, role').ilike('username', '%superadmin%');
  console.log('Players with superadmin username:', players);

  const { data: updateData, error } = await supabase.from('players').update({role: 'superadmin'}).eq('username', 'jonathan').select();
  if(error) {
     console.log('Update Error:', error);
  } else {
     console.log('Updated jonathan to superadmin:', updateData);
  }
}
check();

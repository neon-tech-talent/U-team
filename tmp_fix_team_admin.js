const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://aputbupvixzmryzosvnr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwdXRidXB2aXh6bXJ5em9zdm5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMjg3MzMsImV4cCI6MjA4OTgwNDczM30.0yuHB3Kdok7D5T1cLw_qOg0qM0VxPbuHHufNMcRcvZ0'
);

async function fixTeamAdmin() {
  // Find Jonathan the player
  const { data: jonathan, error: plErr } = await supabase
    .from('players')
    .select('id, team_id')
    .ilike('username', 'jonathan')
    .single();

  if (plErr) {
    console.error("No se encontró a jonathan jugador:", plErr.message);
    return;
  }

  console.log("Jonathan player ID:", jonathan.id);
  console.log("Jonathan team ID:", jonathan.team_id);

  if (jonathan.team_id) {
    // Update the team's admin_id to point to Jonathan's player ID
    const { error: teamErr } = await supabase
      .from('teams')
      .update({ admin_id: jonathan.id })
      .eq('id', jonathan.team_id);

    if (teamErr) {
      console.error("Error actualizando equipo:", teamErr.message);
    } else {
      console.log("¡Éxito! El equipo ahora apunta correctamente al jugador Jonathan como admin.");
    }
  }
}

fixTeamAdmin();

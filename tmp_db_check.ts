import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function check() {
  const { data: player, error: pError } = await supabase
    .from('players')
    .select('*')
    .eq('username', 'jonathan')
    .single();

  if (pError) {
    console.log('Player Error:', pError.message);
  } else {
    console.log('Player found:', {
        id: player.id,
        username: player.username,
        password: player.password,
        role: player.role,
        team_id: player.team_id,
        is_active: player.is_active
    });
  }

  const { data: teams, error: tError } = await supabase.from('teams').select('*');
  if (tError) {
    console.log('Teams Error:', tError.message);
  } else {
    console.log('Teams found:', teams.map(t => ({ id: t.id, name: t.name, admin_id: t.admin_id })));
  }
}

check();

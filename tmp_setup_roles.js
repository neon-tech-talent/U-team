const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://aputbupvixzmryzosvnr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwdXRidXB2aXh6bXJ5em9zdm5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMjg3MzMsImV4cCI6MjA4OTgwNDczM30.0yuHB3Kdok7D5T1cLw_qOg0qM0VxPbuHHufNMcRcvZ0'
);

async function applyChanges() {
  // 1. Restaurar jonathan a "admin"
  console.log("Restaurando a jonathan a 'admin' (manteniendo su contraseña 'Nhaojant8')...");
  const { error: errorJon } = await supabase
    .from('players')
    .update({ role: 'admin' })
    .eq('username', 'jonathan');

  if (errorJon) console.error("Error al actualizar jonathan:", errorJon);

  // 2. Crear al usuario "Tutuca" como superadmin
  console.log("Comprobando si existe 'Tutuca'...");
  const { data: tutucaExists } = await supabase
    .from('players')
    .select('id')
    .eq('username', 'Tutuca')
    .single();

  if (tutucaExists) {
    console.log("Tutuca ya existe. Actualizando contraseña y rol...");
    const { error: errorTutuca } = await supabase
      .from('players')
      .update({ password: '2613', role: 'superadmin', is_admin: true })
      .eq('username', 'Tutuca');
    if (errorTutuca) console.error("Error al actualizar Tutuca:", errorTutuca);
  } else {
    console.log("Creando nuevo usuario Tutuca como superadmin...");
    const { error: errorNewTutuca } = await supabase
      .from('players')
      .insert({
        full_name: 'Tutuca Admin',
        username: 'Tutuca',
        password: '2613',
        role: 'superadmin',
        is_admin: true,
        is_active: true
      });
    if (errorNewTutuca) console.error("Error al crear Tutuca:", errorNewTutuca);
  }

  console.log("¡Proceso finalizado!");
}

applyChanges();

// app.js — Inicialización principal (initApp)

// ============= INIT =============
async function initApp() {
  const today = new Date().toISOString().split('T')[0];

  ['a-nacimiento','r-empadre','r-parto-real','p-fecha','s-fecha','v-fecha'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = today;
  });

  console.log('🔌 Probando conexión con Supabase...');
  const { data: testData, error: testError } = await db.from('animales').select('id').limit(1);

  if (testError) {
    console.error('❌ Error de conexión:', testError);
    showToast('❌ Error de conexión: ' + testError.message, 'error');
    return;
  }

  console.log('✅ Conexión exitosa');

  await loadAnimales();
  await loadReproduccion();
  await loadProduccion();
  await loadSalud();
  await loadVentas();
  await loadDetalleVenta();

  setupRealtime();

  // 🔥 Cargar dashboard correctamente
  switchTab('dashboard');
}
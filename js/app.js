// app.js — Inicialización principal

async function initApp() {
  const today = new Date().toISOString().split('T')[0];
  ['a-nacimiento','r-empadre','r-parto-real','p-fecha','s-fecha','v-fecha'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = today;
  });

  const { error: testError } = await db.from('animales').select('id').limit(1);
  if (testError) {
    showToast('❌ Error de conexión: ' + testError.message, 'error');
    return;
  }

  await loadAnimales();
  await loadReproduccion();
  await loadProduccion();
  await loadSalud();
  await loadVentas();
  await loadDetalleVenta();
  await loadDashboard();
  setupRealtime();
}
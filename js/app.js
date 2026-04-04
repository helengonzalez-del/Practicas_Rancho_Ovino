// app.js — Inicialización principal (initApp)

// ============= INIT =============
async function initApp() {
  const today = new Date().toISOString().split('T')[0];
  ['a-nacimiento','r-empadre','r-parto-real','p-fecha','s-fecha','v-fecha'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = today;
  });

  // Test de conexión primero
  console.log('🔌 Probando conexión con Supabase...');
  const { data: testData, error: testError } = await db.from('animales').select('id').limit(1);
  if (testError) {
    console.error('❌ Error de conexión:', testError);
    showToast('❌ Error de conexión: ' + testError.message + ' — Revisa la API key en la consola', 'error');
    // Mostrar alerta visible en pantalla
    document.querySelector('.main').insertAdjacentHTML('afterbegin', `
      <div style="background:#FEE2E2;border:2px solid #C0392B;border-radius:10px;padding:1.2rem 1.5rem;margin-bottom:1.5rem;color:#7B1D1D">
        <strong>⚠️ Error de conexión con Supabase</strong><br>
        <code style="font-size:0.85rem">${testError.message}</code><br><br>
        <span style="font-size:0.9rem">Asegúrate de que la <strong>SUPABASE_KEY</strong> sea la <strong>anon public key</strong> correcta.<br>
        Ve a tu proyecto → <strong>Settings → API → anon public</strong> y copia el token JWT (empieza con <code>eyJ...</code>)</span>
      </div>
    `);
    return;
  }
  console.log('✅ Conexión exitosa, datos:', testData);

  await loadAnimales();
  await loadReproduccion();
  await loadProduccion();
  await loadSalud();
  await loadVentas();
  await loadDetalleVenta();
  await loadDashboard();
  setupRealtime();
}
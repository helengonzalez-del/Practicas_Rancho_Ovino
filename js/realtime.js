// realtime.js — Suscripciones en tiempo real

// ============= REALTIME =============
function setupRealtime() {
  db.channel('realtime-all')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'animales' }, () => {
      showToast('🐑 Cambio en Animales detectado');
      loadAnimales();
      loadDashboard();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'reproduccion' }, () => {
      showToast('🐣 Cambio en Reproducción detectado');
      loadReproduccion();
      loadDashboard();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'produccion' }, () => {
      showToast('⚖️ Cambio en Producción detectado');
      loadProduccion();
      loadDashboard();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'salud' }, () => {
      showToast('💉 Cambio en Salud detectado');
      loadSalud();
      loadDashboard();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'ventas' }, () => {
      showToast('💰 Cambio en Ventas detectado');
      loadVentas();
      loadDashboard();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'detalle_venta' }, () => {
      showToast('🧾 Cambio en Detalle Venta detectado');
      loadDetalleVenta();
    })
    .subscribe();
}
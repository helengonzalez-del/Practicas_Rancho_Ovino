// ventas.js — Ventas y detalle de ventas

// ============= VENTAS =============
async function loadVentas() {
  loading('table-ventas');
  const { data, error } = await db.from('ventas').select('*').order('fecha', { ascending: false });
  if (error) { showToast('Error cargando ventas', 'error'); return; }
  ventasCache = data || [];
  if (!data || !data.length) {
    document.getElementById('table-ventas').innerHTML = emptyState('💰', 'No hay ventas registradas');
    return;
  }
  const rows = data.map(v => `
    <tr>
      <td>${formatDate(v.fecha)}</td>
      <td>${v.cliente || '—'}</td>
      <td><strong>${formatMoney(v.total)}</strong></td>
      <td>${formatDate(v.created_at)}</td>
      <td><button class="btn btn-danger" onclick="deleteRecord('ventas','${v.id}',loadVentas)">🗑</button></td>
    </tr>`).join('');
  document.getElementById('table-ventas').innerHTML = `
    <table>
      <thead><tr>
        <th>Fecha</th><th>Cliente</th><th>Total</th><th>Registrado</th><th>Acc.</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  populateVentaSelect();
}

async function saveVenta() {
  const payload = {
    fecha: document.getElementById('v-fecha').value || null,
    cliente: document.getElementById('v-cliente').value || null,
    total: document.getElementById('v-total').value ? parseFloat(document.getElementById('v-total').value) : null,
  };
  if (!payload.fecha) { showToast('La fecha es obligatoria', 'error'); return; }
  const { error } = await db.from('ventas').insert(payload);
  if (error) { showToast('Error: ' + error.message, 'error'); return; }
  showToast('✅ Venta registrada');
  closeModal('modal-venta');
}

function populateVentaSelect() {
  const el = document.getElementById('d-venta');
  if (!el) return;
  el.innerHTML = '<option value="">Seleccionar venta...</option>' +
    ventasCache.map(v => `<option value="${v.id}">${formatDate(v.fecha)} - ${v.cliente || 'Sin cliente'} (${formatMoney(v.total)})</option>`).join('');
}

// ============= DETALLE VENTA =============
async function loadDetalleVenta() {
  loading('table-detalle_venta');
  const { data, error } = await db.from('detalle_venta').select(`
    *,
    venta:id_venta(fecha,cliente),
    animal:id_animal(identificador,nombre)
  `).order('id', { ascending: false });
  if (error) { showToast('Error cargando detalle', 'error'); return; }
  if (!data || !data.length) {
    document.getElementById('table-detalle_venta').innerHTML = emptyState('🧾', 'No hay detalle de ventas registrado');
    return;
  }
  const rows = data.map(d => `
    <tr>
      <td>${d.venta ? formatDate(d.venta.fecha) + (d.venta.cliente ? ' - ' + d.venta.cliente : '') : '—'}</td>
      <td>${d.animal ? d.animal.identificador : '—'}</td>
      <td>${d.animal ? (d.animal.nombre || '—') : '—'}</td>
      <td>${formatMoney(d.precio)}</td>
      <td>${d.peso ? d.peso + ' kg' : '—'}</td>
      <td><button class="btn btn-danger" onclick="deleteRecord('detalle_venta','${d.id}',loadDetalleVenta)">🗑</button></td>
    </tr>`).join('');
  document.getElementById('table-detalle_venta').innerHTML = `
    <table>
      <thead><tr>
        <th>Venta</th><th>ID Animal</th><th>Nombre</th><th>Precio</th><th>Peso</th><th>Acc.</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

async function saveDetalle() {
  const payload = {
    id_venta: document.getElementById('d-venta').value,
    id_animal: document.getElementById('d-animal').value,
    precio: document.getElementById('d-precio').value ? parseFloat(document.getElementById('d-precio').value) : null,
    peso: document.getElementById('d-peso').value ? parseFloat(document.getElementById('d-peso').value) : null,
  };
  if (!payload.id_venta || !payload.id_animal) { showToast('Venta y animal son obligatorios', 'error'); return; }
  const { error } = await db.from('detalle_venta').insert(payload);
  if (error) { showToast('Error: ' + error.message, 'error'); return; }
  showToast('✅ Detalle de venta registrado');
  closeModal('modal-detalle');
}
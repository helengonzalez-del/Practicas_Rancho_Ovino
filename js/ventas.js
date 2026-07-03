// ventas.js — Ventas y detalle de ventas

async function loadVentas() {
  loading('table-ventas');
  const { data, error } = await db.from('ventas').select('*').order('fecha', { ascending: false });
  if (error) { showToast('Error cargando ventas', 'error'); return; }
  ventasCache = data || [];
  if (!data || !data.length) { document.getElementById('table-ventas').innerHTML = emptyState('💰', 'No hay ventas registradas'); return; }
  const rows = data.map(v => `
    <tr>
      <td>${formatDate(v.fecha)}</td>
      <td>${v.cliente || '—'}</td>
      <td><strong>${formatMoney(v.total)}</strong></td>
      <td>${v.notas || '—'}</td>
      <td>
        <div style="display:flex;gap:0.3rem">
          <button class="btn btn-edit" onclick="openEditVenta('${v.id}','${(v.fecha||'')}','${(v.cliente||'').replace(/'/g,'')}','${v.total||''}','${(v.notas||'').replace(/'/g,'')}')">✏️</button>
          <button class="btn btn-danger" onclick="deleteRecord('ventas','${v.id}',loadVentas)">🗑</button>
        </div>
      </td>
    </tr>`).join('');
  document.getElementById('table-ventas').innerHTML = `
    <table><thead><tr><th>Fecha</th><th>Cliente</th><th>Total</th><th>Notas</th><th>Acc.</th></tr></thead>
    <tbody>${rows}</tbody></table>`;
  populateVentaSelect();
}

async function saveVenta() {
  const payload = {
    fecha:   document.getElementById('v-fecha').value || null,
    cliente: document.getElementById('v-cliente').value || null,
    total:   document.getElementById('v-total').value ? parseFloat(document.getElementById('v-total').value) : null,
    notas:   document.getElementById('v-notas').value.trim() || null,
  };
  if (!payload.fecha) { showToast('La fecha es obligatoria', 'error'); return; }
  const { error } = await db.from('ventas').insert(payload);
  if (error) { showToast('Error: ' + error.message, 'error'); return; }
  showToast('✅ Venta registrada');
  closeModal('modal-venta');
}

function openEditVenta(id, fecha, cliente, total, notas) {
  document.getElementById('ev-id').value      = id;
  document.getElementById('ev-fecha').value   = fecha;
  document.getElementById('ev-cliente').value = cliente;
  document.getElementById('ev-total').value   = total;
  document.getElementById('ev-notas').value   = notas;
  openModal('modal-edit-venta');
}

async function updateVenta() {
  const id = document.getElementById('ev-id').value;
  const payload = {
    fecha:   document.getElementById('ev-fecha').value || null,
    cliente: document.getElementById('ev-cliente').value || null,
    total:   document.getElementById('ev-total').value ? parseFloat(document.getElementById('ev-total').value) : null,
    notas:   document.getElementById('ev-notas').value.trim() || null,
  };
  const { error } = await db.from('ventas').update(payload).eq('id', id);
  if (error) { showToast('Error: ' + error.message, 'error'); return; }
  showToast('✅ Venta actualizada');
  closeModal('modal-edit-venta');
  loadVentas();
}

function populateVentaSelect() {
  const el = document.getElementById('d-venta');
  if (!el) return;
  el.innerHTML = '<option value="">Seleccionar venta...</option>' +
    ventasCache.map(v => `<option value="${v.id}">${formatDate(v.fecha)} - ${v.cliente || 'Sin cliente'} (${formatMoney(v.total)})</option>`).join('');
}

// DETALLE VENTA
async function loadDetalleVenta() {
  loading('table-detalle_venta');
  const { data, error } = await db.from('detalle_venta').select(`*,venta:id_venta(fecha,cliente),animal:id_animal(identificador,nombre)`).order('id', { ascending: false });
  if (error) { showToast('Error cargando detalle', 'error'); return; }
  if (!data || !data.length) { document.getElementById('table-detalle_venta').innerHTML = emptyState('🧾', 'No hay detalle de ventas'); return; }
  const rows = data.map(d => `
    <tr>
      <td>${d.venta ? formatDate(d.venta.fecha) + (d.venta.cliente ? ' — ' + d.venta.cliente : '') : '—'}</td>
      <td>${d.animal ? d.animal.identificador : '—'}</td>
      <td>${d.animal ? (d.animal.nombre || '—') : '—'}</td>
      <td>${formatMoney(d.precio)}</td>
      <td>${d.peso != null ? d.peso + ' kg' : '—'}</td>
      <td>${d.notas || '—'}</td>
      <td>
        <div style="display:flex;gap:0.3rem">
          <button class="btn btn-edit" onclick="openEditDetalle('${d.id}','${d.id_venta}','${d.id_animal}','${d.precio||''}','${d.peso||''}','${(d.notas||'').replace(/'/g,'')}')">✏️</button>
          <button class="btn btn-danger" onclick="deleteRecord('detalle_venta','${d.id}',loadDetalleVenta)">🗑</button>
        </div>
      </td>
    </tr>`).join('');
  document.getElementById('table-detalle_venta').innerHTML = `
    <table><thead><tr><th>Venta</th><th>ID Animal</th><th>Nombre</th><th>Precio</th><th>Peso</th><th>Notas</th><th>Acc.</th></tr></thead>
    <tbody>${rows}</tbody></table>`;
}

async function saveDetalle() {
  const payload = {
    id_venta:  document.getElementById('d-venta').value,
    id_animal: document.getElementById('d-animal').value,
    precio:    document.getElementById('d-precio').value ? parseFloat(document.getElementById('d-precio').value) : null,
    peso:      document.getElementById('d-peso').value   ? parseFloat(document.getElementById('d-peso').value)   : null,
    notas:     document.getElementById('d-notas').value.trim() || null,
  };
  if (!payload.id_venta || !payload.id_animal) { showToast('Venta y animal son obligatorios', 'error'); return; }
  const { error } = await db.from('detalle_venta').insert(payload);
  if (error) { showToast('Error: ' + error.message, 'error'); return; }
  showToast('✅ Detalle registrado');
  closeModal('modal-detalle');
}

function openEditDetalle(id, idVenta, idAnimal, precio, peso, notas) {
  document.getElementById('ed-id').value      = id;
  document.getElementById('ed-precio').value  = precio;
  document.getElementById('ed-peso').value    = peso;
  document.getElementById('ed-notas').value   = notas;
  populateVentaSelect();
  const sv = document.getElementById('ed-venta');
  if (sv) { sv.innerHTML = document.getElementById('d-venta').innerHTML; sv.value = idVenta; }
  openModal('modal-edit-detalle');
}

async function updateDetalle() {
  const id = document.getElementById('ed-id').value;
  const payload = {
    precio: document.getElementById('ed-precio').value ? parseFloat(document.getElementById('ed-precio').value) : null,
    peso:   document.getElementById('ed-peso').value   ? parseFloat(document.getElementById('ed-peso').value)   : null,
    notas:  document.getElementById('ed-notas').value.trim() || null,
  };
  const { error } = await db.from('detalle_venta').update(payload).eq('id', id);
  if (error) { showToast('Error: ' + error.message, 'error'); return; }
  showToast('✅ Detalle actualizado');
  closeModal('modal-edit-detalle');
  loadDetalleVenta();
}

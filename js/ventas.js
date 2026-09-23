// ventas.js — Ventas unificadas (Carne y Pie de Cría)

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
      <td>${v.tipo === 'carne' ? 'Carne' : 'Pie de Cría'}</td>
      <td><strong>${formatMoney(v.ingreso || 0)}</strong></td>
      <td>${v.costo != null ? formatMoney(v.costo) : '—'}</td>
      <td>${v.tipo === 'carne' ? (v.rendimiento ? v.rendimiento.toFixed(2)+'%' : '—') : (v.cantidad_animales ?? '—')}</td>
      <td>${v.notas || '—'}</td>
      <td>
        <div style="display:flex;gap:0.3rem">
          <button class="btn btn-edit" onclick="openEditVenta('${v.id}')">✏️</button>
          <button class="btn btn-danger" onclick="deleteRecord('ventas','${v.id}',loadVentas)">🗑</button>
        </div>
      </td>
    </tr>`).join('');
  document.getElementById('table-ventas').innerHTML = `
    <table><thead><tr>
      <th>Fecha</th><th>Cliente</th><th>Tipo</th><th>Ingreso</th><th>Costo</th><th>Rendimiento / Cantidad</th><th>Notas</th><th>Acc.</th>
    </tr></thead><tbody>${rows}</tbody></table>`;
}

async function saveVenta() {
  const tipo = document.getElementById('v-tipo').value;
  const payload = {
    fecha:   document.getElementById('v-fecha').value || null,
    cliente: document.getElementById('v-cliente').value || null,
    tipo:    tipo,
    ingreso: document.getElementById('v-ingreso').value ? parseFloat(document.getElementById('v-ingreso').value) : null,
    costo:   document.getElementById('v-costo').value ? parseFloat(document.getElementById('v-costo').value) : null,
    notas:   document.getElementById('v-notas').value.trim() || null,
  };

  if (!payload.fecha || !tipo) { showToast('Fecha y tipo de venta son obligatorios', 'error'); return; }

  if (tipo === 'carne') {
    const pesoVendido = parseFloat(document.getElementById('v-peso-vendido').value);
    const pesoReal    = parseFloat(document.getElementById('v-peso-real').value);
    payload.peso_vendido = pesoVendido;
    payload.peso_real    = pesoReal;
    payload.rendimiento  = pesoReal ? (pesoVendido / pesoReal) * 100 : null;
  }

  if (tipo === 'pie_cria') {
    const cantidad = parseInt(document.getElementById('v-cantidad').value);
    payload.cantidad_animales = cantidad;
    const ids = Array.from(document.getElementById('v-animales').selectedOptions).map(o => o.value);
    if (ids && ids.length) {
      await db.from('animales').update({ estado: 'vendido' }).in('id', ids);
    }
  }

  const { error } = await db.from('ventas').insert(payload);
  if (error) { showToast('Error: ' + error.message, 'error'); return; }
  showToast('✅ Venta registrada');
  closeModal('modal-venta');
  loadVentas();
}

function openEditVenta(id) {
  const v = ventasCache.find(x => x.id === id);
  if (!v) return;
  document.getElementById('ev-id').value      = v.id;
  document.getElementById('ev-fecha').value   = v.fecha || '';
  document.getElementById('ev-cliente').value = v.cliente || '';
  document.getElementById('ev-tipo').value    = v.tipo || '';
  document.getElementById('ev-ingreso').value = v.ingreso ?? '';
  document.getElementById('ev-costo').value   = v.costo ?? '';
  document.getElementById('ev-peso-vendido').value = v.peso_vendido ?? '';
  document.getElementById('ev-peso-real').value    = v.peso_real ?? '';
  document.getElementById('ev-cantidad').value     = v.cantidad_animales ?? '';
  document.getElementById('ev-notas').value        = v.notas || '';
  toggleVentaFields.call(document.getElementById('ev-tipo'));
  openModal('modal-edit-venta');
}

async function updateVenta() {
  const id   = document.getElementById('ev-id').value;
  const tipo = document.getElementById('ev-tipo').value;
  const payload = {
    fecha:   document.getElementById('ev-fecha').value || null,
    cliente: document.getElementById('ev-cliente').value || null,
    tipo:    tipo,
    ingreso: document.getElementById('ev-ingreso').value ? parseFloat(document.getElementById('ev-ingreso').value) : null,
    costo:   document.getElementById('ev-costo').value ? parseFloat(document.getElementById('ev-costo').value) : null,
    notas:   document.getElementById('ev-notas').value.trim() || null,
  };

  if (tipo === 'carne') {
    const pesoVendido = parseFloat(document.getElementById('ev-peso-vendido').value);
    const pesoReal    = parseFloat(document.getElementById('ev-peso-real').value);
    payload.peso_vendido = pesoVendido;
    payload.peso_real    = pesoReal;
    payload.rendimiento  = pesoReal ? (pesoVendido / pesoReal) * 100 : null;
  }

  if (tipo === 'pie_cria') {
    const cantidad = parseInt(document.getElementById('ev-cantidad').value);
    payload.cantidad_animales = cantidad;
    const ids = Array.from(document.getElementById('ev-animales').selectedOptions).map(o => o.value);
    if (ids && ids.length) {
      await db.from('animales').update({ estado: 'vendido' }).in('id', ids);
    }
  }

  const { error } = await db.from('ventas').update(payload).eq('id', id);
  if (error) { showToast('Error: ' + error.message, 'error'); return; }
  showToast('✅ Venta actualizada');
  closeModal('modal-edit-venta');
  loadVentas();
}

// Mostrar/ocultar campos según tipo
function toggleVentaFields() {
  const tipo = this.value;
  const form = this.closest('.form-grid');
  form.querySelectorAll('.carne-only').forEach(el => el.style.display = tipo === 'carne' ? 'block' : 'none');
  form.querySelectorAll('.pie-only').forEach(el => el.style.display = tipo === 'pie_cria' ? 'block' : 'none');
}



// ventas.js — Ventas unificadas (Carne y Pie de Cría)

async function loadVentas() {
  loading('table-ventas');
  const { data, error } = await db.from('ventas').select('*').order('fecha', { ascending: false });

  if (error) {
    console.error(error);
    showToast('Error cargando ventas', 'error');
    return;
  }

  ventasCache = data || [];

  if (!ventasCache.length) {
    document.getElementById('table-ventas').innerHTML = emptyState('💰', 'No hay ventas registradas');
    return;
  }

  const rows = ventasCache.map(v => `
    <tr>
      <td>${formatDate(v.fecha)}</td>
      <td>${v.cliente || '—'}</td>
      <td>${v.tipo === 'carne' ? 'Carne' : 'Pie de Cría'}</td>
      <td><strong>${formatMoney(v.ingreso || 0)}</strong></td>
      <td>${v.costo != null ? formatMoney(v.costo) : '—'}</td>
      <td>${v.tipo === 'carne' ? (v.rendimiento != null ? Number(v.rendimiento).toFixed(2) + '%' : '—') : (v.cantidad_animales ?? '—')}</td>
      <td>${v.notas || '—'}</td>
      <td>
        <div style="display:flex;gap:.3rem">
          <button class="btn btn-edit" onclick="openEditVenta('${v.id}')">✏️</button>
          <button class="btn btn-danger" onclick="deleteRecord('ventas','${v.id}',loadVentas)">🗑</button>
        </div>
      </td>
    </tr>
  `).join('');

  document.getElementById('table-ventas').innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Fecha</th><th>Cliente</th><th>Tipo</th><th>Ingreso</th><th>Costo</th><th>Rendimiento / Cantidad</th><th>Notas</th><th>Acc.</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

async function populateAnimalesSelects(selectedVentaId = null) {
  const { data, error } = await db.from('animales').select('id, identificador, nombre, estado').order('identificador', { ascending: true });

  if (error) {
    console.error(error);
    showToast('Error cargando animales', 'error');
    return;
  }

  const animales = data || [];
  let animalesVenta = [];

  if (selectedVentaId) {
    const { data: relaciones } = await db.from('venta_animales').select('animal_id').eq('venta_id', selectedVentaId);
    animalesVenta = (relaciones || []).map(a => String(a.animal_id));
  }

  const disponibles = animales.filter(a => {
    const id = String(a.id);
    return a.estado !== 'vendido' || animalesVenta.includes(id);
  });

  const options = disponibles.map(a => {
    const id = String(a.id);
    const selected = animalesVenta.includes(id) ? 'selected' : '';
    return `<option value="${id}" ${selected}>${a.identificador || 'Sin ID'}${a.nombre ? ' - ' + a.nombre : ''}${a.estado === 'vendido' && selected ? ' (vendido)' : ''}</option>`;
  }).join('');

  const html = `<option value="">Seleccionar...</option>${options}`;

  const vAnimales = document.getElementById('v-animales');
  const evAnimales = document.getElementById('ev-animales');

  if (vAnimales) vAnimales.innerHTML = html;
  if (evAnimales) evAnimales.innerHTML = html;
}

async function saveVenta() {
  const fecha = document.getElementById('v-fecha').value;
  const tipo = document.getElementById('v-tipo').value;

  if (!fecha || !tipo) {
    showToast('Fecha y tipo de venta son obligatorios', 'error');
    return;
  }

  const ingreso = document.getElementById('v-ingreso').value;
  const costo = document.getElementById('v-costo').value;

  const payload = {
    fecha,
    cliente: document.getElementById('v-cliente').value.trim() || null,
    tipo,
    ingreso: ingreso !== '' ? parseFloat(ingreso) : null,
    costo: costo !== '' ? parseFloat(costo) : null,
    notas: document.getElementById('v-notas').value.trim() || null
  };

  if (tipo === 'carne') {
    const pesoVendido = document.getElementById('v-peso-vendido').value;
    const pesoReal = document.getElementById('v-peso-real').value;

    payload.peso_vendido = pesoVendido !== '' ? parseFloat(pesoVendido) : null;
    payload.peso_real = pesoReal !== '' ? parseFloat(pesoReal) : null;
    payload.rendimiento = payload.peso_real > 0 && payload.peso_vendido != null
      ? (payload.peso_vendido / payload.peso_real) * 100
      : null;
  }

  if (tipo === 'pie_cria') {
    const cantidad = document.getElementById('v-cantidad').value;
    payload.cantidad_animales = cantidad !== '' ? parseInt(cantidad, 10) : null;
  }

  const { data, error } = await db.from('ventas').insert(payload).select().single();

  if (error) {
    console.error(error);
    showToast('Error: ' + error.message, 'error');
    return;
  }

  const ids = Array.from(document.getElementById('v-animales').selectedOptions)
    .map(o => o.value)
    .filter(id => id !== '');

  for (const animalId of ids) {
    const { error: relacionError } = await db.from('venta_animales').insert({
      venta_id: data.id,
      animal_id: animalId
    });

    if (relacionError) console.error(relacionError);

    const { error: animalError } = await db.from('animales').update({ estado: 'vendido' }).eq('id', animalId);

    if (animalError) console.error(animalError);
  }

  showToast('✅ Venta registrada');
  closeModal('modal-venta');
  limpiarFormularioVenta();
  await loadVentas();

  if (typeof loadAnimales === 'function') {
    await loadAnimales();
  }
}

async function openEditVenta(id) {
  const v = ventasCache.find(x => String(x.id) === String(id));

  if (!v) {
    showToast('No se encontró la venta', 'error');
    return;
  }

  await populateAnimalesSelects(v.id);

  document.getElementById('ev-id').value = v.id;
  document.getElementById('ev-fecha').value = v.fecha || '';
  document.getElementById('ev-cliente').value = v.cliente || '';
  document.getElementById('ev-tipo').value = v.tipo || '';
  document.getElementById('ev-ingreso').value = v.ingreso ?? '';
  document.getElementById('ev-costo').value = v.costo ?? '';
  document.getElementById('ev-peso-vendido').value = v.peso_vendido ?? '';
  document.getElementById('ev-peso-real').value = v.peso_real ?? '';
  document.getElementById('ev-cantidad').value = v.cantidad_animales ?? '';
  document.getElementById('ev-notas').value = v.notas || '';

  toggleVentaFields(document.getElementById('ev-tipo'));
  openModal('modal-edit-venta');
}

async function updateVenta() {
  const id = document.getElementById('ev-id').value;
  const fecha = document.getElementById('ev-fecha').value;
  const tipo = document.getElementById('ev-tipo').value;

  if (!id || !fecha || !tipo) {
    showToast('Fecha y tipo de venta son obligatorios', 'error');
    return;
  }

  const ingreso = document.getElementById('ev-ingreso').value;
  const costo = document.getElementById('ev-costo').value;

  const payload = {
    fecha,
    cliente: document.getElementById('ev-cliente').value.trim() || null,
    tipo,
    ingreso: ingreso !== '' ? parseFloat(ingreso) : null,
    costo: costo !== '' ? parseFloat(costo) : null,
    notas: document.getElementById('ev-notas').value.trim() || null
  };

  if (tipo === 'carne') {
    const pesoVendido = document.getElementById('ev-peso-vendido').value;
    const pesoReal = document.getElementById('ev-peso-real').value;

    payload.peso_vendido = pesoVendido !== '' ? parseFloat(pesoVendido) : null;
    payload.peso_real = pesoReal !== '' ? parseFloat(pesoReal) : null;
    payload.rendimiento = payload.peso_real > 0 && payload.peso_vendido != null
      ? (payload.peso_vendido / payload.peso_real) * 100
      : null;
    payload.cantidad_animales = null;
  }

  if (tipo === 'pie_cria') {
    const cantidad = document.getElementById('ev-cantidad').value;

    payload.cantidad_animales = cantidad !== ''
      ? parseInt(cantidad, 10)
      : null;

    payload.peso_vendido = null;
    payload.peso_real = null;
    payload.rendimiento = null;
  }

  const { error } = await db.from('ventas').update(payload).eq('id', id);

  if (error) {
    console.error(error);
    showToast('Error: ' + error.message, 'error');
    return;
  }

  const nuevosIds = Array.from(document.getElementById('ev-animales').selectedOptions)
    .map(o => o.value)
    .filter(id => id !== '');

  const { data: anteriores } = await db.from('venta_animales').select('animal_id').eq('venta_id', id);

  const anterioresIds = (anteriores || []).map(a => String(a.animal_id));

  await db.from('venta_animales').delete().eq('venta_id', id);

  const quitados = anterioresIds.filter(animalId => !nuevosIds.includes(animalId));

  for (const animalId of quitados) {
    await db.from('animales').update({ estado: 'disponible' }).eq('id', animalId);
  }

  for (const animalId of nuevosIds) {
    await db.from('venta_animales').insert({
      venta_id: id,
      animal_id: animalId
    });

    await db.from('animales').update({ estado: 'vendido' }).eq('id', animalId);
  }

  showToast('✅ Venta actualizada');
  closeModal('modal-edit-venta');
  await loadVentas();

  if (typeof loadAnimales === 'function') {
    await loadAnimales();
  }
}

function toggleVentaFields(selectElement = null) {
  const select = selectElement || this;
  if (!select) return;

  const tipo = select.value;
  const modal = select.closest('.modal');
  if (!modal) return;

  modal.querySelectorAll('.carne-only').forEach(el => {
    el.style.display = tipo === 'carne' ? '' : 'none';
  });

  modal.querySelectorAll('.pie-only').forEach(el => {
    el.style.display = tipo === 'pie_cria' ? '' : 'none';
  });
}

function limpiarFormularioVenta() {
  [
    'v-fecha',
    'v-cliente',
    'v-ingreso',
    'v-costo',
    'v-peso-vendido',
    'v-peso-real',
    'v-cantidad',
    'v-notas'
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  const tipo = document.getElementById('v-tipo');
  if (tipo) {
    tipo.value = '';
    toggleVentaFields(tipo);
  }

  const animales = document.getElementById('v-animales');
  if (animales) {
    Array.from(animales.options).forEach(option => option.selected = false);
  }
}
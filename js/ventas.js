// ventas.js — completo v4

async function loadVentas() {
  loading('table-ventas');
  await refrescarAnimalesCache(); // ✅ mantiene el resumen de borregos y los selects al día
  const { data, error } = await db.from('ventas').select('*').order('fecha', { ascending: false });
  if (error) { showToast('Error cargando ventas', 'error'); return; }
  ventasCache = data || [];
  if (!data || !data.length) {
    document.getElementById('table-ventas').innerHTML = emptyState('💰', 'No hay ventas registradas');
    return;
  }
  const rows = data.map(v => {
    const tipo = v.tipo === 'carne' ? '🥩 Carne' : v.tipo === 'pie_cria' ? '🐑 Pie de Cría' : '—';
    const utilidad = ((v.ingreso||0) - (v.costo||0));
    return `<tr>
      <td>${formatDate(v.fecha)}</td>
      <td>${v.cliente || '—'}</td>
      <td>${tipo}</td>
      <td><strong style="color:var(--verde)">${formatMoney(v.ingreso)}</strong></td>
      <td>${formatMoney(v.costo)}</td>
      <td><strong style="color:${utilidad>=0?'var(--verde)':'#C0392B'}">${formatMoney(utilidad)}</strong></td>
      <td>${v.notas || '—'}</td>
      <td>
        <div style="display:flex;gap:0.3rem">
          <button class="btn btn-edit" onclick="openEditVenta('${v.id}')">✏️</button>
          <button class="btn btn-danger" onclick="deleteVenta('${v.id}')">🗑</button>
        </div>
      </td>
    </tr>`;
  }).join('');
  document.getElementById('table-ventas').innerHTML = `
    <table><thead><tr>
      <th>Fecha</th><th>Cliente</th><th>Tipo</th><th>Ingreso</th><th>Costo</th><th>Utilidad</th><th>Notas</th><th>Acc.</th>
    </tr></thead><tbody>${rows}</tbody></table>`;
  populateVentaSelect();
}

// ✅ Trae los animales más recientes desde la base y actualiza el cache local.
// Se usa antes de abrir los modales de venta para no depender de que
// loadAnimales() ya se haya ejecutado antes (por ejemplo si el usuario
// entra directo a la pestaña Ventas sin pasar por Animales). También
// refresca los selects de padre/madre (si esa función existe) y el
// resumen de borregos, para que todo quede sincronizado.
async function refrescarAnimalesCache() {
  const { data, error } = await db.from('animales').select('*').order('created_at', { ascending: false });
  if (error) { showToast('Error cargando animales', 'error'); return animalesCache || []; }
  animalesCache = data || [];
  if (typeof populateAnimalSelects === 'function') populateAnimalSelects();
  renderResumenBorregos();
  return animalesCache;
}

// ✅ Un animal se considera disponible para vender si NO está explícitamente
// 'vendido' o 'muerto'. Esto cubre también animales cuyo estado haya
// quedado vacío/null por error, en vez de exigir el texto exacto 'activo'.
function animalDisponible(a) {
  return a.estado !== 'vendido' && a.estado !== 'muerto';
}

// ✅ Panel con el resumen de borregos por estado (activos / vendidos / muertos)
// para la pestaña de Ventas. Si el contenedor #resumen-borregos no existe
// en el HTML todavía, esta función simplemente no hace nada.
function renderResumenBorregos() {
  const cont = document.getElementById('resumen-borregos');
  if (!cont) return;

  const activos  = animalesCache.filter(a => a.estado === 'activo' || !a.estado).length;
  const vendidos = animalesCache.filter(a => a.estado === 'vendido').length;
  const muertos  = animalesCache.filter(a => a.estado === 'muerto').length;

  cont.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1rem;margin:1rem 0">
      <div style="border-left:4px solid #2e7d32;background:#f4f9f4;border-radius:8px;padding:0.75rem 1rem">
        <strong>🟢 Activos (${activos})</strong>
      </div>
      <div style="border-left:4px solid #B08900;background:#fbf7ec;border-radius:8px;padding:0.75rem 1rem">
        <strong>💰 Vendidos (${vendidos})</strong>
      </div>
      <div style="border-left:4px solid #555;background:#f2f2f2;border-radius:8px;padding:0.75rem 1rem">
        <strong>⚫ Muertos (${muertos})</strong>
      </div>
    </div>`;
}

// ✅ Abrir modal y poblar animales disponibles
async function openModalVenta() {
  await refrescarAnimalesCache();

  const sel = document.getElementById('v-animales');
  if (sel) {
    sel.innerHTML = animalesCache
      .filter(animalDisponible)
      .map(a => `<option value="${a.id}">${a.identificador}${a.nombre ? ' — ' + a.nombre : ''}</option>`)
      .join('');
    if (!sel.innerHTML) sel.innerHTML = '<option disabled>No hay animales disponibles</option>';
  }
  // Limpiar campos
  ['v-fecha','v-cliente','v-ingreso','v-costo','v-peso-vendido','v-peso-real','v-rendimiento','v-cantidad','v-notas'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  document.getElementById('v-tipo').value = '';
  document.querySelectorAll('.carne-only, .pie-only').forEach(el => el.style.display = 'none');
  openModal('modal-venta');
}

// ✅ Ahora acota el toggle al modal donde vive el <select>, para que
// modal-venta y modal-edit-venta no se pisen entre sí (comparten las
// mismas clases .carne-only / .pie-only).
function toggleVentaFields(sel) {
  const tipo = sel.value;
  const scope = sel.closest('.modal') || document;
  scope.querySelectorAll('.carne-only').forEach(el => el.style.display = tipo === 'carne'    ? '' : 'none');
  scope.querySelectorAll('.pie-only').forEach(el   => el.style.display = tipo === 'pie_cria' ? '' : 'none');
}

function calcularRendimientoVenta() {
  const vendido = parseFloat(document.getElementById('v-peso-vendido').value) || 0;
  const real    = parseFloat(document.getElementById('v-peso-real').value)    || 0;
  const rend    = real > 0 ? ((vendido / real) * 100).toFixed(1) : '';
  document.getElementById('v-rendimiento').value = rend;
}

async function saveVenta() {
  const tipo   = document.getElementById('v-tipo').value;
  const fecha  = document.getElementById('v-fecha').value;
  const ingreso = parseFloat(document.getElementById('v-ingreso').value) || null;
  const costo   = parseFloat(document.getElementById('v-costo').value)   || null;

  if (!fecha) { showToast('La fecha es obligatoria', 'error'); return; }
  if (!tipo)  { showToast('Selecciona el tipo de venta', 'error'); return; }

  // Animales seleccionados
  const selAnimales = Array.from(document.getElementById('v-animales').selectedOptions).map(o => o.value).filter(Boolean);

  const payload = {
    fecha,
    cliente:      document.getElementById('v-cliente').value.trim() || null,
    tipo,
    ingreso,
    costo,
    total:        ingreso,
    peso_vendido: tipo === 'carne' ? (parseFloat(document.getElementById('v-peso-vendido').value) || null) : null,
    peso_real:    tipo === 'carne' ? (parseFloat(document.getElementById('v-peso-real').value)    || null) : null,
    rendimiento:  tipo === 'carne' ? (parseFloat(document.getElementById('v-rendimiento').value)  || null) : null,
    cantidad_animales: tipo === 'pie_cria' ? (parseInt(document.getElementById('v-cantidad').value) || null) : null,
    notas:        document.getElementById('v-notas').value.trim() || null,
  };

  const { data: venta, error } = await db.from('ventas').insert(payload).select().single();
  if (error) { showToast('Error: ' + error.message, 'error'); return; }

  // ✅ Guardar detalle y marcar animales como vendidos
  for (const animalId of selAnimales) {
    await db.from('detalle_venta').insert({
      id_venta:  venta.id,
      id_animal: animalId,
      precio:    ingreso && selAnimales.length ? parseFloat((ingreso / selAnimales.length).toFixed(2)) : null,
    });
    await db.from('animales').update({ estado: 'vendido' }).eq('id', animalId);
  }

  // ✅ Reflejar el nuevo estado de los animales en memoria al instante
  animalesCache.forEach(a => { if (selAnimales.includes(a.id)) a.estado = 'vendido'; });
  renderResumenBorregos();

  showToast('✅ Venta registrada');
  closeModal('modal-venta');
  loadVentas();
  loadAnimales(); // ✅ actualiza estado en tabla animales
}

// Guardamos aquí los animales que ya pertenecían a la venta que se está
// editando, para poder comparar contra la nueva selección al guardar.
let edVentaAnimalesOriginales = [];

async function openEditVenta(id) {
  const { data: v, error } = await db.from('ventas').select('*').eq('id', id).single();
  if (error || !v) { showToast('Error cargando la venta', 'error'); return; }

  document.getElementById('ev-id').value      = v.id;
  document.getElementById('ev-fecha').value   = v.fecha   || '';
  document.getElementById('ev-cliente').value = v.cliente || '';
  document.getElementById('ev-tipo').value    = v.tipo    || '';
  document.getElementById('ev-ingreso').value = v.ingreso != null ? v.ingreso : (v.total || '');
  document.getElementById('ev-costo').value   = v.costo   || '';
  document.getElementById('ev-peso-vendido').value = v.peso_vendido != null ? v.peso_vendido : '';
  document.getElementById('ev-peso-real').value    = v.peso_real    != null ? v.peso_real    : '';
  document.getElementById('ev-cantidad').value     = v.cantidad_animales != null ? v.cantidad_animales : '';
  document.getElementById('ev-notas').value   = v.notas   || '';

  // Mostrar/ocultar campos según tipo (peso vs cantidad), solo dentro de este modal
  toggleVentaFields(document.getElementById('ev-tipo'));

  // ✅ Traer animales frescos de la base (no depender de que loadAnimales()
  // ya se haya ejecutado antes)
  await refrescarAnimalesCache();

  // ✅ Borregos que ya están asociados a esta venta
  const { data: detalles, error: errDet } = await db
    .from('detalle_venta')
    .select('id_animal')
    .eq('id_venta', id);
  if (errDet) { showToast('Error cargando animales de la venta', 'error'); }
  const idsDeEstaVenta = (detalles || []).map(d => d.id_animal).filter(Boolean);
  edVentaAnimalesOriginales = idsDeEstaVenta;

  // ✅ Opciones disponibles: animales activos + los que ya pertenecen a esta venta
  //    (estos últimos están en estado 'vendido', pero deben poder seguir
  //    seleccionados/deseleccionados dentro del modal de edición)
  const sel = document.getElementById('ev-animales');
  const opciones = animalesCache.filter(a =>
    animalDisponible(a) || idsDeEstaVenta.includes(a.id)
  );
  sel.innerHTML = opciones.length
    ? opciones.map(a =>
        `<option value="${a.id}" ${idsDeEstaVenta.includes(a.id) ? 'selected' : ''}>${a.identificador}${a.nombre ? ' — ' + a.nombre : ''}</option>`
      ).join('')
    : '<option disabled>No hay animales disponibles</option>';

  openModal('modal-edit-venta');
}

async function updateVenta() {
  const id      = document.getElementById('ev-id').value;
  const tipo    = document.getElementById('ev-tipo').value;
  const ingreso = parseFloat(document.getElementById('ev-ingreso').value) || null;
  const costo   = parseFloat(document.getElementById('ev-costo').value)   || null;

  const selAnimalesNuevo = Array.from(document.getElementById('ev-animales').selectedOptions)
    .map(o => o.value).filter(Boolean);

  const payload = {
    fecha:   document.getElementById('ev-fecha').value   || null,
    cliente: document.getElementById('ev-cliente').value || null,
    tipo:    tipo || null,
    ingreso, costo, total: ingreso,
    peso_vendido: tipo === 'carne'    ? (parseFloat(document.getElementById('ev-peso-vendido').value) || null) : null,
    peso_real:    tipo === 'carne'    ? (parseFloat(document.getElementById('ev-peso-real').value)    || null) : null,
    cantidad_animales: tipo === 'pie_cria' ? (parseInt(document.getElementById('ev-cantidad').value) || null) : null,
    notas:   document.getElementById('ev-notas').value.trim() || null,
  };

  const { error } = await db.from('ventas').update(payload).eq('id', id);
  if (error) { showToast('Error: ' + error.message, 'error'); return; }

  // ✅ Comparar selección original vs nueva para actualizar detalle_venta y animales
  const originales = edVentaAnimalesOriginales || [];
  const quitados  = originales.filter(a => !selAnimalesNuevo.includes(a));
  const agregados = selAnimalesNuevo.filter(a => !originales.includes(a));

  for (const animalId of quitados) {
    await db.from('detalle_venta').delete().eq('id_venta', id).eq('id_animal', animalId);
    await db.from('animales').update({ estado: 'activo' }).eq('id', animalId);
  }
  for (const animalId of agregados) {
    await db.from('detalle_venta').insert({
      id_venta:  id,
      id_animal: animalId,
      precio: ingreso && selAnimalesNuevo.length ? parseFloat((ingreso / selAnimalesNuevo.length).toFixed(2)) : null,
    });
    await db.from('animales').update({ estado: 'vendido' }).eq('id', animalId);
  }

  // ✅ Reflejar los cambios de estado en memoria al instante
  animalesCache.forEach(a => {
    if (quitados.includes(a.id))  a.estado = 'activo';
    if (agregados.includes(a.id)) a.estado = 'vendido';
  });
  renderResumenBorregos();

  showToast('✅ Venta actualizada');
  closeModal('modal-edit-venta');
  loadVentas();
  loadDetalleVenta();
  loadAnimales();
}

// ✅ Eliminar venta y revertir estado de animales
async function deleteVenta(id) {
  if (!confirm('¿Seguro que deseas eliminar esta venta y revertir el estado de los animales?')) return;
  const { data: detalles } = await db.from('detalle_venta').select('id_animal').eq('id_venta', id);
  if (detalles?.length) {
    for (const d of detalles) {
      if (d.id_animal) await db.from('animales').update({ estado: 'activo' }).eq('id', d.id_animal);
    }
    // ✅ Reflejar de inmediato en memoria
    const idsRevertidos = detalles.map(d => d.id_animal).filter(Boolean);
    animalesCache.forEach(a => { if (idsRevertidos.includes(a.id)) a.estado = 'activo'; });
    renderResumenBorregos();
  }
  const { error } = await db.from('ventas').delete().eq('id', id);
  if (error) { showToast('Error: ' + error.message, 'error'); return; }
  showToast('🗑 Venta eliminada');
  loadVentas();
  loadAnimales();
}

function populateVentaSelect() {
  const el = document.getElementById('d-venta');
  if (!el) return;
  el.innerHTML = '<option value="">Seleccionar venta...</option>' +
    ventasCache.map(v =>
      `<option value="${v.id}">${formatDate(v.fecha)} — ${v.cliente || 'Sin cliente'} (${formatMoney(v.total)})</option>`
    ).join('');
}

// DETALLE VENTA
async function loadDetalleVenta() {
  loading('table-detalle_venta');
  const { data, error } = await db.from('detalle_venta').select(`
    *, venta:id_venta(fecha,cliente), animal:id_animal(identificador,nombre)
  `).order('id', { ascending: false });
  if (error) { showToast('Error cargando detalle', 'error'); return; }
  if (!data || !data.length) {
    document.getElementById('table-detalle_venta').innerHTML = emptyState('🧾', 'No hay detalle de ventas'); return;
  }
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
          <button class="btn btn-edit" onclick="openEditDetalle('${d.id}','${d.id_venta}','${d.precio||''}','${d.peso||''}','${(d.notas||'').replace(/'/g,'')}')">✏️</button>
          <button class="btn btn-danger" onclick="deleteDetalle('${d.id}','${d.id_animal}')">🗑</button>
        </div>
      </td>
    </tr>`).join('');
  document.getElementById('table-detalle_venta').innerHTML = `
    <table><thead><tr>
      <th>Venta</th><th>ID Animal</th><th>Nombre</th><th>Precio</th><th>Peso</th><th>Notas</th><th>Acc.</th>
    </tr></thead><tbody>${rows}</tbody></table>`;
}

function openModalDetalle() {
  populateVentaSelect();
  const selAnimal = document.getElementById('d-animal');
  if (selAnimal) {
    selAnimal.innerHTML = '<option value="">Seleccionar animal...</option>' +
      animalesCache.filter(animalDisponible).map(a =>
        `<option value="${a.id}">${a.identificador}${a.nombre?' — '+a.nombre:''}</option>`).join('');
  }
  openModal('modal-detalle');
}

async function saveDetalle() {
  const animalId = document.getElementById('d-animal').value;
  const payload = {
    id_venta:  document.getElementById('d-venta').value,
    id_animal: animalId,
    precio:    document.getElementById('d-precio').value ? parseFloat(document.getElementById('d-precio').value) : null,
    peso:      document.getElementById('d-peso').value   ? parseFloat(document.getElementById('d-peso').value)   : null,
    notas:     document.getElementById('d-notas').value.trim() || null,
  };
  if (!payload.id_venta || !payload.id_animal) { showToast('Venta y animal son obligatorios', 'error'); return; }
  const { error } = await db.from('detalle_venta').insert(payload);
  if (error) { showToast('Error: ' + error.message, 'error'); return; }
  if (animalId) {
    await db.from('animales').update({ estado: 'vendido' }).eq('id', animalId);
    const a = animalesCache.find(a => a.id === animalId); if (a) a.estado = 'vendido';
  }
  showToast('✅ Detalle registrado');
  closeModal('modal-detalle');
  loadDetalleVenta();
  loadAnimales();
}

function openEditDetalle(id, idVenta, precio, peso, notas) {
  document.getElementById('ed-id').value     = id;
  document.getElementById('ed-precio').value = precio;
  document.getElementById('ed-peso').value   = peso;
  document.getElementById('ed-notas').value  = notas;
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

// ✅ Eliminar detalle y revertir estado animal
async function deleteDetalle(id, animalId) {
  if (!confirm('¿Seguro que deseas eliminar este registro?')) return;
  const { error } = await db.from('detalle_venta').delete().eq('id', id);
  if (error) { showToast('Error al eliminar: ' + error.message, 'error'); return; }
  if (animalId) {
    await db.from('animales').update({ estado: 'activo' }).eq('id', animalId);
    const a = animalesCache.find(a => a.id === animalId); if (a) a.estado = 'activo';
  }
  showToast('🗑 Registro eliminado');
  loadDetalleVenta();
  loadAnimales();
}
// animales.js — Registro y gestión de animales

const RAZAS_BASE = ['Pelifok','Dorper','Kathadin'];
var razasCache = [...RAZAS_BASE];

async function loadRazas() {
  const { data } = await db.from('razas').select('nombre').order('nombre');
  if (data?.length) razasCache = data.map(r => r.nombre);
  renderRazasSelect();
}

function renderRazasSelect() {
  const sel = document.getElementById('a-raza');
  if (!sel) return;
  const current = sel.value;
  sel.innerHTML = '<option value="">Seleccionar raza...</option>' +
    razasCache.map(r => `<option value="${r}">${r}</option>`).join('') +
    '<option value="__nueva__">➕ Agregar nueva raza...</option>';
  if (current) sel.value = current;
}

async function onRazaChange() {
  const sel = document.getElementById('a-raza');
  if (sel.value !== '__nueva__') return;
  const nueva = prompt('Nombre de la nueva raza:');
  if (!nueva || !nueva.trim()) { sel.value = ''; return; }
  const nombre = nueva.trim();
  await db.from('razas').insert({ nombre }).select();
  if (!razasCache.includes(nombre)) razasCache.push(nombre);
  razasCache.sort();
  renderRazasSelect();
  sel.value = nombre;
}

function calcularEdad(fechaNac) {
  if (!fechaNac) return '—';
  const hoy = new Date();
  const nac = new Date(fechaNac + 'T12:00:00');
  let años = hoy.getFullYear() - nac.getFullYear();
  let meses = hoy.getMonth() - nac.getMonth();
  if (meses < 0) { años--; meses += 12; }
  if (hoy.getDate() < nac.getDate()) meses--;
  if (años > 0) return `${años} año${años>1?'s':''} ${meses>0?meses+'m':''}`.trim();
  if (meses > 0) return `${meses} mes${meses>1?'es':''}`;
  const dias = Math.floor((hoy - nac) / (1000*60*60*24));
  return `${dias} día${dias!==1?'s':''}`;
}

const ESTADO_PROD_LABELS = {
  gestante:'Gestante', parida:'Parida', servicio:'Servicio',
  primala:'Primala', cordera:'Cordera', lactando:'Lactando',
  destetada:'Destetada', semental:'Semental', engorda:'Engorda'
};
const TIPO_NAC_LABELS = { sencillo:'Sencillo', doble:'Doble', triple:'Triple' };
const ESTADO_PROD_BADGES = {
  gestante:'badge-gestando', parida:'badge-pario', servicio:'badge-macho',
  primala:'badge-hembra', cordera:'badge-vendido', lactando:'badge-activo',
  destetada:'badge-vendido', semental:'badge-macho', engorda:'badge-muerto'
};

async function loadAnimales() {
  loading('table-animales');
  const { data, error } = await db.from('animales').select('*').order('created_at', { ascending: false });
  if (error) { showToast('Error cargando animales', 'error'); return; }
  animalesCache = data || [];
  renderAnimalesTable(data);
  populateAnimalSelects();
}

function renderAnimalesTable(data) {
  if (!data || !data.length) {
    document.getElementById('table-animales').innerHTML = emptyState('🐑', 'No hay animales registrados aún');
    return;
  }
  const rows = data.map(a => `
    <tr>
      <td><strong>${a.identificador}</strong></td>
      <td>${a.nombre || '—'}</td>
      <td>${badge(a.sexo, {'macho':'badge-macho','hembra':'badge-hembra'})}</td>
      <td>${a.raza || '—'}</td>
      <td title="${a.fecha_nacimiento || ''}">${calcularEdad(a.fecha_nacimiento)}</td>
      <td>${badge(a.estado, {'activo':'badge-activo','vendido':'badge-vendido','muerto':'badge-muerto'})}</td>
      <td>${a.estado_productivo ? badge(a.estado_productivo, ESTADO_PROD_BADGES) : '—'}</td>
      <td>${a.peso_inicial ? a.peso_inicial + ' kg' : '—'}</td>
      <td>${a.numero_partos ?? '—'}</td>
      <td>
        <div style="display:flex;gap:0.3rem">
          <button class="btn btn-edit" onclick="openEditAnimal('${a.id}')">✏️</button>
          <button class="btn btn-danger" onclick="deleteRecord('animales','${a.id}',loadAnimales)">🗑</button>
        </div>
      </td>
    </tr>`).join('');
  document.getElementById('table-animales').innerHTML = `
    <table>
      <thead><tr>
        <th>ID</th><th>Nombre</th><th>Sexo</th><th>Raza</th>
        <th>Edad</th><th>Estado</th><th>Est. Productivo</th><th>Peso</th><th>Partos</th><th>Acc.</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

async function saveAnimal() {
  const padreVal = document.getElementById('a-padre').value;
  const madreVal = document.getElementById('a-madre').value;
  const padreManual = document.getElementById('a-padre-manual').value.trim();
  const madreManual = document.getElementById('a-madre-manual').value.trim();

  const payload = {
    identificador:    document.getElementById('a-identificador').value.trim(),
    nombre:           document.getElementById('a-nombre').value.trim() || null,
    sexo:             document.getElementById('a-sexo').value,
    raza:             document.getElementById('a-raza').value !== '__nueva__' ? document.getElementById('a-raza').value || null : null,
    fecha_nacimiento: document.getElementById('a-nacimiento').value || null,
    estado:           document.getElementById('a-estado').value,
    estado_productivo:document.getElementById('a-estado-productivo').value || null,
    numero_partos:    document.getElementById('a-num-partos').value ? parseInt(document.getElementById('a-num-partos').value) : 0,
    tipo_nacimiento:  document.getElementById('a-tipo-nacimiento').value || null,
    notas:            document.getElementById('a-notas').value.trim() || null,
    id_padre:         padreVal || null,
    id_madre:         madreVal || null,
    nombre_padre:     !padreVal && padreManual ? padreManual : null,
    nombre_madre:     !madreVal && madreManual ? madreManual : null,
    peso_inicial:     document.getElementById('a-peso-inicial').value ? parseFloat(document.getElementById('a-peso-inicial').value) : null,
  };

  if (!payload.identificador || !payload.sexo) { showToast('Identificador y sexo son obligatorios', 'error'); return; }

  const { data, error } = await db.from('animales').insert(payload).select().single();
  if (error) { showToast('Error: ' + error.message, 'error'); return; }

  // Si hay peso inicial, registrar en produccion
  if (payload.peso_inicial && data) {
    const fecha = document.getElementById('a-nacimiento').value || new Date().toISOString().split('T')[0];
    await db.from('produccion').insert({ id_animal: data.id, fecha, peso: payload.peso_inicial, observaciones: 'Peso inicial al registro' });
  }

  showToast('✅ Animal registrado exitosamente');
  closeModal('modal-animal');
  resetAnimalForm();
}

function resetAnimalForm() {
  ['a-identificador','a-nombre','a-raza','a-nacimiento','a-notas','a-peso-inicial','a-padre-manual','a-madre-manual','a-num-partos'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  ['a-sexo','a-estado','a-estado-productivo','a-tipo-nacimiento','a-padre','a-madre'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  togglePadreManual(); toggleMadreManual();
}

function togglePadreManual() {
  const sel = document.getElementById('a-padre');
  const manual = document.getElementById('wrap-padre-manual');
  if (manual) manual.style.display = sel && sel.value === '' ? 'block' : 'none';
}

function toggleMadreManual() {
  const sel = document.getElementById('a-madre');
  const manual = document.getElementById('wrap-madre-manual');
  if (manual) manual.style.display = sel && sel.value === '' ? 'block' : 'none';
}

// ---- EDITAR ANIMAL ----
async function openEditAnimal(id) {
  const { data: a, error } = await db.from('animales').select('*').eq('id', id).single();
  if (error) { showToast('Error cargando animal', 'error'); return; }

  document.getElementById('ea-id').value             = a.id;
  document.getElementById('ea-identificador').value  = a.identificador || '';
  document.getElementById('ea-nombre').value         = a.nombre || '';
  document.getElementById('ea-sexo').value           = a.sexo || '';
  document.getElementById('ea-nacimiento').value     = a.fecha_nacimiento || '';
  document.getElementById('ea-estado').value         = a.estado || 'activo';
  document.getElementById('ea-estado-productivo').value = a.estado_productivo || '';
  document.getElementById('ea-num-partos').value     = a.numero_partos ?? '';
  document.getElementById('ea-tipo-nacimiento').value= a.tipo_nacimiento || '';
  document.getElementById('ea-notas').value          = a.notas || '';

  // Raza
  await loadRazas();
  const razaSel = document.getElementById('ea-raza');
  razaSel.innerHTML = '<option value="">Seleccionar raza...</option>' +
    razasCache.map(r => `<option value="${r}">${r}</option>`).join('') +
    '<option value="__nueva__">➕ Agregar nueva raza...</option>';
  razaSel.value = a.raza || '';

  openModal('modal-edit-animal');
}

async function updateAnimal() {
  const id = document.getElementById('ea-id').value;
  const razaVal = document.getElementById('ea-raza').value;

  const payload = {
    identificador:    document.getElementById('ea-identificador').value.trim(),
    nombre:           document.getElementById('ea-nombre').value.trim() || null,
    sexo:             document.getElementById('ea-sexo').value,
    raza:             razaVal !== '__nueva__' ? razaVal || null : null,
    fecha_nacimiento: document.getElementById('ea-nacimiento').value || null,
    estado:           document.getElementById('ea-estado').value,
    estado_productivo:document.getElementById('ea-estado-productivo').value || null,
    numero_partos:    document.getElementById('ea-num-partos').value ? parseInt(document.getElementById('ea-num-partos').value) : 0,
    tipo_nacimiento:  document.getElementById('ea-tipo-nacimiento').value || null,
    notas:            document.getElementById('ea-notas').value.trim() || null,
  };

  if (!payload.identificador || !payload.sexo) { showToast('Identificador y sexo son obligatorios', 'error'); return; }
  const { error } = await db.from('animales').update(payload).eq('id', id);
  if (error) { showToast('Error: ' + error.message, 'error'); return; }
  showToast('✅ Animal actualizado');
  closeModal('modal-edit-animal');
  loadAnimales();
}

function populateAnimalSelects() {
  const selects = ['a-padre','a-madre','r-hembra','r-macho','p-animal','s-animal','d-animal'];
  selects.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const current = el.value;
    const label0 = id === 'a-padre' ? 'Ninguno (registrar manualmente)' : id === 'a-madre' ? 'Ninguna (registrar manualmente)' : 'Seleccionar...';
    el.innerHTML = `<option value="">${label0}</option>` + animalesCache.map(a =>
      `<option value="${a.id}">${a.identificador}${a.nombre ? ' - ' + a.nombre : ''}</option>`
    ).join('');
    el.value = current;
  });
  togglePadreManual();
  toggleMadreManual();
}

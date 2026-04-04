// animales.js — Registro y gestión de animales

// ============= ANIMALES =============
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
      <td>${formatDate(a.fecha_nacimiento)}</td>
      <td>${badge(a.estado, {'activo':'badge-activo','vendido':'badge-vendido','muerto':'badge-muerto'})}</td>
      <td>${formatDate(a.fecha_ingreso)}</td>
      <td>
        <button class="btn btn-danger" onclick="deleteRecord('animales','${a.id}',loadAnimales)">🗑</button>
      </td>
    </tr>`).join('');
  document.getElementById('table-animales').innerHTML = `
    <table>
      <thead><tr>
        <th>ID</th><th>Nombre</th><th>Sexo</th><th>Raza</th>
        <th>Nacimiento</th><th>Estado</th><th>Ingreso</th><th>Acc.</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

async function saveAnimal() {
  const payload = {
    identificador: document.getElementById('a-identificador').value.trim(),
    nombre: document.getElementById('a-nombre').value.trim() || null,
    sexo: document.getElementById('a-sexo').value,
    raza: document.getElementById('a-raza').value.trim() || null,
    fecha_nacimiento: document.getElementById('a-nacimiento').value || null,
    estado: document.getElementById('a-estado').value,
    id_padre: document.getElementById('a-padre').value || null,
    id_madre: document.getElementById('a-madre').value || null,
  };
  if (!payload.identificador || !payload.sexo) { showToast('Identificador y sexo son obligatorios', 'error'); return; }
  const { error } = await db.from('animales').insert(payload);
  if (error) { showToast('Error: ' + error.message, 'error'); return; }
  showToast('✅ Animal registrado exitosamente');
  closeModal('modal-animal');
  document.getElementById('a-identificador').value = '';
  document.getElementById('a-nombre').value = '';
  document.getElementById('a-sexo').value = '';
  document.getElementById('a-raza').value = '';
  document.getElementById('a-nacimiento').value = '';
}

function populateAnimalSelects() {
  const selects = ['a-padre','a-madre','r-hembra','r-macho','p-animal','s-animal','d-animal'];
  selects.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const current = el.value;
    const label0 = id === 'a-padre' ? 'Ninguno' : id === 'a-madre' ? 'Ninguna' : 'Seleccionar...';
    el.innerHTML = `<option value="">${label0}</option>` + animalesCache.map(a =>
      `<option value="${a.id}">${a.identificador}${a.nombre ? ' - ' + a.nombre : ''}</option>`
    ).join('');
    el.value = current;
  });
}
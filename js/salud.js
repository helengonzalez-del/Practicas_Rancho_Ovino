// salud.js — Eventos de salud animal

async function loadSalud() {
  loading('table-salud');
  const { data, error } = await db.from('salud').select(`*,animal:id_animal(identificador,nombre)`).order('fecha', { ascending: false });
  if (error) { showToast('Error cargando salud', 'error'); return; }
  if (!data || !data.length) { document.getElementById('table-salud').innerHTML = emptyState('💉', 'No hay eventos de salud'); return; }
  const tipoMap = { enfermedad:'badge-muerto', vacuna:'badge-activo', tratamiento:'badge-gestando', desparasitacion:'badge-vendido' };
  const rows = data.map(s => `
    <tr>
      <td>${s.animal ? s.animal.identificador : '—'}</td>
      <td>${formatDate(s.fecha)}</td>
      <td>${badge(s.tipo, tipoMap)}</td>
      <td>${s.diagnostico || '—'}</td>
      <td>${s.medicamento || '—'}</td>
      <td>${s.dosis || '—'}</td>
      <td>${s.notas || '—'}</td>
      <td>
        <div style="display:flex;gap:0.3rem">
          <button class="btn btn-edit" onclick="openEditSalud('${s.id}')">✏️</button>
          <button class="btn btn-danger" onclick="deleteRecord('salud','${s.id}',loadSalud)">🗑</button>
        </div>
      </td>
    </tr>`).join('');
  document.getElementById('table-salud').innerHTML = `
    <table><thead><tr><th>Animal</th><th>Fecha</th><th>Tipo</th><th>Diagnóstico</th><th>Medicamento</th><th>Dosis</th><th>Notas</th><th>Acc.</th></tr></thead>
    <tbody>${rows}</tbody></table>`;
}

async function saveSalud() {
  const payload = {
    id_animal:    document.getElementById('s-animal').value,
    fecha:        document.getElementById('s-fecha').value,
    tipo:         document.getElementById('s-tipo').value,
    medicamento:  document.getElementById('s-medicamento').value || null,
    dosis:        document.getElementById('s-dosis').value || null,
    diagnostico:  document.getElementById('s-diagnostico').value || null,
    tratamiento:  document.getElementById('s-tratamiento').value || null,
    observaciones:document.getElementById('s-observaciones').value || null,
    notas:        document.getElementById('s-notas').value.trim() || null,
  };
  if (!payload.id_animal || !payload.fecha || !payload.tipo) { showToast('Animal, fecha y tipo son obligatorios', 'error'); return; }
  const { error } = await db.from('salud').insert(payload);
  if (error) { showToast('Error: ' + error.message, 'error'); return; }
  showToast('✅ Evento de salud registrado');
  closeModal('modal-salud');
}

async function openEditSalud(id) {
  const { data: s } = await db.from('salud').select('*').eq('id', id).single();
  if (!s) return;
  document.getElementById('es-id').value           = s.id;
  document.getElementById('es-fecha').value         = s.fecha || '';
  document.getElementById('es-tipo').value          = s.tipo || '';
  document.getElementById('es-medicamento').value   = s.medicamento || '';
  document.getElementById('es-dosis').value         = s.dosis || '';
  document.getElementById('es-diagnostico').value   = s.diagnostico || '';
  document.getElementById('es-tratamiento').value   = s.tratamiento || '';
  document.getElementById('es-observaciones').value = s.observaciones || '';
  document.getElementById('es-notas').value         = s.notas || '';
  openModal('modal-edit-salud');
}

async function updateSalud() {
  const id = document.getElementById('es-id').value;
  const payload = {
    fecha:        document.getElementById('es-fecha').value,
    tipo:         document.getElementById('es-tipo').value,
    medicamento:  document.getElementById('es-medicamento').value || null,
    dosis:        document.getElementById('es-dosis').value || null,
    diagnostico:  document.getElementById('es-diagnostico').value || null,
    tratamiento:  document.getElementById('es-tratamiento').value || null,
    observaciones:document.getElementById('es-observaciones').value || null,
    notas:        document.getElementById('es-notas').value.trim() || null,
  };
  const { error } = await db.from('salud').update(payload).eq('id', id);
  if (error) { showToast('Error: ' + error.message, 'error'); return; }
  showToast('✅ Evento actualizado');
  closeModal('modal-edit-salud');
  loadSalud();
}

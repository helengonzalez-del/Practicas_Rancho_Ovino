// salud.js — Eventos de salud animal

// ============= SALUD =============
async function loadSalud() {
  loading('table-salud');
  const { data, error } = await db.from('salud').select(`
    *, animal:id_animal(identificador,nombre)
  `).order('fecha', { ascending: false });
  if (error) { showToast('Error cargando salud', 'error'); return; }
  if (!data || !data.length) {
    document.getElementById('table-salud').innerHTML = emptyState('💉', 'No hay eventos de salud registrados');
    return;
  }
  const tipoMap = { 'enfermedad':'badge-muerto','vacuna':'badge-activo','tratamiento':'badge-gestando','desparasitacion':'badge-vendido' };
  const rows = data.map(s => `
    <tr>
      <td>${s.animal ? s.animal.identificador : '—'}</td>
      <td>${formatDate(s.fecha)}</td>
      <td>${badge(s.tipo, tipoMap)}</td>
      <td>${s.diagnostico || '—'}</td>
      <td>${s.medicamento || '—'}</td>
      <td>${s.dosis || '—'}</td>
      <td>${s.tratamiento || '—'}</td>
      <td><button class="btn btn-danger" onclick="deleteRecord('salud','${s.id}',loadSalud)">🗑</button></td>
    </tr>`).join('');
  document.getElementById('table-salud').innerHTML = `
    <table>
      <thead><tr>
        <th>Animal</th><th>Fecha</th><th>Tipo</th><th>Diagnóstico</th>
        <th>Medicamento</th><th>Dosis</th><th>Tratamiento</th><th>Acc.</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

async function saveSalud() {
  const payload = {
    id_animal: document.getElementById('s-animal').value,
    fecha: document.getElementById('s-fecha').value,
    tipo: document.getElementById('s-tipo').value,
    medicamento: document.getElementById('s-medicamento').value || null,
    dosis: document.getElementById('s-dosis').value || null,
    diagnostico: document.getElementById('s-diagnostico').value || null,
    tratamiento: document.getElementById('s-tratamiento').value || null,
    observaciones: document.getElementById('s-observaciones').value || null,
  };
  if (!payload.id_animal || !payload.fecha || !payload.tipo) { showToast('Animal, fecha y tipo son obligatorios', 'error'); return; }
  const { error } = await db.from('salud').insert(payload);
  if (error) { showToast('Error: ' + error.message, 'error'); return; }
  showToast('✅ Evento de salud registrado');
  closeModal('modal-salud');
}
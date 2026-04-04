// produccion.js — Registro de pesos

// ============= PRODUCCION =============
async function loadProduccion() {
  loading('table-produccion');
  const { data, error } = await db.from('produccion').select(`
    *, animal:id_animal(identificador,nombre)
  `).order('fecha', { ascending: false });
  if (error) { showToast('Error cargando producción', 'error'); return; }
  if (!data || !data.length) {
    document.getElementById('table-produccion').innerHTML = emptyState('⚖️', 'No hay registros de peso');
    return;
  }
  const rows = data.map(p => `
    <tr>
      <td>${p.animal ? p.animal.identificador : '—'}</td>
      <td>${p.animal ? (p.animal.nombre || '—') : '—'}</td>
      <td>${formatDate(p.fecha)}</td>
      <td><strong>${p.peso ? p.peso + ' kg' : '—'}</strong></td>
      <td>${p.observaciones || '—'}</td>
      <td><button class="btn btn-danger" onclick="deleteRecord('produccion','${p.id}',loadProduccion)">🗑</button></td>
    </tr>`).join('');
  document.getElementById('table-produccion').innerHTML = `
    <table>
      <thead><tr>
        <th>ID Animal</th><th>Nombre</th><th>Fecha</th><th>Peso</th><th>Observaciones</th><th>Acc.</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

async function saveProduccion() {
  const payload = {
    id_animal: document.getElementById('p-animal').value,
    fecha: document.getElementById('p-fecha').value,
    peso: document.getElementById('p-peso').value ? parseFloat(document.getElementById('p-peso').value) : null,
    observaciones: document.getElementById('p-observaciones').value || null,
  };
  if (!payload.id_animal || !payload.fecha) { showToast('Animal y fecha son obligatorios', 'error'); return; }
  const { error } = await db.from('produccion').insert(payload);
  if (error) { showToast('Error: ' + error.message, 'error'); return; }
  showToast('✅ Peso registrado');
  closeModal('modal-produccion');
}
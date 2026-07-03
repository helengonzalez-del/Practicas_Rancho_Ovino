// produccion.js — Registro de pesos

async function loadProduccion() {
  loading('table-produccion');
  const { data, error } = await db.from('produccion').select(`*,animal:id_animal(identificador,nombre)`).order('fecha', { ascending: false });
  if (error) { showToast('Error cargando producción', 'error'); return; }
  if (!data || !data.length) { document.getElementById('table-produccion').innerHTML = emptyState('⚖️', 'No hay registros de peso'); return; }
  const rows = data.map(p => `
    <tr>
      <td>${p.animal ? p.animal.identificador : '—'}</td>
      <td>${p.animal ? (p.animal.nombre || '—') : '—'}</td>
      <td>${formatDate(p.fecha)}</td>
      <td><strong>${p.peso != null ? p.peso + ' kg' : '—'}</strong></td>
      <td>${p.observaciones || '—'}</td>
      <td>
        <div style="display:flex;gap:0.3rem">
          <button class="btn btn-edit" onclick="openEditProduccion('${p.id}','${p.fecha||''}','${p.peso||''}','${(p.observaciones||'').replace(/'/g,'')}')">✏️</button>
          <button class="btn btn-danger" onclick="deleteRecord('produccion','${p.id}',loadProduccion)">🗑</button>
        </div>
      </td>
    </tr>`).join('');
  document.getElementById('table-produccion').innerHTML = `
    <table><thead><tr><th>ID Animal</th><th>Nombre</th><th>Fecha</th><th>Peso</th><th>Observaciones</th><th>Acc.</th></tr></thead>
    <tbody>${rows}</tbody></table>`;
}

async function saveProduccion() {
  const payload = {
    id_animal:    document.getElementById('p-animal').value,
    fecha:        document.getElementById('p-fecha').value,
    peso:         document.getElementById('p-peso').value ? parseFloat(document.getElementById('p-peso').value) : null,
    observaciones:document.getElementById('p-observaciones').value || null,
  };
  if (!payload.id_animal || !payload.fecha) { showToast('Animal y fecha son obligatorios', 'error'); return; }
  const { error } = await db.from('produccion').insert(payload);
  if (error) { showToast('Error: ' + error.message, 'error'); return; }
  showToast('✅ Peso registrado');
  closeModal('modal-produccion');
}

function openEditProduccion(id, fecha, peso, obs) {
  document.getElementById('ep2-id').value    = id;
  document.getElementById('ep2-fecha').value = fecha;
  document.getElementById('ep2-peso').value  = peso;
  document.getElementById('ep2-obs').value   = obs;
  openModal('modal-edit-produccion');
}

async function updateProduccion() {
  const id = document.getElementById('ep2-id').value;
  const payload = {
    fecha:        document.getElementById('ep2-fecha').value,
    peso:         document.getElementById('ep2-peso').value ? parseFloat(document.getElementById('ep2-peso').value) : null,
    observaciones:document.getElementById('ep2-obs').value || null,
  };
  const { error } = await db.from('produccion').update(payload).eq('id', id);
  if (error) { showToast('Error: ' + error.message, 'error'); return; }
  showToast('✅ Peso actualizado');
  closeModal('modal-edit-produccion');
  loadProduccion();
}

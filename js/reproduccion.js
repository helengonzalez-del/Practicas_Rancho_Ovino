// reproduccion.js — Empadres y partos

async function loadReproduccion() {
  loading('table-reproduccion');
  const { data, error } = await db
    .from('reproduccion')
    .select(`*, hembra:id_hembra(identificador,nombre), macho:id_macho(identificador,nombre)`)
    .order('created_at', { ascending: false });

  if (error) { showToast('Error cargando reproducción: ' + error.message, 'error'); return; }
  if (!data || !data.length) {
    document.getElementById('table-reproduccion').innerHTML = emptyState('🐣', 'No hay registros de reproducción');
    return;
  }

  const rows = data.map(r => `
    <tr>
      <td>${r.hembra ? r.hembra.identificador : '—'}</td>
      <td>${r.macho  ? r.macho.identificador  : '—'}</td>
      <td>${formatDate(r.fecha_empadre)}</td>
      <td>${formatDate(r.fecha_parto_estimada)}</td>
      <td>${formatDate(r.fecha_parto_real)}</td>
      <td>${r.numero_crias ?? '—'}</td>
      <td>${badge(r.estado, { gestando:'badge-gestando', pario:'badge-pario', fallido:'badge-fallido' })}</td>
      <td>${r.observaciones || '—'}</td>
      <td style="display:flex;gap:0.4rem">
        <button class="btn btn-edit" onclick="openEditParto('${r.id}','${r.fecha_parto_real || ''}','${r.numero_crias ?? ''}','${r.estado}','${(r.observaciones || '').replace(/'/g, '')}')">✏️</button>
        <button class="btn btn-danger" onclick="deleteRecord('reproduccion','${r.id}',loadReproduccion)">🗑</button>
      </td>
    </tr>`).join('');

  document.getElementById('table-reproduccion').innerHTML = `
    <table>
      <thead><tr>
        <th>Hembra</th><th>Macho</th><th>Empadre</th><th>Parto Est.</th>
        <th>Parto Real</th><th>Crías</th><th>Estado</th><th>Observaciones</th><th>Acc.</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function openEditParto(id, partoReal, crias, estado, observaciones) {
  document.getElementById('ep-id').value            = id;
  document.getElementById('ep-parto-real').value    = partoReal;
  document.getElementById('ep-crias').value         = crias;
  document.getElementById('ep-estado').value        = estado;
  document.getElementById('ep-observaciones').value = observaciones;
  openModal('modal-editar-parto');
}

async function updateParto() {
  const id = document.getElementById('ep-id').value;
  const payload = {
    fecha_parto_real: document.getElementById('ep-parto-real').value || null,
    numero_crias:     document.getElementById('ep-crias').value ? parseInt(document.getElementById('ep-crias').value) : null,
    estado:           document.getElementById('ep-estado').value,
    observaciones:    document.getElementById('ep-observaciones').value || null,
  };

  const { error } = await db.from('reproduccion').update(payload).eq('id', id);
  if (error) { showToast('Error: ' + error.message, 'error'); return; }

  showToast('✅ Parto actualizado correctamente');
  closeModal('modal-editar-parto');
}

async function saveReproduccion() {
  const payload = {
    id_hembra:       document.getElementById('r-hembra').value,
    id_macho:        document.getElementById('r-macho').value,
    fecha_empadre:   document.getElementById('r-empadre').value,
    fecha_parto_real:document.getElementById('r-parto-real').value || null,
    numero_crias:    document.getElementById('r-crias').value ? parseInt(document.getElementById('r-crias').value) : null,
    estado:          document.getElementById('r-estado').value,
    observaciones:   document.getElementById('r-observaciones').value || null,
  };

  if (!payload.id_hembra || !payload.id_macho || !payload.fecha_empadre) {
    showToast('Hembra, macho y fecha de empadre son obligatorios', 'error'); return;
  }

  const { error } = await db.from('reproduccion').insert(payload);
  if (error) { showToast('Error: ' + error.message, 'error'); return; }

  showToast('✅ Empadre registrado exitosamente');
  closeModal('modal-reproduccion');
}
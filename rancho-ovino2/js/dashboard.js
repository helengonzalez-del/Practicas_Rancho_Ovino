// dashboard.js — Estadísticas y gráficas

// ============= DASHBOARD =============
async function loadDashboard() {
  // Stats animales
  const { data: animals } = await db.from('animales').select('id,sexo,estado');
  const activos = animals?.filter(a => a.estado === 'activo') || [];
  document.getElementById('stat-total').textContent = activos.length;
  document.getElementById('stat-machos').textContent = activos.filter(a => a.sexo === 'macho').length;
  document.getElementById('stat-hembras').textContent = activos.filter(a => a.sexo === 'hembra').length;

  // Stats gestando
  const { data: repro } = await db.from('reproduccion').select('estado');
  const gestando = repro?.filter(r => r.estado === 'gestando') || [];
  document.getElementById('stat-gestando').textContent = gestando.length;

  // Stats ventas
  const { data: ventas } = await db.from('ventas').select('total');
  const totalVentas = ventas?.reduce((s, v) => s + (v.total || 0), 0) || 0;
  document.getElementById('stat-ventas-total').textContent = formatMoney(totalVentas);

  // Stats salud
  const { data: salud } = await db.from('salud').select('id');
  document.getElementById('stat-eventos-salud').textContent = salud?.length || 0;

  // Charts
  buildChartEstado(animals || []);
  await buildChartPesos();
  await buildChartSalud();
  await buildChartVentas();
  await buildProximosPartos();
}

function buildChart(id, type, labels, datasets, options = {}) {
  const ctx = document.getElementById(id);
  if (!ctx) return;
  if (charts[id]) charts[id].destroy();
  charts[id] = new Chart(ctx, {
    type,
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { labels: { font: { family: 'Lato' }, color: '#3D2B1A' } } },
      ...options
    }
  });
}

function buildChartEstado(animals) {
  const activos = animals.filter(a => a.estado === 'activo').length;
  const vendidos = animals.filter(a => a.estado === 'vendido').length;
  const muertos = animals.filter(a => a.estado === 'muerto').length;
  buildChart('chartEstado', 'doughnut',
    ['Activos', 'Vendidos', 'Muertos'],
    [{ data: [activos, vendidos, muertos], backgroundColor: ['#4A6741','#C8A96A','#C0392B'], borderWidth: 0 }]
  );
}

async function buildChartPesos() {
  const { data } = await db.from('produccion').select('fecha,peso').order('fecha');
  if (!data?.length) return;
  const grouped = {};
  data.forEach(p => {
    const mes = p.fecha?.slice(0, 7);
    if (!grouped[mes]) grouped[mes] = [];
    grouped[mes].push(p.peso);
  });
  const labels = Object.keys(grouped).slice(-8);
  const values = labels.map(m => {
    const arr = grouped[m];
    return (arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(2);
  });
  buildChart('chartPesos', 'line', labels,
    [{ label: 'Peso promedio (kg)', data: values, borderColor: '#6B4C2A', backgroundColor: 'rgba(107,76,42,0.1)', tension: 0.4, fill: true, pointBackgroundColor: '#6B4C2A' }],
    { scales: { y: { beginAtZero: false, ticks: { color: '#8A7968' } }, x: { ticks: { color: '#8A7968' } } } }
  );
}

async function buildChartSalud() {
  const { data } = await db.from('salud').select('tipo');
  if (!data?.length) return;
  const counts = {};
  data.forEach(s => { counts[s.tipo] = (counts[s.tipo] || 0) + 1; });
  buildChart('chartSalud', 'bar',
    Object.keys(counts),
    [{ label: 'Eventos', data: Object.values(counts), backgroundColor: ['#4A6741','#C8A96A','#6B4C2A','#8B6340'], borderRadius: 6 }],
    { scales: { y: { beginAtZero: true, ticks: { color: '#8A7968' } }, x: { ticks: { color: '#8A7968' } } } }
  );
}

async function buildChartVentas() {
  const { data } = await db.from('ventas').select('fecha,total').order('fecha');
  if (!data?.length) return;
  const grouped = {};
  data.forEach(v => {
    const mes = v.fecha?.slice(0, 7);
    if (!grouped[mes]) grouped[mes] = 0;
    grouped[mes] += v.total || 0;
  });
  const labels = Object.keys(grouped).slice(-8);
  const values = labels.map(m => grouped[m].toFixed(2));
  buildChart('chartVentas', 'bar', labels,
    [{ label: 'Ventas ($)', data: values, backgroundColor: 'rgba(200,169,106,0.7)', borderColor: '#C8A96A', borderWidth: 2, borderRadius: 6 }],
    { scales: { y: { beginAtZero: true, ticks: { color: '#8A7968' } }, x: { ticks: { color: '#8A7968' } } } }
  );
}

async function buildProximosPartos() {
  const { data } = await db.from('reproduccion').select(`
    fecha_parto_estimada, estado,
    hembra:id_hembra(identificador,nombre)
  `).eq('estado','gestando').order('fecha_parto_estimada');
  
  const cont = document.getElementById('proximos-partos-list');
  if (!data?.length) {
    cont.innerHTML = '<p style="color:var(--gris-calido);padding:1rem">No hay hembras en gestación actualmente.</p>';
    return;
  }
  const hoy = new Date();
  cont.innerHTML = data.map(r => {
    const fecha = new Date(r.fecha_parto_estimada + 'T12:00:00');
    const dias = Math.round((fecha - hoy) / (1000 * 60 * 60 * 24));
    const urgencia = dias <= 7 ? '#C0392B' : dias <= 30 ? '#E67E22' : '#4A6741';
    return `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:0.75rem 1rem;background:var(--crema);border-radius:8px;margin-bottom:0.5rem;border-left:4px solid ${urgencia}">
        <div>
          <strong style="color:var(--tierra)">${r.hembra?.identificador || '—'}</strong>
          <span style="color:var(--gris-calido);font-size:0.85rem;margin-left:0.5rem">${r.hembra?.nombre || ''}</span>
        </div>
        <div style="text-align:right">
          <div style="font-size:0.8rem;color:var(--gris-calido)">Parto estimado</div>
          <div style="font-weight:700;color:${urgencia}">${formatDate(r.fecha_parto_estimada)} (${dias > 0 ? 'en ' + dias + ' días' : 'hoy o ya pasó'})</div>
        </div>
      </div>`;
  }).join('');
}
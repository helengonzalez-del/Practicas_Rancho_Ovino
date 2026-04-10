// dashboard.js — Estadísticas y gráficas

var charts = {};
var anioSeleccionado = new Date().getFullYear();
var animalSeleccionado = '';

async function loadDashboard() {
  const { data: animals } = await db.from('animales').select('id,sexo,estado');
  const activos = animals?.filter(a => a.estado === 'activo') || [];
  document.getElementById('stat-total').textContent   = activos.length;
  document.getElementById('stat-machos').textContent  = activos.filter(a => a.sexo === 'macho').length;
  document.getElementById('stat-hembras').textContent = activos.filter(a => a.sexo === 'hembra').length;

  const { data: repro } = await db.from('reproduccion').select('estado');
  document.getElementById('stat-gestando').textContent = repro?.filter(r => r.estado === 'gestando').length || 0;

  const { data: ventas } = await db.from('ventas').select('total');
  const totalVentas = ventas?.reduce((s, v) => s + (v.total || 0), 0) || 0;
  document.getElementById('stat-ventas-total').textContent = formatMoney(totalVentas);

  const { data: salud } = await db.from('salud').select('id');
  document.getElementById('stat-eventos-salud').textContent = salud?.length || 0;

  buildChartEstado(animals || []);
  await buildChartSalud();
  await buildChartVentas();
  await buildFiltros();
  await buildChartPesos();
  await buildProximosPartos();
}

async function buildFiltros() {
  const { data: animals } = await db.from('animales').select('id,identificador,nombre').order('identificador');

  const selAnimal = document.getElementById('filtro-animal');
  const selAnio   = document.getElementById('filtro-anio');
  if (!selAnimal || !selAnio) return;

  selAnimal.innerHTML = '<option value="">Todos</option>' +
    (animals || []).map(a =>
      `<option value="${a.id}">${a.identificador}${a.nombre ? ' — ' + a.nombre : ''}</option>`
    ).join('');

  if (selAnio.options.length === 0) {
    const anioActual = new Date().getFullYear();
    for (let y = 2024; y <= anioActual + 3; y++) {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      if (y === anioActual) opt.selected = true;
      selAnio.appendChild(opt);
    }
  }
}

function onFiltroChange() {
  animalSeleccionado = document.getElementById('filtro-animal').value;
  anioSeleccionado   = parseInt(document.getElementById('filtro-anio').value);
  buildChartPesos();
}

async function buildChartPesos() {
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

  let query = db.from('produccion').select('fecha,peso,id_animal');
  if (animalSeleccionado) query = query.eq('id_animal', animalSeleccionado);

  const { data } = await query;

  const pesoPorMes = Array(12).fill(null).map(() => []);
  (data || []).forEach(p => {
    if (!p.fecha || !p.peso) return;
    const fecha = new Date(p.fecha + 'T12:00:00');
    if (fecha.getFullYear() !== anioSeleccionado) return;
    pesoPorMes[fecha.getMonth()].push(p.peso);
  });

  const valores = pesoPorMes.map(arr =>
    arr.length ? parseFloat((arr.reduce((s,v) => s+v, 0) / arr.length).toFixed(2)) : null
  );

  const selAnimal = document.getElementById('filtro-animal');
  const labelAnimal = selAnimal?.selectedIndex > 0
    ? selAnimal.options[selAnimal.selectedIndex].text
    : 'Todos';

  buildChart('chartPesos', 'line', meses, [{
    label: `Peso (kg) — ${labelAnimal} ${anioSeleccionado}`,
    data: valores,
    borderColor: '#2E6B3E',
    backgroundColor: 'rgba(46,107,62,0.1)',
    tension: 0.4,
    fill: true,
    pointBackgroundColor: '#2E6B3E',
    pointRadius: 5,
    spanGaps: false
  }], {
    scales: {
      y: { beginAtZero: false, ticks: { color: '#4A7A5A', callback: v => v + ' kg' } },
      x: { ticks: { color: '#4A7A5A' } }
    }
  });
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
      plugins: { legend: { labels: { font: { family: 'Lato' }, color: '#0F3320' } } },
      ...options
    }
  });
}

function buildChartEstado(animals) {
  const activos  = animals.filter(a => a.estado === 'activo').length;
  const vendidos = animals.filter(a => a.estado === 'vendido').length;
  const muertos  = animals.filter(a => a.estado === 'muerto').length;
  buildChart('chartEstado', 'doughnut',
    ['Activos', 'Vendidos', 'Muertos'],
    [{ data: [activos, vendidos, muertos], backgroundColor: ['#1B5E35','#5BAD78','#C0392B'], borderWidth: 0 }]
  );
}

async function buildChartSalud() {
  const { data } = await db.from('salud').select('tipo');
  if (!data?.length) return;
  const counts = {};
  data.forEach(s => { counts[s.tipo] = (counts[s.tipo] || 0) + 1; });
  buildChart('chartSalud', 'bar',
    Object.keys(counts),
    [{ label: 'Eventos', data: Object.values(counts), backgroundColor: ['#1B5E35','#2E7D4F','#5BAD78','#72C490'], borderRadius: 6 }],
    { scales: { y: { beginAtZero: true, ticks: { color: '#4A7A5A' } }, x: { ticks: { color: '#4A7A5A' } } } }
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
    [{ label: 'Ventas ($)', data: values, backgroundColor: 'rgba(91,173,120,0.7)', borderColor: '#5BAD78', borderWidth: 2, borderRadius: 6 }],
    { scales: { y: { beginAtZero: true, ticks: { color: '#4A7A5A' } }, x: { ticks: { color: '#4A7A5A' } } } }
  );
}

async function buildProximosPartos() {
  const { data } = await db.from('reproduccion')
    .select(`fecha_parto_estimada, estado, hembra:id_hembra(identificador,nombre)`)
    .eq('estado','gestando')
    .order('fecha_parto_estimada');

  const cont = document.getElementById('proximos-partos-list');
  if (!data?.length) {
    cont.innerHTML = '<p style="color:var(--gris-calido);padding:1rem">No hay hembras en gestación actualmente.</p>';
    return;
  }
  const hoy = new Date();
  cont.innerHTML = data.map(r => {
    const fecha    = new Date(r.fecha_parto_estimada + 'T12:00:00');
    const dias     = Math.round((fecha - hoy) / (1000 * 60 * 60 * 24));
    const urgencia = dias <= 7 ? '#C0392B' : dias <= 30 ? '#E67E22' : '#1B5E35';
    return `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:0.75rem 1rem;
        background:var(--crema);border-radius:8px;margin-bottom:0.5rem;border-left:4px solid ${urgencia}">
        <div>
          <strong style="color:var(--tierra)">${r.hembra?.identificador || '—'}</strong>
          <span style="color:var(--gris-calido);font-size:0.85rem;margin-left:0.5rem">${r.hembra?.nombre || ''}</span>
        </div>
        <div style="text-align:right">
          <div style="font-size:0.8rem;color:var(--gris-calido)">Parto estimado</div>
          <div style="font-weight:700;color:${urgencia}">
            ${formatDate(r.fecha_parto_estimada)} (${dias > 0 ? 'en ' + dias + ' días' : 'hoy o ya pasó'})
          </div>
        </div>
      </div>`;
  }).join('');
}
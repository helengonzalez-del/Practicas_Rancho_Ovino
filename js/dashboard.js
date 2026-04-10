// dashboard.js — Estadísticas y gráficas

let charts = {};
let anioSeleccionado = new Date().getFullYear();
let animalSeleccionado = '';

async function loadDashboard() {
  try {
    const { data: animals } = await db.from('animales').select('id,sexo,estado');
    const activos = animals?.filter(a => a.estado === 'activo') || [];

    document.getElementById('stat-total').textContent   = activos.length;
    document.getElementById('stat-machos').textContent  = activos.filter(a => a.sexo === 'macho').length;
    document.getElementById('stat-hembras').textContent = activos.filter(a => a.sexo === 'hembra').length;

    const { data: repro } = await db.from('reproduccion').select('estado');
    document.getElementById('stat-gestando').textContent =
      repro?.filter(r => r.estado === 'gestando').length || 0;

    const { data: ventas } = await db.from('ventas').select('total');
    const totalVentas = ventas?.reduce((s, v) => s + (v.total || 0), 0) || 0;
    document.getElementById('stat-ventas-total').textContent = formatMoney(totalVentas);

    const { data: salud } = await db.from('salud').select('id');
    document.getElementById('stat-eventos-salud').textContent = salud?.length || 0;

    buildChartEstado(animals || []);
    await buildChartSalud();
    await buildChartVentas();

    await buildFiltros();      // 🔥 primero filtros
    await buildChartPesos();   // 🔥 luego gráfica

    await buildProximosPartos();

  } catch (err) {
    console.error('Error en dashboard:', err);
  }
}

// ── FILTROS ─────────────────────────────────────────
async function buildFiltros() {
  const selectAnimal = document.getElementById('filtro-animal');
  const selectAnio   = document.getElementById('filtro-anio');

  if (!selectAnimal || !selectAnio) return;

  const { data: animals } = await db
    .from('animales')
    .select('id,identificador,nombre')
    .eq('estado','activo')
    .order('identificador');

  selectAnimal.innerHTML = `
    <option value="">Todos</option>
    ${(animals || []).map(a =>
      `<option value="${a.id}">
        ${a.identificador}${a.nombre ? ' — ' + a.nombre : ''}
      </option>`
    ).join('')}
  `;

  const anioActual = new Date().getFullYear();
  const anios = [];
  for (let y = 2024; y <= anioActual + 3; y++) anios.push(y);

  selectAnio.innerHTML = anios.map(y =>
    `<option value="${y}" ${y === anioActual ? 'selected' : ''}>${y}</option>`
  ).join('');

  anioSeleccionado = anioActual;
  animalSeleccionado = '';

  onFiltroChange(); // 🔥 fuerza primera carga
}

function onFiltroChange() {
  animalSeleccionado = document.getElementById('filtro-animal').value;
  anioSeleccionado   = parseInt(document.getElementById('filtro-anio').value);
  buildChartPesos();
}

// ── GRÁFICA PESOS ───────────────────────────────────
async function buildChartPesos() {
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

  let query = db.from('produccion').select('fecha,peso,id_animal');

  if (animalSeleccionado) {
    query = query.eq('id_animal', animalSeleccionado);
  }

  const { data } = await query;

  const pesoPorMes = Array(12).fill(null).map(() => []);

  (data || []).forEach(p => {
    if (!p.fecha) return;
    const fecha = new Date(p.fecha + 'T12:00:00');
    if (fecha.getFullYear() !== anioSeleccionado) return;
    pesoPorMes[fecha.getMonth()].push(p.peso);
  });

  const valores = pesoPorMes.map(arr =>
    arr.length ? parseFloat((arr.reduce((s,v) => s+v, 0) / arr.length).toFixed(2)) : null
  );

  const label = animalSeleccionado
    ? document.getElementById('filtro-animal').selectedOptions[0].text
    : 'Todos';

  buildChart('chartPesos', 'line', meses, [{
    label: `Peso (kg) — ${label} ${anioSeleccionado}`,
    data: valores,
    borderColor: '#2E6B3E',
    backgroundColor: 'rgba(46,107,62,0.1)',
    tension: 0.4,
    fill: true,
    pointRadius: 5
  }]);
}

// ── BASE CHART ──────────────────────────────────────
function buildChart(id, type, labels, datasets, options = {}) {
  const ctx = document.getElementById(id);
  if (!ctx) return;
  if (charts[id]) charts[id].destroy();

  charts[id] = new Chart(ctx, {
    type,
    data: { labels, datasets },
    options: { responsive: true, ...options }
  });
}

// ── ESTADO ──────────────────────────────────────────
function buildChartEstado(animals) {
  const activos  = animals.filter(a => a.estado === 'activo').length;
  const vendidos = animals.filter(a => a.estado === 'vendido').length;
  const muertos  = animals.filter(a => a.estado === 'muerto').length;

  buildChart('chartEstado', 'doughnut',
    ['Activos', 'Vendidos', 'Muertos'],
    [{ data: [activos, vendidos, muertos] }]
  );
}

// ── SALUD ───────────────────────────────────────────
async function buildChartSalud() {
  const { data } = await db.from('salud').select('tipo');
  if (!data?.length) return;

  const counts = {};
  data.forEach(s => counts[s.tipo] = (counts[s.tipo] || 0) + 1);

  buildChart('chartSalud', 'bar',
    Object.keys(counts),
    [{ data: Object.values(counts) }]
  );
}

// ── VENTAS ──────────────────────────────────────────
async function buildChartVentas() {
  const { data } = await db.from('ventas').select('fecha,total');
  if (!data?.length) return;

  const grouped = {};
  data.forEach(v => {
    const mes = v.fecha?.slice(0, 7);
    grouped[mes] = (grouped[mes] || 0) + (v.total || 0);
  });

  buildChart('chartVentas', 'bar',
    Object.keys(grouped),
    [{ data: Object.values(grouped) }]
  );
}

// ── PARTOS ──────────────────────────────────────────
async function buildProximosPartos() {
  const { data } = await db.from('reproduccion').select('*');
  const cont = document.getElementById('proximos-partos-list');
  if (!cont) return;

  if (!data?.length) {
    cont.innerHTML = 'Sin datos';
    return;
  }

  cont.innerHTML = data.map(r =>
    `<div>${r.fecha_parto_estimada || '—'}</div>`
  ).join('');
}
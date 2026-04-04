// auth.js — Login, registro y cierre de sesión

// ============= AUTH =============
let currentUser = null;

function switchAuthTab(tab) {
  document.getElementById('form-login').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('form-register').style.display = tab === 'register' ? 'block' : 'none';
  document.querySelectorAll('.auth-tab-btn').forEach((b, i) => {
    b.classList.toggle('active', (i === 0 && tab === 'login') || (i === 1 && tab === 'register'));
  });
  hideAuthError();
}

function showAuthError(msg) {
  const el = document.getElementById('auth-error');
  el.textContent = msg;
  el.classList.add('show');
}

function hideAuthError() {
  document.getElementById('auth-error').classList.remove('show');
}

async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  if (!email || !password) { showAuthError('Por favor ingresa correo y contraseña.'); return; }

  const btn = document.getElementById('btn-login');
  btn.disabled = true; btn.textContent = 'Verificando...';
  hideAuthError();

  const { data, error } = await db.auth.signInWithPassword({ email, password });

  btn.disabled = false; btn.textContent = 'Entrar al Sistema';

  if (error) { showAuthError('❌ ' + (error.message === 'Invalid login credentials' ? 'Correo o contraseña incorrectos.' : error.message)); return; }
  onLoginSuccess(data.user);
}

async function doRegister() {
  const nombre = document.getElementById('reg-nombre').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const telefono = document.getElementById('reg-telefono').value.trim();
  const rol = document.getElementById('reg-rol').value;
  const password = document.getElementById('reg-password').value;
  const password2 = document.getElementById('reg-password2').value;

  if (!nombre || !email || !password) { showAuthError('Nombre, correo y contraseña son obligatorios.'); return; }
  if (password.length < 6) { showAuthError('La contraseña debe tener al menos 6 caracteres.'); return; }
  if (password !== password2) { showAuthError('Las contraseñas no coinciden.'); return; }

  const btn = document.getElementById('btn-register');
  btn.disabled = true; btn.textContent = 'Creando cuenta...';
  hideAuthError();

  const { data, error } = await db.auth.signUp({ email, password });

  if (error) {
    btn.disabled = false; btn.textContent = 'Crear Cuenta';
    showAuthError('❌ ' + error.message); return;
  }

  // Guardar datos extra en tabla usuarios
  if (data.user) {
    await db.from('usuarios').upsert({
      id: data.user.id,
      nombre,
      rol,
      telefono: telefono || null
    });
  }

  btn.disabled = false; btn.textContent = 'Crear Cuenta';
  showToast('✅ Cuenta creada. Ya puedes iniciar sesión.');
  switchAuthTab('login');
  document.getElementById('login-email').value = email;
}

async function doLogout() {
  if (!confirm('¿Cerrar sesión?')) return;
  await db.auth.signOut();
  currentUser = null;
  document.getElementById('app-shell').classList.remove('visible');
  document.getElementById('auth-screen').classList.add('visible');
  document.getElementById('login-password').value = '';
  showToast('👋 Sesión cerrada');
}

function onLoginSuccess(user) {
  currentUser = user;
  document.getElementById('auth-screen').classList.remove('visible');
  document.getElementById('app-shell').classList.add('visible');

  // Mostrar nombre/email en header
  const email = user.email || '';
  const initials = email.substring(0, 2).toUpperCase();
  document.getElementById('user-avatar').textContent = initials;

  // Buscar nombre en tabla usuarios
  db.from('usuarios').select('nombre,rol').eq('id', user.id).single().then(({ data }) => {
    const display = data?.nombre || email;
    document.getElementById('user-display').textContent = display + (data?.rol ? ' · ' + data.rol : '');
  });

  // Iniciar la app
  initApp();
}

// Verificar sesión activa al cargar
db.auth.getSession().then(({ data: { session } }) => {
  if (session?.user) {
    onLoginSuccess(session.user);
  } else {
    document.getElementById('auth-screen').classList.add('visible');
  }
});

// Escuchar cambios de sesión
db.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    document.getElementById('app-shell').classList.remove('visible');
    document.getElementById('auth-screen').classList.add('visible');
  }
});
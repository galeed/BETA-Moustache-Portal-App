// Estado global
let isRegisterMode = false;
let currentUser = null;
let sb = null;

// Elementos del DOM
const authModal = document.getElementById('authModal');
const authBtn = document.getElementById('authBtn');
const closeAuthBtn = document.getElementById('closeAuth');
const authForm = document.getElementById('authForm');
const userStatus = document.getElementById('userStatus');
const msgBox = document.getElementById('msgBox');
const submitBtn = document.getElementById('submitBtn');
const tabLogin = document.getElementById('tabLogin');
const tabRegister = document.getElementById('tabRegister');
const usernameGroup = document.getElementById('usernameGroup');
const usernameInput = document.getElementById('username');
const themeFader = document.getElementById('themeFader');

const navItems = document.querySelectorAll('.nav-item');
const viewSections = document.querySelectorAll('.view-section');

// NAVEGACIÓN DE PESTAÑAS
navItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const targetViewId = item.getAttribute('data-target');

    if (targetViewId === 'viewPerfil' && !currentUser) {
      openModal();
      return;
    }

    navItems.forEach(nav => nav.classList.remove('active'));
    item.classList.add('active');

    viewSections.forEach(section => {
      if (section.id === targetViewId) {
        section.classList.add('active');
      } else {
        section.classList.remove('active');
      }
    });
  });
});

// CONTROL DEL TEMA (CROSSFADER DÍA / NOCHE)
themeFader.addEventListener('click', () => {
  document.body.classList.toggle('light-mode');
  const isLight = document.body.classList.contains('light-mode');
  localStorage.setItem('theme_preference', isLight ? 'light' : 'dark');
});

// MODAL DE AUTENTICACIÓN
const openModal = () => {
  msgBox.style.display = 'none';
  authModal.classList.add('open');
};

const closeModal = () => {
  authModal.classList.remove('open');
};

authBtn.addEventListener('click', (e) => {
  e.preventDefault();
  if (currentUser && sb) {
    sb.auth.signOut().then(() => updateUI(null));
  } else {
    openModal();
  }
});

closeAuthBtn.addEventListener('click', closeModal);

authModal.addEventListener('click', (e) => {
  if (e.target === authModal) closeModal();
});

tabLogin.addEventListener('click', (e) => {
  e.preventDefault();
  isRegisterMode = false;
  tabLogin.classList.add('active');
  tabRegister.classList.remove('active');
  submitBtn.textContent = 'Entrar';
  usernameGroup.style.display = 'none';
  usernameInput.required = false;
  msgBox.style.display = 'none';
});

tabRegister.addEventListener('click', (e) => {
  e.preventDefault();
  isRegisterMode = true;
  tabRegister.classList.add('active');
  tabLogin.classList.remove('active');
  submitBtn.textContent = 'Crear Cuenta';
  usernameGroup.style.display = 'block';
  usernameInput.required = true;
  msgBox.style.display = 'none';
});

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  msgBox.style.display = 'none';

  if (!sb) {
    showMsg("Atención: Clave o cliente Supabase no disponible.", "error");
    return;
  }

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const username = usernameInput.value.trim();

  submitBtn.disabled = true;

  try {
    if (isRegisterMode) {
      submitBtn.textContent = 'REGISTRANDO...';
      const { data, error } = await sb.auth.signUp({
        email: email,
        password: password,
        options: { data: { username: username } }
      });

      if (error) {
        showMsg(error.message, 'error');
      } else {
        showMsg('Cuenta creada correctamente.', 'success');
        authForm.reset();
      }
    } else {
      submitBtn.textContent = 'AUTENTICANDO...';
      const { data, error } = await sb.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        showMsg(error.message, 'error');
      } else {
        closeModal();
        authForm.reset();
      }
    }
  } catch (err) {
    showMsg("Error de autenticación.", "error");
  }

  submitBtn.disabled = false;
  submitBtn.textContent = isRegisterMode ? 'Crear Cuenta' : 'Entrar';
});

function showMsg(text, type) {
  msgBox.textContent = text;
  msgBox.className = `msg-box ${type}`;
  msgBox.style.display = 'block';
}

const updateUI = (user) => {
  currentUser = user;
  if (user) {
    const displayName = user.user_metadata?.username || user.email;
    userStatus.textContent = `Sesión activa: @${displayName}`;
    authBtn.textContent = 'Salir';
  } else {
    userStatus.textContent = 'Inicia sesión para acceder a tus tracks y colecciones.';
    authBtn.textContent = 'Entrar';
  }
};

// INICIALIZACIÓN
window.addEventListener('DOMContentLoaded', () => {
  // Cargar preferencia guardada del tema
  const savedTheme = localStorage.getItem('theme_preference');
  if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
  }

  // Supabase
  const SUPABASE_URL = 'https://cwpjjzamawyywfcsnaqo.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_NynLf9J-n78PPW7Oaw2W1Q_0_kJjwtl';

  try {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      sb.auth.onAuthStateChange((event, session) => {
        updateUI(session?.user || null);
      });
    }
  } catch (err) {
    console.warn("No se pudo iniciar Supabase:", err);
  }
});

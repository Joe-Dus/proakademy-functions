const Auth = {
  SESSION_KEY:          'pa_session',
  ROLLE_KEY:            'pa_rolle',
  ELTERN_ID_KEY:        'pa_eltern_id',
  ELTERN_EMAIL_KEY:     'pa_eltern_email',
  TRAINER_GRUPPEN_KEY:  'pa_trainer_gruppen',
  USER_ID_KEY:          'pa_user_id',

  isLoggedIn() { return sessionStorage.getItem(this.SESSION_KEY) !== null; },
  getRolle()   { return sessionStorage.getItem(this.ROLLE_KEY) || 'admin'; },
  getTrainerGruppen() {
    try { return JSON.parse(sessionStorage.getItem(this.TRAINER_GRUPPEN_KEY) || '[]'); }
    catch { return []; }
  },

  login(e) {
    e.preventDefault();
    const user  = document.getElementById('login-user').value.trim();
    const pass  = document.getElementById('login-pass').value;
    const errEl = document.getElementById('login-error');
    const btn   = document.getElementById('login-btn');

    DB.seed(); // Sicherstellen, dass User-DB existiert
    let dbUser = DB.getUserByBenutzername(user);
    if (!dbUser) dbUser = DB.getUserByEmail(user);

    if (dbUser && dbUser.passwort === pass && dbUser.aktiv) {
      errEl.style.display = 'none';
      btn.classList.add('loading');
      sessionStorage.setItem(this.SESSION_KEY,  user);
      sessionStorage.setItem(this.ROLLE_KEY,    dbUser.rolle);
      sessionStorage.setItem(this.USER_ID_KEY,  dbUser.id);

      if (dbUser.rolle === 'eltern') {
        if (dbUser.elternId) sessionStorage.setItem(this.ELTERN_ID_KEY, dbUser.elternId);
        if (dbUser.email)    sessionStorage.setItem(this.ELTERN_EMAIL_KEY, dbUser.email);
      }
      if (dbUser.rolle === 'trainer') {
        sessionStorage.setItem(this.TRAINER_GRUPPEN_KEY, JSON.stringify(dbUser.gruppen || []));
      }

      setTimeout(() => {
        document.getElementById('login-screen').style.display  = 'none';
        document.getElementById('app-wrapper').style.display   = '';
        Auth._setUserDisplay(user, dbUser.rolle, dbUser.name);
        if (dbUser.rolle === 'admin')   { App.start(); }
        else if (dbUser.rolle === 'trainer') { document.body.classList.add('trainer-modus'); App.start(); }
        else { ParentApp.start(); }
      }, 400);
    } else {
      errEl.style.display = 'flex';
      document.getElementById('login-pass').value = '';
      document.getElementById('login-pass').focus();
      const card = document.querySelector('.login-card');
      card.classList.add('shake');
      setTimeout(() => card.classList.remove('shake'), 500);
    }
  },

  logout() {
    sessionStorage.removeItem(this.SESSION_KEY);
    sessionStorage.removeItem(this.ROLLE_KEY);
    sessionStorage.removeItem(this.ELTERN_ID_KEY);
    sessionStorage.removeItem(this.ELTERN_EMAIL_KEY);
    sessionStorage.removeItem(this.TRAINER_GRUPPEN_KEY);
    sessionStorage.removeItem(this.USER_ID_KEY);
    document.body.classList.remove('eltern-modus', 'trainer-modus');
    document.getElementById('app-wrapper').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('login-user').value = '';
    document.getElementById('login-pass').value = '';
    document.getElementById('login-error').style.display = 'none';
    document.getElementById('login-btn').classList.remove('loading');
    document.getElementById('login-user').focus();
  },

  _setUserDisplay(user, rolle, name) {
    const display = name || user;
    const rolleLabel = { admin: 'Administrator', trainer: 'Trainer', eltern: 'Eltern-Zugang' }[rolle] || rolle;
    const el = document.getElementById('sidebar-username');
    if (el) el.textContent = display;
    const mobileEl = document.getElementById('mobile-username');
    if (mobileEl) mobileEl.textContent = display;
    const roleEl = document.getElementById('sidebar-user-rolle');
    if (roleEl) roleEl.textContent = rolleLabel;
    const parentName = document.getElementById('parent-topbar-user');
    if (parentName) parentName.textContent = rolleLabel;
  },

  fillLogin(user, pass) {
    document.getElementById('login-user').value = user;
    document.getElementById('login-pass').value = pass;
    document.getElementById('login-error').style.display = 'none';
    document.getElementById('login-pass').type = 'password';
    document.getElementById('eye-icon').className = 'bi bi-eye';
  },

  togglePassword() {
    const input = document.getElementById('login-pass');
    const icon  = document.getElementById('eye-icon');
    if (input.type === 'password') { input.type = 'text';     icon.className = 'bi bi-eye-slash'; }
    else                           { input.type = 'password'; icon.className = 'bi bi-eye'; }
  }
};

const App = {
  currentPage: 'dashboard',

  routes: {
    dashboard:     Dashboard,
    members:       Members,
    calendar:      PA_Calendar,
    groups:        Groups,
    attendance:    Attendance,
    subscriptions: Subscriptions,
    users:         Users,
    neuzugaenge:   Neuzugaenge,
    bulletin:      Bulletin,
  },

  ADMIN_ROUTES:   ['dashboard','members','calendar','groups','attendance','subscriptions','users','neuzugaenge','bulletin'],
  TRAINER_ROUTES: ['dashboard','members','calendar','groups','attendance','bulletin'],

  getAllowedRoutes() {
    const rolle = Auth.getRolle();
    if (rolle === 'trainer') return this.TRAINER_ROUTES;
    return this.ADMIN_ROUTES;
  },

  init() {
    if (Auth.isLoggedIn()) {
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('app-wrapper').style.display  = '';
      const user  = sessionStorage.getItem(Auth.SESSION_KEY);
      const rolle = Auth.getRolle();
      let dbUser = DB.getUserByBenutzername(user);
      if (!dbUser) dbUser = DB.getUserByEmail(user);
      if (!dbUser) { const uid = sessionStorage.getItem(Auth.USER_ID_KEY); if (uid) dbUser = DB.getUserById(uid); }
      if (rolle === 'eltern' && dbUser?.email && !sessionStorage.getItem(Auth.ELTERN_EMAIL_KEY)) {
        sessionStorage.setItem(Auth.ELTERN_EMAIL_KEY, dbUser.email);
      }
      Auth._setUserDisplay(user, rolle, dbUser?.name);
      if (rolle === 'admin')   { App.start(); }
      else if (rolle === 'trainer') { document.body.classList.add('trainer-modus'); App.start(); }
      else { ParentApp.start(); }
    } else {
      document.getElementById('login-user').focus();
    }
  },

  start() {
    DB.seed();
    I18n.applyStatic();
    I18n.updateLangButtons();
    this.setupNav();
    const allowed = this.getAllowedRoutes();
    const defaultPage = Auth.getRolle() === 'trainer' ? 'attendance' : 'dashboard';
    const hash = location.hash.replace('#', '');
    this.navigate(allowed.includes(hash) ? hash : defaultPage);
    window.addEventListener('hashchange', () => {
      if (Auth.getRolle() === 'eltern') return;
      const page = location.hash.replace('#', '');
      if (page && page in this.routes && page !== this.currentPage) {
        const ok = this.getAllowedRoutes();
        this.navigateDirect(ok.includes(page) ? page : (Auth.getRolle() === 'trainer' ? 'attendance' : 'dashboard'));
      }
    });
  },

  navigate(page) {
    location.hash = page;
    this.navigateDirect(page);
  },

  navigateDirect(page) {
    if (!(page in this.routes)) page = 'dashboard';
    this.currentPage = page;
    this.updateNav(page);
    Utils.closeAllModals();
    this.routes[page].render();
    window.scrollTo(0, 0);
  },

  setupNav() {
    document.querySelectorAll('[data-page]').forEach(el => {
      el.addEventListener('click', ev => {
        ev.preventDefault();
        this.navigate(el.dataset.page);
      });
    });
  },

  updateNav(page) {
    document.querySelectorAll('[data-page]').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());

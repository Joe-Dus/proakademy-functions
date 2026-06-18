const GRUPPEN = ['2007','2008','2009','2010','2011','2012','2013','2014','2015','2016','2017','2018','2019','2020','2021'];
const GRUPPEN_FARBEN = {
  '2007': { bg: '#ef4444', dark: '#dc2626', light: '#fef2f2', text: '#991b1b' }, // Rot
  '2008': { bg: '#f97316', dark: '#ea580c', light: '#fff7ed', text: '#9a3412' }, // Orange
  '2009': { bg: '#fbbf24', dark: '#f59e0b', light: '#fffbeb', text: '#92400e' }, // Gelb
  '2010': { bg: '#84cc16', dark: '#65a30d', light: '#f7fee7', text: '#365314' }, // Limette
  '2011': { bg: '#4ade80', dark: '#22c55e', light: '#f0fdf4', text: '#166534' }, // Hellgrün
  '2012': { bg: '#16a34a', dark: '#15803d', light: '#dcfce7', text: '#14532d' }, // Dunkelgrün
  '2013': { bg: '#2dd4bf', dark: '#14b8a6', light: '#f0fdfa', text: '#134e4a' }, // Türkis
  '2014': { bg: '#22d3ee', dark: '#06b6d4', light: '#ecfeff', text: '#155e75' }, // Cyan
  '2015': { bg: '#38bdf8', dark: '#0ea5e9', light: '#f0f9ff', text: '#075985' }, // Hellblau
  '2016': { bg: '#3b82f6', dark: '#2563eb', light: '#eff6ff', text: '#1e3a8a' }, // Blau
  '2017': { bg: '#1d4ed8', dark: '#1e40af', light: '#dbeafe', text: '#1e3a8a' }, // Dunkelblau
  '2018': { bg: '#6366f1', dark: '#4f46e5', light: '#eef2ff', text: '#312e81' }, // Violett
  '2019': { bg: '#a855f7', dark: '#9333ea', light: '#faf5ff', text: '#581c87' }, // Lila
  '2020': { bg: '#ec4899', dark: '#db2777', light: '#fdf2f8', text: '#831843' }, // Pink
  '2021': { bg: '#d946ef', dark: '#c026d3', light: '#fdf4ff', text: '#701a75' }, // Magenta
};
const ABO_TYPEN = {
  kontingent: 'Kontingent',
  monat: 'Monatsabo',
  jahr: 'Jahresabo'
};

const Utils = {
  formatDatum(str) {
    if (!str) return '—';
    const d = new Date(str + (str.length === 10 ? 'T12:00:00' : ''));
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  },
  formatDatumLang(str) {
    if (!str) return '—';
    const d = new Date(str + (str.length === 10 ? 'T12:00:00' : ''));
    return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
  },
  formatMonat(str) {
    if (!str) return '—';
    const [y, m] = str.split('-');
    const d = new Date(parseInt(y), parseInt(m) - 1, 1);
    return d.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  },
  aktuellerMonat() {
    return new Date().toISOString().substring(0, 7);
  },
  heute() {
    return new Date().toISOString().split('T')[0];
  },
  alter(geburtsdatum) {
    if (!geburtsdatum) return '—';
    const heute = new Date();
    const geb = new Date(geburtsdatum + 'T12:00:00');
    let alter = heute.getFullYear() - geb.getFullYear();
    if (heute.getMonth() < geb.getMonth() || (heute.getMonth() === geb.getMonth() && heute.getDate() < geb.getDate())) alter--;
    return alter;
  },

  showToast(msg, typ = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${typ}`;
    const icon = typ === 'success' ? '✓' : typ === 'error' ? '✕' : typ === 'warning' ? '⚠' : 'ℹ';
    toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  },

  openModal(id) {
    const m = document.getElementById(id);
    if (m) { m.classList.add('active'); document.body.style.overflow = 'hidden'; }
  },
  closeModal(id) {
    const m = document.getElementById(id);
    if (m) { m.classList.remove('active'); document.body.style.overflow = ''; }
  },
  closeAllModals() {
    document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
    document.body.style.overflow = '';
  },

  confirm(msg) {
    return new Promise(resolve => {
      const overlay = document.createElement('div');
      overlay.className = 'confirm-overlay';
      overlay.innerHTML = `
        <div class="confirm-box">
          <p>${msg}</p>
          <div class="confirm-actions">
            <button class="btn btn-secondary" id="confirm-no">${t('confirm.no')}</button>
            <button class="btn btn-danger" id="confirm-yes">${t('confirm.yes')}</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      setTimeout(() => overlay.classList.add('active'), 10);
      overlay.querySelector('#confirm-yes').onclick = () => { overlay.remove(); resolve(true); };
      overlay.querySelector('#confirm-no').onclick = () => { overlay.remove(); resolve(false); };
    });
  },

  gruppenBadge(gruppe) {
    const f = GRUPPEN_FARBEN[gruppe] || { bg: '#64748b', light: '#f1f5f9', text: '#334155' };
    return `<span class="badge" style="background:${f.light};color:${f.text};border:1px solid ${f.bg}30">${gruppe}</span>`;
  },

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }
};

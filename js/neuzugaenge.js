const Neuzugaenge = {
  formOffen: false,

  render() {
    const liste = DB.getNeuzugaenge();
    const rolle = Auth.getRolle();

    document.getElementById('app').innerHTML = `
      <div class="page-header">
        <div>
          <h1><i class="bi bi-person-plus-fill"></i> Neuzugänge</h1>
          <p class="subtitle">Neu erfasste Mitglieder – ${t('common.jahrgang')} zuweisen</p>
        </div>
        <div style="display:flex;gap:10px;align-items:center">
          ${liste.length > 0 ? `<span class="badge badge-orange" style="font-size:.9rem;padding:6px 14px">${liste.length} ausstehend</span>` : ''}
          <button class="btn btn-primary" onclick="Neuzugaenge.toggleForm()">
            <i class="bi bi-plus-lg"></i> Neuzugang erfassen
          </button>
        </div>
      </div>

      <!-- Schnell-Erfassungsformular -->
      <div id="nz-form-block" class="card" style="display:none;margin-bottom:16px">
        <div class="card-header">
          <h3><i class="bi bi-person-plus"></i> Neues Mitglied erfassen</h3>
          <button class="btn btn-sm btn-outline" onclick="Neuzugaenge.toggleForm(false)"><i class="bi bi-x"></i></button>
        </div>
        <div class="card-body">
          <div class="form-grid">
            <div class="form-group">
              <label>Vorname *</label>
              <input type="text" id="nz-vorname" placeholder="Vorname" oninput="Neuzugaenge.autoTitel()">
            </div>
            <div class="form-group">
              <label>Nachname *</label>
              <input type="text" id="nz-nachname" placeholder="Nachname" oninput="Neuzugaenge.autoTitel()">
            </div>
            <div class="form-group">
              <label>Geburtsdatum</label>
              <input type="date" id="nz-geburtsdatum">
            </div>
            <div class="form-group">
              <label>${t('common.jahrgang')} (optional)</label>
              <select id="nz-gruppe">
                <option value="">— Noch nicht zugewiesen —</option>
                ${GRUPPEN.map(g => `<option value="${g}">${g}</option>`).join('')}
              </select>
            </div>
          </div>
          <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:8px">
            <button class="btn btn-secondary" onclick="Neuzugaenge.toggleForm(false)">Abbrechen</button>
            <button class="btn btn-primary" onclick="Neuzugaenge.addNeuzugang()">
              <i class="bi bi-floppy"></i> Erfassen
            </button>
          </div>
        </div>
      </div>

      ${liste.length === 0 ? `
        <div class="card">
          <div class="card-body">
            <div class="empty-panel">
              <i class="bi bi-check-circle" style="font-size:3rem;color:#10b981"></i>
              <h3>Alle Mitglieder zugewiesen</h3>
              <p>Keine ausstehenden Neuzugänge – perfekt!</p>
            </div>
          </div>
        </div>
      ` : `
        <div class="card">
          <div class="card-body p0">
            ${liste.map(s => Neuzugaenge.renderRow(s)).join('')}
          </div>
        </div>
      `}
    `;

    if (this.formOffen) {
      document.getElementById('nz-form-block').style.display = '';
    }
  },

  renderRow(s) {
    const alter = Utils.alter(s.geburtsdatum);
    return `
      <div class="neuzugang-row">
        <div class="neuzugang-avatar">
          ${s.vorname ? s.vorname[0] : '?'}${s.nachname ? s.nachname[0] : '?'}
        </div>
        <div class="neuzugang-info">
          <strong>${Utils.escapeHtml(s.vorname)} ${Utils.escapeHtml(s.nachname)}</strong>
          <div class="text-muted" style="font-size:.83rem">
            ${s.geburtsdatum ? `geb. ${Utils.formatDatum(s.geburtsdatum)}` : 'kein Geb.-Datum'}
            ${alter !== '—' ? ` · ${alter} Jahre` : ''}
          </div>
        </div>
        <div class="neuzugang-assign">
          <select class="select-inline" onchange="Neuzugaenge.assignGruppe('${s.id}', this.value)">
            <option value="">${t('common.jahrgang')} wählen...</option>
            ${GRUPPEN.map(g => `<option value="${g}">${g}</option>`).join('')}
          </select>
          <button class="btn btn-sm btn-danger-outline" onclick="Neuzugaenge.loeschen('${s.id}')" title="Entfernen">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>`;
  },

  toggleForm(force) {
    this.formOffen = force !== undefined ? force : !this.formOffen;
    const el = document.getElementById('nz-form-block');
    if (el) {
      el.style.display = this.formOffen ? '' : 'none';
      if (this.formOffen) {
        document.getElementById('nz-vorname')?.focus();
      }
    }
  },

  autoTitel() {},

  addNeuzugang() {
    const vorname = document.getElementById('nz-vorname')?.value.trim();
    const nachname = document.getElementById('nz-nachname')?.value.trim();
    if (!vorname || !nachname) { Utils.showToast('Vor- und Nachname erforderlich.', 'error'); return; }
    const gruppe = document.getElementById('nz-gruppe')?.value || '';
    const geburtsdatum = document.getElementById('nz-geburtsdatum')?.value || '';
    DB.saveSpieler({
      vorname, nachname, geburtsdatum,
      gruppe,
      status: gruppe ? 'aktiv' : 'neuzugang',
      aktiv: true,
      elternIds: [],
      aboId: null,
      notizen: '',
    });
    Utils.showToast(`${vorname} ${nachname} ${gruppe ? '→ ' + t('common.jahrgang') + ' ' + gruppe : 'als Neuzugang'} erfasst.`);
    this.formOffen = false;
    this.render();
  },

  assignGruppe(spielerId, gruppe) {
    if (!gruppe) return;
    const s = DB.getSpielerById(spielerId);
    if (!s) return;
    DB.saveSpieler({ ...s, gruppe, status: 'aktiv' });
    Utils.showToast(`${s.vorname} ${s.nachname} → ${t('common.jahrgang')} ${gruppe} zugewiesen`);
    this.render();
  },

  loeschen(spielerId) {
    const s = DB.getSpielerById(spielerId);
    if (!s) return;
    Utils.confirm(`"${s.vorname} ${s.nachname}" als Neuzugang entfernen?`).then(ok => {
      if (!ok) return;
      DB.deleteSpieler(spielerId);
      Utils.showToast('Neuzugang entfernt', 'error');
      this.render();
    });
  }
};

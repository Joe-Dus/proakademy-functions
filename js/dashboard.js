const Dashboard = {
  render() {
    const spieler    = DB.getSpieler().filter(s => s.aktiv && s.status !== 'neuzugang');
    const eltern     = DB.getEltern();
    const trainings  = DB.getTrainings();
    const heute      = Utils.heute();
    const monat      = Utils.aktuellerMonat();
    const neuzugaenge = DB.getNeuzugaenge();

    const heuteTrainings = trainings.filter(t => t.datum === heute);
    const dieseWocheTrainings = trainings.filter(t => {
      const d = new Date(t.datum + 'T12:00:00');
      const h = new Date(heute + 'T12:00:00');
      const diff = (d - h) / 86400000;
      return diff >= 0 && diff < 7;
    });
    const naechsteTrainings = trainings
      .filter(t => t.datum >= heute)
      .sort((a, b) => a.datum.localeCompare(b.datum) || a.startzeit.localeCompare(b.startzeit))
      .slice(0, 8);

    const abos = DB.getAbos().filter(a => a.aktiv);
    const warnings = [];
    abos.filter(a => a.typ === 'kontingent' && a.einheitenProMonat).forEach(abo => {
      const verbraucht = DB.getAnzahlTrainingsThisMonth(abo.spielerId, monat);
      const pct = verbraucht / abo.einheitenProMonat;
      if (pct >= 0.75) {
        const s = DB.getSpielerById(abo.spielerId);
        if (s) warnings.push({ spieler: s, verbraucht, gesamt: abo.einheitenProMonat, pct });
      }
    });

    document.getElementById('app').innerHTML = `
      <div class="page-header">
        <div>
          <h1>${t('dashboard.title')}</h1>
          <p class="subtitle">${t('dashboard.subtitle')}</p>
        </div>
        <div class="header-date">${Utils.formatDatumLang(heute)}</div>
      </div>

      <div class="stats-grid">
        ${this.statCard('bi-people-fill', spieler.length, t('dashboard.active_players'), '#3b82f6', '#eff6ff')}
        ${this.statCard('bi-person-heart', eltern.length, t('dashboard.parents'), '#a855f7', '#faf5ff')}
        ${this.statCard('bi-calendar-check', heuteTrainings.length, t('dashboard.trainings_today'), '#10b981', '#ecfdf5')}
        ${this.statCard('bi-calendar-week', dieseWocheTrainings.length, t('dashboard.trainings_week'), '#f59e0b', '#fffbeb')}
      </div>

      <div class="dashboard-grid">
        <div class="card">
          <div class="card-header">
            <h3><i class="bi bi-calendar-event"></i> ${t('dashboard.next_trainings')}</h3>
            <button class="btn btn-sm btn-outline" onclick="App.navigate('calendar')">${t('common.show_all')}</button>
          </div>
          <div class="card-body p0">
            ${naechsteTrainings.length === 0 ? `<p class="empty-state">${t('dashboard.no_trainings')}</p>` :
              naechsteTrainings.map(tr => this.trainingRow(tr)).join('')}
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3><i class="bi bi-bar-chart-fill"></i> ${t('dashboard.groups_overview')}</h3>
            <button class="btn btn-sm btn-outline" onclick="App.navigate('groups')">${t('common.details')}</button>
          </div>
          <div class="card-body">
            ${GRUPPEN.map(g => this.gruppeBar(g, spieler)).join('')}
          </div>
        </div>
      </div>

      ${neuzugaenge.length > 0 ? `
      <div class="card mt-4">
        <div class="card-header" style="cursor:pointer" onclick="App.navigate('neuzugaenge')">
          <h3><i class="bi bi-person-plus-fill" style="color:#f59e0b"></i> Neuzugänge
            <span class="badge badge-orange" style="margin-left:8px">${neuzugaenge.length}</span>
          </h3>
          <span class="btn btn-sm btn-outline">Zuweisen</span>
        </div>
        <div class="card-body p0">
          ${neuzugaenge.slice(0,3).map(s => `
            <div class="training-row" style="cursor:pointer" onclick="App.navigate('neuzugaenge')">
              <div class="training-color-bar" style="background:#f59e0b"></div>
              <div class="training-row-info">
                <div class="training-row-title">${Utils.escapeHtml(s.vorname)} ${Utils.escapeHtml(s.nachname)}</div>
                <div class="training-row-meta">geb. ${Utils.formatDatum(s.geburtsdatum)} · noch kein ${t('common.jahrgang')}</div>
              </div>
              <span class="badge badge-orange">Neuzugang</span>
            </div>`).join('')}
          ${neuzugaenge.length > 3 ? `<p style="padding:8px 16px;color:#94a3b8;font-size:.82rem">+${neuzugaenge.length-3} weitere</p>` : ''}
        </div>
      </div>` : ''}

      ${warnings.length > 0 ? `
      <div class="card mt-4">
        <div class="card-header">
          <h3><i class="bi bi-exclamation-triangle-fill" style="color:#f59e0b"></i> ${t('dashboard.contingent_warnings')}</h3>
        </div>
        <div class="card-body">
          <div class="warning-grid">
            ${warnings.map(w => this.kontingentWarning(w)).join('')}
          </div>
        </div>
      </div>` : ''}
    `;
  },

  statCard(icon, value, label, color, bg) {
    return `
      <div class="stat-card" style="--accent:${color};--accent-bg:${bg}">
        <div class="stat-icon"><i class="bi ${icon}"></i></div>
        <div class="stat-info">
          <div class="stat-value">${value}</div>
          <div class="stat-label">${label}</div>
        </div>
      </div>`;
  },

  trainingRow(tr) {
    const f = GRUPPEN_FARBEN[tr.gruppe] || { bg: '#64748b' };
    const isHeute = tr.datum === Utils.heute();
    return `
      <div class="training-row">
        <div class="training-color-bar" style="background:${f.bg}"></div>
        <div class="training-row-info">
          <div class="training-row-title">${Utils.escapeHtml(tr.titel)} ${isHeute ? `<span class="badge badge-today">${t('common.today')}</span>` : ''}</div>
          <div class="training-row-meta">
            <i class="bi bi-calendar3"></i> ${Utils.formatDatum(tr.datum)}
            &nbsp;·&nbsp;
            <i class="bi bi-clock"></i> ${tr.startzeit} – ${tr.endzeit}
            &nbsp;·&nbsp;
            <i class="bi bi-geo-alt"></i> ${Utils.escapeHtml(tr.ort)}
          </div>
        </div>
        ${Utils.gruppenBadge(tr.gruppe)}
      </div>`;
  },

  gruppeBar(gruppe, spieler) {
    const anzahl = spieler.filter(s => s.gruppe === gruppe).length;
    const max = Math.max(...GRUPPEN.map(g => spieler.filter(s => s.gruppe === g).length), 1);
    const pct = Math.round((anzahl / max) * 100);
    const f = GRUPPEN_FARBEN[gruppe] || { bg: '#64748b' };
    return `
      <div class="gruppe-bar-row">
        <span class="gruppe-bar-label">${gruppe}</span>
        <div class="gruppe-bar-track">
          <div class="gruppe-bar-fill" style="width:${pct}%;background:${f.bg}"></div>
        </div>
        <span class="gruppe-bar-count">${anzahl}</span>
      </div>`;
  },

  kontingentWarning(w) {
    const pct = Math.min(Math.round(w.pct * 100), 100);
    const color = pct >= 100 ? '#ef4444' : '#f59e0b';
    return `
      <div class="kontingent-warning-card">
        <div class="kw-header">
          <strong>${Utils.escapeHtml(w.spieler.vorname)} ${Utils.escapeHtml(w.spieler.nachname)}</strong>
          ${Utils.gruppenBadge(w.spieler.gruppe)}
        </div>
        <div class="kw-progress-row">
          <div class="progress-bar-track">
            <div class="progress-bar-fill" style="width:${pct}%;background:${color}"></div>
          </div>
          <span style="color:${color};font-weight:600">${w.verbraucht}/${w.gesamt}</span>
        </div>
        <div class="kw-label" style="color:${color}">
          ${pct >= 100 ? t('dashboard.contingent_exhausted') : t('dashboard.units_remaining', {n: w.gesamt - w.verbraucht})}
        </div>
      </div>`;
  }
};

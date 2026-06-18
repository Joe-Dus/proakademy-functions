const Groups = {
  aktiveGruppe: null,

  render() {
    document.getElementById('app').innerHTML = `
      <div class="page-header">
        <div>
          <h1>${t('groups.title')}</h1>
          <p class="subtitle">${t('groups.subtitle')}</p>
        </div>
      </div>
      <div class="groups-grid">
        ${GRUPPEN.map(g => this.renderGruppeCard(g)).join('')}
      </div>
      ${this.aktiveGruppe ? this.renderGruppeDetail(this.aktiveGruppe) : ''}
    `;
  },

  renderGruppeCard(gruppe) {
    const spieler = DB.getSpielerByGruppe(gruppe);
    const trainings = DB.getTrainings().filter(tr => tr.gruppe === gruppe);
    const heute = Utils.heute();
    const naechstes = trainings.filter(tr => tr.datum >= heute).sort((a, b) => a.datum.localeCompare(b.datum))[0];
    const f = GRUPPEN_FARBEN[gruppe];
    const aktiv = this.aktiveGruppe === gruppe;

    return `
      <div class="gruppe-card ${aktiv ? 'active' : ''}" onclick="Groups.toggleGruppe('${gruppe}')"
        style="--g-color:${f.bg};--g-dark:${f.dark};--g-light:${f.light}">
        <div class="gruppe-card-header">
          <div class="gruppe-icon" style="background:${f.bg}">
            <i class="bi bi-people-fill"></i>
          </div>
          <div>
            <h2 class="gruppe-name">${gruppe}</h2>
            <div class="gruppe-meta">${spieler.length} ${t('groups.players')}</div>
          </div>
          <i class="bi bi-chevron-${aktiv ? 'up' : 'down'} gruppe-chevron"></i>
        </div>
        <div class="gruppe-stats-row">
          <div class="gruppe-stat">
            <div class="gruppe-stat-value" style="color:${f.bg}">${trainings.length}</div>
            <div class="gruppe-stat-label">${t('groups.total_trainings')}</div>
          </div>
          <div class="gruppe-stat">
            <div class="gruppe-stat-value" style="color:${f.bg}">${trainings.filter(tr => tr.datum >= heute).length}</div>
            <div class="gruppe-stat-label">${t('groups.planned')}</div>
          </div>
          <div class="gruppe-stat">
            <div class="gruppe-stat-value" style="color:${f.bg}">
              ${naechstes ? Utils.formatDatum(naechstes.datum) : '—'}
            </div>
            <div class="gruppe-stat-label">${t('groups.next_training')}</div>
          </div>
        </div>
      </div>`;
  },

  renderGruppeDetail(gruppe) {
    const spieler = DB.getSpielerByGruppe(gruppe);
    const trainings = DB.getTrainings().filter(tr => tr.gruppe === gruppe);
    const heute = Utils.heute();
    const monat = Utils.aktuellerMonat();
    const f = GRUPPEN_FARBEN[gruppe];

    const naechsteTrainings = trainings
      .filter(tr => tr.datum >= heute)
      .sort((a, b) => a.datum.localeCompare(b.datum))
      .slice(0, 5);

    return `
      <div class="gruppe-detail-card card mt-4" style="border-top:3px solid ${f.bg}">
        <div class="card-header">
          <h3 style="color:${f.bg}"><i class="bi bi-people-fill"></i> ${gruppe} – ${t('groups.details')}</h3>
          <button class="btn btn-sm btn-outline" onclick="App.navigate('members')">${t('groups.add_member')}</button>
        </div>
        <div class="gruppe-detail-grid">
          <div>
            <h4 class="section-title">${t('groups.player_list', {n: spieler.length})}</h4>
            ${spieler.length === 0 ? `<p class="empty-state">${t('groups.no_players')}</p>` : `
            <table class="table table-compact">
              <thead><tr><th>${t('common.name')}</th><th>${t('common.age')}</th><th>${t('groups.trainings_month', {month: Utils.formatMonat(monat)})}</th><th>${t('members.col_subscription')}</th></tr></thead>
              <tbody>
                ${spieler.map(s => {
                  const anzahl = DB.getAnzahlTrainingsThisMonth(s.id, monat);
                  const abo = DB.getAktivesAbo(s.id);
                  let kontingentInfo = '';
                  if (abo?.typ === 'kontingent') {
                    const pct = Math.min((anzahl / abo.einheitenProMonat) * 100, 100);
                    const color = pct >= 100 ? '#ef4444' : pct >= 75 ? '#f59e0b' : f.bg;
                    kontingentInfo = `<span style="color:${color};font-weight:600">${anzahl}/${abo.einheitenProMonat}</span>`;
                  } else {
                    kontingentInfo = `<span>${anzahl}</span>`;
                  }
                  return `<tr>
                    <td><strong>${Utils.escapeHtml(s.vorname)} ${Utils.escapeHtml(s.nachname)}</strong></td>
                    <td>${Utils.alter(s.geburtsdatum)} ${t('common.years_short')}</td>
                    <td>${kontingentInfo}</td>
                    <td>${abo ? `<span class="badge badge-green">${Utils.escapeHtml(abo.name)}</span>` : '<span class="text-muted">—</span>'}</td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>`}
          </div>
          <div>
            <h4 class="section-title">${t('groups.next_trainings')}</h4>
            ${naechsteTrainings.length === 0 ? `<p class="empty-state">${t('groups.no_trainings')}</p>` :
              naechsteTrainings.map(tr => `
              <div class="detail-training-item">
                <div class="detail-training-dot" style="background:${f.bg}"></div>
                <div>
                  <div class="detail-training-date">${Utils.formatDatum(tr.datum)}</div>
                  <div class="detail-training-info">${tr.startzeit} – ${tr.endzeit} · ${Utils.escapeHtml(tr.ort)}</div>
                </div>
                <button class="btn-icon" onclick="App.navigate('attendance');Attendance.vorwaehlenTraining('${tr.id}')" title="${t('nav.attendance')}">
                  <i class="bi bi-check2-square"></i>
                </button>
              </div>`).join('')}
          </div>
        </div>
      </div>`;
  },

  toggleGruppe(gruppe) {
    this.aktiveGruppe = this.aktiveGruppe === gruppe ? null : gruppe;
    this.render();
  }
};

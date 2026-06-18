const ParentApp = {
  elternId: null,

  start() {
    this.elternId = sessionStorage.getItem(Auth.ELTERN_ID_KEY);
    this.elternEmail = sessionStorage.getItem(Auth.ELTERN_EMAIL_KEY);
    DB.seed();
    document.body.classList.add('eltern-modus');
    I18n.applyStatic();
    I18n.updateLangButtons();

    const userId = sessionStorage.getItem(Auth.USER_ID_KEY);
    const dbUser = DB.getUserById(userId);
    const nameEl = document.getElementById('parent-topbar-name');
    if (nameEl && dbUser) nameEl.textContent = dbUser.name || dbUser.benutzername;

    this.render();
  },

  render() {
    const elternEmail = sessionStorage.getItem(Auth.ELTERN_EMAIL_KEY);
    const elternId    = sessionStorage.getItem(Auth.ELTERN_ID_KEY);
    const userId      = sessionStorage.getItem(Auth.USER_ID_KEY);
    const dbUser      = DB.getUserById(userId);

    // Email-basierte Kinderzuordnung (neue Methode)
    let spieler = [];
    if (elternEmail) {
      spieler = DB.getSpieler().filter(s => s.aktiv && s.elternEmail &&
        s.elternEmail.toLowerCase() === elternEmail.toLowerCase());
    }
    // Fallback: alte Verknüpfung über Eltern-Datensatz
    if (spieler.length === 0 && elternId) {
      const eltern = DB.getElternById(elternId);
      if (eltern) spieler = (eltern.spielerIds || []).map(id => DB.getSpielerById(id)).filter(s => s && s.aktiv);
    }

    const displayName = dbUser?.name || elternEmail || 'Eltern';

    if (spieler.length === 0 && !elternEmail && !elternId) {
      document.getElementById('app').innerHTML = `
        <div class="empty-panel" style="min-height:60vh">
          <i class="bi bi-person-x" style="font-size:3rem;color:#cbd5e1"></i>
          <h3>${t('parent.no_account')}</h3>
          <p>${t('parent.contact')}</p>
          <button class="btn btn-primary" style="margin-top:20px" onclick="Auth.logout()">
            <i class="bi bi-arrow-left"></i> ${t('parent.back_login')}
          </button>
        </div>`;
      return;
    }

    const heute = Utils.heute();
    const monat = Utils.aktuellerMonat();

    document.getElementById('app').innerHTML = `
      <div class="parent-welcome-bar">
        <div>
          <h2>${t('parent.welcome', {name: Utils.escapeHtml(displayName.split(' ')[0])})}</h2>
          <p class="subtitle">${t('parent.subtitle')}</p>
        </div>
        <span class="parent-date-badge">${Utils.formatDatumLang(heute)}</span>
      </div>

      ${Bulletin.renderPreview()}

      ${spieler.length === 0
        ? `<div class="card"><div class="card-body empty-state">${t('parent.no_players')}</div></div>`
        : spieler.map(s => this.renderKind(s, monat, heute)).join('')}
    `;
  },

  renderKind(s, monat, heute) {
    const f = GRUPPEN_FARBEN[s.gruppe] || { bg: '#64748b', light: '#f1f5f9', text: '#334155' };
    const abo = DB.getAktivesAbo(s.id);

    const istTeilnehmer = tr => !tr.teilnehmer || tr.teilnehmer.length === 0 || tr.teilnehmer.includes(s.id);

    const naechste = DB.getTrainings()
      .filter(tr => tr.gruppe === s.gruppe && tr.datum >= heute && istTeilnehmer(tr))
      .sort((a, b) => a.datum.localeCompare(b.datum) || a.startzeit.localeCompare(b.startzeit))
      .slice(0, 6);

    const vergangen = DB.getTrainings()
      .filter(tr => tr.gruppe === s.gruppe && tr.datum < heute && istTeilnehmer(tr))
      .sort((a, b) => b.datum.localeCompare(a.datum))
      .slice(0, 8);

    const anwMap = {};
    DB.getAnwesenheitBySpieler(s.id).forEach(a => { anwMap[a.trainingId] = a.anwesend; });

    return `
      <div class="parent-kind-block">

        <div class="parent-kind-header" style="--kind-color:${f.bg}">
          <div class="parent-kind-avatar" style="background:${f.bg}">
            ${s.vorname[0]}${s.nachname[0]}
          </div>
          <div class="parent-kind-info">
            <h3>${Utils.escapeHtml(s.vorname)} ${Utils.escapeHtml(s.nachname)}</h3>
            <div class="parent-kind-meta">
              ${Utils.gruppenBadge(s.gruppe)}
              <span class="text-muted">${t('parent.years', {n: Utils.alter(s.geburtsdatum)})}</span>
              <span class="text-muted">· geb. ${Utils.formatDatum(s.geburtsdatum)}</span>
            </div>
          </div>
        </div>

        ${this.renderAboBox(abo, s.id, monat, heute, f)}

        <div class="card parent-card">
          <div class="card-header">
            <h3>
              <span class="parent-card-dot" style="background:${f.bg}"></span>
              ${t('parent.next_trainings')}
              <span class="badge badge-gray" style="font-weight:500">${s.gruppe}</span>
            </h3>
          </div>
          <div class="card-body p0">
            ${naechste.length === 0
              ? `<p class="empty-state">${t('parent.no_trainings')}</p>`
              : naechste.map(tr => {
                  const isHeute = tr.datum === heute;
                  const isMorgen = tr.datum === this.morgen();
                  return `
                    <div class="parent-training-row">
                      <div class="parent-training-bullet" style="background:${f.bg}"></div>
                      <div class="parent-training-body">
                        <div class="parent-training-date">
                          ${isHeute  ? `<span class="badge badge-today">${t('common.today')}</span> ` : ''}
                          ${isMorgen ? `<span class="badge badge-blue">${t('common.tomorrow')}</span> ` : ''}
                          ${Utils.formatDatumLang(tr.datum)}
                        </div>
                        <div class="parent-training-meta">
                          <i class="bi bi-clock"></i> ${tr.startzeit}–${tr.endzeit}
                          &nbsp;·&nbsp;
                          <i class="bi bi-geo-alt"></i> ${Utils.escapeHtml(tr.ort || '—')}
                          ${tr.trainer ? ` &nbsp;·&nbsp; <i class="bi bi-person"></i> ${Utils.escapeHtml(tr.trainer)}` : ''}
                        </div>
                      </div>
                    </div>`;
                }).join('')}
          </div>
        </div>

        ${vergangen.length > 0 ? `
        <div class="card parent-card">
          <div class="card-header">
            <h3>
              <span class="parent-card-dot" style="background:${f.bg}"></span>
              ${t('parent.last_trainings')}
            </h3>
            <span class="text-muted" style="font-size:.8rem">
              ${t('parent.attendance_summary', {present: Object.values(anwMap).filter(Boolean).length, total: Object.keys(anwMap).length})}
            </span>
          </div>
          <div class="card-body p0">
            ${vergangen.map(tr => {
              const anwesend = anwMap[tr.id];
              const erfasst  = anwMap[tr.id] !== undefined;
              return `
                <div class="parent-anw-row">
                  <div class="parent-anw-icon">
                    ${!erfasst
                      ? '<i class="bi bi-dash-circle" style="color:#cbd5e1;font-size:1.3rem"></i>'
                      : anwesend
                        ? '<i class="bi bi-check-circle-fill" style="color:#10b981;font-size:1.3rem"></i>'
                        : '<i class="bi bi-x-circle-fill" style="color:#ef4444;font-size:1.3rem"></i>'}
                  </div>
                  <div class="parent-anw-info">
                    <span class="parent-anw-date">${Utils.formatDatum(tr.datum)}</span>
                    <span class="parent-anw-detail">${tr.startzeit}–${tr.endzeit} · ${Utils.escapeHtml(tr.ort || '—')}</span>
                  </div>
                  <div>
                    ${!erfasst
                      ? `<span class="badge badge-gray">${t('parent.not_recorded')}</span>`
                      : anwesend
                        ? `<span class="badge badge-green">${t('parent.present')}</span>`
                        : `<span class="badge" style="background:#fef2f2;color:#991b1b;border:1px solid #fecaca">${t('parent.absent')}</span>`}
                  </div>
                </div>`;
            }).join('')}
          </div>
        </div>` : ''}

      </div>`;
  },

  renderAboBox(abo, spielerId, monat, heute, f) {
    if (!abo) return '';

    if (abo.typ === 'kontingent' && abo.einheitenProMonat) {
      const verbraucht = DB.getAnzahlTrainingsThisMonth(spielerId, monat);
      const gesamt     = abo.einheitenProMonat;
      const pct        = Math.min(Math.round((verbraucht / gesamt) * 100), 100);
      const color      = pct >= 100 ? '#ef4444' : pct >= 75 ? '#f59e0b' : '#10b981';
      const verbleibend = gesamt - verbraucht;

      return `
        <div class="card parent-card parent-kontingent-card" style="border-left:4px solid ${color}">
          <div class="parent-kontingent-top">
            <div class="parent-kontingent-icon" style="background:${color}20;color:${color}">
              <i class="bi bi-ticket-perforated-fill"></i>
            </div>
            <div class="parent-kontingent-info">
              <strong>${Utils.escapeHtml(abo.name)}</strong>
              <span class="text-muted">${Utils.formatMonat(monat)}</span>
            </div>
            <div class="parent-kontingent-zahl" style="color:${color}">
              ${verbraucht}<span style="font-size:.9rem;font-weight:500;opacity:.6">/${gesamt}</span>
            </div>
          </div>
          <div class="progress-bar-track" style="margin:10px 0 6px">
            <div class="progress-bar-fill" style="width:${pct}%;background:${color};transition:width .4s"></div>
          </div>
          <p class="parent-kontingent-text" style="color:${color}">
            ${pct >= 100
              ? `<i class="bi bi-exclamation-triangle-fill"></i> ${t('parent.contingent_exhausted')}`
              : `<i class="bi bi-check-circle"></i> ${t('parent.units_remaining', {n: verbleibend})}`}
          </p>
        </div>`;
    }

    const typMap = { kontingent: 'subscriptions.contingent', monat: 'subscriptions.monthly', jahr: 'subscriptions.annual' };
    const istAktiv = abo.aktiv && (!abo.enddatum || abo.enddatum >= heute);
    return `
      <div class="card parent-card parent-abo-flat" style="border-left:4px solid #10b981">
        <div class="parent-abo-flat-inner">
          <i class="bi bi-check-circle-fill" style="color:#10b981;font-size:1.4rem;flex-shrink:0"></i>
          <div>
            <strong>${Utils.escapeHtml(abo.name)}</strong>
            <div style="margin-top:4px;display:flex;gap:6px;flex-wrap:wrap">
              <span class="badge badge-green">${t(typMap[abo.typ] || 'subscriptions.col_type')} – ${istAktiv ? t('parent.active') : t('parent.inactive')}</span>
              ${abo.enddatum ? `<span class="badge badge-gray">${t('parent.valid_until', {date: Utils.formatDatum(abo.enddatum)})}</span>` : ''}
            </div>
          </div>
        </div>
      </div>`;
  },

  morgen() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }
};

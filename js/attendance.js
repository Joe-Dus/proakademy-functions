const Attendance = {
  aktuellesTrainingId: null,
  gruppeFilter: '',

  render() {
    const trainings = DB.getTrainings()
      .sort((a, b) => b.datum.localeCompare(a.datum) || b.startzeit.localeCompare(a.startzeit));

    document.getElementById('app').innerHTML = `
      <div class="page-header">
        <div>
          <h1>${t('attendance.title')}</h1>
          <p class="subtitle">${t('attendance.subtitle')}</p>
        </div>
      </div>

      <div class="attendance-layout">
        <div class="card attendance-selector-card">
          <div class="card-header"><h3><i class="bi bi-calendar3"></i> ${t('attendance.select_training')}</h3></div>
          <div class="card-body">
            <div class="form-group mb-3">
              <label>${t('attendance.filter_group')}</label>
              <select onchange="Attendance.gruppeFilter=this.value;Attendance.renderTrainingListe()" id="att-gruppe-filter">
                <option value="">${t('common.all_groups')}</option>
                ${GRUPPEN.map(g => `<option value="${g}">${g}</option>`).join('')}
              </select>
            </div>
            <div id="training-liste" class="training-select-list">
              ${this.renderTrainingListeHTML(trainings)}
            </div>
          </div>
        </div>

        <div id="anwesenheit-panel" class="card attendance-panel-card">
          ${this.aktuellesTrainingId ? this.renderAnwesenheitPanel() : this.renderEmptyPanel()}
        </div>
      </div>
    `;
  },

  renderTrainingListeHTML(trainings) {
    let filtered = trainings;
    if (this.gruppeFilter) filtered = filtered.filter(tr => tr.gruppe === this.gruppeFilter);

    if (filtered.length === 0) return `<p class="empty-state">${t('attendance.no_trainings')}</p>`;

    const heute = Utils.heute();
    return filtered.slice(0, 30).map(tr => {
      const f = GRUPPEN_FARBEN[tr.gruppe] || { bg: '#64748b' };
      const anw = DB.getAnwesenheitByTraining(tr.id);
      const anwesend = anw.filter(a => a.anwesend).length;
      const gesamt = anw.length;
      const aktiv = this.aktuellesTrainingId === tr.id;
      const istVergangen = tr.datum < heute;
      const istHeute = tr.datum === heute;
      return `
        <div class="training-select-item ${aktiv ? 'active' : ''}" onclick="Attendance.waehleTraining('${tr.id}')">
          <div class="ts-color" style="background:${f.bg}"></div>
          <div class="ts-info">
            <div class="ts-titel">${Utils.escapeHtml(tr.titel)}
              ${istHeute ? `<span class="badge badge-today">${t('common.today')}</span>` : ''}
            </div>
            <div class="ts-meta">${Utils.formatDatum(tr.datum)} · ${tr.startzeit}–${tr.endzeit}</div>
          </div>
          <div class="ts-badge">
            ${gesamt > 0 ? `<span class="badge ${anwesend === gesamt ? 'badge-green' : 'badge-gray'}">${anwesend}/${gesamt}</span>` :
              (istVergangen ? `<span class="badge badge-orange">${t('attendance.open')}</span>` : '<span class="badge badge-gray">—</span>')}
          </div>
        </div>`;
    }).join('');
  },

  renderTrainingListe() {
    const el = document.getElementById('training-liste');
    if (!el) return;
    const trainings = DB.getTrainings()
      .sort((a, b) => b.datum.localeCompare(a.datum) || b.startzeit.localeCompare(a.startzeit));
    el.innerHTML = this.renderTrainingListeHTML(trainings);
  },

  renderEmptyPanel() {
    return `
      <div class="empty-panel">
        <i class="bi bi-calendar-check" style="font-size:3rem;color:#cbd5e1"></i>
        <h3>${t('attendance.empty_title')}</h3>
        <p>${t('attendance.empty_hint')}</p>
      </div>`;
  },

  renderAnwesenheitPanel() {
    const training = DB.getTrainingById(this.aktuellesTrainingId);
    if (!training) return this.renderEmptyPanel();

    const f = GRUPPEN_FARBEN[training.gruppe] || { bg: '#64748b' };
    const spieler = DB.getSpielerByGruppe(training.gruppe);
    const bestehend = DB.getAnwesenheitByTraining(training.id);
    const anwesenheitMap = {};
    bestehend.forEach(a => { anwesenheitMap[a.spielerId] = a.anwesend; });

    const anwesend = Object.values(anwesenheitMap).filter(Boolean).length;

    return `
      <div class="panel-header" style="border-bottom:3px solid ${f.bg}">
        <div>
          <h3>${Utils.escapeHtml(training.titel)}</h3>
          <p class="panel-meta">
            <i class="bi bi-calendar3"></i> ${Utils.formatDatumLang(training.datum)}
            &nbsp;·&nbsp;
            <i class="bi bi-clock"></i> ${training.startzeit} – ${training.endzeit}
            &nbsp;·&nbsp;
            <i class="bi bi-geo-alt"></i> ${Utils.escapeHtml(training.ort || '—')}
          </p>
        </div>
        <div class="panel-summary">
          <div class="summary-number" style="color:${f.bg}">${anwesend}</div>
          <div class="summary-label">${t('attendance.present')}</div>
        </div>
      </div>

      <div class="panel-actions">
        <button class="btn btn-sm btn-outline" onclick="Attendance.alleMarkieren(true)">
          <i class="bi bi-check-all"></i> ${t('attendance.all_present')}
        </button>
        <button class="btn btn-sm btn-outline" onclick="Attendance.alleMarkieren(false)">
          <i class="bi bi-x-lg"></i> ${t('attendance.all_absent')}
        </button>
      </div>

      ${spieler.length === 0 ? `<p class="empty-state mt-3">${t('attendance.no_players')}</p>` : `
      <div class="anwesenheit-list" id="anwesenheit-list">
        ${spieler.map(s => {
          const isAnwesend = anwesenheitMap[s.id] === undefined ? false : anwesenheitMap[s.id];
          const abo = DB.getAktivesAbo(s.id);
          const monat = training.datum.substring(0, 7);
          const verbraucht = DB.getAnzahlTrainingsThisMonth(s.id, monat);
          let kontingentBadge = '';
          if (abo?.typ === 'kontingent') {
            const pct = verbraucht / abo.einheitenProMonat;
            const color = pct >= 1 ? '#ef4444' : pct >= 0.75 ? '#f59e0b' : '#10b981';
            kontingentBadge = `<span class="kontingent-mini" style="color:${color}">
              ${verbraucht}/${abo.einheitenProMonat} <i class="bi bi-ticket-perforated"></i>
            </span>`;
          }
          return `
            <label class="anwesenheit-item ${isAnwesend ? 'present' : ''}">
              <input type="checkbox" class="anw-checkbox" data-spieler-id="${s.id}"
                ${isAnwesend ? 'checked' : ''} onchange="Attendance.toggleAnwesenheit(this)">
              <div class="anw-avatar" style="background:${f.bg}">
                ${s.vorname[0]}${s.nachname[0]}
              </div>
              <div class="anw-info">
                <span class="anw-name">${Utils.escapeHtml(s.vorname)} ${Utils.escapeHtml(s.nachname)}</span>
                ${abo ? `<span class="anw-abo">${Utils.escapeHtml(abo.name)}</span>` : ''}
              </div>
              ${kontingentBadge}
              <div class="anw-status">
                <i class="bi ${isAnwesend ? 'bi-check-circle-fill' : 'bi-circle'}" style="color:${isAnwesend ? '#10b981' : '#cbd5e1'}"></i>
              </div>
            </label>`;
        }).join('')}
      </div>`}

      <div class="panel-footer">
        <button class="btn btn-primary btn-full" onclick="Attendance.speichern()">
          <i class="bi bi-floppy"></i> ${t('attendance.save')}
        </button>
      </div>
    `;
  },

  waehleTraining(id) {
    this.aktuellesTrainingId = id;
    const panel = document.getElementById('anwesenheit-panel');
    if (panel) panel.innerHTML = this.renderAnwesenheitPanel();
    this.renderTrainingListe();
  },

  vorwaehlenTraining(id) {
    this.aktuellesTrainingId = id;
  },

  toggleAnwesenheit(checkbox) {
    const item = checkbox.closest('.anwesenheit-item');
    item.classList.toggle('present', checkbox.checked);
    const icon = item.querySelector('.anw-status i');
    if (icon) {
      icon.className = `bi ${checkbox.checked ? 'bi-check-circle-fill' : 'bi-circle'}`;
      icon.style.color = checkbox.checked ? '#10b981' : '#cbd5e1';
    }
    this.updateSummary();
  },

  updateSummary() {
    const checked = document.querySelectorAll('.anw-checkbox:checked').length;
    const summaryEl = document.querySelector('.summary-number');
    if (summaryEl) summaryEl.textContent = checked;
  },

  alleMarkieren(anwesend) {
    document.querySelectorAll('.anw-checkbox').forEach(cb => {
      cb.checked = anwesend;
      const item = cb.closest('.anwesenheit-item');
      item.classList.toggle('present', anwesend);
      const icon = item.querySelector('.anw-status i');
      if (icon) {
        icon.className = `bi ${anwesend ? 'bi-check-circle-fill' : 'bi-circle'}`;
        icon.style.color = anwesend ? '#10b981' : '#cbd5e1';
      }
    });
    this.updateSummary();
  },

  speichern() {
    if (!this.aktuellesTrainingId) return;
    const training = DB.getTrainingById(this.aktuellesTrainingId);
    if (!training) return;

    const eintraege = [];
    document.querySelectorAll('.anw-checkbox').forEach(cb => {
      eintraege.push({
        trainingId: this.aktuellesTrainingId,
        spielerId: cb.dataset.spielerId,
        anwesend: cb.checked,
        notiert: new Date().toISOString()
      });
    });

    DB.saveAnwesenheitForTraining(this.aktuellesTrainingId, eintraege);
    const anzahl = eintraege.filter(e => e.anwesend).length;
    Utils.showToast(t('attendance.saved', {present: anzahl, total: eintraege.length}));
    this.renderTrainingListe();
    const panel = document.getElementById('anwesenheit-panel');
    if (panel) panel.innerHTML = this.renderAnwesenheitPanel();
  }
};

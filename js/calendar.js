const PA_Calendar = {
  fc: null,
  filterGruppe: '',
  _calAnwTrainingId: null,

  render() {
    document.getElementById('app').innerHTML = `
      <div class="page-header">
        <div>
          <h1>${t('calendar.title')}</h1>
          <p class="subtitle">${t('calendar.subtitle')}</p>
        </div>
        <div class="header-actions">
          <select onchange="PA_Calendar.filterGruppe=this.value;PA_Calendar.refreshEvents()" class="select-inline">
            <option value="">${t('common.all_groups')}</option>
            ${GRUPPEN.map(g => `<option value="${g}">${g}</option>`).join('')}
          </select>
          <button class="btn btn-primary" onclick="PA_Calendar.openTrainingModal()">
            <i class="bi bi-plus-lg"></i> ${t('calendar.add')}
          </button>
        </div>
      </div>
      <div class="calendar-layout">
        <div class="card calendar-card">
          <div id="fullcalendar"></div>
        </div>
        <div class="calendar-sidebar">
          <div class="card">
            <div class="card-header"><h3><i class="bi bi-info-circle"></i> ${t('calendar.legend')}</h3></div>
            <div class="card-body">
              <div class="legend-grid">
                ${GRUPPEN.map(g => {
                  const f = GRUPPEN_FARBEN[g];
                  return `<div class="legend-item">
                    <span class="legend-dot" style="background:${f.bg}"></span>
                    <span>${g}</span>
                  </div>`;
                }).join('')}
              </div>
            </div>
          </div>
          <div class="card mt-3">
            <div class="card-header"><h3><i class="bi bi-calendar-today"></i> ${t('calendar.today_panel')}</h3></div>
            <div id="sidebar-heute" class="card-body p0">
              <p class="empty-state">${t('calendar.no_training_today')}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Training Modal -->
      <div id="modal-training" class="modal">
        <div class="modal-overlay" onclick="Utils.closeModal('modal-training')"></div>
        <div class="modal-box">
          <div class="modal-header">
            <h2 id="training-modal-title">${t('calendar.add_title')}</h2>
            <button class="modal-close" onclick="Utils.closeModal('modal-training')"><i class="bi bi-x-lg"></i></button>
          </div>
          <form id="form-training" onsubmit="PA_Calendar.saveTraining(event)">
            <input type="hidden" id="training-id">
            <div class="form-grid">
              <div class="form-group form-full">
                <label>${t('calendar.field_title')} *</label>
                <input type="text" id="training-titel" required placeholder="${t('calendar.title_placeholder')}">
              </div>
              <div class="form-group">
                <label>${t('calendar.field_group')} *</label>
                <select id="training-gruppe" required onchange="PA_Calendar.onGruppeChange()">
                  <option value="">${t('calendar.select_group')}</option>
                  ${GRUPPEN.map(g => `<option value="${g}">${g}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label>${t('calendar.field_date')} *</label>
                <input type="date" id="training-datum" required>
              </div>
              <div class="form-group">
                <label>${t('calendar.field_start')} *</label>
                <input type="time" id="training-startzeit" required value="16:00">
              </div>
              <div class="form-group">
                <label>${t('calendar.field_end')} *</label>
                <input type="time" id="training-endzeit" required value="17:30">
              </div>
              <div class="form-group">
                <label>${t('calendar.field_location')}</label>
                <input type="text" id="training-ort" placeholder="${t('calendar.location_placeholder')}">
              </div>
              <div class="form-group">
                <label>${t('calendar.field_trainer')}</label>
                <input type="text" id="training-trainer" placeholder="Name des Trainers">
              </div>
              <div class="form-group form-full">
                <label>${t('calendar.field_notes')}</label>
                <textarea id="training-notizen" rows="2" placeholder="Besonderheiten..."></textarea>
              </div>
              <div class="form-group form-full" id="training-teilnehmer-block" style="display:none">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
                  <label style="margin:0">Teilnehmer</label>
                  <button type="button" class="tn-all-btn" onclick="PA_Calendar.toggleAllTeilnehmer(true)">Alle</button>
                  <button type="button" class="tn-all-btn" onclick="PA_Calendar.toggleAllTeilnehmer(false)">Keine</button>
                  <span class="text-muted" id="teiln-count-label" style="font-size:.78rem;margin-left:auto"></span>
                </div>
                <div class="teilnehmer-grid" id="training-teilnehmer-liste"></div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-danger" id="btn-training-delete" style="display:none" onclick="PA_Calendar.deleteCurrentTraining()">${t('common.delete')}</button>
              <button type="button" class="btn btn-outline" id="btn-training-anwesenheit" style="display:none" onclick="PA_Calendar.openAnwesenheitFromEditModal()"><i class="bi bi-check2-square"></i> Anwesenheit</button>
              <div style="flex:1"></div>
              <button type="button" class="btn btn-secondary" onclick="Utils.closeModal('modal-training')">${t('common.cancel')}</button>
              <button type="submit" class="btn btn-primary">${t('common.save')}</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Anwesenheit Modal (Kalender) -->
      <div id="modal-cal-anwesenheit" class="modal">
        <div class="modal-overlay" onclick="Utils.closeModal('modal-cal-anwesenheit')"></div>
        <div class="modal-box modal-anw-box">
          <div class="anw-modal-top" id="cal-anw-header">
            <div id="cal-anw-titel-info"></div>
            <button class="modal-close" onclick="Utils.closeModal('modal-cal-anwesenheit')"><i class="bi bi-x-lg"></i></button>
          </div>
          <div id="cal-anw-liste" class="anw-modal-liste"></div>
          <div class="anw-modal-footer">
            <button class="btn btn-primary btn-full" onclick="PA_Calendar.saveAnwesenheitCalendar()">
              <i class="bi bi-floppy"></i> ${t('attendance.save')}
            </button>
          </div>
        </div>
      </div>
    `;

    this.initCalendar();
    this.renderHeuteSidebar();
  },

  initCalendar() {
    const el = document.getElementById('fullcalendar');
    if (!el || typeof FullCalendar === 'undefined') return;

    this.fc = new FullCalendar.Calendar(el, {
      initialView: 'dayGridMonth',
      locale: I18n.lang,
      height: 'auto',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,listWeek'
      },
      editable: true,
      eventResizableFromStart: true,
      events: this.getEvents(),
      eventClick: (info) => {
        if (Auth.getRolle() === 'trainer') {
          this.openAnwesenheitModal(info.event.id);
        } else {
          this.openTrainingModal(info.event.id);
        }
      },
      eventDrop: (info) => this.onEventDrop(info),
      eventResize: (info) => this.onEventResize(info),
      dateClick: (info) => this.openTrainingModal(null, info.dateStr),
      eventDidMount: (info) => {
        info.el.title = `${info.event.extendedProps.ort || ''} · ${info.event.extendedProps.trainer || ''}`;
      }
    });
    this.fc.render();
  },

  getEvents() {
    let trainings = DB.getTrainings();
    if (this.filterGruppe) trainings = trainings.filter(tr => tr.gruppe === this.filterGruppe);
    return trainings.map(tr => {
      const f = GRUPPEN_FARBEN[tr.gruppe] || { bg: '#64748b', dark: '#475569', light: '#f1f5f9', text: '#334155' };
      return {
        id: tr.id,
        title: tr.titel,
        start: `${tr.datum}T${tr.startzeit}`,
        end: `${tr.datum}T${tr.endzeit}`,
        backgroundColor: f.light,
        borderColor: f.bg,
        textColor: f.text,
        extendedProps: { gruppe: tr.gruppe, ort: tr.ort, trainer: tr.trainer }
      };
    });
  },

  refreshEvents() {
    if (this.fc) {
      this.fc.removeAllEvents();
      this.fc.addEventSource(this.getEvents());
    }
    this.renderHeuteSidebar();
  },

  onEventDrop(info) {
    const tr = DB.getTrainingById(info.event.id);
    if (!tr) return;
    const newDatum = info.event.start.toISOString().split('T')[0];
    DB.saveTraining({ ...tr, datum: newDatum });
    Utils.showToast(t('calendar.moved', {date: Utils.formatDatum(newDatum)}));
    this.renderHeuteSidebar();
  },

  onEventResize(info) {
    const tr = DB.getTrainingById(info.event.id);
    if (!tr) return;
    const pad = n => String(n).padStart(2, '0');
    const start = info.event.start;
    const end = info.event.end;
    const newStart = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
    const newEnd = `${pad(end.getHours())}:${pad(end.getMinutes())}`;
    DB.saveTraining({ ...tr, startzeit: newStart, endzeit: newEnd });
    Utils.showToast(t('calendar.time_updated'));
  },

  openTrainingModal(id, datum) {
    const tr = id ? DB.getTrainingById(id) : null;
    document.getElementById('training-modal-title').textContent = tr ? t('calendar.edit_title') : t('calendar.add_title');
    document.getElementById('training-id').value = tr?.id || '';
    document.getElementById('training-titel').value = tr?.titel || '';
    document.getElementById('training-gruppe').value = tr?.gruppe || '';
    document.getElementById('training-datum').value = tr?.datum || datum || Utils.heute();
    document.getElementById('training-startzeit').value = tr?.startzeit || '16:00';
    document.getElementById('training-endzeit').value = tr?.endzeit || '17:30';
    document.getElementById('training-ort').value = tr?.ort || '';
    document.getElementById('training-trainer').value = tr?.trainer || '';
    document.getElementById('training-notizen').value = tr?.notizen || '';
    document.getElementById('btn-training-delete').style.display = tr ? 'inline-flex' : 'none';
    document.getElementById('btn-training-anwesenheit').style.display = tr ? 'inline-flex' : 'none';
    this.updateTeilnehmerListe(tr?.teilnehmer ?? null);
    Utils.openModal('modal-training');
  },

  updateTrainingTitel() {
    const gruppe = document.getElementById('training-gruppe').value;
    const titel = document.getElementById('training-titel');
    if (!titel.value || GRUPPEN.some(g => titel.value === `${t('common.jahrgang')} ${g}` || titel.value === `${g} Training`)) {
      titel.value = gruppe ? `${t('common.jahrgang')} ${gruppe}` : '';
    }
  },

  onGruppeChange() {
    this.updateTrainingTitel();
    this.updateTeilnehmerListe(null);
  },

  updateTeilnehmerListe(selectedIds) {
    const gruppe = document.getElementById('training-gruppe')?.value;
    const block = document.getElementById('training-teilnehmer-block');
    if (!block) return;
    if (!gruppe) { block.style.display = 'none'; return; }
    const spieler = DB.getSpielerByGruppe(gruppe);
    if (spieler.length === 0) { block.style.display = 'none'; return; }
    block.style.display = '';
    const f = GRUPPEN_FARBEN[gruppe] || { bg: '#64748b' };
    document.getElementById('training-teilnehmer-liste').innerHTML = spieler.map(s => {
      const checked = !selectedIds || selectedIds.includes(s.id);
      return `<label class="teilnehmer-item">
        <input type="checkbox" class="tn-checkbox" value="${s.id}" ${checked ? 'checked' : ''} onchange="PA_Calendar.updateTeilnehmerCount()">
        <div class="teilnehmer-avatar" style="background:${f.bg}">${Utils.escapeHtml(s.vorname[0])}${Utils.escapeHtml(s.nachname[0])}</div>
        <span>${Utils.escapeHtml(s.vorname)} ${Utils.escapeHtml(s.nachname)}</span>
      </label>`;
    }).join('');
    this.updateTeilnehmerCount();
  },

  updateTeilnehmerCount() {
    const all = document.querySelectorAll('.tn-checkbox');
    const checked = document.querySelectorAll('.tn-checkbox:checked');
    const label = document.getElementById('teiln-count-label');
    if (label) label.textContent = `${checked.length} von ${all.length} ausgewählt`;
  },

  toggleAllTeilnehmer(checked) {
    document.querySelectorAll('.tn-checkbox').forEach(cb => { cb.checked = checked; });
    this.updateTeilnehmerCount();
  },

  saveTraining(ev) {
    ev.preventDefault();
    const id = document.getElementById('training-id').value;
    const gruppe = document.getElementById('training-gruppe').value;
    const tnCheckboxes = document.querySelectorAll('.tn-checkbox');
    let teilnehmer = null;
    if (tnCheckboxes.length > 0) {
      const selected = Array.from(tnCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
      if (selected.length < DB.getSpielerByGruppe(gruppe).length) teilnehmer = selected;
    }
    const data = {
      id: id || undefined,
      titel: document.getElementById('training-titel').value.trim(),
      gruppe,
      datum: document.getElementById('training-datum').value,
      startzeit: document.getElementById('training-startzeit').value,
      endzeit: document.getElementById('training-endzeit').value,
      ort: document.getElementById('training-ort').value.trim(),
      trainer: document.getElementById('training-trainer').value.trim(),
      notizen: document.getElementById('training-notizen').value.trim(),
      teilnehmer,
    };
    DB.saveTraining(data);
    Utils.closeModal('modal-training');
    Utils.showToast(id ? t('calendar.updated', {title: data.titel}) : t('calendar.added', {title: data.titel}));
    this.refreshEvents();
  },

  deleteCurrentTraining() {
    const id = document.getElementById('training-id').value;
    if (!id) return;
    const tr = DB.getTrainingById(id);
    Utils.confirm(`${tr?.titel || ''}`).then(ok => {
      if (!ok) return;
      DB.deleteTraining(id);
      Utils.closeModal('modal-training');
      Utils.showToast(t('calendar.deleted'), 'error');
      this.refreshEvents();
    });
  },

  renderHeuteSidebar() {
    const el = document.getElementById('sidebar-heute');
    if (!el) return;
    const heute = Utils.heute();
    let trainings = DB.getTrainings()
      .filter(tr => tr.datum === heute)
      .sort((a, b) => a.startzeit.localeCompare(b.startzeit));
    if (trainings.length === 0) {
      el.innerHTML = `<p class="empty-state">${t('calendar.no_training_today')}</p>`;
      return;
    }
    el.innerHTML = trainings.map(tr => {
      const f = GRUPPEN_FARBEN[tr.gruppe] || { bg: '#64748b' };
      return `<div class="sidebar-training-item" onclick="Auth.getRolle()==='trainer'?PA_Calendar.openAnwesenheitModal('${tr.id}'):PA_Calendar.openTrainingModal('${tr.id}')">
        <div class="sidebar-training-dot" style="background:${f.bg}"></div>
        <div>
          <div class="sidebar-training-title">${Utils.escapeHtml(tr.titel)}</div>
          <div class="sidebar-training-time">${tr.startzeit} – ${tr.endzeit}</div>
        </div>
      </div>`;
    }).join('');
  },

  openAnwesenheitModal(trainingId) {
    const training = DB.getTrainingById(trainingId);
    if (!training) return;
    this._calAnwTrainingId = trainingId;

    const f = GRUPPEN_FARBEN[training.gruppe] || { bg: '#64748b', light: '#f1f5f9' };
    const alleSpieler = DB.getSpielerByGruppe(training.gruppe);
    const spieler = training.teilnehmer && training.teilnehmer.length > 0
      ? alleSpieler.filter(s => training.teilnehmer.includes(s.id))
      : alleSpieler;
    const bestehend = DB.getAnwesenheitByTraining(trainingId);
    const anwesenheitMap = {};
    bestehend.forEach(a => { anwesenheitMap[a.spielerId] = a.anwesend; });
    const monat = training.datum.substring(0, 7);

    document.getElementById('cal-anw-header').style.borderLeft = `4px solid ${f.bg}`;
    document.getElementById('cal-anw-titel-info').innerHTML =
      `<div style="font-size:.78rem;font-weight:700;letter-spacing:.04em;color:${f.bg}">${t('common.jahrgang')} ${training.gruppe}</div>` +
      `<div style="font-size:.82rem;color:var(--text-muted);margin-top:2px">${Utils.formatDatumLang(training.datum)}&ensp;${training.startzeit}–${training.endzeit}</div>`;

    document.getElementById('cal-anw-liste').innerHTML = this._buildAnwListeHTML(spieler, anwesenheitMap, monat, f);
    Utils.openModal('modal-cal-anwesenheit');
  },

  openAnwesenheitFromEditModal() {
    const id = document.getElementById('training-id').value;
    if (!id) return;
    Utils.closeModal('modal-training');
    this.openAnwesenheitModal(id);
  },

  _buildAnwListeHTML(spieler, anwesenheitMap, monat, f) {
    if (spieler.length === 0) return `<p class="empty-state">${t('attendance.no_players')}</p>`;
    return spieler.map(s => {
      const isAnwesend = anwesenheitMap[s.id] ?? false;
      const abo = DB.getAktivesAbo(s.id);
      let teHtml = '';
      if (abo && abo.typ === 'kontingent') {
        const remaining = abo.einheitenProMonat - DB.getAnzahlTrainingsThisMonth(s.id, monat);
        const cls = remaining <= 0 ? 'te-text-red' : remaining === 1 ? 'te-text-yellow' : 'te-text-green';
        teHtml = `<span class="anw-te-text ${cls}">${Math.max(0, remaining)} von ${abo.einheitenProMonat} TE</span>`;
      }
      return `
        <label class="anw-row ${isAnwesend ? 'anw-row-present' : ''}">
          <input type="checkbox" class="cal-anw-checkbox" data-spieler-id="${s.id}"
            ${isAnwesend ? 'checked' : ''} onchange="PA_Calendar.toggleAnwesenheitCalendar(this)">
          <div class="anw-athlete">
            <div class="anw-avatar-lg" style="background:${f.bg}">
              ${Utils.escapeHtml(s.vorname[0])}${Utils.escapeHtml(s.nachname[0])}
            </div>
            <div class="anw-name-block">
              <span class="anw-full-name">${Utils.escapeHtml(s.vorname)} ${Utils.escapeHtml(s.nachname)}</span>
              ${teHtml}
            </div>
          </div>
          <div class="anw-check-col">
            <i class="bi ${isAnwesend ? 'bi-check-square-fill' : 'bi-square'} anw-chk-icon"></i>
            <span class="anw-check-text">Anwesend</span>
          </div>
        </label>`;
    }).join('');
  },

  toggleAnwesenheitCalendar(checkbox) {
    const row = checkbox.closest('.anw-row');
    if (!row) return;
    row.classList.toggle('anw-row-present', checkbox.checked);
    const icon = row.querySelector('.anw-chk-icon');
    if (icon) icon.className = `bi ${checkbox.checked ? 'bi-check-square-fill' : 'bi-square'} anw-chk-icon`;
  },

  alleMarkierenCalendar(anwesend) {
    document.querySelectorAll('.cal-anw-checkbox').forEach(cb => {
      cb.checked = anwesend;
      const row = cb.closest('.anw-row');
      if (!row) return;
      row.classList.toggle('anw-row-present', anwesend);
      const icon = row.querySelector('.anw-chk-icon');
      if (icon) icon.className = `bi ${anwesend ? 'bi-check-square-fill' : 'bi-square'} anw-chk-icon`;
    });
  },

  saveAnwesenheitCalendar() {
    if (!this._calAnwTrainingId) return;
    const training = DB.getTrainingById(this._calAnwTrainingId);
    if (!training) return;

    const eintraege = [];
    document.querySelectorAll('.cal-anw-checkbox').forEach(cb => {
      eintraege.push({
        trainingId: this._calAnwTrainingId,
        spielerId: cb.dataset.spielerId,
        anwesend: cb.checked,
        notiert: new Date().toISOString()
      });
    });

    DB.saveAnwesenheitForTraining(this._calAnwTrainingId, eintraege);
    const anzahl = eintraege.filter(e => e.anwesend).length;
    Utils.closeModal('modal-cal-anwesenheit');
    Utils.showToast(t('attendance.saved', {present: anzahl, total: eintraege.length}));

    const monat = training.datum.substring(0, 7);
    const relevanteSpieler = training.teilnehmer && training.teilnehmer.length > 0
      ? DB.getSpielerByGruppe(training.gruppe).filter(s => training.teilnehmer.includes(s.id))
      : DB.getSpielerByGruppe(training.gruppe);
    const atLimit = relevanteSpieler.filter(s => {
      const abo = DB.getAktivesAbo(s.id);
      if (!abo || abo.typ !== 'kontingent') return false;
      return DB.getAnzahlTrainingsThisMonth(s.id, monat) >= abo.einheitenProMonat;
    });
    if (atLimit.length > 0) {
      setTimeout(() => Utils.showToast(
        `⚠ ${atLimit.length} Spieler hat/haben das Monatskontingent ausgeschöpft!`, 'warning'
      ), 700);
    }
    this.refreshEvents();
  }
};

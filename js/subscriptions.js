const Subscriptions = {
  filter: { suche: '', typ: '' },

  render() {
    document.getElementById('app').innerHTML = `
      <div class="page-header">
        <div>
          <h1>${t('subscriptions.title')}</h1>
          <p class="subtitle">${t('subscriptions.subtitle')}</p>
        </div>
        <button class="btn btn-primary" onclick="Subscriptions.openAboModal()">
          <i class="bi bi-plus-lg"></i> ${t('subscriptions.add')}
        </button>
      </div>

      ${this.renderKontingentUebersicht()}

      <div class="filter-bar mt-4">
        <div class="search-box">
          <i class="bi bi-search"></i>
          <input type="text" placeholder="${t('subscriptions.search_placeholder')}"
            oninput="Subscriptions.filter.suche=this.value;Subscriptions.updateList()">
        </div>
        <select onchange="Subscriptions.filter.typ=this.value;Subscriptions.updateList()">
          <option value="">${t('subscriptions.all_types')}</option>
          <option value="kontingent">${t('subscriptions.contingent')}</option>
          <option value="monat">${t('subscriptions.monthly')}</option>
          <option value="jahr">${t('subscriptions.annual')}</option>
        </select>
      </div>

      <div id="abo-list-container">
        ${this.renderAboList()}
      </div>

      <!-- Abo Modal -->
      <div id="modal-abo" class="modal">
        <div class="modal-overlay" onclick="Utils.closeModal('modal-abo')"></div>
        <div class="modal-box">
          <div class="modal-header">
            <h2 id="abo-modal-title">${t('subscriptions.add_title')}</h2>
            <button class="modal-close" onclick="Utils.closeModal('modal-abo')"><i class="bi bi-x-lg"></i></button>
          </div>
          <form id="form-abo" onsubmit="Subscriptions.saveAbo(event)">
            <input type="hidden" id="abo-id">
            <div class="form-grid">
              <div class="form-group form-full">
                <label>${t('subscriptions.field_player')}</label>
                <select id="abo-spieler-id" required>
                  <option value="">${t('subscriptions.select_player')}</option>
                  ${DB.getSpieler().filter(s => s.aktiv).map(s =>
                    `<option value="${s.id}">${Utils.escapeHtml(s.vorname)} ${Utils.escapeHtml(s.nachname)} (${s.gruppe})</option>`
                  ).join('')}
                </select>
              </div>
              <div class="form-group form-full">
                <label>${t('subscriptions.field_name')}</label>
                <input type="text" id="abo-name" required placeholder="z.B. 8er Kontingent">
              </div>
              <div class="form-group">
                <label>${t('subscriptions.field_type')}</label>
                <select id="abo-typ" required onchange="Subscriptions.toggleKontingentFelder()">
                  <option value="">${t('subscriptions.select_type')}</option>
                  <option value="kontingent">${t('subscriptions.contingent')}</option>
                  <option value="monat">${t('subscriptions.monthly')}</option>
                  <option value="jahr">${t('subscriptions.annual')}</option>
                </select>
              </div>
              <div class="form-group" id="field-einheiten">
                <label>${t('subscriptions.field_units')}</label>
                <input type="number" id="abo-einheiten" min="1" max="31" placeholder="8">
              </div>
              <div class="form-group">
                <label>${t('subscriptions.field_price')}</label>
                <input type="number" id="abo-preis" required min="0" step="0.01" placeholder="45.00">
              </div>
              <div class="form-group">
                <label>${t('subscriptions.field_start')}</label>
                <input type="date" id="abo-startdatum" required value="${Utils.heute()}">
              </div>
              <div class="form-group">
                <label>${t('subscriptions.field_end')} <span class="text-muted">${t('subscriptions.field_end_hint')}</span></label>
                <input type="date" id="abo-enddatum">
              </div>
              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" id="abo-aktiv" checked>
                  ${t('subscriptions.field_active')}
                </label>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-danger" id="btn-abo-delete" style="display:none" onclick="Subscriptions.deleteCurrentAbo()">${t('common.delete')}</button>
              <div style="flex:1"></div>
              <button type="button" class="btn btn-secondary" onclick="Utils.closeModal('modal-abo')">${t('common.cancel')}</button>
              <button type="submit" class="btn btn-primary">${t('common.save')}</button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  renderKontingentUebersicht() {
    const monat = Utils.aktuellerMonat();
    const abos = DB.getAbos().filter(a => a.aktiv && a.typ === 'kontingent');
    if (abos.length === 0) return '';

    return `
      <div class="card">
        <div class="card-header">
          <h3><i class="bi bi-ticket-perforated-fill"></i> ${t('subscriptions.contingents')} – ${Utils.formatMonat(monat)}</h3>
        </div>
        <div class="kontingent-grid">
          ${abos.map(abo => {
            const spieler = DB.getSpielerById(abo.spielerId);
            if (!spieler) return '';
            const verbraucht = DB.getAnzahlTrainingsThisMonth(abo.spielerId, monat);
            const gesamt = abo.einheitenProMonat;
            const pct = Math.min(Math.round((verbraucht / gesamt) * 100), 100);
            const color = pct >= 100 ? '#ef4444' : pct >= 75 ? '#f59e0b' : '#10b981';
            const f = GRUPPEN_FARBEN[spieler.gruppe] || { bg: '#64748b', light: '#f1f5f9' };
            return `
              <div class="kontingent-card">
                <div class="kk-header">
                  <div class="kk-avatar" style="background:${f.bg}">${spieler.vorname[0]}${spieler.nachname[0]}</div>
                  <div class="kk-info">
                    <strong>${Utils.escapeHtml(spieler.vorname)} ${Utils.escapeHtml(spieler.nachname)}</strong>
                    <span>${Utils.gruppenBadge(spieler.gruppe)}</span>
                  </div>
                  <div class="kk-count" style="color:${color}">${verbraucht}/${gesamt}</div>
                </div>
                <div class="kk-label">${Utils.escapeHtml(abo.name)}</div>
                <div class="progress-bar-track mt-2">
                  <div class="progress-bar-fill" style="width:${pct}%;background:${color}"></div>
                </div>
                <div class="kk-footer">
                  <span style="color:${color};font-size:.8rem">
                    ${pct >= 100 ? t('subscriptions.exhausted') : t('subscriptions.remaining', {n: gesamt - verbraucht})}
                  </span>
                  <span class="text-muted" style="font-size:.8rem">${pct}%</span>
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>`;
  },

  renderAboList() {
    let abos = DB.getAbos();
    const { suche, typ } = this.filter;
    if (typ) abos = abos.filter(a => a.typ === typ);
    if (suche) {
      const s = suche.toLowerCase();
      abos = abos.filter(a => {
        const sp = DB.getSpielerById(a.spielerId);
        return a.name.toLowerCase().includes(s) ||
          (sp && `${sp.vorname} ${sp.nachname}`.toLowerCase().includes(s));
      });
    }

    const heute = Utils.heute();
    const typMap = { kontingent: 'subscriptions.contingent', monat: 'subscriptions.monthly', jahr: 'subscriptions.annual' };
    return `
      <div class="card">
        <table class="table">
          <thead>
            <tr>
              <th>${t('subscriptions.col_player')}</th>
              <th>${t('subscriptions.col_subscription')}</th>
              <th>${t('subscriptions.col_type')}</th>
              <th>${t('subscriptions.col_price')}</th>
              <th>${t('subscriptions.col_duration')}</th>
              <th>${t('common.status')}</th>
              <th>${t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            ${abos.length === 0 ? `<tr><td colspan="7" class="empty-state">${t('subscriptions.no_abos')}</td></tr>` :
              abos.map(abo => {
                const sp = DB.getSpielerById(abo.spielerId);
                const isAktiv = abo.aktiv && abo.startdatum <= heute && (!abo.enddatum || abo.enddatum >= heute);
                return `<tr>
                  <td>
                    ${sp ? `<strong>${Utils.escapeHtml(sp.vorname)} ${Utils.escapeHtml(sp.nachname)}</strong><br>${Utils.gruppenBadge(sp.gruppe)}` : `<span class="text-muted">${t('subscriptions.deleted_player')}</span>`}
                  </td>
                  <td>${Utils.escapeHtml(abo.name)}</td>
                  <td>
                    <span class="badge ${abo.typ === 'kontingent' ? 'badge-blue' : abo.typ === 'monat' ? 'badge-purple' : 'badge-orange'}">
                      ${t(typMap[abo.typ] || 'subscriptions.col_type')}
                      ${abo.typ === 'kontingent' ? ` (${abo.einheitenProMonat}x)` : ''}
                    </span>
                  </td>
                  <td>${abo.preis ? abo.preis.toFixed(2) + ' €' : '—'}</td>
                  <td>
                    <span class="text-muted">${Utils.formatDatum(abo.startdatum)}</span>
                    ${abo.enddatum ? ` – ${Utils.formatDatum(abo.enddatum)}` : ` – ${t('subscriptions.unlimited')}`}
                  </td>
                  <td><span class="status-dot ${isAktiv ? 'active' : 'inactive'}">${isAktiv ? t('common.active') : t('common.inactive')}</span></td>
                  <td class="action-cell">
                    <button class="btn-icon" onclick="Subscriptions.openAboModal('${abo.id}')"><i class="bi bi-pencil"></i></button>
                    <button class="btn-icon danger" onclick="Subscriptions.deleteAbo('${abo.id}')"><i class="bi bi-trash"></i></button>
                  </td>
                </tr>`;
              }).join('')}
          </tbody>
        </table>
      </div>`;
  },

  updateList() {
    const el = document.getElementById('abo-list-container');
    if (el) el.innerHTML = this.renderAboList();
  },

  toggleKontingentFelder() {
    const typ = document.getElementById('abo-typ').value;
    const field = document.getElementById('field-einheiten');
    const input = document.getElementById('abo-einheiten');
    if (typ === 'kontingent') {
      field.style.display = '';
      input.required = true;
    } else {
      field.style.display = 'none';
      input.required = false;
      input.value = '';
    }
  },

  openAboModal(id) {
    const abo = id ? DB.getAboById(id) : null;
    document.getElementById('abo-modal-title').textContent = abo ? t('subscriptions.edit_title') : t('subscriptions.add_title');
    document.getElementById('abo-id').value = abo?.id || '';
    document.getElementById('abo-spieler-id').value = abo?.spielerId || '';
    document.getElementById('abo-name').value = abo?.name || '';
    document.getElementById('abo-typ').value = abo?.typ || '';
    document.getElementById('abo-einheiten').value = abo?.einheitenProMonat || '';
    document.getElementById('abo-preis').value = abo?.preis || '';
    document.getElementById('abo-startdatum').value = abo?.startdatum || Utils.heute();
    document.getElementById('abo-enddatum').value = abo?.enddatum || '';
    document.getElementById('abo-aktiv').checked = abo ? abo.aktiv : true;
    document.getElementById('btn-abo-delete').style.display = abo ? 'inline-flex' : 'none';
    document.getElementById('field-einheiten').style.display = abo?.typ === 'kontingent' ? '' : 'none';
    Utils.openModal('modal-abo');
  },

  saveAbo(ev) {
    ev.preventDefault();
    const id = document.getElementById('abo-id').value;
    const typ = document.getElementById('abo-typ').value;
    const einheiten = parseInt(document.getElementById('abo-einheiten').value) || null;
    const data = {
      id: id || undefined,
      spielerId: document.getElementById('abo-spieler-id').value,
      name: document.getElementById('abo-name').value.trim(),
      typ,
      einheitenProMonat: typ === 'kontingent' ? einheiten : null,
      preis: parseFloat(document.getElementById('abo-preis').value) || 0,
      startdatum: document.getElementById('abo-startdatum').value,
      enddatum: document.getElementById('abo-enddatum').value || null,
      aktiv: document.getElementById('abo-aktiv').checked,
    };
    const saved = DB.saveAbo(data);
    const sp = DB.getSpielerById(data.spielerId);
    if (sp && !sp.aboId) DB.saveSpieler({ ...sp, aboId: saved.id });
    Utils.closeModal('modal-abo');
    Utils.showToast(id ? t('subscriptions.updated', {name: data.name}) : t('subscriptions.added', {name: data.name}));
    this.render();
  },

  deleteCurrentAbo() {
    const id = document.getElementById('abo-id').value;
    if (!id) return;
    const abo = DB.getAboById(id);
    Utils.confirm(t('subscriptions.confirm_delete', {name: abo?.name || ''})).then(ok => {
      if (!ok) return;
      DB.deleteAbo(id);
      Utils.closeModal('modal-abo');
      Utils.showToast(t('subscriptions.deleted'), 'error');
      this.render();
    });
  },

  async deleteAbo(id) {
    const abo = DB.getAboById(id);
    if (!abo) return;
    const ok = await Utils.confirm(t('subscriptions.confirm_delete', {name: abo.name}));
    if (!ok) return;
    DB.deleteAbo(id);
    Utils.showToast(t('subscriptions.deleted'), 'error');
    this.render();
  }
};

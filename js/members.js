const Members = {
  aktuellerTab: 'spieler',
  spielerFilter: { suche: '', gruppe: '' },
  elternFilter: { suche: '' },

  render() {
    document.getElementById('app').innerHTML = `
      <div class="page-header">
        <div>
          <h1>${t('members.title')}</h1>
          <p class="subtitle">${t('members.subtitle')}</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-primary" onclick="Members.openSpielerModal()">
            <i class="bi bi-person-plus-fill"></i> ${t('members.add_player')}
          </button>
          <button class="btn btn-secondary" onclick="Members.openElternModal()">
            <i class="bi bi-person-plus"></i> ${t('members.add_parent')}
          </button>
        </div>
      </div>

      <div class="tabs">
        <button class="tab ${this.aktuellerTab === 'spieler' ? 'active' : ''}" onclick="Members.switchTab('spieler')">
          <i class="bi bi-person-running"></i> ${t('members.players_tab')}
        </button>
        <button class="tab ${this.aktuellerTab === 'eltern' ? 'active' : ''}" onclick="Members.switchTab('eltern')">
          <i class="bi bi-people"></i> ${t('members.parents_tab')}
        </button>
      </div>

      <div id="tab-content">
        ${this.aktuellerTab === 'spieler' ? this.renderSpielerTab() : this.renderElternTab()}
      </div>

      <!-- Spieler Modal -->
      <div id="modal-spieler" class="modal">
        <div class="modal-overlay" onclick="Utils.closeModal('modal-spieler')"></div>
        <div class="modal-box">
          <div class="modal-header">
            <h2 id="spieler-modal-title">${t('members.add_player_title')}</h2>
            <button class="modal-close" onclick="Utils.closeModal('modal-spieler')"><i class="bi bi-x-lg"></i></button>
          </div>
          <form id="form-spieler" onsubmit="Members.saveSpieler(event)">
            <input type="hidden" id="spieler-id">
            <div class="form-grid">
              <div class="form-group">
                <label>${t('members.firstname')} *</label>
                <input type="text" id="spieler-vorname" required placeholder="Max">
              </div>
              <div class="form-group">
                <label>${t('members.lastname')} *</label>
                <input type="text" id="spieler-nachname" required placeholder="Mustermann">
              </div>
              <div class="form-group">
                <label>${t('common.birthdate')} *</label>
                <input type="date" id="spieler-geburtsdatum" required>
              </div>
              <div class="form-group">
                <label>${t('common.group')} *</label>
                <select id="spieler-gruppe" required>
                  <option value="">${t('members.select_group')}</option>
                  ${GRUPPEN.map(g => `<option value="${g}">${g}</option>`).join('')}
                </select>
              </div>
              <div class="form-group form-full">
                <label>E-Mail Elternteil <span class="text-muted" style="font-size:.78rem">(Login-E-Mail für Eltern-Zugang)</span></label>
                <input type="email" id="spieler-eltern-email" placeholder="eltern@email.de">
              </div>
              <div class="form-group form-full">
                <label>${t('members.linked_parents')}</label>
                <div id="spieler-eltern-checkboxes" class="checkbox-group">
                  ${DB.getEltern().map(e => `
                    <label class="checkbox-label">
                      <input type="checkbox" name="elternId" value="${e.id}">
                      ${Utils.escapeHtml(e.vorname)} ${Utils.escapeHtml(e.nachname)}
                    </label>`).join('') || `<span class="text-muted">${t('members.no_parents')}</span>`}
                </div>
              </div>
              <div class="form-group form-full">
                <label>${t('common.notes')}</label>
                <textarea id="spieler-notizen" rows="2" placeholder="${t('members.notes_placeholder')}"></textarea>
              </div>
              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" id="spieler-aktiv" checked>
                  ${t('members.active_member')}
                </label>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="Utils.closeModal('modal-spieler')">${t('common.cancel')}</button>
              <button type="submit" class="btn btn-primary">${t('common.save')}</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Eltern Modal -->
      <div id="modal-eltern" class="modal">
        <div class="modal-overlay" onclick="Utils.closeModal('modal-eltern')"></div>
        <div class="modal-box">
          <div class="modal-header">
            <h2 id="eltern-modal-title">${t('members.add_parent_title')}</h2>
            <button class="modal-close" onclick="Utils.closeModal('modal-eltern')"><i class="bi bi-x-lg"></i></button>
          </div>
          <form id="form-eltern" onsubmit="Members.saveEltern(event)">
            <input type="hidden" id="eltern-id">
            <div class="form-grid">
              <div class="form-group">
                <label>${t('members.firstname')} *</label>
                <input type="text" id="eltern-vorname" required placeholder="Klaus">
              </div>
              <div class="form-group">
                <label>${t('members.lastname')} *</label>
                <input type="text" id="eltern-nachname" required placeholder="Mustermann">
              </div>
              <div class="form-group">
                <label>${t('common.email')} *</label>
                <input type="email" id="eltern-email" required placeholder="email@beispiel.de">
              </div>
              <div class="form-group">
                <label>${t('common.phone')}</label>
                <input type="tel" id="eltern-telefon" placeholder="+49 171 1234567">
              </div>
              <div class="form-group form-full">
                <label>${t('members.linked_players')}</label>
                <div id="eltern-spieler-checkboxes" class="checkbox-group">
                  ${DB.getSpieler().map(s => `
                    <label class="checkbox-label">
                      <input type="checkbox" name="spielerId" value="${s.id}">
                      ${Utils.escapeHtml(s.vorname)} ${Utils.escapeHtml(s.nachname)}
                      ${Utils.gruppenBadge(s.gruppe)}
                    </label>`).join('')}
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="Utils.closeModal('modal-eltern')">${t('common.cancel')}</button>
              <button type="submit" class="btn btn-primary">${t('common.save')}</button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  renderSpielerTab() {
    let spieler = DB.getSpieler();
    const { suche, gruppe } = this.spielerFilter;
    if (suche) {
      const s = suche.toLowerCase();
      spieler = spieler.filter(sp => `${sp.vorname} ${sp.nachname}`.toLowerCase().includes(s));
    }
    if (gruppe) spieler = spieler.filter(sp => sp.gruppe === gruppe);

    return `
      <div class="filter-bar">
        <div class="search-box">
          <i class="bi bi-search"></i>
          <input type="text" placeholder="${t('members.search_player')}" value="${Utils.escapeHtml(suche)}"
            oninput="Members.spielerFilter.suche=this.value;Members.updateTabContent()">
        </div>
        <select onchange="Members.spielerFilter.gruppe=this.value;Members.updateTabContent()">
          <option value="">${t('common.all_groups')}</option>
          ${GRUPPEN.map(g => `<option value="${g}" ${gruppe === g ? 'selected' : ''}>${g}</option>`).join('')}
        </select>
        <span class="filter-count">${t('members.player_count', {n: spieler.length})}</span>
      </div>
      <div class="card">
        <table class="table">
          <thead>
            <tr>
              <th>${t('common.name')}</th>
              <th>${t('common.group')}</th>
              <th>${t('common.age')}</th>
              <th>${t('common.birthdate')}</th>
              <th>${t('members.col_parents')}</th>
              <th>${t('members.col_subscription')}</th>
              <th>${t('common.status')}</th>
              <th>${t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            ${spieler.length === 0 ? `<tr><td colspan="8" class="empty-state">${t('members.no_players')}</td></tr>` :
              spieler.map(s => this.spielerRow(s)).join('')}
          </tbody>
        </table>
      </div>`;
  },

  spielerRow(s) {
    const eltern = (s.elternIds || []).map(id => {
      const e = DB.getElternById(id);
      return e ? `${e.vorname} ${e.nachname}` : '';
    }).filter(Boolean);
    const abo = DB.getAktivesAbo(s.id);
    const elternCell = s.elternEmail
      ? `<span class="text-muted" style="font-size:.8rem"><i class="bi bi-envelope" style="color:#64748b;margin-right:3px"></i>${Utils.escapeHtml(s.elternEmail)}</span>`
      : eltern.length ? eltern.map(e => `<span class="text-muted">${Utils.escapeHtml(e)}</span>`).join('<br>') : '<span class="text-muted">—</span>';
    return `
      <tr>
        <td><strong>${Utils.escapeHtml(s.vorname)} ${Utils.escapeHtml(s.nachname)}</strong></td>
        <td>${Utils.gruppenBadge(s.gruppe)}</td>
        <td>${Utils.alter(s.geburtsdatum)} ${t('common.years_short')}</td>
        <td>${Utils.formatDatum(s.geburtsdatum)}</td>
        <td>${elternCell}</td>
        <td>${abo ? `<span class="badge badge-green">${Utils.escapeHtml(abo.name)}</span>` : `<span class="text-muted">${t('common.no_subscription')}</span>`}</td>
        <td><span class="status-dot ${s.aktiv ? 'active' : 'inactive'}">${s.aktiv ? t('common.active') : t('common.inactive')}</span></td>
        <td class="action-cell">
          <button class="btn-icon" title="${t('common.edit')}" onclick="Members.openSpielerModal('${s.id}')"><i class="bi bi-pencil"></i></button>
          ${Auth.getRolle() !== 'trainer' ? `<button class="btn-icon danger" title="${t('common.delete')}" onclick="Members.deleteSpieler('${s.id}')"><i class="bi bi-trash"></i></button>` : ''}
        </td>
      </tr>`;
  },

  renderElternTab() {
    let eltern = DB.getEltern();
    const { suche } = this.elternFilter;
    if (suche) {
      const s = suche.toLowerCase();
      eltern = eltern.filter(e => `${e.vorname} ${e.nachname} ${e.email}`.toLowerCase().includes(s));
    }
    return `
      <div class="filter-bar">
        <div class="search-box">
          <i class="bi bi-search"></i>
          <input type="text" placeholder="${t('members.search_parent')}" value="${Utils.escapeHtml(suche)}"
            oninput="Members.elternFilter.suche=this.value;Members.updateTabContent()">
        </div>
        <span class="filter-count">${t('members.parent_count', {n: eltern.length})}</span>
      </div>
      <div class="card">
        <table class="table">
          <thead>
            <tr>
              <th>${t('common.name')}</th>
              <th>${t('common.email')}</th>
              <th>${t('common.phone')}</th>
              <th>${t('members.col_players')}</th>
              <th>${t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            ${eltern.length === 0 ? `<tr><td colspan="5" class="empty-state">${t('members.no_parents_found')}</td></tr>` :
              eltern.map(e => this.elternRow(e)).join('')}
          </tbody>
        </table>
      </div>`;
  },

  elternRow(e) {
    const spieler = (e.spielerIds || []).map(id => {
      const s = DB.getSpielerById(id);
      return s ? `${s.vorname} ${s.nachname}` : '';
    }).filter(Boolean);
    return `
      <tr>
        <td><strong>${Utils.escapeHtml(e.vorname)} ${Utils.escapeHtml(e.nachname)}</strong></td>
        <td><a href="mailto:${Utils.escapeHtml(e.email)}">${Utils.escapeHtml(e.email)}</a></td>
        <td>${Utils.escapeHtml(e.telefon || '—')}</td>
        <td>${spieler.map(n => `<span class="text-muted">${Utils.escapeHtml(n)}</span>`).join('<br>') || '<span class="text-muted">—</span>'}</td>
        <td class="action-cell">
          <button class="btn-icon" title="${t('common.edit')}" onclick="Members.openElternModal('${e.id}')"><i class="bi bi-pencil"></i></button>
          ${Auth.getRolle() !== 'trainer' ? `<button class="btn-icon danger" title="${t('common.delete')}" onclick="Members.deleteEltern('${e.id}')"><i class="bi bi-trash"></i></button>` : ''}
        </td>
      </tr>`;
  },

  switchTab(tab) {
    this.aktuellerTab = tab;
    this.render();
  },

  updateTabContent() {
    const el = document.getElementById('tab-content');
    if (el) el.innerHTML = this.aktuellerTab === 'spieler' ? this.renderSpielerTab() : this.renderElternTab();
  },

  openSpielerModal(id) {
    const spieler = id ? DB.getSpielerById(id) : null;
    document.getElementById('spieler-modal-title').textContent = spieler ? t('members.edit_player_title') : t('members.add_player_title');
    document.getElementById('spieler-id').value = spieler?.id || '';
    document.getElementById('spieler-vorname').value = spieler?.vorname || '';
    document.getElementById('spieler-nachname').value = spieler?.nachname || '';
    document.getElementById('spieler-geburtsdatum').value = spieler?.geburtsdatum || '';
    document.getElementById('spieler-gruppe').value = spieler?.gruppe || '';
    document.getElementById('spieler-eltern-email').value = spieler?.elternEmail || '';
    document.getElementById('spieler-notizen').value = spieler?.notizen || '';
    document.getElementById('spieler-aktiv').checked = spieler ? spieler.aktiv : true;
    document.querySelectorAll('[name="elternId"]').forEach(cb => {
      cb.checked = spieler?.elternIds?.includes(cb.value) || false;
    });
    Utils.openModal('modal-spieler');
  },

  saveSpieler(e) {
    e.preventDefault();
    const id = document.getElementById('spieler-id').value;
    const elternIds = [...document.querySelectorAll('[name="elternId"]:checked')].map(cb => cb.value);
    const elternEmail = document.getElementById('spieler-eltern-email').value.trim().toLowerCase() || null;
    const data = {
      id: id || undefined,
      vorname: document.getElementById('spieler-vorname').value.trim(),
      nachname: document.getElementById('spieler-nachname').value.trim(),
      geburtsdatum: document.getElementById('spieler-geburtsdatum').value,
      gruppe: document.getElementById('spieler-gruppe').value,
      elternIds,
      elternEmail,
      notizen: document.getElementById('spieler-notizen').value.trim(),
      aktiv: document.getElementById('spieler-aktiv').checked,
      aboId: id ? DB.getSpielerById(id)?.aboId || null : null,
    };
    const saved = DB.saveSpieler(data);
    elternIds.forEach(eid => {
      const el = DB.getElternById(eid);
      if (el && !el.spielerIds.includes(saved.id)) {
        DB.saveEltern({ ...el, spielerIds: [...el.spielerIds, saved.id] });
      }
    });
    Utils.closeModal('modal-spieler');
    Utils.showToast(`${data.vorname} ${data.nachname} ${id ? t('common.active').toLowerCase() : ''}`);
    this.render();
  },

  async deleteSpieler(id) {
    const s = DB.getSpielerById(id);
    if (!s) return;
    const ok = await Utils.confirm(t('members.confirm_delete_player', {name: `${s.vorname} ${s.nachname}`}));
    if (!ok) return;
    DB.deleteSpieler(id);
    Utils.showToast(`${s.vorname} ${s.nachname} ${t('common.delete').toLowerCase()}`, 'error');
    this.render();
  },

  openElternModal(id) {
    const e = id ? DB.getElternById(id) : null;
    document.getElementById('eltern-modal-title').textContent = e ? t('members.edit_parent_title') : t('members.add_parent_title');
    document.getElementById('eltern-id').value = e?.id || '';
    document.getElementById('eltern-vorname').value = e?.vorname || '';
    document.getElementById('eltern-nachname').value = e?.nachname || '';
    document.getElementById('eltern-email').value = e?.email || '';
    document.getElementById('eltern-telefon').value = e?.telefon || '';
    document.querySelectorAll('[name="spielerId"]').forEach(cb => {
      cb.checked = e?.spielerIds?.includes(cb.value) || false;
    });
    Utils.openModal('modal-eltern');
  },

  saveEltern(ev) {
    ev.preventDefault();
    const id = document.getElementById('eltern-id').value;
    const spielerIds = [...document.querySelectorAll('[name="spielerId"]:checked')].map(cb => cb.value);
    const data = {
      id: id || undefined,
      vorname: document.getElementById('eltern-vorname').value.trim(),
      nachname: document.getElementById('eltern-nachname').value.trim(),
      email: document.getElementById('eltern-email').value.trim(),
      telefon: document.getElementById('eltern-telefon').value.trim(),
      spielerIds,
    };
    DB.saveEltern(data);
    Utils.closeModal('modal-eltern');
    Utils.showToast(`${data.vorname} ${data.nachname} ${id ? t('common.active').toLowerCase() : ''}`);
    this.render();
  },

  async deleteEltern(id) {
    const e = DB.getElternById(id);
    if (!e) return;
    const ok = await Utils.confirm(t('members.confirm_delete_parent', {name: `${e.vorname} ${e.nachname}`}));
    if (!ok) return;
    DB.deleteEltern(id);
    Utils.showToast(`${e.vorname} ${e.nachname} ${t('common.delete').toLowerCase()}`, 'error');
    this.render();
  }
};

const Users = {
  render() {
    if (Auth.getRolle() !== 'admin') { App.navigate('dashboard'); return; }
    const users = DB.getUsers();
    const currentId = sessionStorage.getItem(Auth.USER_ID_KEY);

    document.getElementById('app').innerHTML = `
      <div class="page-header">
        <div>
          <h1><i class="bi bi-shield-lock-fill"></i> Benutzerverwaltung</h1>
          <p class="subtitle">Logins anlegen, bearbeiten und sperren</p>
        </div>
        <button class="btn btn-primary" onclick="Users.openModal()">
          <i class="bi bi-plus-lg"></i> Benutzer anlegen
        </button>
      </div>

      <div class="card">
        <div class="card-body p0">
          <table class="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Benutzername</th>
                <th>Rolle</th>
                <th>Gruppen / Verknüpfung</th>
                <th>Status</th>
                <th style="width:100px"></th>
              </tr>
            </thead>
            <tbody>
              ${users.length === 0 ? `<tr><td colspan="6" class="text-center text-muted py-3">Keine Benutzer</td></tr>` :
                users.map(u => Users.renderRow(u, currentId)).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div id="modal-user" class="modal">
        <div class="modal-overlay" onclick="Utils.closeModal('modal-user')"></div>
        <div class="modal-box">
          <div class="modal-header">
            <h2 id="user-modal-title">Benutzer</h2>
            <button class="modal-close" onclick="Utils.closeModal('modal-user')"><i class="bi bi-x-lg"></i></button>
          </div>
          <form id="form-user" onsubmit="Users.save(event)">
            <input type="hidden" id="user-id">
            <div class="form-grid">
              <div class="form-group">
                <label>Vollständiger Name *</label>
                <input type="text" id="user-name" required placeholder="Vor- und Nachname">
              </div>
              <div class="form-group">
                <label>Benutzername *</label>
                <input type="text" id="user-benutzername" required placeholder="Login-Name (ohne Leerzeichen)">
              </div>
              <div class="form-group">
                <label>Passwort <span id="user-pass-hint" style="color:#94a3b8;font-size:.8rem"></span></label>
                <input type="password" id="user-passwort" placeholder="Passwort eingeben" autocomplete="new-password">
              </div>
              <div class="form-group">
                <label>Rolle *</label>
                <select id="user-rolle" required onchange="Users.onRolleChange()">
                  <option value="admin">Admin</option>
                  <option value="trainer">Trainer</option>
                  <option value="eltern">Eltern</option>
                </select>
              </div>
              <div class="form-group form-full" id="user-gruppen-block">
                <label>${t('common.jahrgaenge')} <span style="color:#94a3b8;font-size:.8rem">(Trainer sieht nur diese Gruppen)</span></label>
                <div class="gruppe-checkboxes">
                  ${GRUPPEN.map(g => {
                    const f = GRUPPEN_FARBEN[g] || { bg: '#64748b' };
                    return `<label class="gruppe-check-label">
                      <input type="checkbox" class="user-gruppe-cb" value="${g}">
                      <span class="gruppe-check-dot" style="background:${f.bg}"></span>
                      ${g}
                    </label>`;
                  }).join('')}
                </div>
              </div>
              <div class="form-group form-full" id="user-email-block" style="display:none">
                <label>Login-E-Mail <span style="color:#94a3b8;font-size:.8rem">(Elternteil loggt sich mit dieser E-Mail ein)</span></label>
                <input type="email" id="user-email" placeholder="eltern@email.de">
              </div>
              <div class="form-group form-full" id="user-eltern-block" style="display:none">
                <label>Verknüpfter Elternteil <span style="color:#94a3b8;font-size:.8rem">(optional – für Eltern-Login)</span></label>
                <select id="user-elternId">
                  <option value="">— Kein Elternteil verknüpft —</option>
                  ${DB.getEltern().map(e => `<option value="${e.id}">${e.vorname} ${e.nachname}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-danger" id="btn-user-delete" style="display:none" onclick="Users.deleteUser()">
                <i class="bi bi-trash"></i> Löschen
              </button>
              <div style="flex:1"></div>
              <button type="button" class="btn btn-secondary" onclick="Utils.closeModal('modal-user')">Abbrechen</button>
              <button type="submit" class="btn btn-primary"><i class="bi bi-floppy"></i> Speichern</button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  renderRow(u, currentId) {
    const isSelf = u.id === currentId;
    const rolleLabel = { admin: 'Admin', trainer: 'Trainer', eltern: 'Eltern' }[u.rolle] || u.rolle;
    const rolleBadge = { admin: 'badge-red', trainer: 'badge-blue', eltern: 'badge-green' }[u.rolle] || 'badge-gray';
    let detail = '—';
    if (u.rolle === 'trainer' && u.gruppen?.length) detail = u.gruppen.join(', ');
    if (u.rolle === 'eltern') {
      if (u.email) detail = u.email;
      else if (u.elternId) {
        const e = DB.getElternById(u.elternId);
        detail = e ? `${e.vorname} ${e.nachname}` : '(verknüpft)';
      }
    }
    return `
      <tr class="${u.aktiv ? '' : 'row-disabled'}">
        <td><strong>${Utils.escapeHtml(u.name || u.benutzername)}</strong>${isSelf ? ' <span style="color:#94a3b8;font-size:.75rem">(ich)</span>' : ''}</td>
        <td><code style="font-size:.85rem">${Utils.escapeHtml(u.benutzername)}</code></td>
        <td><span class="badge ${rolleBadge}">${rolleLabel}</span></td>
        <td class="text-muted" style="font-size:.82rem">${Utils.escapeHtml(detail)}</td>
        <td>${u.aktiv ? '<span class="badge badge-green">Aktiv</span>' : '<span class="badge badge-gray">Gesperrt</span>'}</td>
        <td>
          <div style="display:flex;gap:6px">
            <button class="btn btn-sm btn-outline" onclick="Users.openModal('${u.id}')"><i class="bi bi-pencil"></i></button>
            ${!isSelf ? `<button class="btn btn-sm btn-outline" title="${u.aktiv ? 'Sperren' : 'Entsperren'}" onclick="Users.toggleAktiv('${u.id}')">
              <i class="bi bi-${u.aktiv ? 'lock' : 'unlock'}"></i>
            </button>` : ''}
          </div>
        </td>
      </tr>`;
  },

  onRolleChange() {
    const rolle = document.getElementById('user-rolle').value;
    document.getElementById('user-gruppen-block').style.display = rolle === 'trainer' ? '' : 'none';
    document.getElementById('user-email-block').style.display   = rolle === 'eltern'  ? '' : 'none';
    document.getElementById('user-eltern-block').style.display  = rolle === 'eltern'  ? '' : 'none';
  },

  openModal(id) {
    const u = id ? DB.getUserById(id) : null;
    document.getElementById('user-modal-title').textContent = u ? 'Benutzer bearbeiten' : 'Benutzer anlegen';
    document.getElementById('user-id').value = u?.id || '';
    document.getElementById('user-name').value = u?.name || '';
    document.getElementById('user-benutzername').value = u?.benutzername || '';
    document.getElementById('user-passwort').value = '';
    document.getElementById('user-passwort').required = !u;
    document.getElementById('user-pass-hint').textContent = u ? '(leer lassen = unverändert)' : '';
    document.getElementById('user-rolle').value = u?.rolle || 'trainer';
    const emailInput = document.getElementById('user-email');
    if (emailInput) emailInput.value = u?.email || '';
    const elternSel = document.getElementById('user-elternId');
    if (elternSel) elternSel.value = u?.elternId || '';
    document.querySelectorAll('.user-gruppe-cb').forEach(cb => {
      cb.checked = (u?.gruppen || []).includes(cb.value);
    });
    document.getElementById('btn-user-delete').style.display = id ? 'inline-flex' : 'none';
    this.onRolleChange();
    Utils.openModal('modal-user');
  },

  save(e) {
    e.preventDefault();
    const id = document.getElementById('user-id').value;
    const existing = id ? DB.getUserById(id) : null;
    const passwort = document.getElementById('user-passwort').value;
    const rolle = document.getElementById('user-rolle').value;
    const bn = document.getElementById('user-benutzername').value.trim().toLowerCase();

    if (!passwort && !existing) {
      Utils.showToast('Bitte Passwort angeben.', 'error'); return;
    }
    const dup = DB.getUsers().find(u => u.benutzername.toLowerCase() === bn && u.id !== id);
    if (dup) { Utils.showToast('Benutzername bereits vergeben!', 'error'); return; }

    const gruppen = [...document.querySelectorAll('.user-gruppe-cb:checked')].map(cb => cb.value);
    const elternId = document.getElementById('user-elternId')?.value || null;
    const email = document.getElementById('user-email')?.value.trim().toLowerCase() || null;

    if (rolle === 'eltern' && email) {
      const emailDup = DB.getUsers().find(u => u.email && u.email.toLowerCase() === email && u.id !== id);
      if (emailDup) { Utils.showToast('Diese E-Mail wird bereits für einen anderen Eltern-Account verwendet!', 'error'); return; }
    }

    const data = {
      id: id || undefined,
      name: document.getElementById('user-name').value.trim(),
      benutzername: bn,
      passwort: passwort || (existing?.passwort || ''),
      rolle,
      aktiv: existing ? existing.aktiv : true,
      gruppen: rolle === 'trainer' ? gruppen : [],
      elternId: rolle === 'eltern' ? (elternId || null) : null,
      email: rolle === 'eltern' ? email : null,
    };
    DB.saveUser(data);
    Utils.closeModal('modal-user');
    Utils.showToast(id ? 'Benutzer aktualisiert' : 'Benutzer angelegt');
    this.render();
  },

  deleteUser() {
    const id = document.getElementById('user-id').value;
    const u = DB.getUserById(id);
    if (!u) return;
    const currentId = sessionStorage.getItem(Auth.USER_ID_KEY);
    if (id === currentId) { Utils.showToast('Eigenen Account nicht löschbar!', 'error'); return; }
    Utils.confirm(`Benutzer "${u.name || u.benutzername}" wirklich löschen?`).then(ok => {
      if (!ok) return;
      DB.deleteUser(id);
      Utils.closeModal('modal-user');
      Utils.showToast('Benutzer gelöscht', 'error');
      this.render();
    });
  },

  toggleAktiv(id) {
    const u = DB.getUserById(id);
    if (!u) return;
    DB.saveUser({ ...u, aktiv: !u.aktiv });
    Utils.showToast(u.aktiv ? `"${u.name}" gesperrt` : `"${u.name}" entsperrt`);
    this.render();
  }
};

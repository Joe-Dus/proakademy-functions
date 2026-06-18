const Bulletin = {
  render() {
    const rolle = Auth.getRolle();
    const kannSchreiben = rolle === 'admin' || rolle === 'trainer';
    const alle = DB.getBulletin().sort((a, b) => b.erstelltAm.localeCompare(a.erstelltAm));

    document.getElementById('app').innerHTML = `
      <div class="page-header">
        <div>
          <h1><i class="bi bi-megaphone-fill"></i> Schwarzes Brett</h1>
          <p class="subtitle">Nachrichten und Mitteilungen für Eltern</p>
        </div>
        ${kannSchreiben ? `
          <button class="btn btn-primary" onclick="Bulletin.openModal()">
            <i class="bi bi-plus-lg"></i> Nachricht erstellen
          </button>
        ` : ''}
      </div>

      ${alle.length === 0 ? `
        <div class="card">
          <div class="card-body">
            <div class="empty-panel">
              <i class="bi bi-megaphone" style="font-size:3rem;color:#cbd5e1"></i>
              <h3>Noch keine Einträge</h3>
              <p>Erstelle die erste Nachricht fürs Schwarze Brett.</p>
            </div>
          </div>
        </div>
      ` : alle.map(b => Bulletin.renderKarte(b, kannSchreiben)).join('')}

      <!-- Modal -->
      <div id="modal-bulletin" class="modal">
        <div class="modal-overlay" onclick="Utils.closeModal('modal-bulletin')"></div>
        <div class="modal-box">
          <div class="modal-header">
            <h2 id="bulletin-modal-title">Nachricht</h2>
            <button class="modal-close" onclick="Utils.closeModal('modal-bulletin')"><i class="bi bi-x-lg"></i></button>
          </div>
          <form id="form-bulletin" onsubmit="Bulletin.save(event)">
            <input type="hidden" id="bulletin-id">
            <div class="form-grid">
              <div class="form-group form-full">
                <label>Titel / Betreff *</label>
                <input type="text" id="bulletin-titel" required placeholder="z.B. Training fällt aus">
              </div>
              <div class="form-group form-full">
                <label>Nachrichtentext *</label>
                <textarea id="bulletin-inhalt" rows="6" required placeholder="Deine Nachricht an die Eltern..."></textarea>
              </div>
              <div class="form-group">
                <label>Ablaufdatum <span style="color:#94a3b8;font-size:.8rem">(optional)</span></label>
                <input type="date" id="bulletin-ablauf">
              </div>
              <div class="form-group" style="display:flex;align-items:center;gap:10px;padding-top:22px">
                <input type="checkbox" id="bulletin-wichtig" style="width:18px;height:18px;cursor:pointer">
                <label for="bulletin-wichtig" style="margin:0;cursor:pointer;font-weight:500">
                  <i class="bi bi-exclamation-triangle-fill" style="color:#f59e0b"></i> Wichtige Nachricht
                </label>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-danger" id="btn-bulletin-delete" style="display:none" onclick="Bulletin.deleteEntry()">
                <i class="bi bi-trash"></i> Löschen
              </button>
              <div style="flex:1"></div>
              <button type="button" class="btn btn-secondary" onclick="Utils.closeModal('modal-bulletin')">Abbrechen</button>
              <button type="submit" class="btn btn-primary"><i class="bi bi-send"></i> Veröffentlichen</button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  renderKarte(b, kannSchreiben) {
    const d = new Date(b.erstelltAm);
    const datum = d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `
      <div class="card bulletin-card${b.wichtig ? ' bulletin-wichtig' : ''}">
        <div class="card-body">
          <div class="bulletin-header">
            <div style="flex:1;min-width:0">
              ${b.wichtig ? `<span class="badge badge-orange" style="margin-bottom:6px">
                <i class="bi bi-exclamation-triangle-fill"></i> Wichtige Mitteilung
              </span>` : ''}
              <h3 class="bulletin-titel">${Utils.escapeHtml(b.titel)}</h3>
              <div class="bulletin-meta">
                <span><i class="bi bi-person"></i> ${Utils.escapeHtml(b.autor || '—')}</span>
                <span><i class="bi bi-calendar3"></i> ${datum}</span>
                ${b.ablaufdatum ? `<span><i class="bi bi-clock"></i> gültig bis ${Utils.formatDatum(b.ablaufdatum)}</span>` : ''}
              </div>
            </div>
            ${kannSchreiben ? `
              <div style="display:flex;gap:6px;flex-shrink:0;margin-left:12px">
                <button class="btn btn-sm btn-outline" onclick="Bulletin.openModal('${b.id}')"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline" style="color:#ef4444;border-color:#fecaca" onclick="Bulletin.deleteById('${b.id}')"><i class="bi bi-trash"></i></button>
              </div>
            ` : ''}
          </div>
          <div class="bulletin-inhalt">${Utils.escapeHtml(b.inhalt).replace(/\n/g, '<br>')}</div>
        </div>
      </div>`;
  },

  // Mini-Vorschau für die Eltern-Startseite
  renderPreview() {
    const eintraege = DB.getActiveBulletin();
    if (!eintraege.length) return '';
    return `
      <div class="bulletin-preview-block">
        <div class="bulletin-preview-header">
          <i class="bi bi-megaphone-fill"></i>
          <span>Schwarzes Brett</span>
          <span class="badge badge-gray">${eintraege.length}</span>
        </div>
        ${eintraege.slice(0, 3).map(b => `
          <div class="bulletin-preview-item${b.wichtig ? ' bulletin-preview-wichtig' : ''}">
            ${b.wichtig ? '<i class="bi bi-exclamation-triangle-fill" style="color:#f59e0b;flex-shrink:0"></i>' : '<i class="bi bi-chat-left-text" style="color:#64748b;flex-shrink:0"></i>'}
            <div>
              <strong>${Utils.escapeHtml(b.titel)}</strong>
              <div class="bulletin-preview-text">${Utils.escapeHtml(b.inhalt).slice(0, 120)}${b.inhalt.length > 120 ? '…' : ''}</div>
            </div>
          </div>
        `).join('')}
        ${eintraege.length > 3 ? `<div style="padding:8px 14px;text-align:center;font-size:.82rem;color:#64748b">+${eintraege.length - 3} weitere Einträge</div>` : ''}
      </div>`;
  },

  openModal(id) {
    const b = id ? DB.getBulletin().find(x => x.id === id) : null;
    document.getElementById('bulletin-modal-title').textContent = b ? 'Eintrag bearbeiten' : 'Neue Nachricht';
    document.getElementById('bulletin-id').value = b?.id || '';
    document.getElementById('bulletin-titel').value = b?.titel || '';
    document.getElementById('bulletin-inhalt').value = b?.inhalt || '';
    document.getElementById('bulletin-ablauf').value = b?.ablaufdatum || '';
    document.getElementById('bulletin-wichtig').checked = b?.wichtig || false;
    document.getElementById('btn-bulletin-delete').style.display = id ? 'inline-flex' : 'none';
    Utils.openModal('modal-bulletin');
  },

  save(e) {
    e.preventDefault();
    const id = document.getElementById('bulletin-id').value;
    const data = {
      id: id || undefined,
      titel: document.getElementById('bulletin-titel').value.trim(),
      inhalt: document.getElementById('bulletin-inhalt').value.trim(),
      ablaufdatum: document.getElementById('bulletin-ablauf').value || null,
      wichtig: document.getElementById('bulletin-wichtig').checked,
      autor: sessionStorage.getItem(Auth.SESSION_KEY) || 'Trainer',
    };
    DB.saveBulletin(data);
    Utils.closeModal('modal-bulletin');
    Utils.showToast(id ? 'Eintrag aktualisiert' : 'Nachricht veröffentlicht');
    this.render();
  },

  deleteEntry() {
    const id = document.getElementById('bulletin-id').value;
    const b = DB.getBulletin().find(x => x.id === id);
    Utils.confirm(`Eintrag "${b?.titel || ''}" löschen?`).then(ok => {
      if (!ok) return;
      DB.deleteBulletin(id);
      Utils.closeModal('modal-bulletin');
      Utils.showToast('Eintrag gelöscht', 'error');
      this.render();
    });
  },

  deleteById(id) {
    const b = DB.getBulletin().find(x => x.id === id);
    Utils.confirm(`Eintrag "${b?.titel || ''}" löschen?`).then(ok => {
      if (!ok) return;
      DB.deleteBulletin(id);
      Utils.showToast('Eintrag gelöscht', 'error');
      this.render();
    });
  }
};

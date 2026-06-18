const DB = {
  KEYS: {
    SPIELER:    'pa_spieler',
    ELTERN:     'pa_eltern',
    TRAININGS:  'pa_trainings',
    ANWESENHEIT:'pa_anwesenheit',
    ABOS:       'pa_abos',
    USERS:      'pa_users',
    BULLETIN:   'pa_bulletin',
  },

  uuid() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  },

  _get(key) {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); }
    catch { return []; }
  },
  _set(key, data) { localStorage.setItem(key, JSON.stringify(data)); },

  // ── Spieler ────────────────────────────────────────────────────────────────
  getSpieler() { return this._get(this.KEYS.SPIELER); },
  getSpielerById(id) { return this.getSpieler().find(s => s.id === id) || null; },
  getSpielerByGruppe(gruppe) {
    return this.getSpieler().filter(s => s.gruppe === gruppe && s.aktiv && s.status !== 'neuzugang');
  },
  getNeuzugaenge() {
    return this.getSpieler().filter(s => s.aktiv && (!s.gruppe || s.gruppe === '' || s.status === 'neuzugang'));
  },
  saveSpieler(data) {
    const list = this.getSpieler();
    if (data.id) {
      const i = list.findIndex(s => s.id === data.id);
      if (i >= 0) list[i] = { ...list[i], ...data };
      else list.push(data);
    } else {
      data = { ...data, id: this.uuid(), erstelltAm: new Date().toISOString() };
      list.push(data);
    }
    this._set(this.KEYS.SPIELER, list);
    return data;
  },
  deleteSpieler(id) {
    this._set(this.KEYS.SPIELER, this.getSpieler().filter(s => s.id !== id));
    this._set(this.KEYS.ANWESENHEIT, this.getAnwesenheit().filter(a => a.spielerId !== id));
  },

  // ── Eltern ────────────────────────────────────────────────────────────────
  getEltern() { return this._get(this.KEYS.ELTERN); },
  getElternById(id) { return this.getEltern().find(e => e.id === id) || null; },
  saveEltern(data) {
    const list = this.getEltern();
    if (data.id) {
      const i = list.findIndex(e => e.id === data.id);
      if (i >= 0) list[i] = { ...list[i], ...data };
      else list.push(data);
    } else {
      data = { ...data, id: this.uuid(), erstelltAm: new Date().toISOString() };
      list.push(data);
    }
    this._set(this.KEYS.ELTERN, list);
    return data;
  },
  deleteEltern(id) {
    this._set(this.KEYS.ELTERN, this.getEltern().filter(e => e.id !== id));
  },

  // ── Trainings ─────────────────────────────────────────────────────────────
  getTrainings() { return this._get(this.KEYS.TRAININGS); },
  getTrainingById(id) { return this.getTrainings().find(t => t.id === id) || null; },
  saveTraining(data) {
    const list = this.getTrainings();
    if (data.id) {
      const i = list.findIndex(t => t.id === data.id);
      if (i >= 0) list[i] = { ...list[i], ...data };
      else list.push(data);
    } else {
      data = { ...data, id: this.uuid(), erstelltAm: new Date().toISOString() };
      list.push(data);
    }
    this._set(this.KEYS.TRAININGS, list);
    return data;
  },
  deleteTraining(id) {
    this._set(this.KEYS.TRAININGS, this.getTrainings().filter(t => t.id !== id));
    this._set(this.KEYS.ANWESENHEIT, this.getAnwesenheit().filter(a => a.trainingId !== id));
  },

  // ── Anwesenheit ───────────────────────────────────────────────────────────
  getAnwesenheit() { return this._get(this.KEYS.ANWESENHEIT); },
  getAnwesenheitByTraining(trainingId) {
    return this.getAnwesenheit().filter(a => a.trainingId === trainingId);
  },
  getAnwesenheitBySpieler(spielerId) {
    return this.getAnwesenheit().filter(a => a.spielerId === spielerId && a.anwesend);
  },
  saveAnwesenheitForTraining(trainingId, eintraege) {
    const other = this.getAnwesenheit().filter(a => a.trainingId !== trainingId);
    const withIds = eintraege.map(e => ({ ...e, id: e.id || this.uuid() }));
    this._set(this.KEYS.ANWESENHEIT, [...other, ...withIds]);
  },
  getAnzahlTrainingsThisMonth(spielerId, monat) {
    const trainings = this.getTrainings();
    return this.getAnwesenheit()
      .filter(a => a.spielerId === spielerId && a.anwesend)
      .filter(a => {
        const t = trainings.find(t => t.id === a.trainingId);
        return t && t.datum.startsWith(monat);
      }).length;
  },

  // ── Abos ─────────────────────────────────────────────────────────────────
  getAbos() { return this._get(this.KEYS.ABOS); },
  getAboById(id) { return this.getAbos().find(a => a.id === id) || null; },
  getAbosBySpielerId(spielerId) { return this.getAbos().filter(a => a.spielerId === spielerId); },
  getAktivesAbo(spielerId) {
    const heute = new Date().toISOString().split('T')[0];
    return this.getAbos().find(a =>
      a.spielerId === spielerId && a.aktiv &&
      a.startdatum <= heute && (!a.enddatum || a.enddatum >= heute)
    ) || null;
  },
  saveAbo(data) {
    const list = this.getAbos();
    if (data.id) {
      const i = list.findIndex(a => a.id === data.id);
      if (i >= 0) list[i] = { ...list[i], ...data };
      else list.push(data);
    } else {
      data = { ...data, id: this.uuid(), erstelltAm: new Date().toISOString() };
      list.push(data);
    }
    this._set(this.KEYS.ABOS, list);
    return data;
  },
  deleteAbo(id) {
    this._set(this.KEYS.ABOS, this.getAbos().filter(a => a.id !== id));
  },

  // ── Benutzer ──────────────────────────────────────────────────────────────
  getUsers() { return this._get(this.KEYS.USERS); },
  getUserById(id) { return this.getUsers().find(u => u.id === id) || null; },
  getUserByBenutzername(benutzername) {
    const lower = (benutzername || '').toLowerCase();
    return this.getUsers().find(u => (u.benutzername || '').toLowerCase() === lower) || null;
  },
  getUserByEmail(email) {
    const lower = (email || '').toLowerCase().trim();
    if (!lower || !lower.includes('@')) return null;
    return this.getUsers().find(u => (u.email || '').toLowerCase().trim() === lower) || null;
  },
  saveUser(data) {
    const list = this.getUsers();
    if (data.id) {
      const i = list.findIndex(u => u.id === data.id);
      if (i >= 0) list[i] = { ...list[i], ...data };
      else list.push(data);
    } else {
      data = { ...data, id: this.uuid(), erstelltAm: new Date().toISOString() };
      list.push(data);
    }
    this._set(this.KEYS.USERS, list);
    return data;
  },
  deleteUser(id) {
    this._set(this.KEYS.USERS, this.getUsers().filter(u => u.id !== id));
  },

  // ── Schwarzes Brett ───────────────────────────────────────────────────────
  getBulletin() { return this._get(this.KEYS.BULLETIN); },
  getActiveBulletin() {
    const heute = new Date().toISOString().split('T')[0];
    return this.getBulletin()
      .filter(b => !b.ablaufdatum || b.ablaufdatum >= heute)
      .sort((a, b) => (b.wichtig ? 1 : 0) - (a.wichtig ? 1 : 0) || b.erstelltAm.localeCompare(a.erstelltAm));
  },
  saveBulletin(data) {
    const list = this.getBulletin();
    if (data.id) {
      const i = list.findIndex(b => b.id === data.id);
      if (i >= 0) list[i] = { ...list[i], ...data };
      else list.push(data);
    } else {
      data = { ...data, id: this.uuid(), erstelltAm: new Date().toISOString() };
      list.push(data);
    }
    this._set(this.KEYS.BULLETIN, list);
    return data;
  },
  deleteBulletin(id) {
    this._set(this.KEYS.BULLETIN, this.getBulletin().filter(b => b.id !== id));
  },

  // ── Seed ──────────────────────────────────────────────────────────────────
  seed() {
    const vorhandene = this.getSpieler();
    const alteGruppen = ['U8','U10','U12','U14','Erwachsene'];
    if (vorhandene.length > 0 && vorhandene.some(s => alteGruppen.includes(s.gruppe))) {
      Object.values(this.KEYS).forEach(k => localStorage.removeItem(k));
    }

    const now = new Date().toISOString();
    const heute = new Date().toISOString().split('T')[0];
    const monat = heute.substring(0, 7);

    // Benutzer immer sicherstellen (vor dem frühen return)
    if (this.getUsers().length === 0) {
      const firstEltern = this.getEltern()[0];
      this._set(this.KEYS.USERS, [
        { id: this.uuid(), benutzername: 'admin',   passwort: 'ProAcademy2026', name: 'Administrator',   rolle: 'admin',   aktiv: true, gruppen: [], elternId: null, erstelltAm: now },
        { id: this.uuid(), benutzername: 'trainer', passwort: 'Trainer2026',    name: 'Demo Trainer',     rolle: 'trainer', aktiv: true, gruppen: ['2007','2010','2012','2014','2016','2018','2021'], elternId: null, erstelltAm: now },
        { id: this.uuid(), benutzername: 'eltern',  passwort: 'Eltern2026',     name: 'Eltern Mustermann',rolle: 'eltern',  aktiv: true, gruppen: [], elternId: firstEltern?.id || null, email: 'k.mustermann@email.de', erstelltAm: now },
      ]);
    }

    // elternId reparieren falls noch null (wenn eltern erst nach users erstellt)
    const users = this.getUsers();
    const eu = users.find(u => u.rolle === 'eltern' && !u.elternId);
    if (eu) {
      const fe = this.getEltern()[0];
      if (fe) { eu.elternId = fe.id; this._set(this.KEYS.USERS, users); }
    }

    if (this.getSpieler().length > 0) {
      if (this.getBulletin().length === 0) this._seedBulletin(now);
      return;
    }

    const sid = Array.from({ length: 10 }, () => this.uuid());
    const eid = Array.from({ length: 3 }, () => this.uuid());
    const aid = Array.from({ length: 4 }, () => this.uuid());

    const spieler = [
      { id: sid[0], vorname: 'Max',    nachname: 'Mustermann', geburtsdatum: '2018-03-15', gruppe: '2018', status: 'aktiv', elternIds: [eid[0]], aboId: aid[0], notizen: '',          aktiv: true, elternEmail: 'k.mustermann@email.de', erstelltAm: now },
      { id: sid[1], vorname: 'Lena',   nachname: 'Müller',     geburtsdatum: '2016-07-22', gruppe: '2016', status: 'aktiv', elternIds: [eid[0]], aboId: aid[1], notizen: 'Torwart',   aktiv: true, elternEmail: 'k.mustermann@email.de', erstelltAm: now },
      { id: sid[2], vorname: 'Jonas',  nachname: 'Schmidt',    geburtsdatum: '2014-01-10', gruppe: '2014', status: 'aktiv', elternIds: [eid[1]], aboId: aid[2], notizen: '',          aktiv: true, erstelltAm: now },
      { id: sid[3], vorname: 'Emma',   nachname: 'Wagner',     geburtsdatum: '2012-09-05', gruppe: '2012', status: 'aktiv', elternIds: [eid[2]], aboId: aid[3], notizen: 'Kapitänin', aktiv: true, erstelltAm: now },
      { id: sid[4], vorname: 'Tom',    nachname: 'Fischer',    geburtsdatum: '2007-11-30', gruppe: '2007', status: 'aktiv', elternIds: [],       aboId: null,   notizen: '',          aktiv: true, erstelltAm: now },
      { id: sid[5], vorname: 'Sophie', nachname: 'Becker',     geburtsdatum: '2016-05-14', gruppe: '2016', status: 'aktiv', elternIds: [eid[1]], aboId: null,   notizen: '',          aktiv: true, erstelltAm: now },
      { id: sid[6], vorname: 'Lukas',  nachname: 'Braun',      geburtsdatum: '2018-08-20', gruppe: '2018', status: 'aktiv', elternIds: [eid[2]], aboId: null,   notizen: '',          aktiv: true, erstelltAm: now },
      { id: sid[7], vorname: 'Anna',   nachname: 'Hoffmann',   geburtsdatum: '2010-04-18', gruppe: '2010', status: 'aktiv', elternIds: [eid[0]], aboId: null,   notizen: '',          aktiv: true, elternEmail: 'k.mustermann@email.de', erstelltAm: now },
      { id: sid[8], vorname: 'Felix',  nachname: 'Krause',     geburtsdatum: '2021-02-09', gruppe: '2021', status: 'aktiv', elternIds: [eid[2]], aboId: null,   notizen: '',          aktiv: true, erstelltAm: now },
      // Neuzugang Demo
      { id: sid[9], vorname: 'Mia',    nachname: 'Neumann',    geburtsdatum: '2015-06-12', gruppe: '',     status: 'neuzugang', elternIds: [], aboId: null, notizen: '', aktiv: true, erstelltAm: now },
    ];

    const eltern = [
      { id: eid[0], vorname: 'Klaus', nachname: 'Mustermann', email: 'k.mustermann@email.de', telefon: '+49 171 1234567', spielerIds: [sid[0], sid[1], sid[7]], erstelltAm: now },
      { id: eid[1], vorname: 'Maria', nachname: 'Schmidt',    email: 'm.schmidt@email.de',    telefon: '+49 160 9876543', spielerIds: [sid[2], sid[5]],          erstelltAm: now },
      { id: eid[2], vorname: 'Peter', nachname: 'Wagner',     email: 'p.wagner@email.de',     telefon: '+49 172 5556789', spielerIds: [sid[3], sid[6], sid[8]],  erstelltAm: now },
    ];

    const gruppen = ['2007','2010','2012','2014','2016','2018','2021'];
    const zeiten  = [['09:00','10:30'],['10:30','12:00'],['14:00','15:30'],['15:30','17:00'],['16:00','17:30'],['17:00','18:30'],['18:00','19:30']];
    const orte    = ['Hauptplatz', 'Nebenplatz', 'Trainingsplatz C', 'Turnhalle'];
    const trainer = ['M. Bauer', 'K. Lehmann', 'S. Hoffmann', 'A. Weber'];
    const trainings = [];

    for (let w = -2; w <= 5; w++) {
      gruppen.forEach((gruppe, gi) => {
        const d = new Date();
        d.setDate(d.getDate() + w * 7 + gi);
        if (d.getDay() === 0) d.setDate(d.getDate() + 1);
        if (d.getDay() === 6) d.setDate(d.getDate() + 2);
        const [st, et] = zeiten[gi % zeiten.length];
        trainings.push({
          id: this.uuid(),
          titel: `${t('common.jahrgang')} ${gruppe}`,
          gruppe,
          datum: d.toISOString().split('T')[0],
          startzeit: st,
          endzeit: et,
          ort: orte[gi % orte.length],
          trainer: trainer[gi % trainer.length],
          notizen: '',
          erstelltAm: now
        });
      });
    }

    const abos = [
      { id: aid[0], name: '8er Kontingent',      typ: 'kontingent', einheitenProMonat: 8,    preis: 45,  spielerId: sid[0], startdatum: monat+'-01', enddatum: null, aktiv: true, erstelltAm: now },
      { id: aid[1], name: 'Monatsabo Unlimited',  typ: 'monat',      einheitenProMonat: null, preis: 65,  spielerId: sid[1], startdatum: monat+'-01', enddatum: null, aktiv: true, erstelltAm: now },
      { id: aid[2], name: '10er Kontingent',      typ: 'kontingent', einheitenProMonat: 10,   preis: 55,  spielerId: sid[2], startdatum: monat+'-01', enddatum: null, aktiv: true, erstelltAm: now },
      { id: aid[3], name: 'Jahresabo',            typ: 'jahr',       einheitenProMonat: null, preis: 600, spielerId: sid[3], startdatum: monat+'-01', enddatum: (parseInt(monat.split('-')[0])+1)+'-'+monat.split('-')[1]+'-01', aktiv: true, erstelltAm: now },
    ];

    const anwesenheit = [];
    const vergangene = trainings.filter(t => t.datum < heute);
    vergangene.forEach(tr => {
      spieler.filter(s => s.gruppe === tr.gruppe).forEach(s => {
        anwesenheit.push({ id: this.uuid(), trainingId: tr.id, spielerId: s.id, anwesend: Math.random() > 0.25, notiert: now });
      });
    });

    this._set(this.KEYS.SPIELER,     spieler);
    this._set(this.KEYS.ELTERN,      eltern);
    this._set(this.KEYS.TRAININGS,   trainings);
    this._set(this.KEYS.ABOS,        abos);
    this._set(this.KEYS.ANWESENHEIT, anwesenheit);

    // elternId im eltern-User auf eid[0] setzen
    const usersNow = this.getUsers();
    const euNow = usersNow.find(u => u.rolle === 'eltern');
    if (euNow) { euNow.elternId = eid[0]; this._set(this.KEYS.USERS, usersNow); }

    this._seedBulletin(now);
  },

  _seedBulletin(now) {
    this._set(this.KEYS.BULLETIN, [
      {
        id: this.uuid(),
        titel: 'Willkommen bei ProAcademy!',
        inhalt: 'Herzlich willkommen auf dem digitalen Schwarzen Brett der ProAcademy.\n\nHier finden Sie alle aktuellen Mitteilungen, Terminänderungen und wichtige Informationen rund um den Trainingsbetrieb.',
        wichtig: true,
        autor: 'admin',
        ablaufdatum: null,
        erstelltAm: now,
      },
      {
        id: this.uuid(),
        titel: 'Sommerturnier – Anmeldung läuft',
        inhalt: 'Das jährliche Sommerturnier findet am letzten Wochenende im Juli statt. Bitte meldet Eure Kinder bis spätestens 15. Juli beim Trainer an.',
        wichtig: false,
        autor: 'trainer',
        ablaufdatum: null,
        erstelltAm: now,
      },
    ]);
  }
};

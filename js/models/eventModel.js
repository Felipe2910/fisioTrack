export default class EventModel {

  constructor(db) {
    this.db    = db;
    this.store = "events";
  }

  /* ── helpers de tiempo ── */

  // 'YYYY-MM-DD' sin hora se parsea como UTC en JS, lo que en UTC-6
  // desplaza la fecha un día atrás. Agregar T00:00:00 fuerza hora local.
  static _parseLocal(str) {
    return new Date(str + 'T00:00:00');
  }

  static diasEntre(fechaIni, fechaFin) {
    if (!fechaIni || !fechaFin) return 1;
    const d1 = EventModel._parseLocal(fechaIni);
    const d2 = EventModel._parseLocal(fechaFin);
    return Math.max(1, Math.round((d2 - d1) / 86_400_000) + 1);
  }

  static domingoEntre(fechaIni, fechaFin) {
    if (!fechaIni || !fechaFin) return 0;
    let inicio = EventModel._parseLocal(fechaIni);
    let fin    = EventModel._parseLocal(fechaFin);
    let domingos = 0;
    while (inicio <= fin) {
      if (inicio.getDay() === 0) domingos++;
      inicio.setDate(inicio.getDate() + 1);
    }
    return domingos;
  }

  /* ── CRUD ── */

  async add(event) {
    const enriched = this._enrich(event);
    const id = await this.db.add(this.store, enriched);
    return id;
  }

  async getAll() {
    const events = await this.db.getAll(this.store);
    events.sort((a, b) => new Date(a.fechaInicio) - new Date(b.fechaInicio));
    return events;
  }

  async getById(id) {
    return this.db.getById(this.store, id);
  }

  async update(event) {
    const enriched = this._enrich(event);
    return this.db.update(this.store, enriched);
  }

  async delete(id) {
    return this.db.delete(this.store, id);
  }

  /* ── resumen para reportes ── */

  async getSummary() {
    const events = await this.getAll();

    const totalDias     = events.reduce((s, e) => s + (e.diasCubiertos  || 0), 0);
    const totalDomingos = events.reduce((s, e) => s + (e.domingosCubiertos || 0), 0);

    const atletaMap = {};
    events.forEach(ev => {
      const nombres = ev.atleta.split(",").map(n => n.trim()).filter(Boolean);
      nombres.forEach(nombre => {
        if (!atletaMap[nombre]) atletaMap[nombre] = { eventos: 0, dias: 0, domingos: 0 };
        atletaMap[nombre].eventos++;
        atletaMap[nombre].dias     += ev.diasCubiertos      || 0;
        atletaMap[nombre].domingos += ev.domingosCubiertos  || 0;
      });
    });

    return { events, totalDias, totalDomingos, atletaMap };
  }

  /* ── interno ── */

  _enrich(event) {
    return {
      ...event,
      diasCubiertos:     EventModel.diasEntre(event.fechaInicio, event.fechaFin),
      domingosCubiertos: EventModel.domingoEntre(event.fechaInicio, event.fechaFin),
    };
  }
}

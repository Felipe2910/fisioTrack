export default class AthleteModel {

  constructor(db) {
    this.db    = db;
    this.store = "athletes";
  }

  async add(athlete) {
    return this.db.add(this.store, athlete);
  }

  async getAll() {
    const athletes = await this.db.getAll(this.store);
    athletes.sort((a, b) => a.nombre.localeCompare(b.nombre));
    return athletes;
  }

  async update(athlete) {
    return this.db.update(this.store, athlete);  // usa el método genérico
  }

  async delete(id) {
    return this.db.delete(this.store, id);
  }
}

export default class PhysioModel {

  constructor(db) {
    this.db    = db;
    this.store = "physios";
  }

  async add(physio) {
    return this.db.add(this.store, physio);
  }

  async getAll() {
    const physios = await this.db.getAll(this.store);
    physios.sort((a, b) => a.nombre.localeCompare(b.nombre));
    return physios;
  }

  async update(physio) {
    return this.db.update(this.store, physio);
  }

  async delete(id) {
    return this.db.delete(this.store, id);
  }
}
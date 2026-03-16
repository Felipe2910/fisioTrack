export default class DBService {

  constructor() {
    this.dbName    = "FisioTrackDB";
    this.dbVersion = 3;          // limpieza de índices
    this.db        = null;
  }

  async init() {
    return new Promise((resolve, reject) => {

      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror   = () => reject(request.error);
      request.onsuccess = () => { this.db = request.result; resolve(this.db); };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains("events")) {
          const store = db.createObjectStore("events", {
            keyPath: "id", autoIncrement: true
          });
          store.createIndex("fechaInicio", "fechaInicio");
        }

        if (!db.objectStoreNames.contains("physios")) {
          const aStore = db.createObjectStore("physios", {
            keyPath: "id", autoIncrement: true
          });
          aStore.createIndex("nombre", "nombre");
        }
      };
    });
  }

  async add(storeName, data) {
    return new Promise((resolve, reject) => {
      const tx      = this.db.transaction(storeName, "readwrite");
      const store   = tx.objectStore(storeName);
      const request = store.add(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror   = () => reject(request.error);
    });
  }

  async getAll(storeName) {
    return new Promise((resolve, reject) => {
      const tx      = this.db.transaction(storeName, "readonly");
      const store   = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror   = () => reject(request.error);
    });
  }

  async update(storeName, data) {
    return new Promise((resolve, reject) => {
      const tx      = this.db.transaction(storeName, "readwrite");
      const store   = tx.objectStore(storeName);
      const request = store.put(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror   = () => reject(request.error);
    });
  }

  async delete(storeName, id) {
    return new Promise((resolve, reject) => {
      const tx      = this.db.transaction(storeName, "readwrite");
      const store   = tx.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror   = () => reject(request.error);
    });
  }

  async getById(storeName, id) {
    return new Promise((resolve, reject) => {
      const tx      = this.db.transaction(storeName, "readonly");
      const store   = tx.objectStore(storeName);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror   = () => reject(request.error);
    });
  }
}
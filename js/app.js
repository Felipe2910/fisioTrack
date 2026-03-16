import DBService           from "./services/dbService.js";
import EventModel          from "./models/eventModel.js";
import PhysioModel        from "./models/physioModel.js";
import EventView           from "./views/eventView.js";
import PhysioView         from "./views/physioView.js";
import EventController     from "./controllers/eventController.js";
import PhysioController   from "./controllers/physioController.js";

/* ── Sidebar ── */
class Sidebar {
  constructor() {
    this.menuBtn   = document.querySelector(".menu-toggle");
    this.sidebar   = document.querySelector(".sidebar");
    this.overlay   = document.querySelector(".overlay");
    this.menuItems = document.querySelectorAll(".sidebar button");
    this._init();
  }
  _init() {
    this.menuBtn.addEventListener("click", () => this.toggle());
    this.overlay.addEventListener("click", () => this.close());
    this.menuItems.forEach(item => item.addEventListener("click", () => this.close()));
    document.addEventListener("click", e => this._handleOutside(e));
  }
  toggle() { this.sidebar.classList.toggle("open"); this.overlay.classList.toggle("show"); }
  close()  { this.sidebar.classList.remove("open"); this.overlay.classList.remove("show"); }
  _handleOutside(e) {
    if (!this.sidebar.contains(e.target) && !this.menuBtn.contains(e.target)) this.close();
  }
}

/* ── ViewManager ── */
class ViewManager {
  constructor() {
    this.views   = document.querySelectorAll(".view");
    this.buttons = document.querySelectorAll("[data-view]");
    this._init();
  }
  _init() {
    this.buttons.forEach(btn => {
      btn.addEventListener("click", () => this.showView(btn.dataset.view));
    });
  }
  showView(viewId) {
    this.views.forEach(v => v.classList.toggle("active", v.id === viewId));
    this.buttons.forEach(b => b.classList.toggle("active", b.dataset.view === viewId));
  }
}

/* ── Bootstrap ── */
async function startApp() {
  const db           = new DBService();
  await db.init();

  const eventModel   = new EventModel(db);
  const physioModel = new PhysioModel(db);

  // exponer physioModel globalmente para el mini-form inline
  window.__physioModel = physioModel;

  const eventView    = new EventView();
  const physioView  = new PhysioView();
  const viewManager  = new ViewManager();
  const sidebar      = new Sidebar();

  // eventController necesita physioView para renderizar el selector
  const eventCtrl = new EventController(eventModel, eventView, physioView, viewManager);

  // physioController notifica a eventController cuando cambia la lista
  new PhysioController(
    physioModel,
    physioView,
    viewManager,
    (physios) => eventCtrl.onPhysiosUpdated(physios)
  );

  // cargar fisioterapeutas iniciales en el selector
  const physios = await physioModel.getAll();
  eventCtrl.onPhysiosUpdated(physios);

  viewManager.showView("eventos");
  sidebar.close();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").catch(console.warn);
  }
}

startApp().catch(console.error);

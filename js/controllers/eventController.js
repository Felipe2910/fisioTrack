import EventModel   from "../models/eventModel.js";
import ReportService from "../services/reportService.js";

export default class EventController {

  constructor(model, view, athleteView, viewManager) {
    this.model       = model;
    this.view        = view;
    this.athleteView = athleteView;
    this.viewManager = viewManager;

    this.form        = document.querySelector("#eventForm");
    this.formTitle   = document.querySelector("#formTitle");
    this.editingId   = null;

    // estado del selector de atletas
    this._atletasDisponibles = [];
    this._atletasSeleccionados = [];

    this.init();
  }

  async init() {
    await this._refreshTable();
    this._bindSelector();
    this._bindInlineAthleteForm();
    this._bindForm();
    this._bindTableActions();
    this._bindHeader();
    this._bindReport();
  }

  /* ── tabla de eventos ── */

  async _refreshTable() {
    const events = await this.model.getAll();
    this.view.render(events);
  }

  /* ── llamado desde athleteController cuando cambia la lista ── */

  onAthletesUpdated(athletes) {
    this._atletasDisponibles = athletes;
    this.athleteView.renderSelector(athletes, this._atletasSeleccionados);
  }

  /* ── selector: filtro + checkboxes + tags ── */

  _bindSelector() {
    const filtro   = document.querySelector("#inp-atleta-filtro");
    const lista    = document.querySelector("#atletaCheckList");
    const tags     = document.querySelector("#atletaSeleccionados");

    // filtrar al escribir
    filtro?.addEventListener("input", () => {
      const q = filtro.value.toLowerCase().trim();
      lista.querySelectorAll(".athlete-check-item").forEach(item => {
        const coincide = item.dataset.nombre.includes(q);
        item.classList.toggle("hidden", !coincide);
      });
      // mostrar "sin resultados" si nada coincide
      const visibles = lista.querySelectorAll(".athlete-check-item:not(.hidden)").length;
      let noResults = lista.querySelector(".no-results");
      if (!visibles && q) {
        if (!noResults) {
          noResults = document.createElement("div");
          noResults.className = "no-results";
          lista.appendChild(noResults);
        }
        noResults.textContent = `Sin resultados para "${filtro.value}"`;
      } else if (noResults) {
        noResults.remove();
      }
    });

    // marcar / desmarcar checkbox
    lista?.addEventListener("change", (e) => {
      const cb = e.target;
      if (cb.type !== "checkbox") return;
      const nombre = cb.value;
      if (cb.checked) {
        if (!this._atletasSeleccionados.includes(nombre)) {
          this._atletasSeleccionados.push(nombre);
        }
      } else {
        this._atletasSeleccionados = this._atletasSeleccionados.filter(n => n !== nombre);
      }
      this.athleteView._updateTags(this._atletasSeleccionados);
    });

    // quitar tag con ×
    tags?.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-nombre]");
      if (!btn) return;
      const nombre = btn.dataset.nombre;
      this._atletasSeleccionados = this._atletasSeleccionados.filter(n => n !== nombre);
      // desmarcar checkbox correspondiente
      lista.querySelectorAll("input[type=checkbox]").forEach(cb => {
        if (cb.value === nombre) cb.checked = false;
      });
      this.athleteView._updateTags(this._atletasSeleccionados);
    });
  }

  /* ── mini-form inline para crear atleta nuevo desde el formulario de evento ── */

  _bindInlineAthleteForm() {
    const btnAbrir    = document.querySelector("#btnNuevoAtletaInline");
    const inlineForm  = document.querySelector("#atletaInlineForm");
    const btnGuardar  = document.querySelector("#btnGuardarAtletaInline");
    const btnCancelar = document.querySelector("#btnCancelarAtletaInline");
    const inputNombre  = document.querySelector("#inline-nombre");
    const inputDeporte = document.querySelector("#inline-deporte");

    btnAbrir?.addEventListener("click", () => {
      inlineForm.style.display = inlineForm.style.display === "none" ? "block" : "none";
      if (inlineForm.style.display === "block") inputNombre.focus();
    });

    btnCancelar?.addEventListener("click", () => {
      inlineForm.style.display = "none";
      inputNombre.value  = "";
      inputDeporte.value = "";
    });

    btnGuardar?.addEventListener("click", async () => {
      const nombre  = inputNombre.value.trim();
      const deporte = inputDeporte.value.trim();
      if (!nombre) { inputNombre.focus(); return; }

      // importar el modelo de atleta dinámicamente para no crear dependencia circular
      const { default: AthleteModel } = await import("../models/athleteModel.js");
      // reutilizar la instancia guardada en window por app.js
      const athleteModel = window.__athleteModel;
      if (!athleteModel) return;

      await athleteModel.add({ nombre, deporte });
      const todos = await athleteModel.getAll();

      // añadir automáticamente a seleccionados
      if (!this._atletasSeleccionados.includes(nombre)) {
        this._atletasSeleccionados.push(nombre);
      }

      this.athleteView.renderSelector(todos, this._atletasSeleccionados);
      this._atletasDisponibles = todos;

      inputNombre.value  = "";
      inputDeporte.value = "";
      inlineForm.style.display = "none";
    });
  }

  /* ── form submit (crear o editar evento) ── */

  _bindForm() {
    this.form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!this._validate()) return;

      const data = this._readForm();

      if (this.editingId !== null) {
        data.id = this.editingId;
        await this.model.update(data);
      } else {
        await this.model.add(data);
      }

      this._resetForm();
      await this._refreshTable();
      this.viewManager.showView("eventos");
    });

    document.querySelector("#btnCancelar").addEventListener("click", () => {
      this._resetForm();
      this.viewManager.showView("eventos");
    });
  }

  /* ── acciones en tabla ── */

  _bindTableActions() {
    document.querySelector("#eventTableBody").addEventListener("click", async (e) => {
      const editBtn   = e.target.closest(".edit-btn");
      const deleteBtn = e.target.closest(".delete-btn");

      if (editBtn) {
        const id = Number(editBtn.dataset.id);
        await this._openEdit(id);
      }
      if (deleteBtn) {
        const id = Number(deleteBtn.dataset.id);
        if (confirm("¿Eliminar este evento?")) {
          await this.model.delete(id);
          await this._refreshTable();
        }
      }
    });
  }

  async _openEdit(id) {
    const event = await this.model.getById(id);
    if (!event) return;

    this.editingId = id;
    this.formTitle.textContent = "Editar evento";

    // restaurar seleccionados desde el evento guardado
    this._atletasSeleccionados = event.atleta
      ? event.atleta.split(",").map(n => n.trim()).filter(Boolean)
      : [];

    this.athleteView.renderSelector(this._atletasDisponibles, this._atletasSeleccionados);
    this.view.fillForm(this.form, event);
    this._clearErrors();
    this.viewManager.showView("nuevo");
  }

  /* ── botón Agregar ── */

  _bindHeader() {
    const goNew = () => {
      this.editingId = null;
      this.formTitle.textContent = "Registrar evento";
      this._resetForm();
      this.viewManager.showView("nuevo");
    };
    document.querySelector("#btnAgregar")?.addEventListener("click", goNew);
    document.querySelector("#btnAgregarEmpty")?.addEventListener("click", goNew);
  }

  /* ── reportes ── */

  _bindReport() {
    document.querySelectorAll("[data-view='reportes']").forEach(btn => {
      btn.addEventListener("click", () => this._refreshReport());
    });

    // ── copiar texto ──
    document.querySelector("#btnCopiar")?.addEventListener("click", async () => {
      const summary = await this.model.getSummary();
      const texto   = ReportService.toText(summary);
      const exito   = await this._copiarPortapapeles(texto);
      this._showFeedback("copyFeedback",
        exito ? "¡Copiado! Pégalo en WhatsApp o correo." : "No se pudo copiar. Selecciona el texto manualmente.",
        exito ? "success" : "error"
      );
    });

    // ── descargar .xlsx con SheetJS ──
    document.querySelector("#btnXlsx")?.addEventListener("click", async () => {
      const summary = await this.model.getSummary();
      ReportService.toXlsx(summary);
    });

    // ── guardar en Google Drive ──
    document.querySelector("#btnDrive")?.addEventListener("click", async () => {
      const summary = await this.model.getSummary();
      await ReportService.toDrive(summary, (tipo, msg) => {
        if (tipo === "loading") {
          this._showFeedback("driveFeedback", msg, "loading", 0);
        } else if (tipo === "success") {
          // msg es el link de la hoja creada
          const fb = document.querySelector("#driveFeedback");
          fb.innerHTML = `Hoja creada en Drive. <a href="${msg}" target="_blank" style="color:inherit;text-decoration:underline">Abrir</a>`;
          fb.style.color   = "var(--clr-success)";
          fb.style.display = "block";
          setTimeout(() => fb.style.display = "none", 8000);
        } else {
          this._showFeedback("driveFeedback", msg, "error");
        }
      });
    });
  }

  async _refreshReport() {
    const summary = await this.model.getSummary();
    this.view.renderReport(summary);
  }

  /* ── clipboard ── */

  _showFeedback(id, msg, tipo = "success", duracion = 3500) {
    const fb = document.querySelector(`#${id}`);
    if (!fb) return;
    const colores = {
      success: "var(--clr-success)",
      error:   "var(--clr-danger)",
      loading: "var(--clr-muted)",
    };
    fb.textContent   = msg;
    fb.style.color   = colores[tipo] ?? colores.success;
    fb.style.display = "block";
    if (duracion > 0) setTimeout(() => fb.style.display = "none", duracion);
  }

  async _copiarPortapapeles(texto) {
    if (navigator.clipboard && window.isSecureContext) {
      try { await navigator.clipboard.writeText(texto); return true; } catch (_) {}
    }
    try {
      const textarea = document.createElement("textarea");
      textarea.value = texto;
      textarea.style.position = "fixed";
      textarea.style.top      = "0";
      textarea.style.left     = "0";
      textarea.style.opacity  = "0";
      textarea.style.fontSize = "12px";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      return ok;
    } catch (_) { return false; }
  }

  /* ── validación ── */

  _validate() {
    let valid = true;

    // atletas: al menos uno seleccionado
    const errorAtleta = document.querySelector("#errorAtleta");
    if (!this._atletasSeleccionados.length) {
      errorAtleta?.classList.add("show");
      valid = false;
    } else {
      errorAtleta?.classList.remove("show");
    }

    // campos de texto requeridos
    ["evento", "fechaInicio", "fechaFin"].forEach(name => {
      const input = this.form[name];
      const error = input.closest(".form-group")?.querySelector(".field-error");
      if (!input.value.trim()) {
        input.classList.add("invalid");
        error?.classList.add("show");
        valid = false;
      } else {
        input.classList.remove("invalid");
        error?.classList.remove("show");
      }
    });

    const ini = this.form.fechaInicio.value;
    const fin = this.form.fechaFin.value;
    if (ini && fin && fin < ini) {
      const finInput = this.form.fechaFin;
      const error    = finInput.closest(".form-group")?.querySelector(".field-error");
      finInput.classList.add("invalid");
      if (error) { error.textContent = "Debe ser igual o posterior al inicio"; error.classList.add("show"); }
      valid = false;
    }

    return valid;
  }

  _clearErrors() {
    this.form.querySelectorAll(".invalid").forEach(el => el.classList.remove("invalid"));
    this.form.querySelectorAll(".field-error.show").forEach(el => {
      el.classList.remove("show");
      el.textContent = "Campo requerido";
    });
    document.querySelector("#errorAtleta")?.classList.remove("show");
  }

  /* ── helpers ── */

  _readForm() {
    return {
      atleta:        this._atletasSeleccionados.join(", "),
      evento:        this.form.evento.value.trim(),
      fechaInicio:   this.form.fechaInicio.value,
      fechaFin:      this.form.fechaFin.value,
      lugar:         this.form.lugar.value.trim(),
      tipo:          this.form.tipo.value,
      observaciones: this.form.observaciones.value.trim(),
    };
  }

  _resetForm() {
    this.form.reset();
    this.editingId = null;
    this._atletasSeleccionados = [];
    this.athleteView.renderSelector(this._atletasDisponibles, []);
    document.querySelector("#inp-atleta-filtro").value = "";
    document.querySelector("#atletaInlineForm").style.display = "none";
    this._clearErrors();
  }
}

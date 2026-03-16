export default class AthleteController {

  constructor(model, view, viewManager, onAthleteChange) {
    this.model          = model;
    this.view           = view;
    this.viewManager    = viewManager;
    this.onAthleteChange = onAthleteChange; // callback para notificar al selector de eventos

    this.form           = document.querySelector("#atletaForm");
    this.formCard       = document.querySelector("#atletaFormCard");
    this.formTitle      = document.querySelector("#atletaFormTitle");
    this.editingId      = null;

    this.init();
  }

  async init() {
    await this._refreshTable();
    this._bindForm();
    this._bindTableActions();
    this._bindHeader();
  }

  /* ── tabla ── */

  async _refreshTable() {
    const athletes = await this.model.getAll();
    this.view.render(athletes);
    if (this.onAthleteChange) this.onAthleteChange(athletes);
  }

  /* ── form submit ── */

  _bindForm() {
    this.form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!this._validate()) return;

      const data = {
        nombre:  this.form.nombre.value.trim(),
        deporte: this.form.deporte.value.trim(),
      };

      if (this.editingId !== null) {
        data.id = this.editingId;
        await this.model.update(data);
      } else {
        await this.model.add(data);
      }

      this.form.reset();
      this.editingId = null;
      this.formCard.style.display = "none";
      await this._refreshTable();
    });

    document.querySelector("#btnCancelarAtleta")?.addEventListener("click", () => {
      this.form.reset();
      this.editingId = null;
      this.formCard.style.display = "none";
      this._clearErrors();
    });
  }

  /* ── acciones en tabla ── */

  _bindTableActions() {
    document.querySelector("#atletaTableBody").addEventListener("click", async (e) => {
      const editBtn   = e.target.closest(".edit-ath-btn");
      const deleteBtn = e.target.closest(".delete-ath-btn");

      if (editBtn) {
        const id = Number(editBtn.dataset.id);
        await this._openEdit(id);
      }

      if (deleteBtn) {
        const id = Number(deleteBtn.dataset.id);
        if (confirm("¿Eliminar este atleta?")) {
          await this.model.delete(id);
          await this._refreshTable();
        }
      }
    });
  }

  async _openEdit(id) {
    const athlete = await this.model.db.getById("athletes", id);
    if (!athlete) return;

    this.editingId = id;
    this.formTitle.textContent = "Editar atleta";
    this.view.fillForm(this.form, athlete);
    this._clearErrors();
    this.formCard.style.display = "block";
    this.formCard.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ── botón agregar ── */

  _bindHeader() {
    document.querySelector("#btnAgregarAtleta")?.addEventListener("click", () => {
      this.editingId = null;
      this.formTitle.textContent = "Nuevo atleta";
      this.form.reset();
      this._clearErrors();
      this.formCard.style.display = "block";
      this.formCard.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  /* ── validación ── */

  _validate() {
    let valid = true;
    ["nombre", "deporte"].forEach(name => {
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
    return valid;
  }

  _clearErrors() {
    this.form.querySelectorAll(".invalid").forEach(el => el.classList.remove("invalid"));
    this.form.querySelectorAll(".field-error.show").forEach(el => el.classList.remove("show"));
  }
}

export default class PhysioController {

  constructor(model, view, viewManager, onPhysioChange) {
    this.model          = model;
    this.view           = view;
    this.viewManager    = viewManager;
    this.onPhysioChange = onPhysioChange;

    this.form      = document.querySelector("#physioForm");
    this.formCard  = document.querySelector("#physioFormCard");
    this.formTitle = document.querySelector("#physioFormTitle");
    this.editingId = null;

    this.init();
  }

  async init() {
    await this._refreshTable();
    this._bindForm();
    this._bindTableActions();
    this._bindHeader();
  }

  async _refreshTable() {
    const physios = await this.model.getAll();
    this.view.render(physios);
    if (this.onPhysioChange) this.onPhysioChange(physios);
  }

  _bindForm() {
    this.form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!this._validate()) return;

      const data = { nombre: this.form.nombre.value.trim() };

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

    document.querySelector("#btnCancelarPhysio")?.addEventListener("click", () => {
      this.form.reset();
      this.editingId = null;
      this.formCard.style.display = "none";
      this._clearErrors();
    });
  }

  _bindTableActions() {
    document.querySelector("#physioTableBody").addEventListener("click", async (e) => {
      const editBtn   = e.target.closest(".edit-physio-btn");
      const deleteBtn = e.target.closest(".delete-physio-btn");

      if (editBtn) {
        const id = Number(editBtn.dataset.id);
        await this._openEdit(id);
      }

      if (deleteBtn) {
        const id = Number(deleteBtn.dataset.id);
        if (confirm("¿Eliminar este fisioterapeuta?")) {
          await this.model.delete(id);
          await this._refreshTable();
        }
      }
    });
  }

  async _openEdit(id) {
    const physio = await this.model.db.getById("physios", id);
    if (!physio) return;

    this.editingId = id;
    this.formTitle.textContent = "Editar fisioterapeuta";
    this.view.fillForm(this.form, physio);
    this._clearErrors();
    this.formCard.style.display = "block";
    this.formCard.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  _bindHeader() {
    document.querySelector("#btnAgregarPhysio")?.addEventListener("click", () => {
      this.editingId = null;
      this.formTitle.textContent = "Nuevo fisioterapeuta";
      this.form.reset();
      this._clearErrors();
      this.formCard.style.display = "block";
      this.formCard.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  _validate() {
    let valid = true;
    const input = this.form.nombre;
    const error = input.closest(".form-group")?.querySelector(".field-error");
    if (!input.value.trim()) {
      input.classList.add("invalid");
      error?.classList.add("show");
      valid = false;
    } else {
      input.classList.remove("invalid");
      error?.classList.remove("show");
    }
    return valid;
  }

  _clearErrors() {
    this.form.querySelectorAll(".invalid").forEach(el => el.classList.remove("invalid"));
    this.form.querySelectorAll(".field-error.show").forEach(el => el.classList.remove("show"));
  }
}
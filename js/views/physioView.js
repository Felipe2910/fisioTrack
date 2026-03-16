export default class PhysioView {

  constructor() {
    this.tableBody      = document.querySelector("#physioTableBody");
    this.tableCard      = document.querySelector("#physioTableCard");
    this.emptyState     = document.querySelector("#physioEmptyState");
  }

  /* ── tabla de fisioterapeutas ── */

  render(physios) {
    this.tableBody.innerHTML = "";

    if (!physios.length) {
      this.emptyState.style.display = "block";
      this.tableCard.style.display  = "none";
      return;
    }

    this.emptyState.style.display = "none";
    this.tableCard.style.display  = "block";

    physios.forEach(physio => {
      const row = document.createElement("tr");
      const initials = this._initials(physio.nombre);

      row.innerHTML = `
        <td>
          <span class="physio-avatar">${initials}</span>
          ${this._esc(physio.nombre)}
        </td>
        <td>${this._esc(physio.deporte || "—")}</td>
        <td>
          <div class="actions-cell">
            <button class="btn-icon edit-physio-btn" data-id="${physio.id}" title="Editar">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>
                <path d="m15 5 4 4"/>
              </svg>
            </button>
            <button class="btn-icon danger delete-physio-btn" data-id="${physio.id}" title="Eliminar">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10 11v6"/><path d="M14 11v6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                <path d="M3 6h18"/>
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </td>
      `;

      this.tableBody.appendChild(row);
    });
  }

  fillForm(form, physio) {
    form.id.value     = physio.id;
    form.nombre.value = physio.nombre  || "";
    form.deporte.value = physio.deporte || "";
  }

  /* ── selector de fisioterapeutas en formulario de evento ── */

  renderSelector(physios, seleccionados = []) {
    const list = document.querySelector("#physioCheckList");
    if (!list) return;

    list.innerHTML = "";

    if (!physios.length) {
      list.innerHTML = `<div class="no-results">Sin fisioterapeutas registrados.</div>`;
      return;
    }

    physios.forEach(physio => {
      const checked = seleccionados.includes(physio.nombre);
      const item = document.createElement("label");
      item.className = "physio-check-item";
      item.dataset.nombre = physio.nombre.toLowerCase();

      item.innerHTML = `
        <input type="checkbox" value="${this._esc(physio.nombre)}" ${checked ? "checked" : ""}>
        <span class="physio-check-name">${this._esc(physio.nombre)}</span>
        <span class="physio-check-sport">${this._esc(physio.deporte || "")}</span>
      `;

      list.appendChild(item);
    });

    this._updateTags(seleccionados);
  }

  /* ── actualizar tags de seleccionados ── */

  _updateTags(nombres) {
    const container = document.querySelector("#physioSeleccionados");
    const hidden    = document.querySelector("#inp-physio-hidden");
    if (!container) return;

    container.innerHTML = nombres.map(nombre => `
      <span class="physio-tag">
        ${this._esc(nombre)}
        <button type="button" data-nombre="${this._esc(nombre)}" aria-label="Quitar">×</button>
      </span>
    `).join("");

    if (hidden) hidden.value = nombres.join(", ");
  }

  /* ── helpers ── */

  _initials(nombre) {
    return (nombre || "?")
      .split(" ")
      .slice(0, 2)
      .map(p => p[0] || "")
      .join("")
      .toUpperCase();
  }

  _esc(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
}

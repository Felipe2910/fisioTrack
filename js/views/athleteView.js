export default class AthleteView {

  constructor() {
    this.tableBody      = document.querySelector("#atletaTableBody");
    this.tableCard      = document.querySelector("#atletaTableCard");
    this.emptyState     = document.querySelector("#atletaEmptyState");
  }

  /* ── tabla de atletas ── */

  render(athletes) {
    this.tableBody.innerHTML = "";

    if (!athletes.length) {
      this.emptyState.style.display = "block";
      this.tableCard.style.display  = "none";
      return;
    }

    this.emptyState.style.display = "none";
    this.tableCard.style.display  = "block";

    athletes.forEach(athlete => {
      const row = document.createElement("tr");
      const initials = this._initials(athlete.nombre);

      row.innerHTML = `
        <td>
          <span class="ath-avatar">${initials}</span>
          ${this._esc(athlete.nombre)}
        </td>
        <td>${this._esc(athlete.deporte || "—")}</td>
        <td>
          <div class="actions-cell">
            <button class="btn-icon edit-ath-btn" data-id="${athlete.id}" title="Editar">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>
                <path d="m15 5 4 4"/>
              </svg>
            </button>
            <button class="btn-icon danger delete-ath-btn" data-id="${athlete.id}" title="Eliminar">
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

  fillForm(form, athlete) {
    form.id.value     = athlete.id;
    form.nombre.value = athlete.nombre  || "";
    form.deporte.value = athlete.deporte || "";
  }

  /* ── selector de atletas en formulario de evento ── */

  renderSelector(athletes, seleccionados = []) {
    const list = document.querySelector("#atletaCheckList");
    if (!list) return;

    list.innerHTML = "";

    if (!athletes.length) {
      list.innerHTML = `<div class="no-results">Sin atletas registrados.</div>`;
      return;
    }

    athletes.forEach(athlete => {
      const checked = seleccionados.includes(athlete.nombre);
      const item = document.createElement("label");
      item.className = "athlete-check-item";
      item.dataset.nombre = athlete.nombre.toLowerCase();

      item.innerHTML = `
        <input type="checkbox" value="${this._esc(athlete.nombre)}" ${checked ? "checked" : ""}>
        <span class="ath-check-name">${this._esc(athlete.nombre)}</span>
        <span class="ath-check-sport">${this._esc(athlete.deporte || "")}</span>
      `;

      list.appendChild(item);
    });

    this._updateTags(seleccionados);
  }

  /* ── actualizar tags de seleccionados ── */

  _updateTags(nombres) {
    const container = document.querySelector("#atletaSeleccionados");
    const hidden    = document.querySelector("#inp-atleta-hidden");
    if (!container) return;

    container.innerHTML = nombres.map(nombre => `
      <span class="ath-tag">
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

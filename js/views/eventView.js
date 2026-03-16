export default class EventView {

  constructor() {
    this.tableBody  = document.querySelector("#eventTableBody");
    this.emptyState = document.querySelector("#emptyState");
    this.tableCard  = document.querySelector(".table-wrap");
  }

  /* ── tabla principal ── */

  render(events) {
    this.tableBody.innerHTML = "";

    if (!events.length) {
      this.emptyState.style.display = "block";
      this.tableCard.style.display  = "none";
      return;
    }

    this.emptyState.style.display = "none";
    this.tableCard.style.display  = "block";

    events.forEach(event => {
      const row = document.createElement("tr");
      row.dataset.id = event.id;

      const fechas = this._formatFechas(event.fechaInicio, event.fechaFin);
      const badge  = this._tipoBadge(event.tipo);

      row.innerHTML = `
        <td>${this._esc(event.fisioterapeuta)}</td>
        <td>${this._esc(event.evento)}</td>
        <td>${badge}</td>
        <td>${fechas}</td>
        <td style="text-align:center;font-weight:600">${event.diasCubiertos ?? "—"}</td>
        <td style="text-align:center;color:${(event.domingosCubiertos || 0) > 0 ? "var(--clr-warning)" : "var(--clr-muted)"};font-weight:600">
          ${event.domingosCubiertos ?? "—"}
        </td>
        <td>${this._esc(event.lugar || "—")}</td>
        <td>
          <div class="actions-cell">
            <button class="btn-icon edit-btn" data-id="${event.id}" title="Editar">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>
                <path d="m15 5 4 4"/>
              </svg>
            </button>
            <button class="btn-icon danger delete-btn" data-id="${event.id}" title="Eliminar">
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

  /* ── reporte ── */

  renderReport({ events, totalDias, totalDomingos, fisioterapeutaMap }) {
    document.querySelector("#statEventos").textContent  = events.length;
    document.querySelector("#statDias").textContent     = totalDias;
    document.querySelector("#statDomingos").textContent = totalDomingos;

    const container = document.querySelector("#reporteFisioterapeutas");
    if (!Object.keys(fisioterapeutaMap).length) {
      container.innerHTML = `<p style="color:var(--clr-muted);font-size:.85rem">Sin datos aún.</p>`;
      return;
    }

    container.innerHTML = Object.entries(fisioterapeutaMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([nombre, data]) => `
        <div class="fisioterapeuta-row">
          <span class="fisioterapeuta-nombre">${this._esc(nombre)}</span>
          <span class="fisioterapeuta-meta">
            ${data.eventos} evento${data.eventos !== 1 ? "s" : ""} •
            ${data.dias} día${data.dias !== 1 ? "s" : ""} •
            ${data.domingos} dom.
          </span>
        </div>
      `).join("");
  }

  /* ── poblar formulario para editar ── */

  fillForm(form, event) {
    form.id.value           = event.id;
    form.fisioterapeuta.value       = event.fisioterapeuta       || "";
    form.evento.value       = event.evento       || "";
    form.fechaInicio.value  = event.fechaInicio  || "";
    form.fechaFin.value     = event.fechaFin     || "";
    form.lugar.value        = event.lugar        || "";
    form.tipo.value         = event.tipo         || "Deportivo";
    form.observaciones.value = event.observaciones || "";
  }

  /* ── helpers privados ── */

  _esc(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  _formatFechas(ini, fin) {
    if (!ini) return "—";
    const fmtDate = s => {
      const [y, m, d] = s.split("-");
      return `${d}/${m}/${y}`;
    };
    if (!fin || fin === ini) return fmtDate(ini);
    return `${fmtDate(ini)} → ${fmtDate(fin)}`;
  }

  _tipoBadge(tipo) {
    const map = {
      "Deportivo":        ["badge-dep", "Deportivo"],
      "Entrenamiento":    ["badge-ent", "Entrenamiento"],
      "Regional/Nacional":["badge-reg", "Regional"],
      "Campamento":       ["badge-cam", "Campamento"],
    };
    const [cls, label] = map[tipo] ?? ["badge-dep", tipo ?? "—"];
    return `<span class="badge ${cls}">${label}</span>`;
  }
}

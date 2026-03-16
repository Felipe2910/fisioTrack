export default class ReportService {

  /* ── texto plano ── */

  static toText({ events, totalDias, totalDomingos, atletaMap }) {
    const hoy = new Date().toLocaleDateString("es-MX", { day:"2-digit", month:"2-digit", year:"numeric" });
    const L   = [];

    L.push("REPORTE DE COBERTURA FISIOTERAPÉUTICA");
    L.push("IDECAM / CEDAR");
    L.push(`Generado: ${hoy}`);
    L.push("─".repeat(48));
    L.push("");
    L.push(`Eventos registrados : ${events.length}`);
    L.push(`Días cubiertos      : ${totalDias}`);
    L.push(`Domingos cubiertos  : ${totalDomingos}`);
    L.push("");

    if (Object.keys(atletaMap).length) {
      L.push("RESUMEN POR ATLETA:");
      Object.entries(atletaMap)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([nombre, d]) => {
          L.push(`  ${nombre.padEnd(16)} ${d.eventos} evento(s)  ${d.dias} días  ${d.domingos} dom.`);
        });
      L.push("");
    }

    L.push("DETALLE DE EVENTOS:");
    L.push("─".repeat(48));
    events.forEach((ev, i) => {
      const fechas = ReportService._fmtFechas(ev.fechaInicio, ev.fechaFin);
      L.push(`${i + 1}. ${ev.evento}`);
      L.push(`   Atleta(s) : ${ev.atleta}`);
      L.push(`   Fecha     : ${fechas}`);
      L.push(`   Lugar     : ${ev.lugar || "N/D"}`);
      L.push(`   Tipo      : ${ev.tipo  || "—"}`);
      L.push(`   Días      : ${ev.diasCubiertos ?? "—"}   Domingos: ${ev.domingosCubiertos ?? "—"}`);
      if (ev.observaciones) L.push(`   Obs.      : ${ev.observaciones}`);
      L.push("");
    });

    return L.join("\n");
  }

  /* ── .xlsx con SheetJS ── */

  static toXlsx({ events, totalDias, totalDomingos, atletaMap }) {
    const XLSX = window.XLSX;
    if (!XLSX) { alert("SheetJS no está cargado todavía. Intenta en un segundo."); return; }

    const wb = XLSX.utils.book_new();

    /* ── Hoja 1: Detalle ── */
    const headers = [
      "Atleta(s)", "Evento", "Tipo",
      "Fecha inicio", "Fecha fin",
      "Lugar", "Días cubiertos", "Domingos cubiertos", "Observaciones"
    ];

    const rows = events.map(ev => [
      ev.atleta        || "",
      ev.evento        || "",
      ev.tipo          || "",
      ReportService._fmtFechas(ev.fechaInicio, ev.fechaFin).split(" → ")[0] || "",
      ReportService._fmtFechas(ev.fechaInicio, ev.fechaFin).split(" → ")[1] || ReportService._fmtFechas(ev.fechaInicio, ev.fechaFin).split(" → ")[0] || "",
      ev.lugar         || "",
      ev.diasCubiertos     ?? 0,
      ev.domingosCubiertos ?? 0,
      ev.observaciones || "",
    ]);

    // fila de totales al final
    rows.push([
      "TOTAL", "", "", "", "", "",
      totalDias,
      totalDomingos,
      ""
    ]);

    const wsDetalle = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    // anchos de columna
    wsDetalle["!cols"] = [
      { wch: 22 }, { wch: 28 }, { wch: 16 },
      { wch: 13 }, { wch: 13 },
      { wch: 20 }, { wch: 14 }, { wch: 16 }, { wch: 30 }
    ];

    // estilo header (solo disponible en SheetJS Pro, pero la estructura es correcta)
    XLSX.utils.book_append_sheet(wb, wsDetalle, "Detalle");

    /* ── Hoja 2: Resumen por atleta ── */
    const resHeaders = ["Atleta", "Eventos", "Días cubiertos", "Domingos"];
    const resRows    = Object.entries(atletaMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([nombre, d]) => [nombre, d.eventos, d.dias, d.domingos]);

    const wsResumen = XLSX.utils.aoa_to_sheet([resHeaders, ...resRows]);
    wsResumen["!cols"] = [{ wch: 22 }, { wch: 10 }, { wch: 16 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");

    /* ── descargar ── */
    const fecha = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `FisioTrack_${fecha}.xlsx`);
  }

  /* ── Google Sheets API ── */

  static async toDrive({ events, totalDias, totalDomingos, atletaMap }, onStatus) {

    // ── 1. autenticar ──────────────────────────────────────────────────────
    const CLIENT_ID = "273802988057-qe0ee3ssvdvi0mm4i7l4v4b9bnlvm8rf.apps.googleusercontent.com";   // ← reemplazar tras configurar Google Cloud
    const SCOPES    = "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file";

    if (CLIENT_ID === "INSERTAR_CLIENT_ID_AQUI") {
      onStatus("error", "Google Drive no configurado aún. Consulta la guía de configuración.");
      return;
    }

    onStatus("loading", "Conectando con Google...");

    let token;
    try {
      token = await ReportService._googleAuth(CLIENT_ID, SCOPES);
    } catch (err) {
      onStatus("error", "No se pudo iniciar sesión con Google.");
      return;
    }

    // ── 2. crear spreadsheet ───────────────────────────────────────────────
    onStatus("loading", "Creando hoja en Drive...");

    const fecha      = new Date().toLocaleDateString("es-MX");
    const titulo     = `FisioTrack — Reporte ${fecha}`;

    let spreadsheetId;
    try {
      const res = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          properties: { title: titulo },
          sheets: [
            { properties: { title: "Detalle",        sheetId: 0 } },
            { properties: { title: "Resumen atletas", sheetId: 1 } },
          ]
        })
      });
      const data = await res.json();
      spreadsheetId = data.spreadsheetId;
    } catch (err) {
      onStatus("error", "No se pudo crear la hoja en Drive.");
      return;
    }

    // ── 3. escribir datos ──────────────────────────────────────────────────
    onStatus("loading", "Escribiendo datos...");

    const detalle = [
      ["Atleta(s)","Evento","Tipo","Fecha inicio","Fecha fin","Lugar","Días","Domingos","Observaciones"],
      ...events.map(ev => [
        ev.atleta        || "",
        ev.evento        || "",
        ev.tipo          || "",
        ev.fechaInicio   || "",
        ev.fechaFin      || "",
        ev.lugar         || "",
        ev.diasCubiertos     ?? 0,
        ev.domingosCubiertos ?? 0,
        ev.observaciones || "",
      ]),
      ["TOTAL","","","","","", totalDias, totalDomingos, ""],
    ];

    const resumen = [
      ["Atleta","Eventos","Días cubiertos","Domingos"],
      ...Object.entries(atletaMap)
        .sort((a,b) => a[0].localeCompare(b[0]))
        .map(([nombre, d]) => [nombre, d.eventos, d.dias, d.domingos]),
    ];

    try {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            valueInputOption: "RAW",
            data: [
              { range: "Detalle!A1",         values: detalle },
              { range: "Resumen atletas!A1",  values: resumen },
            ]
          })
        }
      );
    } catch (err) {
      onStatus("error", "No se pudieron escribir los datos.");
      return;
    }

    // ── 4. devolver link ───────────────────────────────────────────────────
    const link = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
    onStatus("success", link);
  }

  /* ── OAuth2 con Google Identity Services ── */

  static _googleAuth(clientId, scope) {
    return new Promise((resolve, reject) => {
      // google.accounts.oauth2 es el SDK de Google Identity Services
      // se carga desde accounts.google.com/gsi/client en index.html
      if (!window.google?.accounts?.oauth2) {
        reject(new Error("Google Identity Services no cargado"));
        return;
      }
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope,
        callback: (resp) => {
          if (resp.error) reject(resp);
          else resolve(resp.access_token);
        },
      });
      client.requestAccessToken();
    });
  }

  /* ── helpers ── */

  static _fmtFechas(ini, fin) {
    if (!ini) return "—";
    const fmt = s => { const [y,m,d] = s.split("-"); return `${d}/${m}/${y}`; };
    return (!fin || fin === ini) ? fmt(ini) : `${fmt(ini)} → ${fmt(fin)}`;
  }
}

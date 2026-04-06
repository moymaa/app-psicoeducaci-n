// ============================================================
//  CONSULTA DE CITAS — Apps Script Web App
//  Endpoint: POST → busca email en la hoja → envía citas al paciente
//  Remitente: eutimya.mental@gmail.com  (la cuenta propietaria del script)
//  Hoja: https://docs.google.com/spreadsheets/d/11WRxlxdQzdAL2Ss9GRIqyu58nLLoSKH0BJ5l0GZ69F4
// ============================================================

// ── CONFIGURACIÓN ────────────────────────────────────────────
const SPREADSHEET_ID_CITAS = "11WRxlxdQzdAL2Ss9GRIqyu58nLLoSKH0BJ5l0GZ69F4";
const SHEET_NAME_CITAS     = "Citas";
const EMAIL_REMITENTE      = "eutimya.mental@gmail.com";
const NOMBRE_CLINICA       = "Eutimya · Psiquiatría";
const COL_EMAIL            = 3;   // columna C → Email Paciente
const COL_DOCTOR           = 1;   // columna A → Doctor
const COL_NOMBRE           = 2;   // columna B → Nombre
const COL_FECHA            = 7;   // columna G → Fecha de Cita
const COL_HORA             = 8;   // columna H → Hora de Cita
const COL_MODALIDAD        = 9;   // columna I → Modalidad
const COL_DIRECCION        = 10;  // columna J → Dirección / Ubicación
const COL_LINK             = 11;  // columna K → Link de Sesión
const COL_ESTADO           = 12;  // columna L → Estado


// ── CORS HELPER ───────────────────────────────────────────────
function buildCorsOutput(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}


// ── ENTRY POINTS ─────────────────────────────────────────────

/**
 * GET: responde a preflight / verificación
 */
function doGet(e) {
  return buildCorsOutput({ status: "ok", message: "Eutimya · Consulta de Citas API" });
}

/**
 * POST: { "email": "paciente@ejemplo.com" }
 * Respuestas:
 *   { status: "sent",      count: N }
 *   { status: "not_found" }
 *   { status: "error",     message: "..." }
 */
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var email   = (payload.email || "").trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return buildCorsOutput({ status: "error", message: "Correo inválido." });
    }

    var citas = buscarCitas(email);

    if (citas.length === 0) {
      return buildCorsOutput({ status: "not_found" });
    }

    enviarCorreo(email, citas);
    return buildCorsOutput({ status: "sent", count: citas.length });

  } catch (err) {
    Logger.log("❌ Error en doPost: " + err);
    return buildCorsOutput({ status: "error", message: "Error interno del servidor." });
  }
}


// ── BÚSQUEDA EN LA HOJA ───────────────────────────────────────

function buscarCitas(emailBuscado) {
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID_CITAS);
  var sheet = ss.getSheetByName(SHEET_NAME_CITAS);

  if (!sheet) return [];

  var ultimaFila = sheet.getLastRow();
  if (ultimaFila < 2) return [];

  // Traer columnas A:L (1..12)
  var datos = sheet.getRange(2, 1, ultimaFila - 1, 12).getValues();

  var hoy   = new Date();
  hoy.setHours(0, 0, 0, 0);

  var resultados = [];

  datos.forEach(function(fila) {
    var emailFila  = String(fila[COL_EMAIL - 1] || "").trim().toLowerCase();
    var estadoFila = String(fila[COL_ESTADO - 1] || "").trim();

    if (emailFila !== emailBuscado) return;

    // Solo citas próximas (no pasadas)
    if (estadoFila === "Pasada") return;

    // Verificación adicional por fecha real
    var fechaStr = String(fila[COL_FECHA - 1] || "");
    var fechaCita = parsearFecha(fechaStr);
    if (fechaCita && fechaCita < hoy) return;

    resultados.push({
      doctor:    String(fila[COL_DOCTOR    - 1] || ""),
      nombre:    String(fila[COL_NOMBRE    - 1] || ""),
      fecha:     fechaStr,
      hora:      String(fila[COL_HORA      - 1] || ""),
      modalidad: String(fila[COL_MODALIDAD - 1] || ""),
      direccion: String(fila[COL_DIRECCION - 1] || ""),
      link:      String(fila[COL_LINK      - 1] || ""),
    });
  });

  // Ordenar por fecha
  resultados.sort(function(a, b) {
    var fa = parsearFecha(a.fecha), fb = parsearFecha(b.fecha);
    if (!fa) return 1;
    if (!fb) return -1;
    return fa - fb;
  });

  return resultados;
}

/**
 * Parsea fecha en formato dd/mm/yyyy a Date (o null si falla).
 */
function parsearFecha(str) {
  if (!str) return null;
  var partes = str.split("/");
  if (partes.length !== 3) return null;
  var d = parseInt(partes[0], 10);
  var m = parseInt(partes[1], 10) - 1;
  var y = parseInt(partes[2], 10);
  var fecha = new Date(y, m, d);
  return isNaN(fecha.getTime()) ? null : fecha;
}


// ── ENVÍO DE CORREO ───────────────────────────────────────────

function enviarCorreo(emailDestino, citas) {
  var nombre = citas[0].nombre || "Paciente";

  var asunto = citas.length === 1
    ? "Tu cita en Eutimya · " + citas[0].fecha
    : "Tus " + citas.length + " citas en Eutimya";

  var htmlCuerpo = construirHtmlCorreo(nombre, citas);
  var textoCuerpo = construirTextoCorreo(nombre, citas);

  GmailApp.sendEmail(emailDestino, asunto, textoCuerpo, {
    htmlBody: htmlCuerpo,
    name: NOMBRE_CLINICA,
    replyTo: EMAIL_REMITENTE
  });

  Logger.log("✅ Correo enviado a " + emailDestino + " (" + citas.length + " citas)");
}


// ── TEMPLATES DE CORREO ───────────────────────────────────────

function construirHtmlCorreo(nombre, citas) {
  var citasHtml = citas.map(function(c) {
    var modalidadColor = {
      "Presencial": "#e8f5e9",
      "Online":     "#e3f2fd",
      "Bariatría":  "#fce4ec"
    }[c.modalidad] || "#f5f5f5";

    var modalidadIcono = {
      "Presencial": "📍",
      "Online":     "💻",
      "Bariatría":  "🏥"
    }[c.modalidad] || "🗓";

    var ubicacionHtml = "";
    if (c.modalidad === "Presencial" && c.direccion) {
      ubicacionHtml = '<tr><td style="padding:6px 0;color:#6F7978;font-size:13px;width:130px">📍 Dirección</td>'
                    + '<td style="padding:6px 0;font-size:13px;color:#161D1C">' + c.direccion + '</td></tr>';
    } else if ((c.modalidad === "Online" || c.modalidad === "Bariatría") && c.link) {
      ubicacionHtml = '<tr><td style="padding:6px 0;color:#6F7978;font-size:13px;width:130px">🔗 Link</td>'
                    + '<td style="padding:6px 0;font-size:13px"><a href="' + c.link + '" style="color:#006A60;font-weight:600">Unirse a la sesión</a></td></tr>';
    }

    return '<div style="background:' + modalidadColor + ';border-radius:16px;padding:20px 24px;margin-bottom:16px">'
      + '<div style="font-size:13px;font-weight:600;color:#006A60;letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px">'
      + modalidadIcono + ' ' + c.modalidad + '</div>'
      + '<table style="border-collapse:collapse;width:100%">'
      + '<tr><td style="padding:6px 0;color:#6F7978;font-size:13px;width:130px">👤 Especialista</td>'
      + '<td style="padding:6px 0;font-size:13px;font-weight:600;color:#161D1C">' + c.doctor + '</td></tr>'
      + '<tr><td style="padding:6px 0;color:#6F7978;font-size:13px">📅 Fecha</td>'
      + '<td style="padding:6px 0;font-size:13px;color:#161D1C">' + c.fecha + '</td></tr>'
      + '<tr><td style="padding:6px 0;color:#6F7978;font-size:13px">🕐 Hora</td>'
      + '<td style="padding:6px 0;font-size:13px;color:#161D1C">' + c.hora + ' hrs</td></tr>'
      + ubicacionHtml
      + '</table>'
      + '</div>';
  }).join("");

  return '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#F4FAF8;font-family:\'Roboto\',Helvetica,Arial,sans-serif">'
    + '<table width="100%" cellpadding="0" cellspacing="0" style="background:#F4FAF8;padding:32px 16px">'
    + '<tr><td align="center">'
    + '<table width="100%" style="max-width:520px;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">'

    // Header
    + '<tr><td style="background:#006A60;padding:32px 32px 28px;text-align:center">'
    + '<div style="font-size:28px;margin-bottom:8px">🏥</div>'
    + '<div style="font-family:Helvetica,Arial,sans-serif;font-size:22px;font-weight:700;color:#fff;letter-spacing:-.03em">Eutimya</div>'
    + '<div style="font-size:13px;color:#9EF2E4;margin-top:4px">Psiquiatría · CDMX</div>'
    + '</td></tr>'

    // Body
    + '<tr><td style="padding:28px 28px 8px">'
    + '<p style="font-size:15px;color:#161D1C;margin:0 0 6px">Hola, <strong>' + nombre + '</strong> 👋</p>'
    + '<p style="font-size:14px;color:#3F4947;line-height:1.6;margin:0 0 24px">'
    + 'Aquí están los detalles de tu' + (citas.length > 1 ? 's' : '') + ' cita' + (citas.length > 1 ? 's' : '') + ' próxima' + (citas.length > 1 ? 's' : '') + ':'
    + '</p>'
    + citasHtml
    + '</td></tr>'

    // Footer note
    + '<tr><td style="padding:16px 28px 28px">'
    + '<div style="background:#E9F0EE;border-radius:12px;padding:14px 16px;font-size:12px;color:#3F4947;line-height:1.55">'
    + '🔒 Este correo fue generado automáticamente a partir de tu solicitud. Si tienes dudas, escríbenos a '
    + '<a href="mailto:' + EMAIL_REMITENTE + '" style="color:#006A60">' + EMAIL_REMITENTE + '</a>.'
    + '</div>'
    + '</td></tr>'

    // Footer
    + '<tr><td style="padding:0 28px 24px;text-align:center;color:#6F7978;font-size:11px">'
    + 'Eutimya · Psiquiatría CDMX'
    + '</td></tr>'

    + '</table>'
    + '</td></tr></table>'
    + '</body></html>';
}

function construirTextoCorreo(nombre, citas) {
  var lineas = ["Hola, " + nombre + "!", "",
    "Aquí están los detalles de tu" + (citas.length > 1 ? "s" : "") + " cita" + (citas.length > 1 ? "s" : "") + " próxima" + (citas.length > 1 ? "s" : "") + ":", ""];

  citas.forEach(function(c, i) {
    lineas.push("── Cita " + (i + 1) + " ──────────────────");
    lineas.push("Especialista: " + c.doctor);
    lineas.push("Fecha:        " + c.fecha);
    lineas.push("Hora:         " + c.hora + " hrs");
    lineas.push("Modalidad:    " + c.modalidad);
    if (c.modalidad === "Presencial" && c.direccion) lineas.push("Dirección:    " + c.direccion);
    if (c.link) lineas.push("Link sesión:  " + c.link);
    lineas.push("");
  });

  lineas.push("Si tienes dudas, contáctanos: " + EMAIL_REMITENTE);
  lineas.push("Eutimya · Psiquiatría CDMX");

  return lineas.join("\n");
}


// ── PRUEBA MANUAL ─────────────────────────────────────────────
// Ejecuta esta función desde el editor para probar sin desplegar

function probarConEmail() {
  var emailPrueba = "PON_AQUI_EL_EMAIL_DEL_PACIENTE@ejemplo.com"; // ← cambia esto
  var citas = buscarCitas(emailPrueba);

  if (citas.length === 0) {
    Logger.log("⚠️ No se encontraron citas próximas para: " + emailPrueba);
  } else {
    Logger.log("✅ Citas encontradas: " + citas.length);
    citas.forEach(function(c, i) {
      Logger.log("── Cita " + (i + 1) + " → " + c.fecha + " " + c.hora + " con " + c.doctor + " (" + c.modalidad + ")");
    });
    enviarCorreo(emailPrueba, citas);
    Logger.log("📧 Correo enviado a: " + emailPrueba);
  }
}

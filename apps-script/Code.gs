const SHEET_NAME = 'Prospectos Devnex';

const HEADERS = [
  'Timestamp',
  'Nombre',
  'Empresa',
  'Email',
  'Telefono',
  'Interes',
  'Tamano empresa',
  'Fecha reunion',
  'Hora reunion',
  'Mensaje',
  'Consentimiento',
  'Origen',
  'Pagina',
  'User agent'
];

function doGet(e) {
  const action = String((e && e.parameter && e.parameter.action) || '').toLowerCase();
  const sheet = getLeadSheet_();

  if (action === 'setup') {
    ensureHeaders_(sheet);
    return json_({
      ok: true,
      message: 'Sheet ready',
      sheetName: SHEET_NAME,
      headers: HEADERS
    });
  }

  if (action === 'health') {
    return json_({
      ok: true,
      message: 'Devnex lead endpoint online',
      sheetName: SHEET_NAME
    });
  }

  return json_({
    ok: true,
    usage: {
      setup: '?action=setup',
      health: '?action=health',
      post: 'Send application/x-www-form-urlencoded fields from the web form'
    }
  });
}

function doPost(e) {
  try {
    const sheet = getLeadSheet_();
    ensureHeaders_(sheet);

    const data = readPayload_(e);
    const row = [
      new Date(),
      data.nombre,
      data.empresa,
      data.email,
      data.telefono,
      data.interes,
      data.tamano_empresa,
      data.fecha_reunion,
      data.hora_reunion,
      data.mensaje,
      data.consentimiento,
      data.origen,
      data.pagina,
      data.user_agent
    ];

    sheet.appendRow(row);

    return json_({
      ok: true,
      message: 'Lead saved',
      row: sheet.getLastRow()
    });
  } catch (error) {
    return json_({
      ok: false,
      message: error.message || String(error)
    });
  }
}

function getLeadSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error('Open this script from a Google Spreadsheet, or bind it to one before deploying.');
  }

  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);
  return sheet;
}

function ensureHeaders_(sheet) {
  const range = sheet.getRange(1, 1, 1, HEADERS.length);
  const current = range.getValues()[0];
  const needsHeaders = HEADERS.some((header, index) => current[index] !== header);

  if (!needsHeaders) return;

  range.setValues([HEADERS]);
  range.setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, HEADERS.length);
}

function readPayload_(e) {
  const params = Object.assign({}, (e && e.parameter) || {});

  if (e && e.postData && e.postData.contents) {
    const type = String(e.postData.type || '').toLowerCase();
    if (type.indexOf('application/json') !== -1) {
      Object.assign(params, JSON.parse(e.postData.contents));
    }
  }

  return {
    nombre: clean_(params.nombre),
    empresa: clean_(params.empresa),
    email: clean_(params.email),
    telefono: clean_(params.telefono),
    interes: clean_(params.interes),
    tamano_empresa: clean_(params.tamano_empresa),
    fecha_reunion: clean_(params.fecha_reunion),
    hora_reunion: clean_(params.hora_reunion),
    mensaje: clean_(params.mensaje),
    consentimiento: clean_(params.consentimiento),
    origen: clean_(params.origen),
    pagina: clean_(params.pagina),
    user_agent: clean_(params.user_agent)
  };
}

function clean_(value) {
  return String(value || '').trim();
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

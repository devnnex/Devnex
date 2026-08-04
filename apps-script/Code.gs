const LEADS_SHEET_NAME = 'Prospectos Devnex';
const APPOINTMENTS_SHEET_NAME = 'Citas Devnex';
const PARTNERS_SHEET_NAME = 'Partners Devnex';
const ERRORS_SHEET_NAME = 'Errores Devnex';
const FALLBACK_TIMEZONE = 'America/Bogota';
const APPOINTMENT_DURATION_MINUTES = 60;
const REMINDER_MINUTES_BEFORE = 30;
const DEVNEX_TEAM_EMAIL = 'elkin56ty@gmail.com';
const DEVNEX_LOGO_URL = 'https://devnnex.github.io/Devnex/images/logoo.png';

const LEAD_HEADERS = [
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
  'User agent',
  'Calendar status',
  'Calendar event ID',
  'Calendar event URL',
  'Calendar inicio',
  'Calendar fin',
  'Email cliente status',
  'Email equipo status'
];

const APPOINTMENT_HEADERS = [
  'Timestamp',
  'Lead row',
  'Nombre',
  'Empresa',
  'Email',
  'Telefono',
  'Interes',
  'Fecha reunion',
  'Hora reunion',
  'Inicio',
  'Fin',
  'Calendar status',
  'Calendar event ID',
  'Calendar event URL',
  'Notas',
  'Email cliente status',
  'Email equipo status'
];

const PARTNER_HEADERS = [
  'Timestamp',
  'Partner ID',
  'Nombre',
  'Empresa u ocupacion',
  'Email',
  'Telefono',
  'Ubicacion',
  'Perfil partner',
  'Oportunidades',
  'Consentimiento',
  'Origen',
  'Pagina',
  'User agent',
  'Estado',
  'Email partner status',
  'Email equipo status'
];

const ERROR_HEADERS = [
  'Timestamp',
  'Scope',
  'Message',
  'Payload'
];

function doGet(e) {
  const action = String((e && e.parameter && e.parameter.action) || '').toLowerCase();
  const sheets = setupSheets_();

  if (action === 'setup') {
    return json_({
      ok: true,
      message: 'Sheets ready',
      sheets: [LEADS_SHEET_NAME, APPOINTMENTS_SHEET_NAME, PARTNERS_SHEET_NAME, ERRORS_SHEET_NAME]
    });
  }

  if (action === 'health') {
    return json_({
      ok: true,
      message: 'Devnex lead endpoint online',
      sheets: [LEADS_SHEET_NAME, APPOINTMENTS_SHEET_NAME, PARTNERS_SHEET_NAME, ERRORS_SHEET_NAME]
    });
  }

  return json_({
    ok: true,
    usage: {
      setup: '?action=setup',
      health: '?action=health',
      post: 'Send application/x-www-form-urlencoded fields from the web form'
    },
    sheets: Object.keys(sheets)
  });
}

function doPost(e) {
  const sheets = setupSheets_();
  let data = {};

  try {
    data = readPayload_(e);

    if (normalize_(data.tipo_formulario) === 'partner') {
      return handlePartnerPost_(sheets, data);
    }

    validateLead_(data);

    const calendarResult = createCalendarAppointment_(data);
    const emailResult = sendAppointmentEmails_(data, calendarResult);
    logEmailFailures_(sheets.errors, emailResult, data);

    const lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) throw new Error('El servicio esta ocupado. Intenta de nuevo.');

    let leadRowNumber;
    try {
      leadRowNumber = appendLead_(sheets.leads, data, calendarResult, emailResult);
      appendAppointment_(sheets.appointments, leadRowNumber, data, calendarResult, emailResult);
    } finally {
      lock.releaseLock();
    }

    return json_({
      ok: true,
      message: 'Solicitud guardada, cita creada y correos procesados.',
      row: leadRowNumber,
      calendar: {
        status: calendarResult.status,
        eventId: calendarResult.eventId,
        eventUrl: calendarResult.eventUrl,
        start: calendarResult.startIso,
        end: calendarResult.endIso
      },
      email: {
        customer: emailResult.customer,
        team: emailResult.team
      }
    });
  } catch (error) {
    logError_(sheets.errors, 'doPost', error, data);
    return json_({
      ok: false,
      message: error.message || String(error)
    });
  }
}

function handlePartnerPost_(sheets, data) {
  validatePartner_(data);
  data.partner_id = createPartnerId_();

  const emailResult = sendPartnerEmails_(data);
  logEmailFailures_(sheets.errors, emailResult, data);

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw new Error('El servicio esta ocupado. Intenta de nuevo.');

  let partnerRowNumber;
  try {
    partnerRowNumber = appendPartner_(sheets.partners, data, emailResult);
  } finally {
    lock.releaseLock();
  }

  return json_({
    ok: true,
    type: 'partner',
    message: 'Partner guardado y correos procesados.',
    partnerId: data.partner_id,
    row: partnerRowNumber,
    email: {
      partner: emailResult.partner,
      team: emailResult.team
    }
  });
}

function setup() {
  setupSheets_();
}

function authorizeServices() {
  setupSheets_();
  CalendarApp.getDefaultCalendar().getName();
  MailApp.getRemainingDailyQuota();
  GmailApp.getAliases();
}

function testEmail() {
  authorizeServices();
  const now = new Date();
  const calendarResult = {
    eventUrl: 'https://calendar.google.com/',
    start: now,
    end: new Date(now.getTime() + APPOINTMENT_DURATION_MINUTES * 60000)
  };
  const result = sendHtmlEmail_({
    to: DEVNEX_TEAM_EMAIL,
    subject: 'Prueba de correo Devnex',
    name: 'Devnex Web',
    replyTo: DEVNEX_TEAM_EMAIL,
    body: 'Prueba correcta de envio de correo desde Apps Script Devnex.',
    htmlBody: emailShell_(
      'Prueba de correo',
      'Correo operativo',
      '<p style="margin:0;color:#42375f;font-size:16px;line-height:1.65;">Si recibiste este mensaje, el envio de correos de Devnex ya esta autorizado y funcionando.</p>'
    )
  });

  if (result.indexOf('failed:') === 0) {
    throw new Error(result);
  }

  SpreadsheetApp.getActiveSpreadsheet().toast('Correo de prueba enviado a ' + DEVNEX_TEAM_EMAIL, 'Devnex', 6);
  return result;
}

function onOpen() {
  setupSheets_();
}

function setupSheets_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error('Abre este script desde Google Sheets o vinculalo a una hoja antes de desplegar.');
  }

  const leads = getOrCreateSheet_(spreadsheet, LEADS_SHEET_NAME, LEAD_HEADERS);
  const appointments = getOrCreateSheet_(spreadsheet, APPOINTMENTS_SHEET_NAME, APPOINTMENT_HEADERS);
  const partners = getOrCreateSheet_(spreadsheet, PARTNERS_SHEET_NAME, PARTNER_HEADERS);
  const errors = getOrCreateSheet_(spreadsheet, ERRORS_SHEET_NAME, ERROR_HEADERS);

  return {
    leads: leads,
    appointments: appointments,
    partners: partners,
    errors: errors
  };
}

function getOrCreateSheet_(spreadsheet, sheetName, headers) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) sheet = spreadsheet.insertSheet(sheetName);
  ensureHeaders_(sheet, headers);
  return sheet;
}

function ensureHeaders_(sheet, headers) {
  const range = sheet.getRange(1, 1, 1, headers.length);
  const current = range.getValues()[0];
  const needsHeaders = headers.some(function(header, index) {
    return current[index] !== header;
  });

  if (!needsHeaders) return;

  range.setValues([headers]);
  range.setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
}

function appendLead_(sheet, data, calendarResult, emailResult) {
  const rowNumber = sheet.getLastRow() + 1;
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
    data.user_agent,
    calendarResult.status,
    calendarResult.eventId,
    calendarResult.eventUrl,
    calendarResult.startIso,
    calendarResult.endIso,
    emailResult.customer,
    emailResult.team
  ];

  sheet.getRange(rowNumber, 1, 1, row.length).setValues([row]);
  return rowNumber;
}

function appendAppointment_(sheet, leadRowNumber, data, calendarResult, emailResult) {
  const row = [
    new Date(),
    leadRowNumber,
    data.nombre,
    data.empresa,
    data.email,
    data.telefono,
    data.interes,
    data.fecha_reunion,
    data.hora_reunion,
    calendarResult.startIso,
    calendarResult.endIso,
    calendarResult.status,
    calendarResult.eventId,
    calendarResult.eventUrl,
    calendarResult.notes,
    emailResult.customer,
    emailResult.team
  ];

  sheet.getRange(sheet.getLastRow() + 1, 1, 1, row.length).setValues([row]);
}

function appendPartner_(sheet, data, emailResult) {
  const rowNumber = sheet.getLastRow() + 1;
  const row = [
    new Date(),
    data.partner_id,
    data.nombre,
    data.empresa,
    data.email,
    data.telefono,
    data.ubicacion,
    data.perfil_partner,
    data.mensaje,
    data.consentimiento,
    data.origen,
    data.pagina,
    data.user_agent,
    'Nuevo - por contactar',
    emailResult.partner,
    emailResult.team
  ];

  sheet.getRange(rowNumber, 1, 1, row.length).setValues([row]);
  return rowNumber;
}

function createCalendarAppointment_(data) {
  const appointment = parseAppointment_(data.fecha_reunion, data.hora_reunion);
  const calendar = CalendarApp.getDefaultCalendar();
  const title = 'Devnex - ' + data.nombre + ' / ' + data.empresa;
  const description = [
    'Solicitud recibida desde la pagina web de Devnex.',
    '',
    'Nombre: ' + data.nombre,
    'Empresa: ' + data.empresa,
    'Email: ' + data.email,
    'Telefono: ' + data.telefono,
    'Interes: ' + data.interes,
    'Tamano empresa: ' + data.tamano_empresa,
    'Fecha solicitada: ' + data.fecha_reunion,
    'Franja solicitada: ' + data.hora_reunion,
    '',
    'Mensaje:',
    data.mensaje,
    '',
    'Pagina: ' + data.pagina,
    'Origen: ' + data.origen
  ].join('\n');

  const options = {
    description: description
  };

  options.guests = [data.email, DEVNEX_TEAM_EMAIL].filter(isValidEmail_).join(',');
  options.sendInvites = true;

  const event = calendar.createEvent(title, appointment.start, appointment.end, options);
  event.removeAllReminders();
  event.addPopupReminder(REMINDER_MINUTES_BEFORE);
  event.addEmailReminder(REMINDER_MINUTES_BEFORE);

  return {
    status: 'created',
    eventId: event.getId(),
    eventUrl: buildCalendarEventUrl_(event, calendar),
    start: appointment.start,
    end: appointment.end,
    startIso: formatDate_(appointment.start),
    endIso: formatDate_(appointment.end),
    notes: 'Recordatorios popup y email ' + REMINDER_MINUTES_BEFORE + ' minutos antes.'
  };
}

function sendAppointmentEmails_(data, calendarResult) {
  return {
    customer: sendCustomerEmail_(data, calendarResult),
    team: sendTeamEmail_(data, calendarResult)
  };
}

function sendCustomerEmail_(data, calendarResult) {
  return sendHtmlEmail_({
    to: data.email,
    subject: customerEmailSubject_(data),
    name: 'Devnex',
    replyTo: DEVNEX_TEAM_EMAIL,
    body: customerEmailText_(data, calendarResult),
    htmlBody: customerEmailHtml_(data, calendarResult)
  });
}

function sendTeamEmail_(data, calendarResult) {
  return sendHtmlEmail_({
    to: DEVNEX_TEAM_EMAIL,
    subject: teamEmailSubject_(data),
    name: 'Devnex Web',
    replyTo: data.email,
    body: teamEmailText_(data, calendarResult),
    htmlBody: teamEmailHtml_(data, calendarResult)
  });
}

function sendPartnerEmails_(data) {
  return {
    partner: sendPartnerWelcomeEmail_(data),
    team: sendPartnerTeamEmail_(data)
  };
}

function sendPartnerWelcomeEmail_(data) {
  return sendHtmlEmail_({
    to: data.email,
    subject: 'Bienvenido al programa de partners Devnex',
    name: 'Devnex Partners',
    replyTo: DEVNEX_TEAM_EMAIL,
    body: partnerWelcomeEmailText_(data),
    htmlBody: partnerWelcomeEmailHtml_(data)
  });
}

function sendPartnerTeamEmail_(data) {
  return sendHtmlEmail_({
    to: DEVNEX_TEAM_EMAIL,
    subject: 'Nuevo partner Devnex: ' + data.nombre + ' - ' + data.ubicacion,
    name: 'Devnex Partners',
    replyTo: data.email,
    body: partnerTeamEmailText_(data),
    htmlBody: partnerTeamEmailHtml_(data)
  });
}

function customerEmailSubject_(data) {
  return 'Devnex confirmo tu cita: ' + leadSubjectDetail_(data);
}

function teamEmailSubject_(data) {
  return 'Nuevo lead Devnex: ' + leadSubjectDetail_(data) + ' - ' + data.nombre;
}

function leadSubjectDetail_(data) {
  const problem = compactSubjectText_(data.mensaje);
  const interest = compactSubjectText_(data.interes);
  return problem || interest || 'Solicitud de asesoria';
}

function compactSubjectText_(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 78);
}

function sendHtmlEmail_(message) {
  const options = {
    htmlBody: message.htmlBody,
    name: message.name
  };
  const mailPayload = {
    to: message.to,
    subject: message.subject,
    body: message.body,
    htmlBody: message.htmlBody,
    name: message.name
  };

  if (isValidEmail_(message.replyTo)) {
    options.replyTo = message.replyTo;
    mailPayload.replyTo = message.replyTo;
  }

  try {
    MailApp.sendEmail(mailPayload);
    return 'sent: MailApp';
  } catch (mailError) {
    try {
      GmailApp.sendEmail(message.to, message.subject, message.body, options);
      return 'sent: GmailApp';
    } catch (gmailError) {
      return [
        'failed:',
        'MailApp=' + (mailError.message || String(mailError)),
        'GmailApp=' + (gmailError.message || String(gmailError))
      ].join(' ');
    }
  }
}

function customerEmailText_(data, calendarResult) {
  return [
    'Hola ' + data.nombre + ',',
    '',
    'Recibimos tus datos y tu solicitud de cita con Devnex.',
    'Fecha y hora: ' + formatHumanDate_(calendarResult.start) + ' a ' + formatHumanTime_(calendarResult.end),
    'Servicio de interes: ' + data.interes,
    '',
    'Nuestro equipo revisara tu solicitud y se pondra en contacto contigo para confirmar detalles, alcance y siguiente paso.',
    '',
    'Ver cita: ' + calendarResult.eventUrl,
    '',
    'Devnex'
  ].join('\n');
}

function teamEmailText_(data, calendarResult) {
  return [
    'Nueva cita creada desde el formulario Devnex.',
    '',
    'Nombre: ' + data.nombre,
    'Empresa: ' + data.empresa,
    'Email: ' + data.email,
    'Telefono: ' + data.telefono,
    'Interes: ' + data.interes,
    'Tamano empresa: ' + data.tamano_empresa,
    'Cita: ' + formatHumanDate_(calendarResult.start) + ' a ' + formatHumanTime_(calendarResult.end),
    '',
    'Mensaje:',
    data.mensaje,
    '',
    'Ver cita: ' + calendarResult.eventUrl,
    'Pagina: ' + data.pagina
  ].join('\n');
}

function partnerWelcomeEmailText_(data) {
  return [
    'Hola ' + data.nombre + ',',
    '',
    'Gracias por unirte al programa de partners de Devnex.',
    'Recibimos tu registro correctamente con el identificador ' + data.partner_id + '.',
    '',
    'Pronto te contactaremos para conocerte, conversar sobre las oportunidades que puedes referir y explicarte cómo funciona la comisión según el valor de cada proyecto.',
    '',
    'Nos alegra contar contigo para conectar más negocios con tecnología que los ayude a crecer.',
    '',
    'Equipo Devnex'
  ].join('\n');
}

function partnerTeamEmailText_(data) {
  return [
    'Nuevo registro en el programa de partners Devnex.',
    '',
    'Partner ID: ' + data.partner_id,
    'Nombre: ' + data.nombre,
    'Empresa u ocupacion: ' + (data.empresa || 'No indicada'),
    'Email: ' + data.email,
    'Telefono: ' + data.telefono,
    'Ubicacion: ' + data.ubicacion,
    'Perfil: ' + data.perfil_partner,
    '',
    'Oportunidades que podria referir:',
    data.mensaje,
    '',
    'Pagina: ' + data.pagina
  ].join('\n');
}

function customerEmailHtml_(data, calendarResult) {
  const safeName = escapeHtml_(data.nombre);
  const appointmentDate = escapeHtml_(formatHumanDate_(calendarResult.start));
  const appointmentEnd = escapeHtml_(formatHumanTime_(calendarResult.end));
  const interest = escapeHtml_(data.interes);
  const eventUrl = escapeAttribute_(calendarResult.eventUrl);

  return emailShell_(
    'Cita recibida',
    'Hola ' + safeName + ',',
    [
      '<p style="margin:0 0 16px;color:#42375f;font-size:16px;line-height:1.65;">Recibimos tus datos y tu solicitud de cita con Devnex. Nuestro equipo revisara la informacion y se pondra en contacto contigo para confirmar detalles, alcance y siguiente paso.</p>',
      '<div style="margin:22px 0;padding:18px;border:1px solid #e8ddff;border-radius:14px;background:#fbf8ff;">',
      '<div style="margin-bottom:10px;color:#7c3aed;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">Fecha agendada</div>',
      '<div style="color:#170c2f;font-size:20px;font-weight:800;">' + appointmentDate + ' a ' + appointmentEnd + '</div>',
      '<div style="margin-top:10px;color:#5a4a78;font-size:14px;">Servicio de interes: ' + interest + '</div>',
      '</div>',
      '<a href="' + eventUrl + '" style="display:inline-block;margin-top:4px;padding:13px 18px;border-radius:999px;background:#7c3aed;color:#ffffff;text-decoration:none;font-weight:800;">Ver cita en Google Calendar</a>',
      '<p style="margin:22px 0 0;color:#6b5d85;font-size:14px;line-height:1.6;">Gracias por confiar en Devnex. Vamos a revisar tu caso con cuidado para darte una orientacion clara.</p>'
    ].join('')
  );
}

function teamEmailHtml_(data, calendarResult) {
  const eventUrl = escapeAttribute_(calendarResult.eventUrl);
  const rows = [
    ['Nombre', data.nombre],
    ['Empresa', data.empresa],
    ['Email', data.email],
    ['Telefono', data.telefono],
    ['Interes', data.interes],
    ['Tamano empresa', data.tamano_empresa],
    ['Cita', formatHumanDate_(calendarResult.start) + ' a ' + formatHumanTime_(calendarResult.end)],
    ['Pagina', data.pagina]
  ].map(function(row) {
    return '<tr><td style="padding:10px 0;color:#7b6b99;font-size:13px;">' + escapeHtml_(row[0]) + '</td><td style="padding:10px 0;color:#190d31;font-size:14px;font-weight:700;text-align:right;">' + escapeHtml_(row[1]) + '</td></tr>';
  }).join('');

  return emailShell_(
    'Nueva cita creada',
    'Formulario Devnex',
    [
      '<p style="margin:0 0 16px;color:#42375f;font-size:16px;line-height:1.65;">Se creo una nueva cita en Google Calendar y se guardo la solicitud del prospecto.</p>',
      '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:18px 0;border-top:1px solid #eadfff;border-bottom:1px solid #eadfff;">',
      rows,
      '</table>',
      '<div style="margin:18px 0;padding:16px;border-radius:14px;background:#fbf8ff;color:#42375f;font-size:14px;line-height:1.65;"><strong style="color:#190d31;">Mensaje:</strong><br>' + escapeHtml_(data.mensaje).replace(/\n/g, '<br>') + '</div>',
      '<a href="' + eventUrl + '" style="display:inline-block;margin-top:4px;padding:13px 18px;border-radius:999px;background:#7c3aed;color:#ffffff;text-decoration:none;font-weight:800;">Abrir cita en Calendar</a>'
    ].join('')
  );
}

function partnerWelcomeEmailHtml_(data) {
  const safeName = escapeHtml_(data.nombre);
  const partnerId = escapeHtml_(data.partner_id);

  return emailShell_(
    'Programa de partners',
    'Bienvenido, ' + safeName,
    [
      '<p style="margin:0 0 18px;color:#42375f;font-size:16px;line-height:1.7;">Gracias por unirte al programa de partners de Devnex. Recibimos tu registro correctamente y nos alegra contar contigo para conectar más negocios con soluciones tecnológicas de alto impacto.</p>',
      '<div style="margin:22px 0;padding:20px;border:1px solid #e4d8ff;border-radius:16px;background:linear-gradient(135deg,#fbf8ff,#f5fbff);">',
      '<div style="margin-bottom:8px;color:#7c3aed;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;">Tu registro</div>',
      '<div style="color:#170c2f;font-size:18px;font-weight:800;">' + partnerId + '</div>',
      '<div style="margin-top:8px;color:#65567e;font-size:14px;line-height:1.55;">Conserva este identificador como referencia de tu solicitud.</div>',
      '</div>',
      '<h2 style="margin:24px 0 10px;color:#170c2f;font-size:20px;line-height:1.25;">¿Qué sigue ahora?</h2>',
      '<p style="margin:0;color:#42375f;font-size:16px;line-height:1.7;">Pronto te contactaremos para conocerte, conversar sobre las oportunidades que puedes referir y explicarte cómo funciona la comisión según el valor de cada proyecto.</p>',
      '<div style="margin:24px 0 0;padding:16px 18px;border-left:4px solid #a855f7;border-radius:0 14px 14px 0;background:#f8f3ff;color:#5b4778;font-size:14px;line-height:1.65;"><strong style="color:#27143f;">Juntos creamos oportunidades.</strong><br>Tú haces la conexión; Devnex acompaña el diagnóstico, la propuesta y la implementación.</div>',
      '<p style="margin:24px 0 0;color:#6b5d85;font-size:14px;line-height:1.6;">Gracias por confiar en Devnex.<br><strong style="color:#27143f;">Equipo Devnex</strong></p>'
    ].join('')
  );
}

function partnerTeamEmailHtml_(data) {
  const rows = [
    ['Partner ID', data.partner_id],
    ['Nombre', data.nombre],
    ['Empresa u ocupacion', data.empresa || 'No indicada'],
    ['Email', data.email],
    ['Telefono', data.telefono],
    ['Ubicacion', data.ubicacion],
    ['Perfil', data.perfil_partner],
    ['Pagina', data.pagina]
  ].map(function(row) {
    return '<tr><td style="padding:10px 0;color:#7b6b99;font-size:13px;vertical-align:top;">' + escapeHtml_(row[0]) + '</td><td style="padding:10px 0;color:#190d31;font-size:14px;font-weight:700;text-align:right;">' + escapeHtml_(row[1]) + '</td></tr>';
  }).join('');

  const emailLink = 'mailto:' + escapeAttribute_(data.email);
  const phoneLink = 'https://wa.me/' + String(data.telefono || '').replace(/\D/g, '');

  return emailShell_(
    'Nuevo registro',
    'Partner por contactar',
    [
      '<p style="margin:0 0 16px;color:#42375f;font-size:16px;line-height:1.65;">Se registro una nueva persona interesada en referir negocios a Devnex.</p>',
      '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:18px 0;border-top:1px solid #eadfff;border-bottom:1px solid #eadfff;">',
      rows,
      '</table>',
      '<div style="margin:18px 0;padding:16px;border-radius:14px;background:#fbf8ff;color:#42375f;font-size:14px;line-height:1.65;"><strong style="color:#190d31;">Oportunidades que podria referir:</strong><br>' + escapeHtml_(data.mensaje).replace(/\n/g, '<br>') + '</div>',
      '<a href="' + emailLink + '" style="display:inline-block;margin:4px 8px 0 0;padding:13px 18px;border-radius:999px;background:#7c3aed;color:#ffffff;text-decoration:none;font-weight:800;">Responder por correo</a>',
      '<a href="' + escapeAttribute_(phoneLink) + '" style="display:inline-block;margin-top:4px;padding:13px 18px;border:1px solid #d8c8f5;border-radius:999px;color:#5b21b6;text-decoration:none;font-weight:800;">Contactar por WhatsApp</a>'
    ].join('')
  );
}

function emailShell_(eyebrow, title, content) {
  return [
    '<div style="margin:0;padding:0;background:#f5f0ff;font-family:Arial,Helvetica,sans-serif;">',
    '<div style="max-width:620px;margin:0 auto;padding:30px 16px;">',
    '<div style="border-radius:22px;overflow:hidden;background:#ffffff;box-shadow:0 18px 50px rgba(42,18,92,.16);">',
    '<div style="padding:26px 28px;background:linear-gradient(135deg,#120623,#271047);color:#ffffff;">',
    '<img src="' + escapeAttribute_(DEVNEX_LOGO_URL) + '" width="190" alt="Devnex" style="display:block;width:190px;max-width:72%;height:auto;margin:0 0 22px;border:0;">',
    '<div style="font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#d7c3ff;">' + escapeHtml_(eyebrow) + '</div>',
    '<h1 style="margin:8px 0 0;font-size:28px;line-height:1.15;color:#ffffff;">' + title + '</h1>',
    '</div>',
    '<div style="padding:28px;">',
    content,
    '</div>',
    '<div style="padding:18px 28px;background:#fbf8ff;color:#7b6b99;font-size:13px;line-height:1.55;">Devnex - Desarrollo de software, automatizacion y sistemas empresariales.</div>',
    '</div>',
    '</div>',
    '</div>'
  ].join('');
}

function parseAppointment_(dateText, slotText) {
  const parts = String(dateText || '').split('-').map(function(part) {
    return Number(part);
  });

  if (parts.length !== 3 || parts.some(function(part) { return !part; })) {
    throw new Error('Fecha de reunion invalida.');
  }

  const slot = normalize_(slotText);
  let hour = 8;

  if (slot.indexOf('tarde') !== -1 || slot.indexOf('12:00') !== -1) {
    hour = 12;
  } else if (slot.indexOf('noche') !== -1 || slot.indexOf('5:00') !== -1 || slot.indexOf('17:00') !== -1) {
    hour = 17;
  } else if (slot.indexOf('manana') !== -1 || slot.indexOf('8:00') !== -1) {
    hour = 8;
  } else {
    throw new Error('Franja horaria invalida.');
  }

  const start = new Date(parts[0], parts[1] - 1, parts[2], hour, 0, 0);
  const end = new Date(start.getTime() + APPOINTMENT_DURATION_MINUTES * 60000);

  if (isNaN(start.getTime())) {
    throw new Error('Fecha de reunion invalida.');
  }

  return {
    start: start,
    end: end
  };
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
    tipo_formulario: clean_(params.tipo_formulario),
    nombre: clean_(params.nombre),
    empresa: clean_(params.empresa),
    email: clean_(params.email),
    telefono: clean_(params.telefono),
    ubicacion: clean_(params.ubicacion),
    perfil_partner: clean_(params.perfil_partner),
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

function validateLead_(data) {
  const required = [
    'nombre',
    'empresa',
    'email',
    'telefono',
    'interes',
    'tamano_empresa',
    'fecha_reunion',
    'hora_reunion',
    'mensaje',
    'consentimiento'
  ];
  const missing = required.filter(function(field) {
    return !data[field];
  });

  if (missing.length) {
    throw new Error('Campos requeridos faltantes: ' + missing.join(', '));
  }

  if (!isValidEmail_(data.email)) {
    throw new Error('Correo electronico invalido.');
  }
}

function validatePartner_(data) {
  const required = [
    'nombre',
    'email',
    'telefono',
    'ubicacion',
    'perfil_partner',
    'mensaje',
    'consentimiento'
  ];
  const missing = required.filter(function(field) {
    return !data[field];
  });

  if (missing.length) {
    throw new Error('Campos requeridos faltantes: ' + missing.join(', '));
  }

  if (!isValidEmail_(data.email)) {
    throw new Error('Correo electronico invalido.');
  }
}

function createPartnerId_() {
  const datePart = Utilities.formatDate(new Date(), getTimezone_(), 'yyyyMMdd');
  const randomPart = Utilities.getUuid().replace(/-/g, '').slice(0, 6).toUpperCase();
  return 'DNX-P-' + datePart + '-' + randomPart;
}

function buildCalendarEventUrl_(event, calendar) {
  const encodedId = Utilities.base64EncodeWebSafe(event.getId() + ' ' + calendar.getId()).replace(/=+$/, '');
  return 'https://calendar.google.com/calendar/event?eid=' + encodedId;
}

function logError_(sheet, scope, error, payload) {
  try {
    sheet.getRange(sheet.getLastRow() + 1, 1, 1, ERROR_HEADERS.length).setValues([[
      new Date(),
      scope,
      error.message || String(error),
      JSON.stringify(payload || {})
    ]]);
  } catch (ignored) {
    // Avoid masking the original error.
  }
}

function logEmailFailures_(sheet, emailResult, payload) {
  Object.keys(emailResult).forEach(function(key) {
    const status = String(emailResult[key] || '');
    if (status.indexOf('failed:') === 0) {
      logError_(sheet, 'email_' + key, new Error(status), payload);
    }
  });
}

function formatDate_(date) {
  return Utilities.formatDate(date, getTimezone_(), "yyyy-MM-dd'T'HH:mm:ss");
}

function formatHumanDate_(date) {
  return Utilities.formatDate(date, getTimezone_(), 'yyyy-MM-dd HH:mm');
}

function formatHumanTime_(date) {
  return Utilities.formatDate(date, getTimezone_(), 'HH:mm');
}

function getTimezone_() {
  return Session.getScriptTimeZone() || FALLBACK_TIMEZONE;
}

function normalize_(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function isValidEmail_(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function escapeHtml_(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttribute_(value) {
  return escapeHtml_(value);
}

function clean_(value) {
  const text = String(value || '').trim();
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

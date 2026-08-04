# Devnex lead and partner capture Apps Script

Este Apps Script recibe prospectos y partners desde los formularios web. Guarda cada flujo en Google Sheets, crea citas para prospectos y envia correos HTML de confirmacion o bienvenida.

## Instalacion

1. Crea o abre un Google Sheet para prospectos.
2. Ve a `Extensiones > Apps Script`.
3. Pega el contenido de `Code.gs`.
4. Guarda el proyecto.
5. Ejecuta una vez `authorizeServices` y acepta los permisos de Sheets, Calendar, Mail y Gmail.
6. Ejecuta `testEmail` y confirma que llega un correo de prueba a `elkin56ty@gmail.com`.
7. Ejecuta `setup` o abre la URL del Web App con `?action=setup` para crear o actualizar las hojas y columnas.
8. En `Implementar > Gestionar implementaciones`, edita el despliegue activo, selecciona `Nueva version` y pulsa `Implementar`.
9. Configura:
   - Ejecutar como: `Yo`.
   - Quien tiene acceso: `Cualquier usuario`.
10. Copia la URL del Web App y pegala en la primera linea de `script.js`.

```js
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/DEPLOYMENT_ID/exec';
```

## Endpoints rapidos

- `GET ?action=health`: confirma que el endpoint esta activo.
- `GET ?action=setup`: crea o repara las hojas `Prospectos Devnex`, `Citas Devnex`, `Partners Devnex` y `Errores Devnex`.
- `POST`: recibe los campos del formulario en formato `application/x-www-form-urlencoded`.

El campo `tipo_formulario=partner` dirige el registro al flujo de partners. Si no esta presente, se conserva el flujo original de prospectos y citas.

## Citas

El formulario envia una franja horaria. El script crea una cita de 1 hora al inicio de la franja seleccionada:

- Manana: 8:00 a.m.
- Tarde: 12:00 p.m.
- Noche: 5:00 p.m.

La cita queda en el calendario principal de la cuenta que despliega el Web App, con recordatorio popup y email 30 minutos antes.

Tambien se agregan como invitados el cliente y `elkin56ty@gmail.com`, para que Google Calendar pueda enviar su invitacion propia cuando el despliegue tenga permisos. Adicionalmente, el script envia:

- Un correo HTML de confirmacion al cliente.
- Un correo interno a `elkin56ty@gmail.com` cada vez que se crea una cita.

## Partners

Cada solicitud de afiliacion:

- Recibe un identificador con formato `DNX-P-AAAAMMDD-XXXXXX`.
- Se guarda en la hoja `Partners Devnex` con estado inicial `Nuevo - por contactar`.
- Envia al partner un correo premium de bienvenida con el logo de Devnex.
- Envia al equipo un correo con todos los datos y accesos directos para responder por email o WhatsApp.

El logo del correo se carga desde la URL publica configurada en `DEVNEX_LOGO_URL`. Si cambia el dominio de GitHub Pages, actualiza esa constante antes de desplegar.

Si Sheets y Calendar funcionan pero no llega correo, ejecuta `testEmail` desde Apps Script. El backend intenta enviar primero con `MailApp` y, si falla, reintenta con `GmailApp`; el error exacto queda en la hoja `Errores Devnex` y en las columnas de estado de correo.

## Rendimiento del formulario

El formulario de prospectos conserva su confirmacion inmediata mientras el backend procesa la cita. El formulario de partners espera la confirmacion del backend antes de mostrar el modal de exito y solo entonces limpia los campos; si el registro falla, conserva los datos y muestra un mensaje para reintentar.

# Devnex lead capture Apps Script

Este Apps Script recibe prospectos del formulario web y los guarda en una hoja de Google Sheets.

## Instalacion

1. Crea o abre un Google Sheet para prospectos.
2. Ve a `Extensiones > Apps Script`.
3. Pega el contenido de `Code.gs`.
4. Guarda el proyecto.
5. Ejecuta una vez `doGet` o abre la URL del Web App con `?action=setup` para crear la hoja y columnas.
6. Despliega como `Implementar > Nueva implementacion > Aplicacion web`.
7. Configura:
   - Ejecutar como: `Yo`.
   - Quien tiene acceso: `Cualquier usuario`.
8. Copia la URL del Web App y pegala en `index.html`, atributo `data-endpoint` del formulario `#lead-form`.

```html
<form class="lead-form" id="lead-form" data-endpoint="https://script.google.com/macros/s/DEPLOYMENT_ID/exec" novalidate>
```

## Endpoints rapidos

- `GET ?action=health`: confirma que el endpoint esta activo.
- `GET ?action=setup`: crea o repara columnas.
- `POST`: recibe los campos del formulario en formato `application/x-www-form-urlencoded`.

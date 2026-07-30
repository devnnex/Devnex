document.addEventListener('DOMContentLoaded', () => {
  const whatsappNumber = '573246394689';
  const defaultMessage = [
    'Hola Devnex, vengo desde la página web.',
    '',
    'Quiero recibir asesoría sobre software empresarial, agentes IA o automatizaciones para mi negocio.'
  ].join('\n');

  const whatsappUrl = message => `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message || defaultMessage)}`;

  document.querySelectorAll('.whatsapp-link').forEach(link => {
    link.href = whatsappUrl(link.dataset.message);
  });

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  const body = document.body;
  const nav = document.querySelector('.nav-links');
  const toggle = document.querySelector('.nav-toggle');
  const close = document.querySelector('.nav-close');

  function closeMenu() {
    nav?.classList.remove('active');
    toggle?.setAttribute('aria-expanded', 'false');
    body.classList.remove('menu-open');
  }

  function openMenu() {
    nav?.classList.add('active');
    toggle?.setAttribute('aria-expanded', 'true');
    body.classList.add('menu-open');
  }

  toggle?.addEventListener('click', () => {
    if (nav?.classList.contains('active')) closeMenu();
    else openMenu();
  });

  close?.addEventListener('click', closeMenu);

  nav?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', event => {
      const href = link.getAttribute('href') || '';
      if (!href.startsWith('#')) {
        closeMenu();
        return;
      }

      event.preventDefault();
      const target = document.querySelector(href);
      closeMenu();
      window.setTimeout(() => target?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
    });
  });

  document.addEventListener('click', event => {
    if (body.classList.contains('menu-open') && !nav?.contains(event.target) && !toggle?.contains(event.target)) {
      closeMenu();
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
  });

  const form = document.getElementById('lead-form');
  const status = document.getElementById('form-status');

  function setStatus(message, type = '') {
    if (!status) return;
    status.textContent = message;
    status.className = `form-status ${type}`.trim();
  }

  function leadMessage(data) {
    return [
      'Hola Devnex, vengo desde la página web.',
      '',
      `Nombre: ${data.get('nombre') || ''}`,
      `Empresa: ${data.get('empresa') || ''}`,
      `Email: ${data.get('email') || ''}`,
      `Teléfono: ${data.get('telefono') || ''}`,
      `Interés: ${data.get('interes') || ''}`,
      `Reunión sugerida: ${data.get('fecha_reunion') || ''} - ${data.get('hora_reunion') || ''}`,
      '',
      `Mensaje: ${data.get('mensaje') || ''}`
    ].join('\n');
  }

  form?.addEventListener('submit', async event => {
    event.preventDefault();
    setStatus('');

    if (!form.checkValidity()) {
      form.reportValidity();
      setStatus('Completa los campos requeridos para enviar tu solicitud.', 'is-error');
      return;
    }

    const endpoint = form.dataset.endpoint?.trim();
    const data = new FormData(form);
    data.set('pagina', window.location.href);
    data.set('user_agent', navigator.userAgent);

    const submitButton = form.querySelector('.form-submit');
    submitButton.disabled = true;
    submitButton.textContent = 'Enviando...';

    try {
      if (endpoint) {
        const payload = new URLSearchParams(data);
        const response = await fetch(endpoint, {
          method: 'POST',
          body: payload
        });

        if (!response.ok) throw new Error('No se pudo guardar el prospecto.');
      }

      setStatus('Solicitud recibida. Te contactaremos para coordinar la reunión.', 'is-success');
      window.open(whatsappUrl(leadMessage(data)), '_blank', 'noopener');
      form.reset();
    } catch (error) {
      const fallback = document.createElement('a');
      fallback.href = whatsappUrl(leadMessage(data));
      fallback.target = '_blank';
      fallback.rel = 'noopener';
      fallback.click();
      setStatus('Abrimos WhatsApp como respaldo. Revisa también la configuración del Apps Script.', 'is-error');
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Enviar solicitud';
    }
  });
});

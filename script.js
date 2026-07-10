document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('js-ready');

  const whatsappNumber = '573246394689';
  const defaultMessage = [
    'Hola Devnex, vengo desde la página web.',
    '',
    'Estoy interesado en implementar un sistema para mi empresa o automatizar un proceso manual.',
    'Quiero recibir asesoría para evaluar alcance, tiempos y cotización.'
  ].join('\n');

  function whatsappUrl(message = defaultMessage) {
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  }

  function hydrateWhatsappLinks(message = defaultMessage) {
    document.querySelectorAll('.whatsapp-link').forEach(link => {
      link.href = whatsappUrl(link.dataset.message || message);
    });
  }

  hydrateWhatsappLinks();

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ========== PARTICLES BACKGROUND ========== */
  const canvas = document.getElementById('particles');
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext('2d');
    let w = window.innerWidth;
    let h = window.innerHeight;
    let particles = [];

    function rand(min, max) {
      return Math.random() * (max - min) + min;
    }

    class Particle {
      constructor() {
        this.x = rand(0, w);
        this.y = rand(0, h);
        this.r = rand(0.8, 2.8);
        this.vx = rand(-0.22, 0.22);
        this.vy = rand(-0.22, 0.22);
        this.c = Math.random() > 0.5 ? '#8b5cf6' : '#d946ef';
        this.alpha = rand(0.1, 0.72);
      }

      move() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < -10) this.x = w + 10;
        if (this.x > w + 10) this.x = -10;
        if (this.y < -10) this.y = h + 10;
        if (this.y > h + 10) this.y = -10;
      }

      draw() {
        ctx.beginPath();
        ctx.fillStyle = this.c;
        ctx.globalAlpha = this.alpha;
        ctx.shadowBlur = 18;
        ctx.shadowColor = this.c;
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    function resizeCanvas() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function init() {
      particles = [];
      const count = Math.max(18, Math.round((w * h) / 90000));
      for (let i = 0; i < count; i++) particles.push(new Particle());
    }

    function resize() {
      resizeCanvas();
      init();
    }

    window.addEventListener('resize', resize);
    resize();

    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.move();
        p.draw();
      }
      requestAnimationFrame(frame);
    }

    frame();
  }

  /* ========== FADE-IN ON SCROLL ========== */
  const observed = document.querySelectorAll(
    '.product-card, .enterprise-card, .sector-pills span, .about-section h2, .about-section p, .hero-left h1, .hero-left .lead, .contact-panel'
  );

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    observed.forEach(el => io.observe(el));
  } else {
    observed.forEach(el => el.classList.add('fade-in'));
  }

  /* ========== NAVIGATION ========== */
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  const body = document.body;
  const closeBtn = document.querySelector('.nav-close-btn');
  const dropdown = document.querySelector('.nav-dropdown');
  const dropdownToggle = document.querySelector('.nav-dropdown-toggle');

  function closeDropdown() {
    if (!dropdown || !dropdownToggle) return;
    dropdown.classList.remove('open');
    dropdownToggle.setAttribute('aria-expanded', 'false');
  }

  function closeMenu() {
    navLinks.classList.remove('active');
    toggle.classList.remove('active');
    toggle.setAttribute('aria-expanded', 'false');
    body.classList.remove('menu-open');
    closeDropdown();
  }

  toggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('active');
    toggle.classList.toggle('active', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
    body.classList.toggle('menu-open', isOpen);
  });

  closeBtn.addEventListener('click', closeMenu);

  if (dropdown && dropdownToggle) {
    dropdownToggle.addEventListener('click', event => {
      event.stopPropagation();
      const isOpen = dropdown.classList.toggle('open');
      dropdownToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', event => {
      const target = link.getAttribute('href');

      if (!target || !target.startsWith('#')) {
        closeMenu();
        return;
      }

      event.preventDefault();
      const section = document.querySelector(target);
      closeMenu();

      setTimeout(() => {
        if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 240);
    });
  });

  document.addEventListener('click', event => {
    if (navLinks.classList.contains('active') && !navLinks.contains(event.target) && !toggle.contains(event.target)) {
      closeMenu();
    }

    if (dropdown && !dropdown.contains(event.target)) {
      closeDropdown();
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeMenu();
      closeModal();
    }
  });

  /* ========== PREMIUM PRODUCT MODAL ========== */
  const modal = document.createElement('div');
  modal.classList.add('modal');
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `
    <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <button class="modal-close" type="button" aria-label="Cerrar modal">&times;</button>
      <img class="modal-img" src="" alt="Sistema">
      <div class="modal-copy">
        <span class="modal-badge"></span>
        <h3 class="modal-title" id="modal-title"></h3>
        <p class="modal-desc"></p>
        <ul class="modal-features"></ul>
        <a class="btn-primary modal-cta" href="#" target="_blank" rel="noopener">Solicitar este sistema</a>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const modalImg = modal.querySelector('.modal-img');
  const modalTitle = modal.querySelector('.modal-title');
  const modalDesc = modal.querySelector('.modal-desc');
  const modalBadge = modal.querySelector('.modal-badge');
  const modalFeatures = modal.querySelector('.modal-features');
  const modalClose = modal.querySelector('.modal-close');
  const modalCta = modal.querySelector('.modal-cta');

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    body.classList.remove('modal-open');
  }

  function openModal(card) {
    const img = card.querySelector('img');
    const title = card.querySelector('h3')?.textContent.trim() || 'Sistema Devnex';
    const desc = card.querySelector('p')?.textContent.trim() || '';
    const category = card.dataset.category || 'Sistema personalizado';
    const features = (card.dataset.features || 'Diseño responsive|Implementación personalizada|Soporte para puesta en marcha')
      .split('|')
      .filter(Boolean);

    modalImg.src = img?.src || '';
    modalImg.alt = img?.alt || title;
    modalTitle.textContent = title;
    modalDesc.textContent = desc;
    modalBadge.textContent = category;
    modalFeatures.innerHTML = features.map(feature => `<li>${feature}</li>`).join('');
    modalCta.href = whatsappUrl(`Hola Devnex, vengo desde la página web y quiero más información sobre: ${title}.`);

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    body.classList.add('modal-open');
    modalClose.focus();
  }

  document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', event => {
      if (event.target.closest('a')) return;
      openModal(card);
    });

    const detailsButton = card.querySelector('.details-button');
    if (detailsButton) {
      detailsButton.addEventListener('click', event => {
        event.stopPropagation();
        openModal(card);
      });
    }
  });

  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', event => {
    if (event.target === modal) closeModal();
  });
});

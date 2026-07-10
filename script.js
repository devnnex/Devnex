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
    if (!toggle || !navLinks) return;
    navLinks.classList.remove('active');
    toggle.classList.remove('active');
    toggle.setAttribute('aria-expanded', 'false');
    body.classList.remove('menu-open');
    closeDropdown();
  }

  function openMenu() {
    if (!toggle || !navLinks) return;
    navLinks.classList.add('active');
    toggle.classList.add('active');
    toggle.setAttribute('aria-expanded', 'true');
    body.classList.add('menu-open');
  }

  if (toggle && navLinks) {
    toggle.addEventListener('click', event => {
      event.stopPropagation();
      if (navLinks.classList.contains('active')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    toggle.addEventListener('touchstart', event => {
      event.stopPropagation();
    }, { passive: true });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', event => {
      event.stopPropagation();
      closeMenu();
    });
  }

  if (dropdown && dropdownToggle) {
    dropdownToggle.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      const isOpen = dropdown.classList.toggle('open');
      dropdownToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  if (navLinks) {
    navLinks.addEventListener('click', event => {
      event.stopPropagation();
    });

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
  }

  document.addEventListener('click', event => {
    if (navLinks?.classList.contains('active') && !navLinks.contains(event.target) && !toggle?.contains(event.target)) {
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

  /* ========== PRODUCTS SLIDER ========== */
  const productsSlider = document.querySelector('[data-products-slider]');
  const sliderTrack = productsSlider?.querySelector('.product-grid');
  const sliderCards = sliderTrack ? Array.from(sliderTrack.querySelectorAll('.product-card')) : [];
  const dotsWrap = productsSlider?.querySelector('.slider-dots');
  const prevButton = productsSlider?.querySelector('.slider-prev');
  const nextButton = productsSlider?.querySelector('.slider-next');

  if (productsSlider && sliderTrack && sliderCards.length && dotsWrap && prevButton && nextButton) {
    let currentPage = 0;
    let pageCount = 1;
    let visibleCards = 1;
    let cardStep = 0;
    let autoplay = null;
    let resumeTimer = null;
    let scrollTimer = null;
    let pointerStartX = 0;
    let pointerStartY = 0;
    const autoplayDelay = 4600;
    const userPauseDelay = 15000;

    function clamp(value, min, max) {
      return Math.max(min, Math.min(value, max));
    }

    function measureSlider() {
      const firstCard = sliderCards[0];
      const trackStyle = window.getComputedStyle(sliderTrack);
      const gap = parseFloat(trackStyle.columnGap || trackStyle.gap || '0') || 0;
      cardStep = firstCard.getBoundingClientRect().width + gap;
      visibleCards = cardStep > 0 ? Math.max(1, Math.round((sliderTrack.clientWidth + gap) / cardStep)) : 1;
      pageCount = Math.max(1, Math.ceil(sliderCards.length / visibleCards));
      currentPage = clamp(currentPage, 0, pageCount - 1);
      renderDots();
      updateControls();
      scrollToPage(currentPage, 'auto');
    }

    function pageToCardIndex(page) {
      return clamp(page * visibleCards, 0, Math.max(0, sliderCards.length - visibleCards));
    }

    function scrollToPage(page, behavior = 'smooth') {
      currentPage = clamp(page, 0, pageCount - 1);
      const targetCard = sliderCards[pageToCardIndex(currentPage)];
      if (!targetCard) return;
      const targetLeft = targetCard.getBoundingClientRect().left - sliderTrack.getBoundingClientRect().left + sliderTrack.scrollLeft;
      sliderTrack.scrollTo({ left: targetLeft, behavior });
      updateControls();
    }

    function pageFromScroll() {
      if (!cardStep) return 0;
      const cardIndex = Math.round(sliderTrack.scrollLeft / cardStep);
      return clamp(Math.round(cardIndex / visibleCards), 0, pageCount - 1);
    }

    function renderDots() {
      dotsWrap.innerHTML = '';
      dotsWrap.hidden = pageCount <= 1;
      prevButton.hidden = pageCount <= 1;
      nextButton.hidden = pageCount <= 1;

      for (let page = 0; page < pageCount; page += 1) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'slider-dot';
        dot.setAttribute('aria-label', `Ver grupo ${page + 1} de sistemas`);
        dot.addEventListener('click', () => {
          pauseAutoplay();
          scrollToPage(page);
        });
        dotsWrap.appendChild(dot);
      }
    }

    function updateControls() {
      dotsWrap.querySelectorAll('.slider-dot').forEach((dot, index) => {
        const active = index === currentPage;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-current', active ? 'true' : 'false');
      });
    }

    function stopAutoplay() {
      if (autoplay) window.clearInterval(autoplay);
      autoplay = null;
    }

    function startAutoplay() {
      stopAutoplay();
      if (pageCount <= 1 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      autoplay = window.setInterval(() => {
        scrollToPage((currentPage + 1) % pageCount);
      }, autoplayDelay);
    }

    function pauseAutoplay() {
      stopAutoplay();
      if (resumeTimer) window.clearTimeout(resumeTimer);
      resumeTimer = window.setTimeout(startAutoplay, userPauseDelay);
    }

    prevButton.addEventListener('click', () => {
      pauseAutoplay();
      scrollToPage(currentPage - 1 < 0 ? pageCount - 1 : currentPage - 1);
    });

    nextButton.addEventListener('click', () => {
      pauseAutoplay();
      scrollToPage((currentPage + 1) % pageCount);
    });

    sliderTrack.addEventListener('pointerdown', event => {
      pointerStartX = event.clientX;
      pointerStartY = event.clientY;
      productsSlider.dataset.dragging = 'false';
      pauseAutoplay();
    }, { passive: true });

    sliderTrack.addEventListener('pointermove', event => {
      if (Math.abs(event.clientX - pointerStartX) > 8 || Math.abs(event.clientY - pointerStartY) > 8) {
        productsSlider.dataset.dragging = 'true';
      }
    }, { passive: true });

    function resetDraggingFlag() {
      window.setTimeout(() => {
        productsSlider.dataset.dragging = 'false';
      }, 80);
    }

    sliderTrack.addEventListener('pointerup', resetDraggingFlag, { passive: true });
    sliderTrack.addEventListener('pointercancel', resetDraggingFlag, { passive: true });
    sliderTrack.addEventListener('pointerleave', resetDraggingFlag, { passive: true });

    sliderTrack.addEventListener('wheel', pauseAutoplay, { passive: true });
    sliderTrack.addEventListener('touchstart', pauseAutoplay, { passive: true });

    sliderTrack.addEventListener('scroll', () => {
      if (scrollTimer) window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {
        currentPage = pageFromScroll();
        updateControls();
      }, 80);
    }, { passive: true });

    window.addEventListener('resize', () => {
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(measureSlider, 160);
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopAutoplay();
      } else {
        startAutoplay();
      }
    });

    measureSlider();
    startAutoplay();
  }

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
      if (card.closest('[data-products-slider]')?.dataset.dragging === 'true') return;
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

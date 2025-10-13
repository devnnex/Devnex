document.addEventListener('DOMContentLoaded', () => {

  /* ========== PARTICLES BACKGROUND ========== */
  const canvas = document.getElementById('particles');
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext('2d');
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    let particles = [];

    function rand(min, max){ return Math.random() * (max - min) + min; }

    class P {
      constructor(){
        this.x = rand(0, w);
        this.y = rand(0, h);
        this.r = rand(0.8, 3.2);
        this.vx = rand(-0.25, 0.25);
        this.vy = rand(-0.25, 0.25);
        this.c = Math.random() > 0.5 ? '#8b5cf6' : '#d946ef';
        this.alpha = rand(0.12, 0.85);
      }
      move(){
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < -10) this.x = w + 10;
        if (this.x > w + 10) this.x = -10;
        if (this.y < -10) this.y = h + 10;
        if (this.y > h + 10) this.y = -10;
      }
      draw(){
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

    function init(){
      particles = [];
      const count = Math.round((w * h) / 100000);
      for(let i=0;i<count;i++) particles.push(new P());
    }

    function resize(){
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      init();
    }
    window.addEventListener('resize', resize);
    init();

    function frame(){
      ctx.clearRect(0,0,w,h);
      for(const p of particles){ p.move(); p.draw(); }
      requestAnimationFrame(frame);
    }
    frame();
  }

  /* ========== FADE-IN ON SCROLL ========== */
  const observed = document.querySelectorAll('.product-card, .about-section h2, .about-section p, .hero-left h1, .hero-left .lead');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(en => {
        if(en.isIntersecting){ en.target.classList.add('fade-in'); obs.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    observed.forEach(el => io.observe(el));
  } else {
    observed.forEach(el => el.classList.add('fade-in'));
  }

  /* ========== MOBILE NAV TOGGLE ========== */
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  const body = document.body;
  const links = navLinks.querySelectorAll('a');
  const closeBtn = document.querySelector('.nav-close-btn');

  function closeMenu() {
    navLinks.classList.remove('active');
    toggle.classList.remove('active');
    body.classList.remove('menu-open');
  }

  toggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    toggle.classList.toggle('active');
    body.classList.toggle('menu-open');
  });

  closeBtn.addEventListener('click', closeMenu);

  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');

      closeMenu();

      setTimeout(() => {
        if(document.querySelector(targetId)) {
          document.querySelector(targetId).scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);
    });
  });

  document.addEventListener('click', (e) => {
    if (navLinks.classList.contains('active')) {
      if (!navLinks.contains(e.target) && !toggle.contains(e.target)) {
        closeMenu();
      }
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  /* ========== MODAL PRODUCT CARD ========== */
  // Crear modal en el DOM
  const modal = document.createElement('div');
  modal.classList.add('modal');
  modal.innerHTML = `
    <div class="modal-content">
      <span class="modal-close">&times;</span>
      <img class="modal-img" src="" alt="Sistema">
      <h3 class="modal-title"></h3>
      <p class="modal-desc"></p>
    </div>
  `;
  document.body.appendChild(modal);

  const modalImg = modal.querySelector('.modal-img');
  const modalTitle = modal.querySelector('.modal-title');
  const modalDesc = modal.querySelector('.modal-desc');
  const modalClose = modal.querySelector('.modal-close');

  // Abrir modal al hacer click en una card
  const productCards = document.querySelectorAll('.product-card');
  productCards.forEach(card => {
    card.addEventListener('click', () => {
      const imgSrc = card.querySelector('img').src;
      const title = card.querySelector('h3').textContent;
      const desc = card.querySelector('p').textContent;

      modalImg.src = imgSrc;
      modalTitle.textContent = title;
      modalDesc.textContent = desc;

      modal.classList.add('open');
    });
  });

  // Cerrar modal
  modalClose.addEventListener('click', () => modal.classList.remove('open'));
  modal.addEventListener('click', (e) => {
    if(e.target === modal) modal.classList.remove('open');
  });

});

(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Nav: scrolled state ---------- */
  const nav = document.querySelector('.nav');
  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile menu ---------- */
  const toggle = document.querySelector('.nav__toggle');
  const menu = document.getElementById('mobile-menu');
  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
    nav.classList.toggle('is-scrolled', open || window.scrollY > 24);
  };
  toggle.addEventListener('click', () => setMenu(menu.hidden));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) { setMenu(false); toggle.focus(); }
  });

  /* ---------- Scroll reveal (staggered per group) ---------- */
  const reveals = document.querySelectorAll('.reveal, .journey');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.filter((e) => e.isIntersecting).forEach((entry, i) => {
        entry.target.style.transitionDelay = `${Math.min(i * 60, 300)}ms`;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Active nav link ---------- */
  // top-level links only (not the treatments inside the Services dropdown)
  const links = [...document.querySelectorAll('.nav__links > a, .nav__dd-trigger')];

  // Underline gradient: one green→blue gradient across the whole menu, each link shows its slice
  const navLinks = document.querySelector('.nav__links');
  // Colour at a point (0–1) along the brand gradient: green #54F981 → turquoise #20E7E6 (55%) → blue #1194FF
  const gradAt = (t) => {
    const stops = [[0, [84, 249, 129]], [0.55, [32, 231, 230]], [1, [17, 148, 255]]];
    t = Math.min(1, Math.max(0, t));
    const i = t <= 0.55 ? 0 : 1;
    const [p0, c0] = stops[i], [p1, c1] = stops[i + 1];
    const u = (t - p0) / (p1 - p0);
    return `rgb(${c0.map((v, k) => Math.round(v + (c1[k] - v) * u)).join(',')})`;
  };
  const sizeUnderlines = () => {
    const box = navLinks.getBoundingClientRect();
    const w = navLinks.scrollWidth;
    navLinks.style.setProperty('--nav-w', `${w}px`);
    links.forEach((a) => a.style.setProperty('--x', `${a.getBoundingClientRect().left - box.left}px`));
    // Dropdown accents use the same slice of the gradient as the Services underline
    const trig = document.querySelector('.nav__dd-trigger');
    if (trig && w) {
      const r = trig.getBoundingClientRect();
      const dd = trig.parentElement;
      dd.style.setProperty('--dd-from', gradAt((r.left - box.left) / w));
      dd.style.setProperty('--dd-to', gradAt((r.right - box.left) / w));
    }
  };

  // Services dropdown: close it once a treatment is picked, until the pointer leaves the menu
  const dropdown = document.querySelector('.nav__dropdown');
  if (dropdown) {
    dropdown.querySelectorAll('.nav__menu a').forEach((a) => a.addEventListener('click', () => {
      dropdown.classList.add('is-closed');
      a.blur();
    }));
    dropdown.addEventListener('mouseleave', () => dropdown.classList.remove('is-closed'));
  }
  sizeUnderlines();
  window.addEventListener('resize', sizeUnderlines);
  if (document.fonts) document.fonts.ready.then(sizeUnderlines);
  const sections = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const navIo = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((a) => {
          const on = a.getAttribute('href') === `#${entry.target.id}`;
          a.classList.toggle('is-active', on);
          if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => navIo.observe(s));
  }

  /* ---------- Marquee pause control ---------- */
  const marquee = document.querySelector('.marquee');
  const pauseBtn = document.querySelector('.marquee__pause');
  pauseBtn.addEventListener('click', () => {
    const paused = marquee.classList.toggle('is-paused');
    pauseBtn.setAttribute('aria-pressed', String(paused));
    pauseBtn.setAttribute('aria-label', paused ? 'Play scrolling text' : 'Pause scrolling text');
    pauseBtn.innerHTML = paused
      ? '<svg viewBox="0 0 24 24" class="icon" aria-hidden="true"><path d="M7 4.5v15l12-7.5Z"/></svg>'
      : '<svg viewBox="0 0 24 24" class="icon" aria-hidden="true"><path d="M9 5v14M15 5v14"/></svg>';
  });

  /* ---------- Reviews: "Read more" on reviews longer than six lines ---------- */
  const setupReadMore = () => {
    document.querySelectorAll('.review').forEach((card) => {
      const p = card.querySelector('blockquote p');
      let btn = card.querySelector('.review__more');
      if (card.classList.contains('is-expanded')) return;
      const clipped = p.scrollHeight > p.clientHeight + 2;
      if (clipped && !btn) {
        btn = document.createElement('button');
        btn.type = 'button'; btn.className = 'review__more';
        btn.textContent = 'Read more'; btn.setAttribute('aria-expanded', 'false');
        btn.addEventListener('click', () => {
          const open = card.classList.toggle('is-expanded');
          btn.textContent = open ? 'Show less' : 'Read more';
          btn.setAttribute('aria-expanded', String(open));
        });
        card.querySelector('blockquote').append(btn);
      } else if (!clipped && btn) {
        btn.remove();
      }
    });
  };
  setupReadMore();
  if (document.fonts) document.fonts.ready.then(setupReadMore);
  let rmT; window.addEventListener('resize', () => { clearTimeout(rmT); rmT = setTimeout(setupReadMore, 200); });

  /* ---------- Reviews: two carousels, each with its own arrows either side ---------- */
  document.querySelectorAll('.reviews__carousel').forEach((carousel) => {
    const track = carousel.querySelector('.reviews__track');
    const prev = carousel.querySelector('.reviews__arrow--prev');
    const next = carousel.querySelector('.reviews__arrow--next');
    const update = () => {
      const max = track.scrollWidth - track.clientWidth - 2;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= max;
      prev.hidden = next.hidden = max <= 0;   // everything fits: no arrows needed
    };
    [prev, next].forEach((btn) => btn.addEventListener('click', () => {
      const card = track.querySelector('.review');
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const step = card ? card.getBoundingClientRect().width + gap : track.clientWidth;
      track.scrollBy({ left: step * Number(btn.dataset.dir), behavior: reduceMotion ? 'auto' : 'smooth' });
    }));
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  });

  /* ---------- About Me ripples: only animate while on screen ---------- */
  const ripples = document.querySelector('.ripples');
  if (ripples && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => ripples.classList.toggle('is-paused', !e.isIntersecting)).observe(ripples);
  }

  /* ---------- Opening hours: highlight today ---------- */
  const today = new Date().getDay();
  const row = document.querySelector(`.hours__list [data-day="${today}"]`);
  if (row) row.classList.add('is-today');

  /* ---------- Sticky mobile CTA: after hero, hidden at contact ---------- */
  const sticky = document.querySelector('.sticky-cta');
  const hero = document.querySelector('.hero');
  const contact = document.getElementById('contact');
  if ('IntersectionObserver' in window) {
    let heroVisible = true, contactVisible = false;
    const update = () => sticky.classList.toggle('is-visible', !heroVisible && !contactVisible);
    new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; update(); }, { threshold: 0.15 }).observe(hero);
    new IntersectionObserver(([e]) => { contactVisible = e.isIntersecting; update(); }, { threshold: 0.05 }).observe(contact);
  }

  /* ---------- Footer year ---------- */
  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---------- Hero: flowing line-mesh (echoes the brand wave artwork) ---------- */
  const canvas = document.querySelector('.hero__waves');
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, dpr = 1, raf = 0, running = false, t = 0;

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  };

  const STRANDS = 34;
  function draw() {
    ctx.clearRect(0, 0, w, h);
    const grey = 'rgba(190, 200, 205, 0.16)';
    const brand = ctx.createLinearGradient(0, 0, w, 0);
    brand.addColorStop(0, 'rgba(84, 249, 129, 0.75)');
    brand.addColorStop(0.55, 'rgba(32, 231, 230, 0.75)');
    brand.addColorStop(1, 'rgba(17, 148, 255, 0.75)');

    const baseY = h * (w < 768 ? 0.36 : 0.42);
    const amp = Math.min(h * 0.2, 180);
    const spread = Math.min(h * 0.22, 200);
    const k = (Math.PI * 2) / Math.max(w * 1.1, 700);
    const step = Math.max(6, w / 140);

    for (let i = 0; i < STRANDS; i++) {
      const s = i / (STRANDS - 1);
      const highlight = i === 11 || i === 23;
      ctx.beginPath();
      for (let x = -20; x <= w + 20; x += step) {
        // two interfering waves twist the bundle like a ribbon
        const twist = Math.cos(x * k * 0.8 - t * 0.6 + 1.2);
        const y = baseY
          + Math.sin(x * k + t + s * 1.4) * amp
          + (s - 0.5) * spread * twist;
        if (x === -20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.lineWidth = highlight ? 1.4 : 1;
      ctx.strokeStyle = highlight ? brand : grey;
      ctx.stroke();
    }
  }

  const loop = () => {
    t += 0.0035;
    draw();
    raf = requestAnimationFrame(loop);
  };
  const start = () => { if (!running && !reduceMotion) { running = true; raf = requestAnimationFrame(loop); } };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  resize();
  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 150); });

  if (!reduceMotion) {
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop())).observe(hero);
    } else start();
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  }
})();

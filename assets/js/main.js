/* ============================================================
   ALATA — main.js
   Shared behaviours for all pages. Defensive, no inline styles.
   ============================================================ */

(() => {
  'use strict';

  /* ---------- Helpers ---------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const hasLib = (name) => typeof window[name] !== 'undefined';
  const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isFinePointer = () => window.matchMedia('(pointer: fine)').matches;
  const isInternalLink = (el) => el.tagName === 'A' && el.origin === location.origin && el.pathname.endsWith('.html') && !el.hash;

  /* ---------- Reduced motion guard ---------- */
  const REDUCED = prefersReduced();

  /* ---------- Lenis + ScrollTrigger ---------- */
  let lenis = null;
  if (!REDUCED && hasLib('Lenis')) {
    try {
      lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smooth: true, smoothTouch: false });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } catch (e) { console.warn('Lenis init failed', e); lenis = null; }
  }

  /* ---------- ScrollTrigger setup ---------- */
  if (hasLib('gsap') && hasLib('ScrollTrigger')) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.defaults({ markers: false });
  }

  /* ---------- Reveal on scroll ---------- */
  function initReveal() {
    if (!hasLib('gsap') || !hasLib('ScrollTrigger') || REDUCED) {
      $$('[data-reveal]').forEach(el => el.style.opacity = 1);
      return;
    }
    $$('[data-reveal]').forEach(el => {
      gsap.fromTo(el, { opacity: 0, y: 30 }, {
        opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true }
      });
    });
  }

  /* ---------- Split text (words) ---------- */
  function initSplit() {
    if (!hasLib('gsap') || REDUCED) return;
    $$('[data-split]').forEach(el => {
      const text = el.textContent.trim();
      if (!text) return;
      const words = text.split(/\s+/).map(w => `<span class="split-word" style="display:inline-block;opacity:0;transform:translateY(1.2em);">${w}</span>`).join(' ');
      el.innerHTML = words;
      gsap.to(el.querySelectorAll('.split-word'), {
        opacity: 1, y: 0, duration: 0.7, stagger: 0.04, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true }
      });
    });
  }

  /* ---------- Counters ---------- */
  function initCounters() {
    if (!hasLib('gsap') || REDUCED) {
      $$('.stat-num[data-count]').forEach(el => { el.textContent = (el.dataset.prefix || '') + el.dataset.count + (el.dataset.suffix || ''); });
      return;
    }
    $$('.stat-num[data-count]').forEach(el => {
      const target = parseFloat(el.dataset.count);
      const prefix = el.dataset.prefix || '';
      const suffix = el.dataset.suffix || '';
      const obj = { val: 0 };
      gsap.to(obj, {
        val: target, duration: 1.8, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        onUpdate: () => { el.textContent = prefix + Math.round(obj.val).toLocaleString() + suffix; }
      });
    });
  }

  /* ---------- Marquee ---------- */
  function initMarquee() {
    if (!hasLib('gsap') || REDUCED) return;
    $$('.marquee').forEach(marquee => {
      const track = marquee.querySelector('.marquee-track');
      if (!track) return;
      track.dataset.original = track.innerHTML;
      track.innerHTML += track.innerHTML;
      const width = track.scrollWidth / 2;
      gsap.to(track, { x: -width, duration: 20, ease: 'none', repeat: -1 });
      marquee.addEventListener('mouseenter', () => gsap.to(track, { timeScale: 0.2, duration: 0.3 }));
      marquee.addEventListener('mouseleave', () => gsap.to(track, { timeScale: 1, duration: 0.3 }));
    });
  }

  /* ---------- 3D Tilt ---------- */
  function initTilt() {
    if (!isFinePointer() || REDUCED) return;
    $$('[data-tilt]').forEach(card => {
      let rect, centerX, centerY;
      const updateRect = () => { rect = card.getBoundingClientRect(); centerX = rect.left + rect.width / 2; centerY = rect.top + rect.height / 2; };
      updateRect();
      window.addEventListener('resize', updateRect);
      card.addEventListener('mousemove', e => {
        const dx = (e.clientX - centerX) / (rect.width / 2);
        const dy = (e.clientY - centerY) / (rect.height / 2);
        const rx = (-dy * 6).toFixed(2);
        const ry = (dx * 6).toFixed(2);
        card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.02,1.02,1.02)`;
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  /* ---------- Custom Cursor ---------- */
  function initCursor() {
    if (!isFinePointer() || REDUCED) return;
    const dot = $('.cursor-dot'), ring = $('.cursor-ring');
    if (!dot || !ring) return;
    document.body.classList.add('has-cursor');
    let mx = 0, my = 0, rx = 0, ry = 0;
    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
    const tick = () => {
      rx += (mx - rx) * 0.25;
      ry += (my - ry) * 0.25;
      dot.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
      ring.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
      requestAnimationFrame(tick);
    };
    tick();
    $$('a, button, [data-tilt], .btn, .card, .role-card, .platform-card, .market-card').forEach(el => {
      el.addEventListener('mouseenter', () => { dot.style.transform += ' scale(2)'; ring.style.width = ring.style.height = '60px'; });
      el.addEventListener('mouseleave', () => { dot.style.transform = dot.style.transform.replace(' scale(2)', ''); ring.style.width = ring.style.height = '40px'; });
    });
  }

  /* ---------- Parallax layers ---------- */
  function initParallax() {
    if (!hasLib('gsap') || !hasLib('ScrollTrigger') || REDUCED) return;
    $$('.parallax-layer[data-speed]').forEach(layer => {
      const speed = parseFloat(layer.dataset.speed) || 0.2;
      gsap.to(layer, { yPercent: -100 * speed, ease: 'none', scrollTrigger: { trigger: layer, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }

  /* ---------- Page Transitions ---------- */
  function initPageTransitions() {
    if (REDUCED) return;
    const overlay = $('.page-transition');
    if (!overlay) return;
    // Animate out on load
    gsap.set(overlay, { scaleY: 1, transformOrigin: 'top center' });
    gsap.to(overlay, { scaleY: 0, duration: 0.7, ease: 'power3.inOut', transformOrigin: 'bottom center' });
    // Click handling
    document.addEventListener('click', e => {
      const link = e.target.closest('a');
      if (!link || !isInternalLink(link)) return;
      e.preventDefault();
      const href = link.href;
      gsap.to(overlay, { scaleY: 1, duration: 0.5, ease: 'power3.inOut', transformOrigin: 'top center', onComplete: () => location.href = href });
    });
  }

  /* ---------- Header behaviours ---------- */
  function initHeader() {
    const header = $('.site-header');
    const toggle = $('.nav-toggle');
    const megaTrigger = $('.has-mega > a');
    const megaPanel = $('.mega');

    // Scroll state
    if (header) {
      const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
      if (lenis) lenis.on('scroll', onScroll); else window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    // Mobile nav toggle
    if (toggle) {
      toggle.addEventListener('click', () => {
        const open = document.body.classList.toggle('nav-open');
        toggle.setAttribute('aria-expanded', open);
      });
    }

    // Mega menu: hover/focus desktop, accordion mobile
    if (megaTrigger && megaPanel) {
      const parent = megaTrigger.parentElement;
      const isMobile = () => window.matchMedia('(max-width: 900px)').matches;
      let hoverTimer;
      megaTrigger.addEventListener('mouseenter', () => { if (!isMobile()) parent.classList.add('open'); });
      megaTrigger.addEventListener('focus', () => { if (!isMobile()) parent.classList.add('open'); });
      parent.addEventListener('mouseleave', () => { if (!isMobile()) parent.classList.remove('open'); });
      megaTrigger.addEventListener('click', e => { if (isMobile()) { e.preventDefault(); parent.classList.toggle('open'); } });
      // Close on outside click
      document.addEventListener('click', e => { if (!parent.contains(e.target)) parent.classList.remove('open'); });
    }
  }

  /* ---------- FAQ smooth ---------- */
  function initFAQ() {
    $$('.faq-item').forEach(details => {
      const summary = details.querySelector('summary');
      const content = details.querySelector('p');
      if (!summary || !content) return;
      summary.addEventListener('click', e => {
        if (details.open) return; // let browser close
        e.preventDefault();
        details.open = true;
        gsap.fromTo(content, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: 0.4, ease: 'power2.out' });
      });
      // Close animation
      const close = () => {
        if (!details.open) return;
        gsap.to(content, { height: 0, opacity: 0, duration: 0.3, ease: 'power2.in', onComplete: () => details.open = false });
      };
      summary.addEventListener('click', e => { if (details.open) { e.preventDefault(); close(); } });
    });
  }

  /* ---------- Filter bar ---------- */
  function initFilter() {
    const buttons = $$('.filter-btn[data-filter]');
    const cards = $$('.article-card[data-category]');
    if (!buttons.length || !cards.length) return;
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        cards.forEach(card => {
          const cat = card.dataset.category;
          const show = filter === 'all' || cat === filter;
          card.style.display = show ? '' : 'none';
          card.setAttribute('aria-hidden', !show);
        });
      });
    });
  }

  /* ---------- Contact form (mailto) ---------- */
  function initContactForm() {
    const form = $('.contact-form');
    if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(form);
      const subject = encodeURIComponent(fd.get('subject') || 'Inquiry');
      const body = encodeURIComponent([
        `Name: ${fd.get('name')}`,
        `Email: ${fd.get('email')}`,
        `Company: ${fd.get('company')}`,
        `Role: ${fd.get('role')}`,
        `Message: ${fd.get('message')}`
      ].join('\n'));
      location.href = `mailto:hello@alata.example?subject=${subject}&body=${body}`;
      // Show success toast
      const msg = document.createElement('div');
      msg.className = 'toast';
      msg.textContent = 'Opening your email client…';
      msg.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#0c0d10;border:1px solid rgba(255,255,255,.08);padding:16px 24px;border-radius:8px;color:#f4f5f7;z-index:9999;font-family:Inter,sans-serif;font-size:14px;box-shadow:0 20px 40px rgba(0,0,0,.5)';
      document.body.appendChild(msg);
      setTimeout(() => msg.remove(), 4000);
    });
  }

  /* ---------- Three.js Globe ---------- */
  function initGlobe() {
    if (REDUCED || !hasLib('THREE')) return;
    const canvas = $('#globe');
    if (!canvas) return;
    try {
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      camera.position.z = 2.2;

      // Sizing
      function resize() {
        const w = canvas.clientWidth, h = canvas.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }
      new ResizeObserver(resize).observe(canvas);
      resize();

      // Particles on sphere
      const PARTICLES = 6000;
      const geom = new THREE.BufferGeometry();
      const pos = new Float32Array(PARTICLES * 3);
      const col = new Float32Array(PARTICLES * 3);
      const SIZE = new Float32Array(PARTICLES);
      for (let i = 0; i < PARTICLES; i++) {
        const u = Math.random(), v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        const r = 1 + (Math.random() - 0.5) * 0.02;
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);
        pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
        const intensity = 0.4 + Math.random() * 0.6;
        col[i * 3] = intensity; col[i * 3 + 1] = intensity; col[i * 3 + 2] = intensity;
        SIZE[i] = 0.8 + Math.random() * 1.2;
      }
      geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geom.setAttribute('color', new THREE.BufferAttribute(col, 3));
      geom.setAttribute('aSize', new THREE.BufferAttribute(SIZE, 1));
      const particleMat = new THREE.PointsMaterial({ size: 0.006, vertexColors: true, transparent: true, opacity: 0.6, sizeAttenuation: true });
      const particles = new THREE.Points(geom, particleMat);
      scene.add(particles);

      // Lat/long rings
      const ringGeom = new THREE.BufferGeometry();
      const ringPos = [];
      for (let lat = -60; lat <= 60; lat += 30) {
        const phi = (90 - lat) * Math.PI / 180;
        for (let i = 0; i <= 64; i++) {
          const theta = (i / 64) * Math.PI * 2;
          ringPos.push(Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta));
        }
      }
      for (let lon = 0; lon < 360; lon += 30) {
        const theta = lon * Math.PI / 180;
        for (let i = 0; i <= 64; i++) {
          const phi = (i / 64) * Math.PI;
          ringPos.push(Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta));
        }
      }
      ringGeom.setAttribute('position', new THREE.Float32BufferAttribute(ringPos, 3));
      const ringMat = new THREE.LineBasicMaterial({ color: 0x7fd4ff, transparent: true, opacity: 0.08 });
      const rings = new THREE.LineSegments(ringGeom, ringMat);
      rings.scale.setScalar(1.02);
      scene.add(rings);

      // Arcs + pulses
      const singapore = { lat: 1.35, lng: 103.82 };
      const cities = [
        { name: 'Kuala Lumpur', lat: 3.14, lng: 101.69 },
        { name: 'Manila', lat: 14.60, lng: 120.98 },
        { name: 'Bangkok', lat: 13.75, lng: 100.50 },
        { name: 'Ho Chi Minh City', lat: 10.78, lng: 106.70 },
        { name: 'Jakarta', lat: -6.21, lng: 106.85 }
      ];
      function latLngToVec3(lat, lng, r = 1) {
        const phi = (90 - lat) * Math.PI / 180;
        const theta = (lng + 180) * Math.PI / 180;
        return new THREE.Vector3(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
      }
      const sgVec = latLngToVec3(singapore.lat, singapore.lng);
      const arcGroup = new THREE.Group();
      const pulseGroup = new THREE.Group();
      cities.forEach(city => {
        const cityVec = latLngToVec3(city.lat, city.lng);
        const mid = sgVec.clone().lerp(cityVec, 0.5).normalize().multiplyScalar(1.18);
        const curve = new THREE.QuadraticBezierCurve3(sgVec.clone().multiplyScalar(1.01), mid, cityVec.clone().multiplyScalar(1.01));
        const points = curve.getPoints(32);
        const arcGeom = new THREE.BufferGeometry().setFromPoints(points);
        const arcMat = new THREE.LineBasicMaterial({ color: 0x7fd4ff, transparent: true, opacity: 0.25 });
        arcGroup.add(new THREE.Line(arcGeom, arcMat));
        // Pulse data stored on curve
        curve.userData = { progress: Math.random(), speed: 0.15 + Math.random() * 0.15 };
        // Pulse mesh
        const pulseGeom = new THREE.SphereGeometry(0.018, 8, 8);
        const pulseMat = new THREE.MeshBasicMaterial({ color: 0x7fd4ff, transparent: true, opacity: 0 });
        const pulse = new THREE.Mesh(pulseGeom, pulseMat);
        pulse.userData.curve = curve;
        pulseGroup.add(pulse);
      });
      scene.add(arcGroup);
      scene.add(pulseGroup);

      // Mouse parallax
      let mx = 0, my = 0;
      document.addEventListener('mousemove', e => { mx = (e.clientX / window.innerWidth - 0.5) * 0.15; my = (e.clientY / window.innerHeight - 0.5) * 0.15; });

      // Visibility
      let visible = true;
      const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; }, { rootMargin: '100px' });
      observer.observe(canvas);

      // Animation loop
      function animate() {
        requestAnimationFrame(animate);
        if (!visible) return;
        // Slow rotation
        particles.rotation.y += 0.00015;
        rings.rotation.y += 0.00015;
        arcGroup.rotation.y += 0.00015;
        pulseGroup.rotation.y += 0.00015;
        // Mouse parallax
        camera.position.x += (mx * 0.3 - camera.position.x) * 0.02;
        camera.position.y += (-my * 0.3 - camera.position.y) * 0.02;
        camera.lookAt(0, 0, 0);
        // Pulses
        pulseGroup.children.forEach(pulse => {
          const curve = pulse.userData.curve;
          curve.userData.progress += 0.001 * curve.userData.speed;
          if (curve.userData.progress > 1) curve.userData.progress = 0;
          const pt = curve.getPoint(curve.userData.progress);
          pulse.position.copy(pt);
          pulse.material.opacity = Math.sin(curve.userData.progress * Math.PI) * 0.9;
          pulse.scale.setScalar(0.5 + Math.sin(curve.userData.progress * Math.PI) * 0.5);
        });
        renderer.render(scene, camera);
      }
      animate();
    } catch (e) { console.warn('Globe init failed', e); }
  }

  /* ---------- Footer year ---------- */
  function setFooterYear() {
    const y = $('#year');
    if (y) y.textContent = new Date().getFullYear();
  }

  /* ---------- Boot ---------- */
  function boot() {
    initReveal();
    initSplit();
    initCounters();
    initMarquee();
    initTilt();
    initCursor();
    initParallax();
    initPageTransitions();
    initHeader();
    initFAQ();
    initFilter();
    initContactForm();
    initGlobe();
    setFooterYear();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

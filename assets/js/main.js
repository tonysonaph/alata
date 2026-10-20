(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var body = doc.body;
  var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var reducedMotion = !!(motionQuery && motionQuery.matches);
  var hasGSAP = typeof window.gsap !== 'undefined';
  var hasScrollTrigger = hasGSAP && typeof window.ScrollTrigger !== 'undefined';
  var hasLenis = typeof window.Lenis !== 'undefined';
  var finePointer = window.matchMedia ? window.matchMedia('(pointer: fine)').matches : false;
  var lenis = null;

  function ready(callback) {
    if (doc.readyState === 'loading') {
      doc.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
      callback();
    }
  }

  function all(selector, context) {
    return Array.prototype.slice.call((context || doc).querySelectorAll(selector));
  }

  function one(selector, context) {
    return (context || doc).querySelector(selector);
  }

  function isVisible(element) {
    if (!element) return false;
    var rect = element.getBoundingClientRect();
    var style = window.getComputedStyle(element);
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.display !== 'none' &&
      style.visibility !== 'hidden'
    );
  }

  function setReducedMotionState() {
    reducedMotion = !!(motionQuery && motionQuery.matches);
    body.classList.toggle('reduced-motion', reducedMotion);
  }

  ready(function () {
    setReducedMotionState();

    if (motionQuery) {
      if (typeof motionQuery.addEventListener === 'function') {
        motionQuery.addEventListener('change', function () {
          setReducedMotionState();
        });
      } else if (typeof motionQuery.addListener === 'function') {
        motionQuery.addListener(function () {
          setReducedMotionState();
        });
      }
    }

    initPageTransition();
    initHeader();
    initSmoothScroll();
    initReveal();
    initSplitHeadings();
    initCounters();
    initMarquee();
    initTilt();
    initCursor();
    initParallax();
    initHeroFloating();
    initFaq();
    initFilters();
    initContactForm();
    initFooterYear();
  });

  function initPageTransition() {
    var transition = one('.page-transition');
    if (!transition || !hasGSAP || reducedMotion) return;

    gsap.set(transition, { autoAlpha: 1 });
    gsap.to(transition, {
      autoAlpha: 0,
      duration: 0.65,
      ease: 'power2.inOut',
      delay: 0.05,
      onComplete: function () {
        transition.setAttribute('aria-hidden', 'true');
      }
    });

    doc.addEventListener('click', function (event) {
      var link = event.target.closest ? event.target.closest('a[href]') : null;
      if (!link) return;

      var href = link.getAttribute('href');
      if (!href || href.charAt(0) === '#' || link.target === '_blank') return;
      if (link.hasAttribute('download') || link.getAttribute('rel') === 'noopener') return;

      var url;
      try {
        url = new URL(link.href, window.location.href);
      } catch (error) {
        return;
      }

      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return;
      if (url.href === window.location.href) return;

      event.preventDefault();

      gsap.killTweensOf(transition);
      gsap.set(transition, { autoAlpha: 1 });
      gsap.to(transition, {
        autoAlpha: 1,
        duration: 0.35,
        ease: 'power2.in',
        onComplete: function () {
          window.location.href = url.href;
        }
      });
    });
  }

  function initHeader() {
    var header = one('.site-header');
    if (!header) return;

    function updateHeader() {
      header.classList.toggle('scrolled', window.scrollY > 40);
    }

    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });

    var toggle = one('.nav-toggle');
    var nav = one('.main-nav');

    if (toggle && nav) {
      toggle.addEventListener('click', function () {
        var open = body.classList.toggle('nav-open');
        toggle.setAttribute('aria-expanded', String(open));
      });

      doc.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && body.classList.contains('nav-open')) {
          body.classList.remove('nav-open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    }

    all('.has-mega').forEach(function (item) {
      var trigger = one('a', item);
      var menu = one('.mega', item);
      if (!trigger || !menu) return;

      function openMenu() {
        if (reducedMotion || !finePointer) return;
        item.classList.add('mega-open');
        menu.setAttribute('aria-hidden', 'false');
      }

      function closeMenu() {
        item.classList.remove('mega-open');
        menu.setAttribute('aria-hidden', 'true');
      }

      item.addEventListener('mouseenter', openMenu);
      item.addEventListener('mouseleave', closeMenu);
      item.addEventListener('focusin', openMenu);
      item.addEventListener('focusout', function (event) {
        if (!item.contains(event.relatedTarget)) closeMenu();
      });

      trigger.addEventListener('click', function (event) {
        if (finePointer && !reducedMotion) {
          event.preventDefault();
          if (item.classList.contains('mega-open')) {
            closeMenu();
          } else {
            openMenu();
          }
        }
      });
    });
  }

  function initSmoothScroll() {
    if (!hasLenis || !hasGSAP || !hasScrollTrigger || reducedMotion) return;

    try {
      lenis = new Lenis({
        duration: 1.15,
        smoothWheel: true,
        touchMultiplier: 1.1,
        wheelMultiplier: 0.9
      });

      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (time) {
        lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);

      all('a[href^="#"]').forEach(function (link) {
        link.addEventListener('click', function (event) {
          var href = link.getAttribute('href');
          if (!href || href === '#') return;

          var target = doc.querySelector(href);
          if (!target) return;

          event.preventDefault();
          lenis.scrollTo(target, {
            offset: -20,
            duration: 1.1
          });
        });
      });
    } catch (error) {
      lenis = null;
    }
  }

  function initReveal() {
    var items = all('[data-reveal]');
    if (!items.length || !hasGSAP || !hasScrollTrigger || reducedMotion) {
      items.forEach(function (item) {
        item.classList.add('is-visible');
      });
      return;
    }

    body.classList.add('has-reveal');
    items.forEach(function (item) {
      item.classList.add('reveal-ready');
      gsap.fromTo(
        item,
        { autoAlpha: 0, y: 28 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: item,
            start: 'top 88%',
            once: true
          }
        }
      );
    });
  }

  function initSplitHeadings() {
    var headings = all('[data-split]');
    if (!headings.length) return;

    headings.forEach(function (heading) {
      var text = heading.textContent.trim();
      if (!text) return;

      heading.setAttribute('aria-label', text);
      heading.textContent = '';

      var words = text.split(/\s+/);
      words.forEach(function (word, index) {
        var wordElement = doc.createElement('span');
        wordElement.className = 'split-word';
        wordElement.setAttribute('aria-hidden', 'true');
        wordElement.textContent = word;

        heading.appendChild(wordElement);
        if (index < words.length - 1) {
          heading.appendChild(doc.createTextNode(' '));
        }
      });

      heading.classList.add('is-split');

      if (!hasGSAP || !hasScrollTrigger || reducedMotion) {
        heading.classList.add('is-visible');
        return;
      }

      var wordsElements = all('.split-word', heading);
      gsap.fromTo(
        wordsElements,
        { autoAlpha: 0, y: 24, rotateX: -8 },
        {
          autoAlpha: 1,
          y: 0,
          rotateX: 0,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.065,
          scrollTrigger: {
            trigger: heading,
            start: 'top 86%',
            once: true
          }
        }
      );
    });
  }

  function initCounters() {
    var counters = all('.stat-num[data-count]');
    if (!counters.length) return;

    function formatValue(value, element) {
      var decimals = String(element.getAttribute('data-count')).indexOf('.') !== -1 ? 1 : 0;
      return Math.round(value).toLocaleString('en-GB') + (decimals ? '.' + decimals : '');
    }

    counters.forEach(function (counter) {
      var target = parseFloat(counter.getAttribute('data-count'));
      if (isNaN(target)) return;

      var prefix = counter.getAttribute('data-prefix') || '';
      var suffix = counter.getAttribute('data-suffix') || '';

      if (!hasGSAP || !hasScrollTrigger || reducedMotion) {
        counter.textContent = prefix + formatValue(target, counter) + suffix;
        return;
      }

      var value = { current: 0 };
      counter.textContent = prefix + '0' + suffix;

      gsap.to(value, {
        current: target,
        duration: 1.7,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: counter,
          start: 'top 90%',
          once: true
        },
        onUpdate: function () {
          counter.textContent = prefix + formatValue(value.current, counter) + suffix;
        },
        onComplete: function () {
          counter.textContent = prefix + formatValue(target, counter) + suffix;
        }
      });
    });
  }

  function initMarquee() {
    var marquees = all('.marquee');
    if (!marquees.length) return;

    marquees.forEach(function (marquee) {
      var track = one('.marquee-track', marquee);
      if (!track) return;

      var original = track.innerHTML;
      track.innerHTML = original + original;

      if (!hasGSAP || reducedMotion) return;

      gsap.to(track, {
        xPercent: -50,
        duration: 24,
        ease: 'none',
        repeat: -1
      });
    });
  }

  function initTilt() {
    if (!finePointer || reducedMotion || !hasGSAP) return;

    all('[data-tilt]').forEach(function (card) {
      var reset;

      card.addEventListener('pointermove', function (event) {
        if (event.pointerType !== 'mouse') return;

        var rect = card.getBoundingClientRect();
        var x = (event.clientX - rect.left) / rect.width - 0.5;
        var y = (event.clientY - rect.top) / rect.height - 0.5;

        gsap.to(card, {
          rotateY: x * 7,
          rotateX: y * -7,
          transformPerspective: 900,
          duration: 0.4,
          ease: 'power2.out',
          overwrite: true
        });
      });

      card.addEventListener('pointerleave', function () {
        gsap.to(card, {
          rotateY: 0,
          rotateX: 0,
          duration: 0.65,
          ease: 'power3.out',
          overwrite: true
        });
      });
    });
  }

  function initCursor() {
    var cursor = one('.cursor');
    if (!cursor || !finePointer || reducedMotion) return;

    var dot = one('.cursor-dot', cursor);
    var ring = one('.cursor-ring', cursor);
    if (!dot || !ring) return;

    body.classList.add('has-cursor');
    cursor.classList.add('is-active');

    var mouseX = window.innerWidth / 2;
    var mouseY = window.innerHeight / 2;
    var dotX = mouseX;
    var dotY = mouseY;
    var ringX = mouseX;
    var ringY = mouseY;

    doc.addEventListener('mousemove', function (event) {
      mouseX = event.clientX;
      mouseY = event.clientY;
      dot.style.transform = 'translate3d(' + mouseX + 'px,' + mouseY + 'px,0)';
    });

    function animateCursor() {
      dotX += (mouseX - dotX) * 0.22;
      dotY += (mouseY - dotY) * 0.22;
      ringX += (mouseX - ringX) * 0.1;
      ringY += (mouseY - ringY) * 0.1;
      ring.style.transform = 'translate3d(' + ringX + 'px,' + ringY + 'px,0)';
      requestAnimationFrame(animateCursor);
    }

    animateCursor();

    all('a, button, input, textarea, select, [data-tilt]').forEach(function (element) {
      element.addEventListener('mouseenter', function () {
        cursor.classList.add('is-hovering');
      });
      element.addEventListener('mouseleave', function () {
        cursor.classList.remove('is-hovering');
      });
    });
  }

  function initParallax() {
    if (!hasGSAP || !hasScrollTrigger || reducedMotion) return;

    all('.parallax-layer[data-speed]').forEach(function (layer) {
      var speed = parseFloat(layer.getAttribute('data-speed')) || 0.2;
      gsap.to(layer, {
        y: function () {
          return speed * 100;
        },
        ease: 'none',
        scrollTrigger: {
          trigger: layer.closest('section') || layer,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });
    });
  }

  function initHeroFloating() {
    var hero = one('.hero');
    if (!hero || !hasGSAP || reducedMotion) return;

    var visual = one('.hero-visual', hero);
    if (!visual) return;

    all('.hero-photo, .chip', visual).forEach(function (element, index) {
      gsap.to(element, {
        y: index % 2 === 0 ? -10 : 12,
        x: index % 3 === 0 ? 4 : -3,
        duration: 2.8 + (index % 4) * 0.35,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        delay: index * 0.12
      });
    });
  }

  function initFaq() {
    all('.faq details.faq-item').forEach(function (item) {
      var summary = one('summary', item);
      if (!summary) return;

      summary.addEventListener('click', function (event) {
        if (reducedMotion) return;

        var group = item.parentElement;
        var wasOpen = item.open;

        all('details', group).forEach(function (other) {
          if (other !== item) other.open = false;
        });

        if (wasOpen) {
          event.preventDefault();
        }
      });
    });
  }

  function initFilters() {
    var filterBar = one('.filter-bar');
    if (!filterBar) return;

    var buttons = all('.filter-btn[data-filter]', filterBar);
    var cards = all('.article-card[data-category]');

    if (!buttons.length || !cards.length) return;

    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        var filter = button.getAttribute('data-filter') || 'all';

        buttons.forEach(function (other) {
          var active = other === button;
          other.classList.toggle('is-active', active);
          other.setAttribute('aria-pressed', String(active));
        });

        cards.forEach(function (card) {
          var category = card.getAttribute('data-category');
          var show = filter === 'all' || category === filter;
          card.hidden = !show;
          card.classList.toggle('is-filtered', !show);

          if (show && hasGSAP && !reducedMotion) {
            gsap.fromTo(
              card,
              { autoAlpha: 0, y: 12 },
              { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out' }
            );
          }
        });
      });
    });
  }

  function initContactForm() {
    all('form.contact-form').forEach(function (form) {
      var success = one('.form-success', form);
      var status = one('.form-status', form);

      form.addEventListener('submit', function (event) {
        event.preventDefault();

        var data = new FormData(form);
        var name = (data.get('name') || '').toString().trim();
        var email = (data.get('email') || '').toString().trim();
        var company = (data.get('company') || '').toString().trim();
        var message = (data.get('message') || '').toString().trim();
        var subject = 'ALATA enquiry' + (company ? ' — ' + company : '');
        var body = [
          'Hello ALATA,',
          '',
          name ? 'Name: ' + name : '',
          email ? 'Email: ' + email : '',
          company ? 'Company: ' + company : '',
          '',
          'Enquiry:',
          message || 'I would like to discuss working with ALATA.',
          '',
          'Sent from the ALATA website'
        ].filter(function (line) {
          return line !== '';
        }).join('\n');

        if (success) {
          success.textContent = 'Your email application is opening. If it does not open, please email hello@alata.example.';
          success.classList.add('is-visible');
          success.setAttribute('role', 'status');
        }

        if (status) {
          status.textContent = 'Opening your email application…';
          status.setAttribute('role', 'status');
        }

        window.location.href =
          'mailto:hello@alata.example?subject=' +
          encodeURIComponent(subject) +
          '&body=' +
          encodeURIComponent(body);
      });
    });
  }

  function initFooterYear() {
    all('[data-current-year]').forEach(function (element) {
      element.textContent = String(new Date().getFullYear());
    });
  }
})();

/*! KAN Logistics website | Designed & developed by Mohammed Abdelrazek */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

const root = document.documentElement;
root.classList.add('js');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

gsap.registerPlugin(ScrollTrigger);

// Smooth scroll (skipped for reduced motion)
let lenis = null;
if (!reduceMotion) {
  const rem = parseFloat(getComputedStyle(root).fontSize);
  lenis = new Lenis({ lerp: 0.1, anchors: { offset: -6 * rem } });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

// Header: solid capsule after scrolling, hidden while scrolling down
const header = document.querySelector('[data-header]');
if (header) {
  let lastY = window.scrollY;
  const update = () => {
    const y = window.scrollY;
    header.classList.toggle('is-floating', y > 40);
    const goingDown = y > lastY + 4;
    const goingUp = y < lastY - 4;
    if (!root.classList.contains('nav-open')) {
      if (goingDown && y > 400) header.classList.add('is-hidden');
      else if (goingUp || y < 400) header.classList.remove('is-hidden');
    }
    lastY = y;
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
  header.addEventListener('focusin', () => header.classList.remove('is-hidden'));
}

// Mobile navigation
const toggle = document.querySelector('[data-menu-toggle]');
const nav = document.getElementById('site-nav');
if (toggle && nav) {
  const desktop = window.matchMedia('(min-width: 1024px)');
  const main = document.getElementById('main');
  const footer = document.querySelector('.ftr');

  const setOpen = (open, { restoreFocus = false } = {}) => {
    toggle.setAttribute('aria-expanded', String(open));
    root.classList.toggle('nav-open', open);
    for (const el of [main, footer]) el?.toggleAttribute('inert', open);
    if (open) {
      lenis?.stop();
      nav.querySelector('a')?.focus();
    } else {
      lenis?.start();
      if (restoreFocus) toggle.focus();
    }
  };

  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => {
    if (e.target.closest('a')) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && root.classList.contains('nav-open')) setOpen(false, { restoreFocus: true });
  });
  desktop.addEventListener('change', (e) => {
    if (e.matches) setOpen(false);
  });
}

// Background videos: pause button, only play while on screen

// smaller encode for phones and data saver
const pickSource = (video) => {
  const saveData = navigator.connection?.saveData;
  return saveData || window.innerWidth < 768 ? video.dataset.srcSmall : video.dataset.srcLarge;
};

document.querySelectorAll('[data-media]').forEach((scope) => {
  const video = scope.querySelector('[data-video]');
  const button = scope.querySelector('[data-media-toggle]');
  if (!video || !button) return;

  const noun = button.getAttribute('aria-label').replace(/^Pause /, '');
  let userPaused = reduceMotion;
  let visible = !video.hasAttribute('data-inview');

  const sync = () => {
    const shouldPlay = !userPaused && visible && !document.hidden;
    if (shouldPlay) {
      if (!video.src) video.src = pickSource(video);
      video.play().catch(() => {});
    } else {
      video.pause();
    }
    scope.classList.toggle('is-paused', userPaused);
    button.setAttribute('aria-label', `${userPaused ? 'Play' : 'Pause'} ${noun}`);
  };

  button.addEventListener('click', () => {
    userPaused = !userPaused;
    sync();
  });
  document.addEventListener('visibilitychange', sync);

  if (video.hasAttribute('data-inview')) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    }, { rootMargin: '200px' }).observe(scope);
  }

  // start after load so the video doesn't slow down the first paint
  if (document.readyState === 'complete') sync();
  else window.addEventListener('load', sync, { once: true });
});

// Hero: video shrinks into a rounded frame on scroll
const heroStage = document.querySelector('[data-hero-stage]');
if (heroStage && !reduceMotion) {
  gsap.to(heroStage, {
    scale: 0.9,
    borderRadius: 40,
    ease: 'none',
    scrollTrigger: { trigger: '[data-hero]', start: 'top top', end: 'bottom top', scrub: true },
  });
  gsap.to('.hero__inner', {
    yPercent: -12,
    opacity: 0,
    ease: 'none',
    scrollTrigger: { trigger: '[data-hero]', start: '30% top', end: 'bottom top', scrub: true },
  });
}

// Statement: highlight words on scroll
document.querySelectorAll('[data-words]').forEach((el) => {
  if (reduceMotion) return;
  const words = el.textContent.trim().split(/\s+/);
  el.textContent = '';
  for (const [i, word] of words.entries()) {
    const span = document.createElement('span');
    span.className = 'w';
    span.textContent = word;
    el.append(span, i < words.length - 1 ? ' ' : '');
  }
  gsap.fromTo(
    el.querySelectorAll('.w'),
    { opacity: 0.2 },
    {
      opacity: 1,
      stagger: 0.08,
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true },
    },
  );
});

// Home services: pinned horizontal scroll
const hs = document.querySelector('[data-hs]');
if (hs) {
  const pin = hs.querySelector('[data-hs-pin]');
  const track = hs.querySelector('[data-hs-track]');
  const bar = hs.querySelector('[data-hs-progress]');
  const mm = gsap.matchMedia();

  mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
    hs.classList.add('is-pinned');
    const distance = () => track.scrollWidth - window.innerWidth;
    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: pin,
        pin: true,
        start: 'top top',
        end: () => `+=${distance()}`,
        scrub: 0.8,
        invalidateOnRefresh: true,
        onUpdate: (self) => gsap.set(bar, { scaleX: self.progress }),
      },
    });

    // keyboard users: bring the focused card into view
    const onFocus = (e) => {
      const card = e.target.closest('.hs__card');
      if (!card) return;
      const st = tween.scrollTrigger;
      const ratio = Math.min(1, Math.max(0, (card.offsetLeft - 80) / distance()));
      window.scrollTo(0, st.start + ratio * (st.end - st.start));
    };
    track.addEventListener('focusin', onFocus);

    return () => {
      hs.classList.remove('is-pinned');
      track.removeEventListener('focusin', onFocus);
    };
  });

  track.addEventListener(
    'scroll',
    () => {
      if (hs.classList.contains('is-pinned')) return;
      const max = track.scrollWidth - track.clientWidth;
      gsap.set(bar, { scaleX: max > 0 ? track.scrollLeft / max : 0 });
    },
    { passive: true },
  );
}

// Page hero image scale-in
document.querySelectorAll('[data-grow]').forEach((el) => {
  if (reduceMotion) return;
  gsap.fromTo(
    el,
    { scale: 0.88, borderRadius: 64 },
    { scale: 1, borderRadius: 28, ease: 'none', scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 25%', scrub: true } },
  );
  const img = el.querySelector('img');
  if (img) {
    gsap.fromTo(img, { yPercent: -8 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
  }
});

// Services page: sync sticky image with the active section
const chapters = [...document.querySelectorAll('[data-chapter]')];
if (chapters.length) {
  const visuals = [...document.querySelectorAll('[data-visual] img')];
  const num = document.querySelector('[data-visual-num]');
  const links = [...document.querySelectorAll('[data-svc-nav] a')];
  const activate = (i) => {
    visuals.forEach((img, j) => img.classList.toggle('is-active', j === i));
    links.forEach((a, j) => a.classList.toggle('is-current', j === i));
    if (num) num.textContent = String(i + 1).padStart(2, '0');
    const link = links[i];
    if (link) {
      const list = link.closest('ol');
      list.scrollTo({ left: link.parentElement.offsetLeft - 16, behavior: 'smooth' });
    }
  };
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) activate(chapters.indexOf(entry.target));
      }
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  chapters.forEach((c) => observer.observe(c));
}

// Globe (lazy loaded)
const globeEl = document.querySelector('[data-globe]');
if (globeEl) {
  const io = new IntersectionObserver(
    async ([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const { mountGlobe } = await import('./globe.js');
      mountGlobe(globeEl, { reduceMotion });
    },
    { rootMargin: '300px' },
  );
  io.observe(globeEl);
}

// Magnetic button
if (finePointer && !reduceMotion) {
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.25, y: (e.clientY - r.top - r.height / 2) * 0.25, duration: 0.6, ease: 'power3.out' });
    });
    el.addEventListener('pointerleave', () => gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.4)' }));
  });
}

// Reveal on scroll
const revealables = document.querySelectorAll('[data-reveal]');
if (!reduceMotion && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  revealables.forEach((el) => observer.observe(el));
} else {
  revealables.forEach((el) => el.classList.add('is-visible'));
}

// late images change the page height, recalc pin positions
window.addEventListener('load', () => ScrollTrigger.refresh());

/* ============================================================
   NORDHAUS — интерактив лендинга
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 1. Хедер: фон при скролле ---------- */
  const header = document.getElementById('header');
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 60);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- 2. Мобильное меню ---------- */
  const burger = document.getElementById('burger');
  const nav = document.querySelector('.nav');
  if (burger && nav) {
    burger.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
    });
    nav.querySelectorAll('.nav__link').forEach((link) =>
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      })
    );
  }

  /* ---------- 3. Reveal-анимации при скролле ---------- */
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('in'));
  }

  /* ---------- 4. Счётчики в блоке статистики ---------- */
  const counters = document.querySelectorAll('[data-count]');
  const animateCount = (el) => {
    const target = parseInt(el.dataset.count, 10);
    const duration = 1400;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.textContent = Math.round(eased * target);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window && counters.length) {
    const co = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((el) => co.observe(el));
  }

  /* ---------- 5. Лёгкий параллакс на hero ---------- */
  const heroImg = document.getElementById('heroImg');
  if (heroImg && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.addEventListener(
      'scroll',
      () => {
        const y = window.scrollY;
        if (y < window.innerHeight) {
          heroImg.style.transform = `translateY(${y * 0.18}px) scale(1.05)`;
        }
      },
      { passive: true }
    );
  }

  /* ---------- 6. Маска телефона ---------- */
  const phone = document.querySelector('input[name="phone"]');
  if (phone) {
    phone.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.startsWith('8')) v = '7' + v.slice(1);
      if (v.startsWith('9')) v = '7' + v;
      v = v.slice(0, 11);
      let out = '+7';
      if (v.length > 1) out += ' (' + v.slice(1, 4);
      if (v.length >= 4) out += ') ' + v.slice(4, 7);
      if (v.length >= 7) out += '-' + v.slice(7, 9);
      if (v.length >= 9) out += '-' + v.slice(9, 11);
      e.target.value = out;
    });
  }

  /* ---------- 7. Валидация и отправка формы ---------- */
  const form = document.getElementById('leadForm');
  const success = document.getElementById('formSuccess');

  const setError = (field, message) => {
    const wrap = field.closest('.field');
    const errEl = wrap.querySelector('[data-error]');
    wrap.classList.toggle('invalid', Boolean(message));
    if (errEl) errEl.textContent = message || '';
  };

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;

      const name = form.elements['name'];
      const tel = form.elements['phone'];

      if (!name.value.trim()) {
        setError(name, 'Введите имя');
        valid = false;
      } else {
        setError(name, '');
      }

      const digits = tel.value.replace(/\D/g, '');
      if (digits.length < 11) {
        setError(tel, 'Введите корректный телефон');
        valid = false;
      } else {
        setError(tel, '');
      }

      if (!valid) return;

      // Здесь будет реальная отправка (fetch на бэкенд / интеграция CRM).
      // Пока — имитация успешной заявки.
      const btn = form.querySelector('button[type="submit"]');
      const original = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Отправляем…';

      setTimeout(() => {
        form
          .querySelectorAll('.field__input')
          .forEach((i) => (i.value = ''));
        btn.disabled = false;
        btn.textContent = original;
        if (success) {
          success.hidden = false;
          success.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 900);
    });

    // Убираем ошибку при вводе
    form.querySelectorAll('.field__input').forEach((input) => {
      input.addEventListener('input', () => setError(input, ''));
    });
  }

  /* ---------- 8. Типографика: убираем висячие предлоги ---------- */
  // Короткие слова (1–2 буквы) и частые предлоги/союзы приклеиваем
  // к следующему слову неразрывным пробелом, чтобы они не висели в конце строки.
  const noOrphans = (text) =>
    text
      .replace(/(^|[\s(«„"—–-])([а-яёa-z]{1,2})\s+/gi, '$1$2 ')
      .replace(
        /(^|[\s(«„"—–-])(для|под|над|при|без|про|или|что|как|это|так|изо|обо)\s+/gi,
        '$1$2 '
      );

  // Заголовки с ручными переносами не трогаем
  const skipSelector =
    '.hero__title, .section__title, .included__title, .lead__title,' +
    '.card__name, .step__title, .feature__title, .footer__title,' +
    '.faq__item summary, script, style, code, input, textarea';

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) {
    const parent = node.parentElement;
    if (!parent || !node.nodeValue.trim()) continue;
    if (parent.closest(skipSelector)) continue;
    textNodes.push(node);
  }
  textNodes.forEach((n) => {
    const fixed = noOrphans(n.nodeValue);
    if (fixed !== n.nodeValue) n.nodeValue = fixed;
  });

  /* ---------- 9. Год в подвале (если потребуется) ---------- */
  // document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
})();

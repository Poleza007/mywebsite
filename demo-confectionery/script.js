/* ============================================================
   Вензель — интерактив. Чистый JS, без зависимостей.
   ============================================================ */
(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -------------------- Типографика: убираем висячие предлоги -------------------- */
  // Короткие слова «приклеиваем» к следующему неразрывным пробелом,
  // чтобы предлоги и союзы не оставались в конце строки на узких экранах.
  var NB = String.fromCharCode(160); // неразрывный пробел
  var SHORT_WORDS = ('в во на за по из к ко с со о об от до у и а но да же ли бы не ни ' +
                     'для под при над про без что как так то или если уже ещё все вся').split(' ');
  var shortWordsRe = new RegExp('(^|[\\s(«"])(' + SHORT_WORDS.join('|') + ')\\s+', 'gi');

  function fixWidows(text) {
    var out = text;
    out = out.replace(shortWordsRe, '$1$2' + NB);
    out = out.replace(shortWordsRe, '$1$2' + NB);
    out = out.replace(/(\d)\s+(?=[\dА-Яа-яЁёA-Za-z₽])/g, '$1' + NB);
    return out;
  }

  function applyTypography(root) {
    var scope = root || document.body;
    var walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        var parent = node.parentNode;
        if (!parent) return NodeFilter.FILTER_REJECT;
        var tag = parent.nodeName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA') return NodeFilter.FILTER_REJECT;
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      var fixed = fixWidows(node.nodeValue);
      if (fixed !== node.nodeValue) node.nodeValue = fixed;
    });
  }

  applyTypography();

  /* -------------------- Хедер: фон при скролле -------------------- */
  var header = document.getElementById('header');
  function onScroll() {
    header.classList.toggle('is-scrolled', window.scrollY > 24);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* -------------------- Мобильное меню -------------------- */
  var burger = document.getElementById('burger');
  var mobileMenu = document.getElementById('mobile-menu');

  function toggleMenu(open) {
    var isOpen = open !== undefined ? open : !mobileMenu.classList.contains('is-open');
    mobileMenu.classList.toggle('is-open', isOpen);
    burger.classList.toggle('is-open', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
    mobileMenu.setAttribute('aria-hidden', String(!isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  burger.addEventListener('click', function () { toggleMenu(); });
  mobileMenu.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function () { toggleMenu(false); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mobileMenu.classList.contains('is-open')) toggleMenu(false);
  });

  /* -------------------- Reveal при появлении -------------------- */
  var revealEls = document.querySelectorAll('.reveal');
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  }

  /* -------------------- Счётчики статистики -------------------- */
  var counters = document.querySelectorAll('.stat__num[data-count]');
  function animateCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var suffix = el.getAttribute('data-suffix') || '';
    if (prefersReducedMotion) { el.innerHTML = target + suffix; return; }
    var duration = 1400, start = null;
    function step(ts) {
      if (start === null) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.innerHTML = Math.round(target * eased) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var countObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { animateCount(entry.target); obs.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { countObserver.observe(el); });
  } else {
    counters.forEach(function (el) { el.innerHTML = el.getAttribute('data-count') + (el.getAttribute('data-suffix') || ''); });
  }

  /* -------------------- FAQ: один открыт за раз -------------------- */
  var faqItems = document.querySelectorAll('.faq__item');
  faqItems.forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (item.open) faqItems.forEach(function (other) { if (other !== item) other.open = false; });
    });
  });

  /* -------------------- Маска телефона -------------------- */
  var phoneInput = document.getElementById('phone');
  function formatPhone(value) {
    var digits = value.replace(/\D/g, '');
    if (digits.length && digits[0] === '8') digits = '7' + digits.slice(1);
    if (digits.length && digits[0] !== '7') digits = '7' + digits;
    digits = digits.slice(0, 11);
    var out = '+7';
    if (digits.length > 1) out += ' (' + digits.slice(1, 4);
    if (digits.length >= 4) out += ') ' + digits.slice(4, 7);
    if (digits.length >= 7) out += '-' + digits.slice(7, 9);
    if (digits.length >= 9) out += '-' + digits.slice(9, 11);
    return out;
  }
  if (phoneInput) {
    phoneInput.addEventListener('input', function () {
      var digits = phoneInput.value.replace(/\D/g, '');
      if (!digits) { phoneInput.value = ''; return; }
      phoneInput.value = formatPhone(phoneInput.value);
    });
  }

  /* -------------------- Валидация и отправка формы -------------------- */
  var form = document.getElementById('order-form');
  var success = document.getElementById('order-success');

  function setError(field, message) {
    var input = form.elements[field];
    var errorEl = form.querySelector('[data-error-for="' + field + '"]');
    if (input) input.classList.toggle('is-invalid', Boolean(message));
    if (errorEl) errorEl.textContent = message || '';
  }
  function validate() {
    var ok = true;
    var name = form.elements['name'];
    var phone = form.elements['phone'];
    if (!name.value.trim()) { setError('name', 'Пожалуйста, укажите имя'); ok = false; } else setError('name', '');
    if (phone.value.replace(/\D/g, '').length < 11) { setError('phone', 'Введите телефон полностью'); ok = false; } else setError('phone', '');
    return ok;
  }
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) return;
      // Демо: реальной отправки нет. Здесь подключается бэкенд,
      // CRM кондитерской или отправка заявки в Telegram-бот.
      var data = {
        name: form.elements['name'].value.trim(),
        phone: form.elements['phone'].value.trim(),
        occasion: form.elements['occasion'].value,
        date: form.elements['date'].value,
        comment: form.elements['comment'].value.trim()
      };
      console.log('Заявка на торт (демо):', data);
      form.querySelectorAll('.field, .field-row, .order__note, button[type="submit"]').forEach(function (el) {
        el.style.display = 'none';
      });
      success.hidden = false;
      success.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
    });
    ['name', 'phone'].forEach(function (name) {
      var input = form.elements[name];
      if (input) input.addEventListener('blur', function () { if (input.value.trim()) setError(name, ''); });
    });
  }

})();

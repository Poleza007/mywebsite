/* ============================================================
   КРОМКА — интерактив. Чистый JS, без зависимостей.
   ============================================================ */
(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -------------------- Хедер: тень при скролле -------------------- */
  var header = document.getElementById('header');
  function onScroll() {
    if (window.scrollY > 24) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
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
    if (e.key === 'Escape' && mobileMenu.classList.contains('is-open')) {
      toggleMenu(false);
    }
  });

  /* -------------------- Reveal при появлении в вьюпорте -------------------- */
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

  /* -------------------- Счётчики в блоке статистики -------------------- */
  var counters = document.querySelectorAll('.stat__num[data-count]');

  function animateCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var suffix = el.getAttribute('data-suffix') || '';
    if (prefersReducedMotion) {
      el.innerHTML = target + suffix;
      return;
    }
    var duration = 1400;
    var start = null;

    function step(ts) {
      if (start === null) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      // ease-out
      var eased = 1 - Math.pow(1 - progress, 3);
      el.innerHTML = Math.round(target * eased) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if ('IntersectionObserver' in window) {
    var countObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { countObserver.observe(el); });
  } else {
    counters.forEach(function (el) {
      el.innerHTML = el.getAttribute('data-count') + (el.getAttribute('data-suffix') || '');
    });
  }

  /* -------------------- FAQ: одновременно открыт один пункт -------------------- */
  var faqItems = document.querySelectorAll('.faq__item');
  faqItems.forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (item.open) {
        faqItems.forEach(function (other) {
          if (other !== item) other.open = false;
        });
      }
    });
  });

  /* -------------------- Маска телефона -------------------- */
  var phoneInput = document.getElementById('phone');

  function formatPhone(value) {
    var digits = value.replace(/\D/g, '');
    // нормализуем ведущую 8 к 7
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
  var form = document.getElementById('booking-form');
  var success = document.getElementById('booking-success');

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

    if (!name.value.trim()) {
      setError('name', 'Пожалуйста, укажите имя');
      ok = false;
    } else {
      setError('name', '');
    }

    var phoneDigits = phone.value.replace(/\D/g, '');
    if (phoneDigits.length < 11) {
      setError('phone', 'Введите телефон полностью');
      ok = false;
    } else {
      setError('phone', '');
    }
    return ok;
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) return;

      // Демо: реальной отправки нет. Здесь подключается YClients,
      // бэкенд или отправка заявки в Telegram-бот.
      var data = {
        name: form.elements['name'].value.trim(),
        phone: form.elements['phone'].value.trim(),
        service: form.elements['service'].value,
        comment: form.elements['comment'].value.trim()
      };
      console.log('Заявка (демо):', data);

      form.querySelectorAll('.field, .booking__note, button[type="submit"]').forEach(function (el) {
        el.style.display = 'none';
      });
      success.hidden = false;
      success.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
    });

    ['name', 'phone'].forEach(function (name) {
      var input = form.elements[name];
      if (input) {
        input.addEventListener('blur', function () {
          if (input.value.trim()) setError(name, '');
        });
      }
    });
  }

  /* -------------------- Типографика: убираем висячие предлоги -------------------- */
  // Короткие слова «приклеиваем» к следующему слову неразрывным пробелом,
  // чтобы предлоги и союзы не оставались в конце строки на узких экранах.
  var NB = String.fromCharCode(160); // неразрывный пробел
  var SHORT_WORDS = ('в во на за по из к ко с со о об от до у и а но да же ли бы не ни ' +
                     'для под при над про без что как так то или если уже ещё все вся').split(' ');
  var shortWordsRe = new RegExp('(^|[\\s(«"])(' + SHORT_WORDS.join('|') + ')\\s+', 'gi');

  function fixWidows(text) {
    var out = text;
    // два прохода, чтобы срабатывало на цепочках вроде «и в доме»
    out = out.replace(shortWordsRe, '$1$2' + NB);
    out = out.replace(shortWordsRe, '$1$2' + NB);
    // число и следующее за ним слово или разряд не разрываем: «50 мин», «1 900 ₽»
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

  /* -------------------- Услуги и цены: Google-таблица или data/prices.js -------------------- */
  // Цены берутся из Google-таблицы (SHEET_ID). Если таблица пустая или недоступна —
  // показываем цены из data/prices.js (резерв). Чтобы отключить таблицу, очистите SHEET_ID.
  var SHEET_ID = '1KxBnPLmz0ZKLWGp6Ohyh2y42bbj1Wws_pev-Rmc_1dA';
  var SHEET_GID = '0'; // gid листа (число после gid= в адресе таблицы; у первого листа это 0)

  function escapeHtml(value) {
    var d = document.createElement('div');
    d.textContent = value == null ? '' : String(value);
    return d.innerHTML;
  }

  function renderServices(items) {
    var list = document.getElementById('services-list');
    if (!list) return;
    if (!items || !items.length) {
      list.innerHTML = '<p class="services__loading">Список услуг скоро появится.</p>';
      return;
    }
    list.innerHTML = items.map(function (s) {
      return '<article class="service">' +
               '<div class="service__body">' +
                 '<h3 class="service__name">' + escapeHtml(s.name) + '</h3>' +
                 '<p class="service__desc">' + escapeHtml(s.desc) + '</p>' +
               '</div>' +
               '<div class="service__meta">' +
                 '<span class="service__time">' + escapeHtml(s.time) + '</span>' +
                 '<span class="service__price">' + escapeHtml(s.price) + '</span>' +
               '</div>' +
             '</article>';
    }).join('');

    applyTypography(list);

    if (!prefersReducedMotion) {
      var cards = list.querySelectorAll('.service');
      cards.forEach(function (card) { card.classList.add('reveal'); });
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          cards.forEach(function (card) { card.classList.add('is-visible'); });
        });
      });
    }
  }

  function loadPricesFromSheet() {
    var url = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID +
              '/gviz/tq?tqx=out:json&headers=1&gid=' + encodeURIComponent(SHEET_GID);
    return fetch(url).then(function (r) { return r.text(); }).then(function (text) {
      var json = JSON.parse(text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1));
      var rows = (json.table && json.table.rows) || [];
      return rows.map(function (row) {
        var c = row.c || [];
        return { name: c[0] && c[0].v, desc: c[1] && c[1].v, time: c[2] && c[2].v, price: c[3] && c[3].v };
      }).filter(function (s) { return s.name; });
    });
  }

  function initServices() {
    if (SHEET_ID) {
      loadPricesFromSheet()
        .then(function (items) {
          renderServices(items && items.length ? items : window.KROMKA_PRICES);
        })
        .catch(function () { renderServices(window.KROMKA_PRICES); });
    } else {
      renderServices(window.KROMKA_PRICES);
    }
  }
  initServices();

})();

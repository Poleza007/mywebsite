/* ============================================================
   РОВНО — интерактив. Чистый JS, без зависимостей и сборки.
   Ни одной цены в этом файле: все ставки лежат в data/prices.js.
   ============================================================ */
(function () {
  'use strict';

  var P = window.PRICES;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function money(n) { return Math.round(n).toLocaleString('ru-RU') + ' ₽'; }
  function nice(n)  { return Math.round(n * 10) / 10; }
  /* Количество в смете: русская запятая вместо точки. */
  function qty(n)   { return String(nice(n)).replace('.', ','); }

  /* ==========================================================
     Шапка: подложка при скролле
     ========================================================== */
  var header = $('#header');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 24); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ==========================================================
     Мобильное меню
     ========================================================== */
  var burger = $('#burger');
  var menu = $('#mobile-menu');
  if (burger && menu) {
    var toggleMenu = function (open) {
      var isOpen = open === undefined ? !menu.classList.contains('is-open') : open;
      menu.classList.toggle('is-open', isOpen);
      burger.classList.toggle('is-open', isOpen);
      burger.setAttribute('aria-expanded', String(isOpen));
      menu.setAttribute('aria-hidden', String(!isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    };
    burger.addEventListener('click', function () { toggleMenu(); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { toggleMenu(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) toggleMenu(false);
    });
  }

  /* ==========================================================
     Появление блоков.
     Классы вешаются скриптом, а не в разметке: если JS не
     выполнится, страница останется полностью видимой.
     ========================================================== */
  (function reveal() {
    var targets = $$('.section__title, .section__lead, .mech, .incl, .sched, .penalty, .mate, .kit, .nodes, .work, .task, .stage, .checklist__wrap, .review, .faq, .order__grid');
    if (reduced || !('IntersectionObserver' in window)) return;
    targets.forEach(function (el, i) {
      el.classList.add('reveal');
      el.setAttribute('data-delay', String((i % 4) + 1));
    });
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    targets.forEach(function (el) { io.observe(el); });
  })();

  /* ==========================================================
     FAQ: открыт только один пункт
     ========================================================== */
  var faqItems = $$('.faq__item');
  faqItems.forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (item.open) faqItems.forEach(function (o) { if (o !== item) o.open = false; });
    });
  });

  /* ==========================================================
     Узлы в разрезе: вкладки
     ========================================================== */
  var tabs = $$('.node-tab');
  if (tabs.length) {
    var activate = function (n) {
      tabs.forEach(function (t) {
        var on = t.getAttribute('data-node') === n;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
      });
      $$('.node-panel').forEach(function (p) {
        p.classList.toggle('is-active', p.getAttribute('data-node') === n);
      });
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { activate(t.getAttribute('data-node')); });
      t.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : (e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0);
        if (!d) return;
        e.preventDefault();
        var next = tabs[(i + d + tabs.length) % tabs.length];
        next.focus();
        activate(next.getAttribute('data-node'));
      });
    });
  }

  /* ==========================================================
     КАЛЬКУЛЯТОР СМЕТЫ
     ========================================================== */
  var calc = $('#calc');
  if (calc && P) {

    var state = {
      room: 'bedroom',
      fabric: 'matte',
      profile: 'standard',
      perimeterTouched: false
    };

    /* ---------- Отрисовка вариантов из data/prices.js ---------- */
    function radios(host, name, dict, checked, render) {
      host.innerHTML = Object.keys(dict).map(function (key) {
        var it = dict[key];
        return '<label class="opt">' +
          '<input type="radio" name="' + name + '" value="' + key + '"' + (key === checked ? ' checked' : '') + '>' +
          '<span class="opt__box">' + render(it) + '</span></label>';
      }).join('');
      $$('input', host).forEach(function (input) {
        input.addEventListener('change', function () {
          state[name] = input.value;
          if (name === 'room') applyRoomDefaults(input.value);
          update();
        });
      });
    }

    radios($('#opt-room'), 'room', P.rooms, state.room, function (r) {
      return '<span class="opt__t">' + r.label + '</span>' +
             '<span class="opt__m">обычно ' + r.area + ' м²</span>';
    });

    radios($('#opt-fabric'), 'fabric', P.fabric, state.fabric, function (f) {
      return '<span class="opt__t">' + f.label + '</span>' +
             '<span class="opt__m">' + f.price + ' ₽/м² · ' + f.brand + '</span>' +
             '<span class="opt__h">' + f.hint + '</span>';
    });

    radios($('#opt-profile'), 'profile', P.profile, state.profile, function (p) {
      return '<span class="opt__t">' + p.label + '</span>' +
             '<span class="opt__m">' + p.price + ' ₽/п.м</span>' +
             '<span class="opt__h">' + p.hint + '</span>';
    });

    /* ---------- Поля ---------- */
    var el = {
      area: $('#area'), height: $('#height'), perimeter: $('#perimeter'),
      spots: $('#spots'), chandelier: $('#chandelier'), line: $('#line'), track: $('#track'),
      pipes: $('#pipes'), corners: $('#corners'), niche: $('#niche'), dismantle: $('#dismantle'),
      perimeterNote: $('#perimeter-note')
    };

    function val(node, min, max) {
      var v = parseFloat(node.value);
      if (isNaN(v)) return 0;
      if (min !== undefined) v = Math.max(min, v);
      if (max !== undefined) v = Math.min(max, v);
      return v;
    }

    /* Периметр из площади: прямоугольник с типовым для комнаты
       соотношением сторон. Пользователь может вписать свой. */
    function autoPerimeter(area, room) {
      var r = room.ratio;
      var p = 2 * Math.sqrt(area) * (Math.sqrt(r) + 1 / Math.sqrt(r));
      return nice(p * (room.perimeterFactor || 1));
    }

    function applyRoomDefaults(key) {
      var r = P.rooms[key];
      el.area.value = r.area;
      el.spots.value = r.spots;
      el.pipes.value = r.pipes;
      state.perimeterTouched = false;
      el.perimeter.value = autoPerimeter(r.area, r);
      el.perimeterNote.textContent = 'Рассчитан автоматически.';
    }

    el.perimeter.addEventListener('input', function () {
      state.perimeterTouched = true;
      el.perimeterNote.textContent = 'Указан вручную.';
    });

    el.area.addEventListener('input', function () {
      if (state.perimeterTouched) return;
      var a = val(el.area, 0);
      if (a > 0) el.perimeter.value = autoPerimeter(a, P.rooms[state.room]);
    });

    [el.area, el.height, el.perimeter, el.spots, el.chandelier, el.line,
     el.track, el.pipes, el.corners, el.niche, el.dismantle].forEach(function (node) {
      node.addEventListener('input', update);
      node.addEventListener('change', update);
    });

    /* ---------- Расчёт ---------- */
    function build() {
      var area = val(el.area, 0);
      var rows = [];
      var add = function (name, calcText, sum, free) {
        rows.push({ name: name, calc: calcText, sum: sum, free: !!free });
      };

      var f = P.fabric[state.fabric];
      var pr = P.profile[state.profile];
      var per = val(el.perimeter, 0);
      var h = val(el.height, 0);

      add('Полотно · ' + f.label, area + ' м² × ' + f.price + ' ₽', area * f.price);
      add(pr.label, qty(per) + ' п.м × ' + pr.price + ' ₽', per * pr.price);
      add(P.install.label, area + ' м² × ' + P.install.price + ' ₽', area * P.install.price);

      var lightMap = [['spots', 'spot'], ['chandelier', 'chandelier'], ['line', 'line'], ['track', 'track']];
      lightMap.forEach(function (pair) {
        var n = val(el[pair[0]], 0);
        var item = P.light[pair[1]];
        if (n > 0) add(item.label, qty(n) + ' ' + item.unit + ' × ' + item.price + ' ₽', n * item.price);
      });

      var extraMap = [['pipes', 'pipe'], ['corners', 'corner'], ['niche', 'niche']];
      extraMap.forEach(function (pair) {
        var n = val(el[pair[0]], 0);
        var item = P.extra[pair[1]];
        if (n > 0) add(item.label, qty(n) + ' ' + item.unit + ' × ' + item.price + ' ₽', n * item.price);
      });

      if (el.dismantle.value === '1' && area > 0) {
        add(P.extra.dismantle.label, area + ' м² × ' + P.extra.dismantle.price + ' ₽', area * P.extra.dismantle.price);
      }
      if (h > 3 && area > 0) {
        add(P.extra.high.label, area + ' м² × ' + P.extra.high.price + ' ₽', area * P.extra.high.price);
      }

      P.free.forEach(function (item) { add(item.label, 'включено', 0, true); });

      var sum = rows.reduce(function (a, r) { return a + r.sum; }, 0);
      return { rows: rows, sum: sum, area: area };
    }

    /* ---------- Вывод сметы ---------- */
    var out = { rows: $('#est-rows'), total: $('#est-total'), per: $('#est-per'), room: $('#est-room'), note: $('#est-note') };
    var areaField = $('#f-area');
    var areaErr = $('[data-err="area"]');

    function update() {
      var area = val(el.area, 0);
      var bad = area < 1 || area > 200;

      areaField.classList.toggle('is-invalid', bad && el.area.value !== '');
      areaErr.textContent = bad && el.area.value !== ''
        ? 'Считаем от 1 до 200 м². Для большего объёма нужен индивидуальный расчёт.'
        : '';

      out.room.textContent = P.rooms[state.room].label + (bad ? '' : ' · ' + area + ' м²');

      if (bad) {
        out.rows.innerHTML = '<p class="estimate__empty">Впишите площадь от 1 до 200 м² — и смета соберётся сама. Объекты больше 200 м² считаем индивидуально: оставьте телефон, перезвоним.</p>';
        out.total.textContent = '—';
        out.per.textContent = '';
        return;
      }

      var r = build();
      out.rows.innerHTML = r.rows.map(function (row) {
        return '<div class="estimate__row' + (row.free ? ' estimate__row--free' : '') + '">' +
          '<span class="estimate__name"><b>' + row.name + '</b>' +
          '<span class="estimate__calc">' + row.calc + '</span></span>' +
          '<span class="estimate__sum">' + (row.free ? '0 ₽' : money(row.sum)) + '</span></div>';
      }).join('');

      var total = r.sum;
      var raised = total < P.minOrder;
      if (raised) total = P.minOrder;

      out.total.textContent = money(total);

      if (raised) {
        // Вилку не показываем: цифра упёрлась в минимум и вниз уже не пойдёт.
        out.per.textContent = 'минимальный заказ · по позициям вышло ' + money(r.sum);
        out.note.textContent = 'По позициям получилось ' + money(r.sum) + ' — это ниже минимального заказа ' +
          money(P.minOrder) + '. Выезд бригады с оборудованием и газовым баллоном дешевле не окупается. ' +
          'Мы говорим об этом здесь, а не после того, как вы полдня прождали замерщика.';
      } else {
        var low = Math.round(total * (1 - P.spread) / 100) * 100;
        out.per.textContent = Math.round(total / r.area).toLocaleString('ru-RU') +
          ' ₽ за м² · обычно после замера выходит ' + low.toLocaleString('ru-RU') + '–' +
          Math.round(total).toLocaleString('ru-RU') + ' ₽';
        out.note.textContent = 'Это потолок цены, а не приманка. После замера сумма может только уменьшиться — ' +
          'вырасти она может лишь если вы сами измените задачу.';
      }
    }

    /* ---------- Шаги ---------- */
    var steps = $$('.step', calc);
    var progress = $$('#calc-progress span');
    var prev = $('#calc-prev');
    var next = $('#calc-next');
    var cur = 1;

    function showStep(n) {
      cur = Math.min(Math.max(n, 1), steps.length);
      steps.forEach(function (s) { s.classList.toggle('is-active', +s.getAttribute('data-step') === cur); });
      progress.forEach(function (p, i) { p.classList.toggle('is-done', i < cur); });
      prev.disabled = cur === 1;
      next.textContent = cur === steps.length ? 'Пересчитать' : 'Далее';
    }
    prev.addEventListener('click', function () { showStep(cur - 1); });
    next.addEventListener('click', function () {
      if (cur === steps.length) { update(); return; }
      showStep(cur + 1);
    });

    applyRoomDefaults(state.room);
    showStep(1);
    update();
  }

  /* ==========================================================
     Маска телефона
     ========================================================== */
  function maskPhone(value) {
    var d = value.replace(/\D/g, '');
    if (d && d[0] === '8') d = '7' + d.slice(1);
    if (d && d[0] !== '7') d = '7' + d;
    d = d.slice(0, 11);
    var out = '+7';
    if (d.length > 1) out += ' (' + d.slice(1, 4);
    if (d.length >= 4) out += ') ' + d.slice(4, 7);
    if (d.length >= 7) out += '-' + d.slice(7, 9);
    if (d.length >= 9) out += '-' + d.slice(9, 11);
    return out;
  }
  var phone = $('#phone');
  if (phone) {
    phone.addEventListener('input', function () {
      if (!phone.value.replace(/\D/g, '')) { phone.value = ''; return; }
      phone.value = maskPhone(phone.value);
    });
  }

  /* ==========================================================
     Форма записи на замер
     ========================================================== */
  var form = $('#order-form');
  var success = $('#order-success');
  var dateInput = $('#date');

  if (dateInput) {
    var t = new Date();
    t.setMinutes(t.getMinutes() - t.getTimezoneOffset());
    var iso = t.toISOString().slice(0, 10);
    dateInput.min = iso;
    dateInput.value = iso;
  }

  if (form) {
    var setErr = function (name, msg) {
      var input = form.elements[name];
      var box = input ? input.closest('.field') : null;
      var slot = form.querySelector('[data-err="' + name + '"]');
      if (box) box.classList.toggle('is-invalid', Boolean(msg));
      if (slot) slot.textContent = msg || '';
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      if (!form.elements.name.value.trim()) { setErr('name', 'Как к вам обращаться?'); ok = false; } else setErr('name', '');
      if (form.elements.phone.value.replace(/\D/g, '').length < 11) { setErr('phone', 'Введите телефон полностью'); ok = false; } else setErr('phone', '');
      if (!ok) return;

      // ДЕМО: заявка никуда не уходит. Здесь подключается отправка
      // в Telegram-бот, на почту или в CRM клиента.
      console.log('Заявка на замер (демо):', {
        name: form.elements.name.value.trim(),
        phone: form.elements.phone.value.trim(),
        date: form.elements.date.value,
        slot: form.elements.slot.value,
        comment: form.elements.comment.value.trim()
      });

      form.hidden = true;
      success.hidden = false;
      success.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    });

    ['name', 'phone'].forEach(function (n) {
      var input = form.elements[n];
      if (input) input.addEventListener('blur', function () { if (input.value.trim()) setErr(n, ''); });
    });
  }

})();

// Форма расчёта стоимости.
// Сейчас отправка имитируется: показываем экран «Заявка отправлена».
// Чтобы заявки реально приходили — раскомментируйте блок fetch ниже
// и положите на хостинг обработчик send.php (или подключите форм-сервис).

document.addEventListener('DOMContentLoaded', function () {
  var form = document.getElementById('calc-form');
  var done = document.getElementById('calc-done');
  if (!form || !done) return;

  var phone = document.getElementById('phone');

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    // Минимальная проверка: нужен телефон, иначе на заявку нечем ответить.
    if (!phone.value.trim()) {
      phone.setAttribute('aria-invalid', 'true');
      phone.focus();
      return;
    }
    phone.removeAttribute('aria-invalid');

    // var data = new FormData(form);
    // fetch('send.php', { method: 'POST', body: data });

    form.hidden = true;
    done.hidden = false;
    done.setAttribute('tabindex', '-1');
    done.focus();
  });
});

// Мобильное меню.
document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (!toggle || !nav) return;

  function setState(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Меню');
  }

  function close() {
    setState(false);
  }

  toggle.addEventListener('click', function () {
    setState(!nav.classList.contains('is-open'));
  });

  nav.addEventListener('click', function (event) {
    if (event.target.tagName === 'A') close();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') close();
  });
});

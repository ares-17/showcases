(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------ WhatsApp */
  // Numero in <body data-wa-number="393331234567">: solo cifre, prefisso
  // internazionale, senza "+". Se vuoto, wa.me apre la scelta del contatto
  // con il messaggio già scritto.
  var WA_NUMBER = String(document.body.dataset.waNumber || '').replace(/[^\d]/g, '');

  function waUrl(text) {
    var base = WA_NUMBER ? 'https://wa.me/' + WA_NUMBER : 'https://wa.me/';
    return base + '?text=' + encodeURIComponent(text);
  }

  var direct = document.getElementById('wa-direct');
  if (direct) {
    direct.href = waUrl('Ciao, vorrei informazioni su StudioMS e una demo di 20 minuti.');
  }

  /* ------------------------------------------------------------ header */
  // In cima l'header è trasparente: la banda scura della hero passa sotto.
  // Appena si scorre prende fondo carta semi-opaco. Soglia bassa e rAF per
  // non far lampeggiare lo stato durante lo scroll.
  var header = document.querySelector('.site-header');
  if (header) {
    var headerTick = false;
    function syncHeader() {
      headerTick = false;
      header.dataset.scrolled = window.scrollY > 8 ? 'true' : 'false';
    }
    function requestHeader() {
      if (!headerTick) {
        headerTick = true;
        window.requestAnimationFrame(syncHeader);
      }
    }
    window.addEventListener('scroll', requestHeader, { passive: true });
    window.addEventListener('resize', requestHeader);
    syncHeader();
  }

  /* ------------------------------------------------------------ reveals */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  if ('IntersectionObserver' in window && revealEls.length) {
    document.documentElement.classList.add('reveal-on');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------------ calcolatore */
  var calcSlot = document.getElementById('calc-slot');
  if (calcSlot) {
    var calcValue = document.getElementById('calc-value');
    var slotOut = document.getElementById('calc-slot-out');
    var valueOut = document.getElementById('calc-value-out');
    var monthEl = document.getElementById('calc-month');
    var yearEl = document.getElementById('calc-year');
    var number = new Intl.NumberFormat('it-IT', { useGrouping: 'always' });
    var shown = 1170;
    var frame = null;

    function setFigure(target) {
      if (reduceMotion || !window.requestAnimationFrame) {
        shown = target;
        monthEl.textContent = number.format(target) + ' €';
        return;
      }
      var from = shown;
      var start = performance.now();
      if (frame) { cancelAnimationFrame(frame); }
      function step(now) {
        var t = Math.min(1, (now - start) / 420);
        var eased = 1 - Math.pow(1 - t, 3);
        shown = Math.round(from + (target - from) * eased);
        monthEl.textContent = number.format(shown) + ' €';
        if (t < 1) {
          frame = requestAnimationFrame(step);
        } else {
          shown = target;
          frame = null;
        }
      }
      frame = requestAnimationFrame(step);
    }

    function updateCalc() {
      var slots = Number(calcSlot.value) || 0;
      var fee = Number(calcValue.value) || 0;
      var yearly = slots * fee * 52;
      var monthly = Math.round(yearly / 12);
      slotOut.textContent = number.format(slots);
      valueOut.textContent = number.format(fee) + ' €';
      yearEl.textContent = number.format(yearly) + ' €';
      setFigure(monthly);
    }

    calcSlot.addEventListener('input', updateCalc);
    calcValue.addEventListener('input', updateCalc);
    updateCalc();
  }

  /* ------------------------------------------------------------ form */
  var form = document.getElementById('demo-form');
  if (!form) { return; }

  var statusEl = document.getElementById('form-status');
  var result = document.getElementById('result');
  var resultText = document.getElementById('result-text');
  var waLink = document.getElementById('wa-link');
  var copyBtn = document.getElementById('copy-btn');

  var fields = {
    nome: document.getElementById('nome'),
    studio: document.getElementById('studio'),
    email: document.getElementById('email'),
    professionisti: document.getElementById('professionisti'),
    quando: document.getElementById('quando'),
    note: document.getElementById('note'),
    consenso: document.getElementById('consenso')
  };

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function setError(name, message) {
    var el = fields[name];
    if (!el) { return; }
    var holder = el.closest('.field');
    var err = document.getElementById('err-' + name);
    if (message) {
      if (holder) { holder.classList.add('has-error'); }
      el.setAttribute('aria-invalid', 'true');
      if (err) { err.textContent = message; err.hidden = false; }
    } else {
      if (holder) { holder.classList.remove('has-error'); }
      el.removeAttribute('aria-invalid');
      if (err) { err.textContent = ''; err.hidden = true; }
    }
  }

  function validate() {
    var firstInvalid = null;
    var order = ['nome', 'studio', 'email', 'professionisti', 'consenso'];

    var rules = {
      nome: function () {
        return fields.nome.value.trim().length >= 2 ? '' : 'Scrivi nome e cognome.';
      },
      studio: function () {
        return fields.studio.value.trim().length >= 2 ? '' : 'Indica lo studio e la città.';
      },
      email: function () {
        var value = fields.email.value.trim();
        if (!value) { return 'Serve un indirizzo email.'; }
        return EMAIL_RE.test(value) ? '' : 'Controlla l’indirizzo email.';
      },
      professionisti: function () {
        return fields.professionisti.value ? '' : 'Scegli quanti professionisti siete.';
      },
      consenso: function () {
        return fields.consenso.checked ? '' : 'Serve il consenso per essere contattato.';
      }
    };

    order.forEach(function (name) {
      var message = rules[name]();
      setError(name, message);
      if (message && !firstInvalid) { firstInvalid = fields[name]; }
    });

    return firstInvalid;
  }

  ['nome', 'studio', 'email', 'professionisti', 'consenso'].forEach(function (name) {
    var el = fields[name];
    var eventName = el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input';
    el.addEventListener(eventName, function () { setError(name, ''); });
  });

  function checkedInterests() {
    return Array.prototype.slice
      .call(form.querySelectorAll('input[name="interessi"]:checked'))
      .map(function (input) { return input.value; });
  }

  function buildMessage() {
    var nome = fields.nome.value.trim().replace(/\s+/g, ' ');
    var studio = fields.studio.value.trim().replace(/\s+/g, ' ');
    var email = fields.email.value.trim();
    var quando = fields.quando.value;
    var note = fields.note.value.trim();
    var interessi = checkedInterests();

    var lines = [
      'Ciao, sono ' + nome + '.',
      'Studio: ' + studio + '.',
      'Email: ' + email + '.',
      'Professionisti: ' + fields.professionisti.value + '.'
    ];

    if (interessi.length) { lines.push('Interesse: ' + interessi.join(', ') + '.'); }
    if (quando) { lines.push('Preferenza orario: ' + quando + '.'); }
    if (note) { lines.push('Note: ' + note); }

    lines.push('');
    lines.push('Vorrei una demo di StudioMS (20 minuti).');

    return lines.join('\n');
  }

  function showResult(message) {
    resultText.textContent = message;
    waLink.href = waUrl(message);
    result.hidden = false;
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    var invalid = validate();
    if (invalid) {
      statusEl.textContent = 'Controlla i campi evidenziati.';
      invalid.focus();
      return;
    }

    statusEl.textContent = 'Messaggio pronto.';
    var message = buildMessage();
    showResult(message);

    // Apre WhatsApp nella stessa azione dell'utente: se il browser blocca
    // la finestra, il pulsante nel pannello resta come via d'uscita.
    try {
      window.open(waUrl(message), '_blank', 'noopener');
    } catch (err) {
      /* il link nel pannello copre questo caso */
    }

    if (!reduceMotion && result.scrollIntoView) {
      result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });

  function fallbackCopy(text) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    document.body.appendChild(area);
    area.select();
    try { document.execCommand('copy'); } catch (err) { /* silenzioso */ }
    document.body.removeChild(area);
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var text = resultText.textContent;
      var done = function () {
        copyBtn.textContent = 'Copiato';
        window.setTimeout(function () { copyBtn.textContent = 'Copia testo'; }, 1800);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done, function () {
          fallbackCopy(text);
          done();
        });
      } else {
        fallbackCopy(text);
        done();
      }
    });
  }

  /* ------------------------------------------------------------ FAB (right side) */
  var demo = document.getElementById('demo');
  var fab = document.getElementById('fab-right');
  if (fab && demo && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      fab.hidden = entries[0].isIntersecting; // hide when the demo is in view
    }, { threshold: 0.4 }).observe(demo);
  }
})();

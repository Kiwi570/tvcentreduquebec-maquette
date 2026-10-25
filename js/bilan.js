/* Bilan télé : facture au pavé numérique, types d'émissions, téléviseur et priorité.
   Calcule l'économie mensuelle et annuelle, et le délai pour rembourser l'appareil conseillé. */
(function () {
  'use strict';
  var D = window.TVCQ;
  var ui = D.ui;
  var gsap = window.gsap;
  var motion = !ui.calm && !!gsap;
  
  var CATS = [
    { id: 'nouvelles', nom: 'Nouvelles et télé générale', ex: 0, services: 'Antenne numérique (gratuit selon votre secteur), ICI TOU.TV, TVA+, Noovo.ca' },
    { id: 'series', nom: 'Séries', ex: 20, services: 'Crave, Club illico, Netflix' },
    { id: 'films', nom: 'Films', ex: 15, services: 'Netflix, Prime Video, Crave' },
    { id: 'sport', nom: 'Sport', ex: 20, services: 'RDS sur Prime Video (annonce de Bell, 2024) ; autres sports à compléter' },
    { id: 'jeunesse', nom: 'Jeunesse', ex: 12, services: 'ICI TOU.TV, Disney+, Netflix' }
  ];
  var RECO = {
    prix: { id: 'onn-4k', why: 'Le moins cher des cinq, avec Google TV et la 4K.' },
    compact: { id: 'formuler-z-mini', why: 'Le plus petit : 83 × 60 × 12,5 mm, 5 W au maximum.' },
    filaire: { id: 'formuler-z10', why: 'Port Ethernet pour brancher l’appareil directement au modem.' },
    stockage: { id: 'formuler-z11-pro-max', why: '32 Go de stockage et un port Ethernet.' }
  };

  var state = {
    bill: 120, billIsExample: true,
    cats: { nouvelles: true, series: true, films: false, sport: true, jeunesse: false },
    amounts: {}, edited: {},
    tv: 'simple', prio: 'prix', step: 1
  };
  CATS.forEach(function (c) { state.amounts[c.id] = c.ex; });

  // le pavé numérique de la page joue le rôle de télécommande : pas de télécommande 3D ici
  function press() {}

  /* ---------- Étapes ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.wiz-tab'));
  var panels = [1, 2, 3].map(function (n) { return document.getElementById('step-' + n); });
  function goStep(n, focus) {
    if (n === state.step) return;
    var prev = state.step;
    state.step = n;
    tabs.forEach(function (t, i) {
      var on = i + 1 === n;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      t.classList.toggle('is-done', i + 1 < n);
    });
    panels.forEach(function (p, i) { p.hidden = i + 1 !== n; });
    var panel = panels[n - 1];
    if (motion) gsap.fromTo(panel, { x: n > prev ? 40 : -40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: 'power3.out' });
    ui.setOSD('BILAN', 'Étape ' + n + ' / 3');
    if (focus !== false) {
      var h = panel.querySelector('h2');
      if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
    }
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { goStep(i + 1); });
    t.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); goStep(Math.min(3, i + 2)); tabs[Math.min(2, i + 1)].focus(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goStep(Math.max(1, i)); tabs[Math.max(0, i - 1)].focus(); }
    });
  });
  document.querySelectorAll('[data-next]').forEach(function (b) { b.addEventListener('click', function () { press('ok'); goStep(Math.min(3, state.step + 1)); }); });
  document.querySelectorAll('[data-prev]').forEach(function (b) { b.addEventListener('click', function () { press('back'); goStep(Math.max(1, state.step - 1)); }); });

  /* ---------- Question 1 : la facture ---------- */
  var input = document.getElementById('bill-input');
  var hint = document.querySelector('[data-bill-hint]');
  function setBill(str, fromUser) {
    var clean = String(str).replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 4);
    input.value = clean;
    input.style.width = Math.max(1, clean.length) + 'ch';
    state.bill = parseInt(clean || '0', 10);
    if (fromUser) {
      state.billIsExample = false;
      hint.textContent = state.bill > 0 ? 'Votre montant, taxes incluses.' : 'Entrez le montant de votre facture.';
    }
    compute();
  }
  var firstEntry = true;
  function typeDigit(d) {
    var base = firstEntry ? '' : input.value;
    firstEntry = false;
    setBill(base + d, true);
    flashKey(d);
  }
  function deleteDigit() {
    firstEntry = false;
    setBill(input.value.slice(0, -1), true);
    flashKey('del');
  }
  function flashKey(k) {
    var b = document.querySelector('.keypad [data-k="' + k + '"]');
    if (!b) return;
    b.classList.add('is-press');
    setTimeout(function () { b.classList.remove('is-press'); }, 140);
  }
  document.querySelector('.keypad').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-k]');
    if (!b) return;
    var k = b.dataset.k;
    if (k === 'del') { deleteDigit(); press('back'); }
    else if (k === 'ok') { press('ok'); goStep(2); }
    else { typeDigit(k); press('ch:' + k); }
  });
  input.addEventListener('input', function () { firstEntry = false; setBill(input.value, true); });
  input.addEventListener('focus', function () { input.select(); });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); press('ok'); goStep(2); }
    else if (/^\d$/.test(e.key)) press('ch:' + e.key);
  });
  document.addEventListener('keydown', function (e) {
    if (state.step !== 1 || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
    var t = document.activeElement;
    // la saisie au clavier ne s'applique que dans le bilan (ou sans focus), jamais depuis un lien du menu
    var inWizard = t && t.closest && t.closest('.wizard');
    if (t && t !== document.body && !inWizard) return;
    if (t === input || (t && t.closest && t.closest('input, textarea, select'))) return;
    if (/^\d$/.test(e.key)) { e.preventDefault(); typeDigit(e.key); press('ch:' + e.key); }
    else if (e.key === 'Backspace') { e.preventDefault(); deleteDigit(); press('back'); }
    else if (e.key === 'Enter' && !(t && t.closest && t.closest('button, a'))) { e.preventDefault(); press('ok'); goStep(2); }
  });

  /* ---------- Question 2 : ce que vous regardez ---------- */
  var catsEl = document.querySelector('[data-cats]');
  var amountsEl = document.querySelector('[data-amounts]');
  catsEl.innerHTML = CATS.map(function (c) {
    return '<button class="chip" type="button" aria-pressed="' + (!!state.cats[c.id]) + '" data-cat="' + c.id + '"><span class="box"></span>' + ui.esc(c.nom) + '</button>';
  }).join('');
  function renderAmounts() {
    amountsEl.innerHTML = CATS.filter(function (c) { return state.cats[c.id]; }).map(function (c) {
      return '<div class="amount-row"><div><div class="nm">' + ui.esc(c.nom) + '</div><div class="ex">' + ui.esc(c.services) + '</div></div>' +
        '<label class="money-input"><span class="sr-only">Montant mensuel pour ' + ui.esc(c.nom) + '</span>' +
        '<input id="amt-' + c.id + '" inputmode="decimal" data-amt="' + c.id + '" value="' + String(state.amounts[c.id]).replace('.', ',') + '"> $</label></div>';
    }).join('') || '<p class="muted">Choisissez au moins un type d’émission.</p>';
  }
  catsEl.addEventListener('click', function (e) {
    var b = e.target.closest('[data-cat]');
    if (!b) return;
    var id = b.dataset.cat;
    state.cats[id] = !state.cats[id];
    b.setAttribute('aria-pressed', String(state.cats[id]));
    renderAmounts();
    compute();
  });
  amountsEl.addEventListener('input', function (e) {
    var id = e.target.dataset.amt;
    if (!id) return;
    var v = parseFloat(e.target.value.replace(',', '.').replace(/[^\d.]/g, ''));
    state.amounts[id] = isNaN(v) ? 0 : Math.min(999, v);
    state.edited[id] = true;
    compute();
  });

  amountsEl.addEventListener('focusout', function (e) {
    var id = e.target.dataset && e.target.dataset.amt;
    if (id) e.target.value = String(state.amounts[id]).replace('.', ',');
  });

  /* ---------- Question 3 : téléviseur et priorité ---------- */
  function radioGroup(sel, key) {
    var g = document.querySelector(sel);
    var items = Array.prototype.slice.call(g.querySelectorAll('[role="radio"]'));
    function pick(b) {
      items.forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); x.tabIndex = x === b ? 0 : -1; });
      state[key] = b.dataset.v;
      compute();
    }
    items.forEach(function (b, i) {
      b.tabIndex = b.getAttribute('aria-checked') === 'true' ? 0 : -1;
      b.addEventListener('click', function () { pick(b); });
      b.addEventListener('keydown', function (e) {
        var d = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        var n = items[(i + d + items.length) % items.length];
        pick(n); n.focus();
      });
    });
  }
  radioGroup('[data-tv]', 'tv');
  radioGroup('[data-prio]', 'prio');

  /* ---------- Calcul ---------- */
  var shown = { mois: 0, an: 0 };
  var kMois = document.querySelector('[data-kpi="mois"]');
  var kAn = document.querySelector('[data-kpi="an"]');
  var kRet = document.querySelector('[data-kpi="retour"]');
  var sMois = document.querySelector('[data-kpi-s="mois"]');
  var sRet = document.querySelector('[data-kpi-s="retour"]');
  var badge = document.querySelector('[data-demo-badge]');
  var recoBox = document.querySelector('.reco');
  var lastReco = '';

  function compute() {
    var monthly = 0;
    var anyExample = state.billIsExample;
    CATS.forEach(function (c) {
      if (!state.cats[c.id]) return;
      monthly += state.amounts[c.id];
      if (!state.edited[c.id] && c.ex > 0) anyExample = true;
    });
    var save = state.bill - monthly;
    var reco = D.parId(RECO[state.prio].id);
    var needDevice = state.tv === 'simple';
    var deviceTTC = needDevice ? ui.round2(reco.prix * (1 + D.taxes.tps + D.taxes.tvq)) : 0;

    animateNumber('mois', Math.max(0, save), kMois);
    animateNumber('an', Math.max(0, save) * 12, kAn);
    sMois.textContent = save > 0
      ? 'Facture de ' + ui.money0(state.bill) + ' moins ' + ui.money0(monthly) + ' de services'
      : (state.bill > 0 ? 'Les services choisis coûtent autant ou plus que votre facture actuelle.' : 'Entrez votre facture à la question 1.');

    if (!needDevice) { kRet.textContent = 'Facultatif'; sRet.textContent = 'Votre téléviseur a déjà les applications.'; }
    else if (save <= 0) { kRet.textContent = '—'; sRet.textContent = 'Pas d’économie mensuelle avec ces montants.'; }
    else {
      var months = Math.ceil(deviceTTC / save);
      kRet.textContent = months + ' mois';
      sRet.textContent = reco.court + ' à ' + ui.money(deviceTTC) + ' taxes incluses';
    }
    badge.textContent = anyExample ? 'Montants d’exemple' : 'Vos montants';
    if (liveVal) liveVal.textContent = ui.money0(Math.max(0, save)) + ' / mois';
    announce('Économie estimée : ' + ui.money0(Math.max(0, save)) + ' par mois, ' + ui.money0(Math.max(0, save) * 12) + ' par année. Appareil conseillé : ' + reco.nom + '.');

    // appareil conseillé
    var key = reco.id + state.tv;
    if (key !== lastReco) {
      lastReco = key;
      var img = recoBox.querySelector('img');
      var apply = function () {
        img.src = D.src(reco);
        img.alt = reco.nom + ', photo du produit';
        recoBox.querySelector('[data-reco-name]').textContent = reco.nom;
        recoBox.querySelector('[data-reco-price]').textContent = ui.money(reco.prix) + ' + taxes';
        recoBox.querySelector('[data-reco-why]').textContent = (needDevice ? '' : 'Facultatif avec un téléviseur intelligent. ') + RECO[state.prio].why;
        recoBox.querySelector('[data-reco-add]').dataset.add = reco.id;
        recoBox.querySelector('[data-reco-link]').setAttribute('href', 'appareil.html#' + reco.id);
      };
      if (motion && lastRecoReady) {
        gsap.to(img, { y: -20, opacity: 0, duration: 0.2, onComplete: function () { apply(); gsap.fromTo(img, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 }); } });
      } else apply();
      lastRecoReady = true;
    }

  }
  var lastRecoReady = false;
  var srBox = document.querySelector('[data-sr-summary]');
  var srTimer = null;
  var srFirst = true;
  function announce(text) {
    if (!srBox) return;
    if (srFirst) { srFirst = false; return; }
    clearTimeout(srTimer);
    srTimer = setTimeout(function () { srBox.textContent = text; }, 900);
  }

  var tweens = {};
  var live = {};
  function animateNumber(key, value, elm) {
    shown[key] = value;
    if (!motion) { elm.textContent = ui.money0(value); return; }
    if (tweens[key]) tweens[key].kill();
    var o = { v: live[key] || 0 };
    tweens[key] = gsap.to(o, { v: value, duration: 0.7, ease: 'power2.out', onUpdate: function () { live[key] = o.v; elm.textContent = ui.money0(o.v); } });
  }

  var resultBox = document.getElementById('resultat');
  var liveBar = document.querySelector('[data-live-bar]');
  var liveVal = liveBar && liveBar.querySelector('[data-live-val]');
  if (liveBar && 'IntersectionObserver' in window) {
    var narrow = window.matchMedia('(max-width: 999px)');
    var resultSeen = false;
    var started = false;
    var syncBar = function () {
      var show = narrow.matches && started && !resultSeen;
      if (show === !liveBar.hidden) return;
      liveBar.hidden = !show;
      document.body.classList.toggle('has-live-bar', show);
      if (show && motion) gsap.fromTo(liveBar, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' });
    };
    new IntersectionObserver(function (en) { resultSeen = en[0].isIntersecting; syncBar(); }, { threshold: 0.25 }).observe(resultBox);
    new IntersectionObserver(function (en) { if (!en[0].isIntersecting && en[0].boundingClientRect.top < 0) { started = true; syncBar(); } }, { threshold: 0 }).observe(document.querySelector('.page-hero'));
    if (narrow.addEventListener) narrow.addEventListener('change', syncBar);
  }
  function showResult(e) {
    if (e) e.preventDefault();
    ui.scrollTo(resultBox, -100);
    resultBox.focus({ preventScroll: true });
    if (motion) gsap.fromTo(resultBox, { boxShadow: '0 0 0 0 rgba(255, 90, 31, 0.9)' }, { boxShadow: '0 0 0 14px rgba(255, 90, 31, 0)', duration: 1.1, ease: 'power2.out', delay: 0.3 });
  }
  document.querySelectorAll('[data-see-result], [data-live-bar]').forEach(function (a) { a.addEventListener('click', showResult); });

  var SAVE_KEY = 'tvcq-bilan';
  function save() {
    ui.session.set(SAVE_KEY, JSON.stringify({ bill: state.bill, billIsExample: state.billIsExample, cats: state.cats, amounts: state.amounts, edited: state.edited, tv: state.tv, prio: state.prio, step: state.step }));
  }
  window.addEventListener('tvcq:save', save);
  window.addEventListener('pagehide', save);
  (function restore() {
    var raw = ui.session.get(SAVE_KEY);
    if (!raw) return;
    try {
      var o = JSON.parse(raw);
      ['cats', 'amounts', 'edited'].forEach(function (k) { if (o[k]) state[k] = o[k]; });
      state.bill = +o.bill || 0; state.billIsExample = !!o.billIsExample;
      state.tv = o.tv === 'intelligent' ? 'intelligent' : 'simple';
      state.prio = RECO[o.prio] ? o.prio : 'prix';
      input.value = String(state.bill);
      firstEntry = state.billIsExample;
      if (!state.billIsExample) hint.textContent = 'Votre montant, taxes incluses.';
      catsEl.querySelectorAll('[data-cat]').forEach(function (b) { b.setAttribute('aria-pressed', String(!!state.cats[b.dataset.cat])); });
      [['[data-tv]', state.tv], ['[data-prio]', state.prio]].forEach(function (g) {
        document.querySelectorAll(g[0] + ' [role="radio"]').forEach(function (b) {
          var on = b.dataset.v === g[1];
          b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1;
        });
      });
      var st = +o.step;
      if (st >= 2 && st <= 3) setTimeout(function () { goStep(st, false); }, 0);
    } catch (err) { /* sauvegarde illisible : on garde l'exemple */ }
  })();

  input.style.width = Math.max(1, input.value.length) + 'ch';
  renderAmounts();
  compute();
  ui.setOSD('BILAN', 'Étape 1 / 3');
  ui.boot();
})();

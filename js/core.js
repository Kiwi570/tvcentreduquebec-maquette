/* Tv-Centre du Québec — script commun : mode calme, défilement fluide, curseur, transitions,
   bandeau de chaîne, panier (tiroir, taxes, points, paiement simulé). */
(function () {
  'use strict';

  var D = window.TVCQ;
  var root = document.documentElement;
  var SCRIPT_URL = (document.currentScript && document.currentScript.src) || location.href;

  /* ---------- Stockage tolérant ---------- */
  function safe(storage) {
    return {
      get: function (k) { try { return window[storage].getItem(k); } catch (e) { return null; } },
      set: function (k, v) { try { window[storage].setItem(k, v); } catch (e) { /* stockage indisponible */ } },
      del: function (k) { try { window[storage].removeItem(k); } catch (e) { /* stockage indisponible */ } }
    };
  }
  var local = safe('localStorage');
  var session = safe('sessionStorage');

  /* ---------- Mode calme ---------- */
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var calmPref = local.get('tvcq-calme');
  var calm = calmPref === '1' || (calmPref === null && reduced);
  if (calm) root.classList.add('calm');
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  var hasGsap = !!window.gsap;
  if (hasGsap) {
    var plugins = [window.ScrollTrigger, window.SplitText, window.DrawSVGPlugin, window.ScrambleTextPlugin].filter(Boolean);
    window.gsap.registerPlugin.apply(window.gsap, plugins);
    window.gsap.defaults({ ease: 'power3.out', duration: 0.8 });
  }
  var gsap = window.gsap;

  /* ---------- Formats ---------- */
  var fmt2 = new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' });
  var fmt0 = new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0, minimumFractionDigits: 0 });
  function money(n) { return fmt2.format(n); }
  function money0(n) { return fmt0.format(Math.round(n)); }
  function round2(n) { return Math.round(n * 100) / 100; }

  function el(html) {
    var t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- Défilement fluide ---------- */
  var lenis = null;
  if (!calm && hasGsap && window.Lenis && window.ScrollTrigger) {
    lenis = new window.Lenis({ lerp: 0.11, smoothWheel: true, wheelMultiplier: 1 });
    lenis.on('scroll', window.ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  function scrollTo(target, offset) {
    var node = typeof target === 'string' ? document.querySelector(target) : target;
    if (!node) return;
    var off = offset == null ? -84 : offset;
    if (lenis) lenis.scrollTo(node, { offset: off, duration: 1.3 });
    else window.scrollTo({ top: node.getBoundingClientRect().top + window.scrollY + off, behavior: calm ? 'auto' : 'smooth' });
  }

  /* ---------- Éléments injectés ---------- */
  var osd = el('<div class="osd" aria-hidden="true"><span class="dot"></span><span class="osd-ch"></span><span class="sep">·</span><span class="osd-lb"></span></div>');
  var cursor = el('<div class="cursor" aria-hidden="true"></div>');
  var screen = el('<div class="tv-screen" aria-hidden="true" hidden><div class="shade top"></div><div class="shade bottom"></div><div class="beam"></div><div class="led-txt"></div></div>');
  var toastEl = el('<div class="toast" role="status" aria-live="polite" hidden><span class="dot"></span><span class="msg"></span></div>');
  document.body.appendChild(osd);
  document.body.appendChild(cursor);
  document.body.appendChild(screen);
  document.body.appendChild(toastEl);

  /* ---------- Bandeau de chaîne ---------- */
  var osdState = { ch: '', lb: '' };
  var osdTimer = null;
  var osdFirst = true;
  osd.classList.add('is-off');
  function setOSD(ch, label) {
    if (osdState.ch === ch && osdState.lb === label) return;
    osdState = { ch: ch, lb: label };
    var chEl0 = osd.querySelector('.osd-ch');
    var lbEl0 = osd.querySelector('.osd-lb');
    if (osdFirst) {
      // au chargement, le bandeau reste caché : il n'apparaît qu'au changement de chaîne
      osdFirst = false;
      chEl0.textContent = ch;
      lbEl0.textContent = label;
      return;
    }
    // comme sur un téléviseur : le bandeau apparaît au changement de chaîne puis s'efface
    clearTimeout(osdTimer);
    osd.classList.remove('is-off');
    osdTimer = setTimeout(function () { osd.classList.add('is-off'); }, 3200);
    var chEl = osd.querySelector('.osd-ch');
    var lbEl = osd.querySelector('.osd-lb');
    if (hasGsap && !calm && window.ScrambleTextPlugin) {
      gsap.to(chEl, { duration: 0.5, scrambleText: { text: ch, chars: '0123456789', speed: 0.6 }, ease: 'none' });
      gsap.to(lbEl, { duration: 0.6, scrambleText: { text: label, chars: 'upperCase', speed: 0.5 }, ease: 'none' });
    } else {
      chEl.textContent = ch;
      lbEl.textContent = label;
    }
  }

  /* ---------- Toast ---------- */
  var toastTimer = null;
  function toast(msg) {
    toastEl.querySelector('.msg').textContent = msg;
    toastEl.hidden = false;
    if (hasGsap && !calm) gsap.fromTo(toastEl, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      if (hasGsap && !calm) gsap.to(toastEl, { y: 20, opacity: 0, duration: 0.3, onComplete: function () { toastEl.hidden = true; } });
      else toastEl.hidden = true;
    }, 2400);
  }

  /* ---------- Curseur ---------- */
  if (finePointer && !calm && hasGsap) {
    var cx = gsap.quickTo(cursor, 'x', { duration: 0.18, ease: 'power3.out' });
    var cy = gsap.quickTo(cursor, 'y', { duration: 0.18, ease: 'power3.out' });
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      cursor.classList.add('is-on');
      cx(e.clientX); cy(e.clientY);
      var t = e.target && e.target.closest ? e.target.closest('a, button, [data-cursor], input, select, textarea, label, .stage-item') : null;
      cursor.classList.toggle('is-hover', !!t || document.body.classList.contains('remote-hover'));
    }, { passive: true });
    window.addEventListener('pointerdown', function () { cursor.classList.add('is-down'); });
    window.addEventListener('pointerup', function () { cursor.classList.remove('is-down'); });
    document.addEventListener('mouseleave', function () { cursor.classList.remove('is-on'); });
  }

  /* ---------- Boutons magnétiques et inclinaison 3D ---------- */
  function magnetic(scope) {
    if (!finePointer || calm || !hasGsap) return;
    (scope || document).querySelectorAll('[data-magnetic]').forEach(function (b) {
      if (b.dataset.magReady) return;
      b.dataset.magReady = '1';
      var qx = gsap.quickTo(b, 'x', { duration: 0.4, ease: 'power3.out' });
      var qy = gsap.quickTo(b, 'y', { duration: 0.4, ease: 'power3.out' });
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        qx((e.clientX - (r.left + r.width / 2)) * 0.28);
        qy((e.clientY - (r.top + r.height / 2)) * 0.4);
      });
      b.addEventListener('pointerleave', function () {
        gsap.to(b, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.45)' });
      });
    });
  }
  function tilt(scope) {
    if (!finePointer || calm || !hasGsap) return;
    (scope || document).querySelectorAll('[data-tilt]').forEach(function (box) {
      if (box.dataset.tiltReady) return;
      box.dataset.tiltReady = '1';
      var target = box.querySelector('img') || box;
      var max = parseFloat(box.dataset.tilt) || 12;
      var rx = gsap.quickTo(target, 'rotationX', { duration: 0.5, ease: 'power3.out' });
      var ry = gsap.quickTo(target, 'rotationY', { duration: 0.5, ease: 'power3.out' });
      var sc = gsap.quickTo(target, 'scale', { duration: 0.5, ease: 'power3.out' });
      box.addEventListener('pointermove', function (e) {
        var r = box.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        ry(px * max * 2); rx(-py * max * 2); sc(1.04);
      });
      box.addEventListener('pointerleave', function () { rx(0); ry(0); sc(1); });
    });
  }

  /* ---------- Révélations au défilement ---------- */
  function belowFold(node) { return node.getBoundingClientRect().top > window.innerHeight * 0.92; }
  function reveal(scope) {
    if (!hasGsap || calm || !window.ScrollTrigger) return;
    var s = scope || document;
    s.querySelectorAll('[data-reveal]').forEach(function (node) {
      if (node.dataset.revReady || !belowFold(node)) return;
      node.dataset.revReady = '1';
      gsap.from(node, { y: 46, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: node, start: 'top 90%', once: true } });
    });
    s.querySelectorAll('[data-reveal-stagger]').forEach(function (group) {
      if (group.dataset.revReady || !belowFold(group)) return;
      group.dataset.revReady = '1';
      gsap.from(group.children, { y: 36, opacity: 0, duration: 0.9, stagger: 0.08, ease: 'power3.out', scrollTrigger: { trigger: group, start: 'top 88%', once: true } });
    });
    s.querySelectorAll('.ch-tag .line').forEach(function (line) {
      if (line.dataset.revReady || !belowFold(line)) return;
      line.dataset.revReady = '1';
      gsap.from(line, { scaleX: 0, duration: 1.2, ease: 'power3.inOut', scrollTrigger: { trigger: line, start: 'top 92%', once: true } });
    });
  }
  function splitHeadings(scope) {
    if (!hasGsap || calm || !window.SplitText || !window.ScrollTrigger) return;
    (scope || document).querySelectorAll('[data-split]').forEach(function (h) {
      if (h.dataset.splitReady) return;
      h.dataset.splitReady = '1';
      var first = !belowFold(h);
      if (first && h.dataset.split !== 'intro') return;
      window.SplitText.create(h, {
        type: 'lines,words', mask: 'lines', autoSplit: true,
        onSplit: function (self) {
          return gsap.from(self.words, {
            yPercent: 115, duration: 1.05, stagger: 0.045, ease: 'power4.out',
            delay: h.dataset.split === 'intro' ? (parseFloat(h.dataset.delay) || 0) : 0,
            scrollTrigger: h.dataset.split === 'intro' ? null : { trigger: h, start: 'top 88%', once: true }
          });
        }
      });
    });
  }

  /* ---------- Écran : allumage, extinction ---------- */
  var shTop = screen.querySelector('.top');
  var shBot = screen.querySelector('.bottom');
  var beam = screen.querySelector('.beam');
  var ledTxt = screen.querySelector('.led-txt');

  function screenOn(label) {
    // l'écran noir s'ouvre depuis un trait orange
    if (!hasGsap || calm) { screen.hidden = true; return null; }
    screen.hidden = false;
    ledTxt.textContent = label || '';
    gsap.set([shTop, shBot], { scaleY: 1 });
    gsap.set(beam, { scaleX: 0, opacity: 1 });
    var tl = gsap.timeline({ onComplete: function () { screen.hidden = true; } });
    tl.to(beam, { scaleX: 1, duration: 0.45, ease: 'power3.inOut' })
      .to(ledTxt, { opacity: 0, duration: 0.2 }, '<0.2')
      .to(shTop, { scaleY: 0, duration: 0.55, ease: 'power3.inOut' }, '>-0.05')
      .to(shBot, { scaleY: 0, duration: 0.55, ease: 'power3.inOut' }, '<')
      .to(beam, { opacity: 0, scaleY: 30, duration: 0.5, ease: 'power2.out' }, '<0.05');
    return tl;
  }
  function screenOff(done) {
    if (!hasGsap || calm) { done(); return; }
    screen.hidden = false;
    ledTxt.textContent = '';
    gsap.set([shTop, shBot], { scaleY: 0 });
    gsap.set(beam, { scaleX: 1, scaleY: 1, opacity: 0 });
    var tl = gsap.timeline({ onComplete: done });
    tl.to([shTop, shBot], { scaleY: 1, duration: 0.38, ease: 'power3.in' })
      .to(beam, { opacity: 1, duration: 0.1 }, '-=0.12')
      .to(beam, { scaleX: 0.005, duration: 0.3, ease: 'power3.in' });
  }

  // arrivée depuis une autre page de la maquette
  var fromNav = session.get('tvcq-nav') === '1';
  session.del('tvcq-nav');
  if (fromNav && !document.body.hasAttribute('data-intro')) screenOn();
  window.addEventListener('pageshow', function (e) { if (e.persisted) screen.hidden = true; });

  function cleanPath(p) { return p.replace(/\.html$/, '').replace(/\/index$/, '/').replace(/\/$/, '') || '/'; }
  function samePage(a, b) { return cleanPath(a) === cleanPath(b); }

  // départ vers une autre page
  document.addEventListener('click', function (e) {
    if (calm || !hasGsap || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest ? e.target.closest('a[href]') : null;
    if (!a || a.target === '_blank' || a.hasAttribute('download') || a.dataset.noTransition != null) return;
    var url;
    try { url = new URL(a.getAttribute('href'), location.href); } catch (err) { return; }
    if (url.origin !== location.origin) return;
    if (samePage(url.pathname, location.pathname) && url.search === location.search) return; // même page : ancre
    e.preventDefault();
    session.set('tvcq-nav', '1');
    screenOff(function () { location.href = url.href; });
  });

  // ancres internes : défilement fluide (aussi pour « index.html#contact » depuis l'accueil)
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href*="#"]') : null;
    if (!a || e.defaultPrevented) return;
    var u;
    try { u = new URL(a.getAttribute('href'), location.href); } catch (err) { return; }
    if (u.origin !== location.origin || !samePage(u.pathname, location.pathname)) return;
    var id = decodeURIComponent(u.hash.slice(1));
    var target = id && document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    scrollTo(target);
    focusTarget(target);
    if (history.replaceState && !document.body.hasAttribute('data-hash-route')) history.replaceState(null, '', '#' + id);
  }, true);

  function focusTarget(t) {
    if (!t.matches('a[href], button, input, select, textarea, [tabindex]')) t.setAttribute('tabindex', '-1');
    try { t.focus({ preventScroll: true }); } catch (err) { t.focus(); }
  }

  // raccourcis à une touche : seulement quand aucun champ ni bouton n'a le focus, et jamais en mode calme
  function shortcutsAllowed(e) {
    if (calm || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return false;
    var a = document.activeElement;
    return !a || a === document.body || a === document.documentElement;
  }

  /* ---------- En-tête : menu mobile, mode calme ---------- */
  var menuBtn = document.querySelector('[data-menu]');
  var mobileNav = document.getElementById('mobile-nav');
  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', function () {
      var open = mobileNav.hidden;
      mobileNav.hidden = !open;
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.textContent = open ? 'Fermer' : 'Menu';
    });
    mobileNav.addEventListener('click', function (e) {
      if (e.target.closest('a')) { mobileNav.hidden = true; menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.textContent = 'Menu'; }
    });
  }
  document.querySelectorAll('[data-calm-toggle]').forEach(function (b) {
    b.setAttribute('aria-pressed', String(calm));
    b.addEventListener('click', function () {
      local.set('tvcq-calme', calm ? '0' : '1');
      window.dispatchEvent(new Event('tvcq:save'));
      location.reload();
    });
  });

  /* ---------- Panier ---------- */
  var CART_KEY = 'tvcq-panier';
  function readCart() {
    try {
      var o = JSON.parse(local.get(CART_KEY) || '{}');
      return o && typeof o === 'object' ? o : {};
    } catch (e) { return {}; }
  }
  var cart = readCart();
  window.addEventListener('storage', function (e) {
    if (e.key !== CART_KEY) return;
    cart = readCart(); updateCount(); renderCart();
  });
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    cart = readCart(); updateCount(); renderCart();
  });
  var cartView = 'list';
  var payChoice = '';

  function lines() {
    return Object.keys(cart).map(function (id) { return { a: D.parId(id), q: cart[id] | 0 }; })
      .filter(function (l) { return l.a && l.q > 0; });
  }
  function totals() {
    var sub = 0, n = 0;
    lines().forEach(function (l) { sub += l.a.prix * l.q; n += l.q; });
    var tps = round2(sub * D.taxes.tps);
    var tvq = round2(sub * D.taxes.tvq);
    return { sub: sub, tps: tps, tvq: tvq, total: round2(sub + tps + tvq), articles: n, points: n * D.fidelite.niveaux[0].parArticle };
  }
  function persist() {
    local.set(CART_KEY, JSON.stringify(cart));
    updateCount();
    renderCart();
  }
  function updateCount() {
    var n = totals().articles;
    document.querySelectorAll('[data-cart-count]').forEach(function (c) { c.textContent = n; });
    document.querySelectorAll('[data-cart-open]').forEach(function (b) {
      b.setAttribute('aria-label', 'Ouvrir le panier, ' + n + (n > 1 ? ' articles' : ' article'));
    });
  }

  var scrim = el('<div class="cart-scrim" hidden></div>');
  var drawer = el(
    '<aside class="cart" role="dialog" aria-modal="true" aria-labelledby="cart-title" data-lenis-prevent hidden>' +
      '<div class="cart-head"><h2 id="cart-title" tabindex="-1">Panier</h2>' +
      '<button class="icon-btn" type="button" data-cart-close aria-label="Fermer le panier">' +
      '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M3 3l12 12M15 3L3 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button></div>' +
      '<div class="cart-body" data-lenis-prevent></div>' +
      '<div class="cart-foot"></div>' +
    '</aside>'
  );
  document.body.appendChild(scrim);
  document.body.appendChild(drawer);
  var cartBody = drawer.querySelector('.cart-body');
  var cartFoot = drawer.querySelector('.cart-foot');
  var lastFocus = null;

  function renderCart() {
    var ls = lines();
    var t = totals();
    if (cartView === 'done') return;
    if (!ls.length) {
      cartBody.innerHTML = '<div class="cart-empty"><p>Votre panier est vide.</p>' +
        '<a class="btn btn--sm" href="boutique.html">Voir les appareils <span class="arrow">→</span></a></div>';
      cartFoot.hidden = true;
      return;
    }
    cartFoot.hidden = false;
    cartBody.innerHTML = ls.map(function (l) {
      return '<div class="cart-item" data-id="' + l.a.id + '">' +
        '<div class="thumb"><img src="' + D.src(l.a) + '" alt="" width="72" height="72"></div>' +
        '<div><div class="nm">' + esc(l.a.nom) + '</div><div class="pr">' + money(l.a.prix) + ' l’unité</div>' +
        '<button class="rm" type="button" data-rm>Retirer</button></div>' +
        '<div class="qty" role="group" aria-label="Quantité pour ' + esc(l.a.court) + '">' +
        '<button type="button" data-dec aria-label="Retirer un">−</button><output>' + l.q + '</output>' +
        '<button type="button" data-inc aria-label="Ajouter un">+</button></div>' +
      '</div>';
    }).join('');
    var tiers = D.fidelite.niveaux[0];
    cartFoot.innerHTML =
      '<div class="sum">' +
        '<div><span>Sous-total</span><span>' + money(t.sub) + '</span></div>' +
        '<div><span>TPS (5 %)</span><span>' + money(t.tps) + '</span></div>' +
        '<div><span>TVQ (9,975 %)</span><span>' + money(t.tvq) + '</span></div>' +
        '<div><span>Livraison</span><span class="todo">à compléter</span></div>' +
        '<div class="tot"><span>Total</span><span>' + money(t.total) + '</span></div>' +
      '</div>' +
      '<div class="pts"><span aria-hidden="true">★</span><span>Niveau ' + tiers.nom + ' : cette commande rapporterait <strong>' + t.points + ' points</strong> (' + tiers.parArticle + ' par article).</span></div>' +
      '<fieldset class="paychoice"><legend>Paiement</legend>' +
        D.paiements.map(function (p, i) {
          return '<label><input type="radio" name="pay" value="' + esc(p) + '"' + (payChoice === p ? ' checked' : '') + ' id="pay-' + i + '"> ' + esc(p) + '</label>';
        }).join('') +
      '</fieldset>' +
      '<button class="btn btn--signal btn--block" type="button" data-checkout' + (payChoice ? '' : ' disabled') + '>Passer la commande (simulation)</button>';
  }

  function renderDone() {
    var t = totals();
    var ls = lines();
    cartFoot.hidden = false;
    cartBody.innerHTML = '<div class="cart-done">' +
      '<span class="badge-demo">Simulation</span>' +
      '<p class="big" tabindex="-1">Commande simulée</p>' +
      '<p class="muted">Ceci est une maquette : aucune commande n’est transmise et aucun paiement n’est demandé.</p>' +
      '<div class="sum">' + ls.map(function (l) {
        return '<div><span>' + l.q + ' × ' + esc(l.a.court) + '</span><span>' + money(l.a.prix * l.q) + '</span></div>';
      }).join('') +
      '<div class="tot"><span>Total taxes incluses</span><span>' + money(t.total) + '</span></div></div>' +
      '<p>Paiement choisi : <strong>' + esc(payChoice) + '</strong></p>' +
      '</div>';
    cartFoot.innerHTML = '<button class="btn btn--block" type="button" data-cart-reset>Vider le panier et fermer</button>';
  }

  function refocus(sel) {
    var n = sel && drawer.querySelector(sel);
    (n || drawer.querySelector('#cart-title')).focus();
  }
  drawer.addEventListener('click', function (e) {
    var item = e.target.closest('.cart-item');
    var id = item && item.dataset.id;
    if (e.target.closest('[data-inc]') && id) { cart[id] = (cart[id] || 0) + 1; persist(); refocus('.cart-item[data-id="' + id + '"] [data-inc]'); }
    else if (e.target.closest('[data-dec]') && id) {
      cart[id] = Math.max(0, (cart[id] || 0) - 1); if (!cart[id]) delete cart[id]; persist();
      refocus(cart[id] ? '.cart-item[data-id="' + id + '"] [data-dec]' : null);
    }
    else if (e.target.closest('[data-rm]') && id) { delete cart[id]; persist(); refocus(null); }
    else if (e.target.closest('[data-checkout]') && payChoice) { cartView = 'done'; renderDone(); refocus('.cart-done .big'); }
    else if (e.target.closest('[data-cart-reset]')) { cart = {}; cartView = 'list'; payChoice = ''; persist(); closeCart(); }
    else if (e.target.closest('[data-cart-close]')) closeCart();
  });
  drawer.addEventListener('change', function (e) {
    if (e.target.name === 'pay') {
      payChoice = e.target.value;
      var b = drawer.querySelector('[data-checkout]');
      if (b) b.disabled = false;
    }
  });
  scrim.addEventListener('click', closeCart);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !drawer.hidden) { e.preventDefault(); closeCart(); }
  });
  // la tabulation boucle dans le tiroir (un seul arrêt par groupe de boutons radio)
  function focusables() {
    return Array.prototype.filter.call(drawer.querySelectorAll('button, a[href], input'), function (n) {
      if (n.disabled || n.offsetParent === null) return false;
      if (n.type === 'radio') {
        var g = drawer.querySelectorAll('input[name="' + n.name + '"]');
        var chk = Array.prototype.filter.call(g, function (x) { return x.checked; })[0];
        return chk ? n === chk : n === g[0];
      }
      return true;
    });
  }
  drawer.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab') return;
    var f = focusables();
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    var a = document.activeElement;
    if (e.shiftKey && (a === first || !drawer.contains(a) || a.id === 'cart-title')) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && a === last) { e.preventDefault(); first.focus(); }
  });
  function setInert(on) {
    Array.prototype.forEach.call(document.body.children, function (n) {
      if (n === drawer || n === scrim || n === toastEl || n.tagName === 'SCRIPT') return;
      if (on) n.setAttribute('inert', ''); else n.removeAttribute('inert');
    });
  }

  function openCart() {
    lastFocus = document.activeElement;
    toastEl.hidden = true;
    if (cartView !== 'done') renderCart();
    scrim.hidden = false; drawer.hidden = false;
    setInert(true);
    if (lenis) lenis.stop();
    if (hasGsap && !calm) {
      gsap.fromTo(drawer, { xPercent: 100 }, { xPercent: 0, duration: 0.55, ease: 'power4.out' });
      gsap.fromTo(scrim, { opacity: 0 }, { opacity: 1, duration: 0.3 });
    }
    var c = drawer.querySelector('[data-cart-close]');
    if (c) c.focus();
  }
  function closeCart() {
    if (drawer.hidden) return;
    setInert(false);
    var finish = function () {
      drawer.hidden = true; scrim.hidden = true;
      if (lenis) lenis.start();
      if (cartView === 'done') { cartView = 'list'; }
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };
    if (hasGsap && !calm) {
      gsap.to(scrim, { opacity: 0, duration: 0.25 });
      gsap.to(drawer, { xPercent: 100, duration: 0.4, ease: 'power3.in', onComplete: finish });
    } else finish();
  }
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-cart-open]')) { e.preventDefault(); openCart(); }
  });

  function flyToCart(img) {
    var btn = document.querySelector('.site-header [data-cart-open]');
    if (!img || !btn || !hasGsap || calm) { if (btn) { btn.classList.remove('bump'); void btn.offsetWidth; btn.classList.add('bump'); } return; }
    var r = img.getBoundingClientRect();
    var b = btn.getBoundingClientRect();
    if (!r.width) return;
    var clone = img.cloneNode(false);
    clone.removeAttribute('srcset');
    clone.className = 'fly';
    clone.style.cssText = 'left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px;';
    document.body.appendChild(clone);
    var dx = b.left + b.width / 2 - (r.left + r.width / 2);
    var dy = b.top + b.height / 2 - (r.top + r.height / 2);
    var tl = gsap.timeline({ onComplete: function () {
      clone.remove();
      btn.classList.remove('bump'); void btn.offsetWidth; btn.classList.add('bump');
    } });
    tl.to(clone, { x: dx, duration: 0.85, ease: 'power1.inOut' }, 0)
      .to(clone, { y: dy, duration: 0.85, ease: 'back.in(1.6)' }, 0)
      .to(clone, { scale: 0.12, rotation: 18, duration: 0.85, ease: 'power2.in' }, 0)
      .to(clone, { opacity: 0, duration: 0.15 }, 0.72);
  }

  function addToCart(id, qty, img) {
    var a = D.parId(id);
    if (!a) return;
    cart[id] = (cart[id] || 0) + (qty || 1);
    persist();
    flyToCart(img);
    toast((qty > 1 ? qty + ' × ' : '') + a.court + ' ajouté au panier');
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-add]');
    if (!b) return;
    e.preventDefault();
    var scope = b.closest('[data-product]') || document;
    var img = scope.querySelector('[data-product-img]') || scope.querySelector('img');
    var qtyEl = scope.querySelector('[data-qty]');
    var qty = qtyEl ? Math.max(1, parseInt(qtyEl.value || qtyEl.textContent, 10) || 1) : 1;
    addToCart(b.dataset.add, qty, img);
  });

  updateCount();
  renderCart();

  /* ---------- Télécommande 3D ---------- */
  function mountRemote(container, opts) {
    var url = new URL('remote3d.js', SCRIPT_URL).href;
    return import(url).then(function (m) { return m.createRemote(container, Object.assign({ calm: calm }, opts || {})); })
      .catch(function (err) {
        if (window.console) console.warn('Télécommande 3D indisponible, version SVG affichée.', err);
        return null;
      });
  }

  /* ---------- Démarrage commun ---------- */
  function boot(scope) {
    magnetic(scope); tilt(scope); reveal(scope);
  }
  var fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
  fontsReady.then(function () { splitHeadings(); if (window.ScrollTrigger) window.ScrollTrigger.refresh(); });
  boot();

  // touche Échap ferme le menu mobile
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mobileNav && !mobileNav.hidden) { mobileNav.hidden = true; if (menuBtn) { menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.textContent = 'Menu'; } }
  });

  window.TVCQ.ui = {
    shortcutsAllowed: shortcutsAllowed, focusTarget: focusTarget,
    calm: calm, finePointer: finePointer, lenis: lenis, hasGsap: hasGsap,
    money: money, money0: money0, round2: round2, esc: esc, el: el,
    setOSD: setOSD, toast: toast, scrollTo: scrollTo,
    screenOn: screenOn, boot: boot, splitHeadings: splitHeadings,
    addToCart: addToCart, openCart: openCart, mountRemote: mountRemote,
    session: session, local: local
  };
})();

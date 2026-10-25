/* Boutique : présentoir à croix directionnelle, filtres, cartes, comparateur. */
(function () {
  'use strict';
  var D = window.TVCQ;
  var ui = D.ui;
  var gsap = window.gsap;
  var motion = !ui.calm && !!gsap;
  var list = D.appareils;

  /* ---------- Présentoir ---------- */
  var stage = document.querySelector('[data-stage]');
  var panel = document.querySelector('[data-stage-panel]');
  var dots = document.querySelector('[data-dots]');
  var cur = 0;

  stage.innerHTML = list.map(function (a, i) {
    return '<div class="stage-item" data-i="' + i + '" role="group" aria-roledescription="appareil" aria-label="' + ui.esc(a.nom) + ', ' + (i + 1) + ' sur ' + list.length + '">' +
      '<img src="' + D.src(a) + '" srcset="' + D.srcset(a) + '" sizes="(min-width: 980px) 30vw, 46vw" alt="' + ui.esc(a.nom) + ', photo du produit" width="' + a.img.w[a.img.w.length - 1] + '" height="' + Math.round(a.img.w[a.img.w.length - 1] / a.img.ratio) + '">' +
      '<div class="pedestal" aria-hidden="true"></div></div>';
  }).join('');
  dots.innerHTML = list.map(function (a, i) {
    return '<button type="button" data-dot="' + i + '" aria-label="' + ui.esc(a.court) + '"></button>';
  }).join('');
  var items = Array.prototype.slice.call(stage.querySelectorAll('.stage-item'));

  function layout(animate) {
    items.forEach(function (it, i) {
      var d = i - cur;
      var ad = Math.abs(d);
      var props = {
        xPercent: d * 82,
        z: -ad * 320,
        rotationY: -d * 34,
        scale: ad === 0 ? 1 : 0.78,
        opacity: ad > 1 ? 0 : ad === 1 ? 0.5 : 1,
        zIndex: 10 - ad
      };
      it.classList.toggle('is-current', d === 0);
      it.setAttribute('aria-hidden', String(d !== 0));
      if (gsap && animate && motion) gsap.to(it, Object.assign({ duration: 0.8, ease: 'power3.out' }, props));
      else if (gsap) gsap.set(it, props);
      else it.style.transform = 'translateX(' + d * 64 + '%) scale(' + props.scale + ')';
    });
    dots.querySelectorAll('button').forEach(function (b, i) { b.setAttribute('aria-current', String(i === cur)); });
    var a = list[cur];
    var nm = panel.querySelector('[data-sp-name]');
    panel.querySelector('[data-sp-idx]').textContent = String(cur + 1).padStart(2, '0') + ' / ' + String(list.length).padStart(2, '0');
    panel.querySelector('[data-sp-acc]').textContent = a.accroche;
    panel.querySelector('[data-sp-add]').dataset.add = a.id;
    panel.querySelector('[data-sp-link]').setAttribute('href', 'appareil.html#' + a.id);
    panel.dataset.current = a.id;
    var price = panel.querySelector('[data-sp-price]');
    if (motion && animate && window.ScrambleTextPlugin) {
      gsap.to(nm, { duration: 0.6, scrambleText: { text: a.nom, chars: 'upperCase', speed: 0.7, revealDelay: 0.15 } });
      gsap.to(price, { duration: 0.5, scrambleText: { text: ui.money(a.prix), chars: '0123456789', speed: 0.8 } });
    } else {
      nm.textContent = a.nom;
      price.textContent = ui.money(a.prix);
    }
    ui.setOSD('BOUTIQUE', a.court);
  }
  function go(n) {
    var next = Math.max(0, Math.min(list.length - 1, n));
    if (next === cur) {
      if (motion) gsap.fromTo(items[cur], { x: 0 }, { x: n < 0 ? 18 : -18, duration: 0.12, yoyo: true, repeat: 1 });
      return;
    }
    cur = next;
    layout(true);
  }
  stage.addEventListener('click', function (e) {
    var it = e.target.closest('.stage-item');
    if (!it) return;
    var i = +it.dataset.i;
    if (i === cur) location.href = 'appareil.html#' + list[i].id;
    else go(i);
  });
  dots.addEventListener('click', function (e) { var b = e.target.closest('[data-dot]'); if (b) go(+b.dataset.dot); });
  panel.querySelectorAll('[data-dir]').forEach(function (b) {
    b.addEventListener('click', function () { go(cur + parseInt(b.dataset.dir, 10)); });
  });
  panel.querySelector('[data-sp-ok]').addEventListener('click', function () {
    ui.addToCart(list[cur].id, 1, items[cur].querySelector('img'));
  });
  // le bouton « Ajouter au panier » doit faire voler l'appareil du présentoir
  panel.querySelector('[data-sp-add]').addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    ui.addToCart(list[cur].id, 1, items[cur].querySelector('img'));
  });
  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var t = e.target;
    if (t && t.closest && t.closest('input, select, textarea, .cart, .compare-wrap')) return;
    var heroVisible = stage.getBoundingClientRect().bottom > 0;
    if (!heroVisible) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); }
    else if (e.key === 'Enter' && t === stage) { e.preventDefault(); ui.addToCart(list[cur].id, 1, items[cur].querySelector('img')); }
  });
  // balayage tactile
  var sx = null;
  stage.addEventListener('pointerdown', function (e) { sx = e.clientX; });
  stage.addEventListener('pointerup', function (e) {
    if (sx == null) return;
    var dx = e.clientX - sx;
    sx = null;
    if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1));
  });
  layout(false);
  if (motion) {
    gsap.from(items.map(function (it) { return it.querySelector('img'); }), { opacity: 0, y: 70, rotationX: -25, duration: 1.1, stagger: 0.08, ease: 'power3.out', delay: 0.35 });
  }

  /* ---------- Catalogue filtrable ---------- */
  var grid = document.querySelector('[data-grid]');
  var fPrix = document.getElementById('f-prix');
  var fStock = document.getElementById('f-stock');
  var fTri = document.getElementById('f-tri');
  var fEth = document.getElementById('f-eth');
  var prixOut = document.querySelector('[data-prix-out]');
  var count = document.querySelector('[data-count]');

  function fact(v) { return v ? '<span>' + ui.esc(v) + '</span>' : ''; }
  function card(a) {
    var tags = [];
    if (a.specs.ethernet) tags.push('Ethernet');
    if (a.specs.garantie) tags.push('Garantie ' + a.specs.garantie);
    return '<article class="shop-card" data-product data-id="' + a.id + '">' +
      '<a class="plinth" href="appareil.html#' + a.id + '" data-tilt="9" tabindex="-1" aria-hidden="true">' +
        '<span class="tagline">' + tags.map(function (t) { return '<span>' + t + '</span>'; }).join('') + '</span>' +
        '<img data-product-img src="' + D.src(a) + '" srcset="' + D.srcset(a) + '" sizes="(min-width: 1040px) 30vw, (min-width: 640px) 46vw, 92vw" alt="' + ui.esc(a.nom) + ', photo du produit" loading="lazy" width="' + a.img.w[a.img.w.length - 1] + '" height="' + Math.round(a.img.w[a.img.w.length - 1] / a.img.ratio) + '">' +
      '</a>' +
      '<div class="body">' +
        '<div class="top"><h3>' + ui.esc(a.nom) + '</h3><span class="price">' + ui.money(a.prix) + '</span></div>' +
        '<p class="muted" style="font-size:.92rem">' + ui.esc(a.accroche) + '</p>' +
        '<div class="facts">' + fact(a.specs.systeme) + fact(a.specs.stockage) + fact(a.specs.video) + '</div>' +
        '<div class="actions"><button class="btn btn--signal btn--sm" type="button" data-add="' + a.id + '">Ajouter au panier</button>' +
        '<a class="btn btn--ghost btn--sm" href="appareil.html#' + a.id + '" aria-label="Voir la fiche : ' + ui.esc(a.nom) + '">Fiche</a></div>' +
      '</div></article>';
  }
  function renderGrid(animate) {
    var max = +fPrix.value;
    var minStock = +fStock.value;
    var eth = fEth.getAttribute('aria-pressed') === 'true';
    prixOut.textContent = ui.money0(max);
    var rows = list.filter(function (a) { return a.prix <= max && a.specs.stockageGo >= minStock && (!eth || a.specs.ethernet); });
    var t = fTri.value;
    rows.sort(function (x, y) {
      if (t === '-prix') return y.prix - x.prix;
      if (t === 'stock') return y.specs.stockageGo - x.specs.stockageGo || x.prix - y.prix;
      return x.prix - y.prix;
    });
    grid.innerHTML = rows.length ? rows.map(card).join('') : '<div class="empty-filter">Aucun appareil ne correspond. Essayez un prix maximum plus élevé ou retirez un filtre.</div>';
    count.textContent = rows.length + (rows.length > 1 ? ' appareils' : ' appareil');
    ui.boot(grid);
    if (animate && motion) gsap.from(grid.children, { y: 24, opacity: 0, duration: 0.5, stagger: 0.05, ease: 'power3.out' });
  }
  // le curseur de prix met la liste à jour en continu, l'animation ne joue qu'au relâchement
  fPrix.addEventListener('input', function () { renderGrid(false); });
  fPrix.addEventListener('change', function () { renderGrid(true); });
  [fStock, fTri].forEach(function (f) { f.addEventListener('change', function () { renderGrid(true); }); });
  fEth.addEventListener('click', function () {
    fEth.setAttribute('aria-pressed', String(fEth.getAttribute('aria-pressed') !== 'true'));
    renderGrid(true);
  });
  renderGrid(false);

  /* ---------- Comparateur ---------- */
  var table = document.querySelector('[data-compare]');
  var maxPrix = Math.max.apply(null, list.map(function (a) { return a.prix; }));
  var maxStock = Math.max.apply(null, list.map(function (a) { return a.specs.stockageGo; }));
  function cell(v) { return v == null ? '<span class="todo">à compléter</span>' : ui.esc(v); }
  function dims(a) { var d = a.specs.dimensions; return d ? d.longueur + ' × ' + d.largeur + ' × ' + String(d.epaisseur).replace('.', ',') + ' mm' : null; }
  var rowsDef = [
    ['Prix', function (a) { return '<span class="mono">' + ui.money(a.prix) + '</span><div class="bar"><span data-w="' + (a.prix / maxPrix).toFixed(3) + '"></span></div>'; }],
    ['Système', function (a) { return cell(a.specs.systeme); }],
    ['Mémoire vive', function (a) { return cell(a.specs.memoire); }],
    ['Stockage', function (a) { return cell(a.specs.stockage) + '<div class="bar"><span data-w="' + (a.specs.stockageGo / maxStock).toFixed(3) + '"></span></div>'; }],
    ['Vidéo', function (a) { return cell(a.specs.video); }],
    ['Audio', function (a) { return cell(a.specs.audio); }],
    ['Réseau', function (a) { return cell(a.specs.reseau); }],
    ['Ports', function (a) { return cell(a.specs.ports); }],
    ['Garantie', function (a) { return cell(a.specs.garantie); }],
    ['Dimensions', function (a) { return cell(dims(a)); }]
  ];
  table.innerHTML = '<caption class="sr-only">Comparaison des cinq appareils</caption><thead><tr><th scope="col"><span class="sr-only">Caractéristique</span></th>' +
    list.map(function (a) { return '<th scope="col"><a href="appareil.html#' + a.id + '" style="text-decoration:none">' + ui.esc(a.court) + '</a></th>'; }).join('') + '</tr></thead><tbody>' +
    rowsDef.map(function (r) {
      return '<tr><th scope="row">' + r[0] + '</th>' + list.map(function (a) { return '<td>' + r[1](a) + '</td>'; }).join('') + '</tr>';
    }).join('') + '</tbody>';
  var bars = table.querySelectorAll('.bar span');
  if (motion && window.ScrollTrigger) {
    bars.forEach(function (b) { gsap.set(b, { scaleX: 0 }); });
    window.ScrollTrigger.create({
      trigger: table, start: 'top 80%', once: true,
      onEnter: function () { bars.forEach(function (b, i) { gsap.to(b, { scaleX: +b.dataset.w, duration: 1.1, delay: (i % 5) * 0.06, ease: 'power3.out' }); }); }
    });
  } else {
    bars.forEach(function (b) { b.style.transform = 'scaleX(' + b.dataset.w + ')'; });
  }

  ui.boot();
})();

/* Fiche appareil : un seul gabarit pour les cinq appareils (appareil.html#identifiant).
   Loupe sur la photo, plan coté qui se dessine, quantité, points de fidélité. */
(function () {
  'use strict';
  var D = window.TVCQ;
  var ui = D.ui;
  var gsap = window.gsap;
  var motion = !ui.calm && !!gsap;
  var list = D.appareils;

  var pick = document.querySelector('[data-pick]');
  var visual = document.querySelector('[data-zoom]');
  var img = visual.querySelector('img');
  var qtyOut = document.querySelector('[data-qty]');
  var current = null;

  function idFromHash() {
    var h = decodeURIComponent((location.hash || '').slice(1));
    return D.parId(h) ? h : list[0].id;
  }

  function specRows(a) {
    var s = a.specs;
    var d = s.dimensions;
    var rows = [
      ['Prix', ui.money(a.prix) + ' + taxes'],
      ['Système', s.systeme], ['Mémoire vive', s.memoire], ['Stockage', s.stockage],
      ['Vidéo', s.video], ['Audio', s.audio], ['Réseau', s.reseau], ['Ports', s.ports],
      ['Garantie', s.garantie],
      ['Dimensions', d ? d.longueur + ' × ' + d.largeur + ' × ' + String(d.epaisseur).replace('.', ',') + ' mm' : null]
    ];
    a.extras.forEach(function (x, i) { rows.push([i === 0 ? 'Autres' : '', x]); });
    return rows.map(function (r) {
      var v = r[1] == null ? '<span class="todo">à compléter</span>' : '<span data-scr="' + ui.esc(r[1]) + '">' + ui.esc(r[1]) + '</span>';
      return '<tr><th scope="row">' + r[0] + '</th><td>' + v + '</td></tr>';
    }).join('');
  }

  /* Position de l'appareil parmi les cinq : prix et stockage, un point par appareil */
  function rangeChart(a) {
    var W = 520, L = 96, R = 500;
    var rows = [
      { key: 'prix', label: 'Prix', min: 150, max: 375, ticks: [200, 250, 300, 350], fmt: function (v) { return v + ' $'; }, val: function (x) { return x.prix; } },
      { key: 'stock', label: 'Stockage', min: 0, max: 34, ticks: [8, 16, 32], fmt: function (v) { return v + ' Go'; }, val: function (x) { return x.specs.stockageGo; } }
    ];
    var rowH = 92, top = 34;
    var byPrice = list.slice().sort(function (p, q) { return p.prix - q.prix; });
    var lo = byPrice[0], hi = byPrice[byPrice.length - 1];
    var stocks = list.map(function (x) { return x.specs.stockageGo; });
    var loS = Math.min.apply(null, stocks), hiS = Math.max.apply(null, stocks);
    var H = top + rows.length * rowH;
    var out = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + ui.esc(a.court) + ' : ' + ui.money0(a.prix) + ' et ' + a.specs.stockageGo + ' Go de stockage, parmi les cinq appareils de ' + ui.money0(lo.prix) + ' à ' + ui.money0(hi.prix) + ' et de ' + loS + ' à ' + hiS + ' Go.">';
    rows.forEach(function (r, ri) {
      var y = top + ri * rowH + 40;
      var sx = function (v) { return L + (v - r.min) / (r.max - r.min) * (R - L); };
      out += '<text x="0" y="' + (y + 4) + '" class="rc-lab">' + r.label + '</text>';
      out += '<line x1="' + L + '" x2="' + R + '" y1="' + y + '" y2="' + y + '" class="rc-axis"/>';
      r.ticks.forEach(function (t) {
        out += '<line x1="' + sx(t) + '" x2="' + sx(t) + '" y1="' + (y + 4) + '" y2="' + (y + 9) + '" class="rc-tick"/>' +
          '<text x="' + sx(t) + '" y="' + (y + 24) + '" text-anchor="middle" class="rc-tickl">' + r.fmt(t) + '</text>';
      });
      // empiler les appareils de même valeur
      // l'appareil affiché passe en haut de sa pile, pour que son étiquette reste lisible
      var seen = {};
      var ordered = list.filter(function (x) { return x !== a; }).concat([a]);
      var pts = ordered.map(function (x) {
        var v = r.val(x);
        var k = seen[v] = (seen[v] || 0) + 1;
        return { x: x, v: v, cx: sx(v), cy: y - (k - 1) * 15 };
      });
      pts.forEach(function (p) {
        var cur = p.x === a;
        out += '<g class="rc-dot' + (cur ? ' is-cur' : '') + '" tabindex="0" data-tip="' + ui.esc(p.x.court + ' · ' + r.fmt(p.v)) + '">' +
          '<circle cx="' + p.cx + '" cy="' + p.cy + '" r="13" class="rc-hit"/>' +
          '<circle cx="' + p.cx + '" cy="' + p.cy + '" r="' + (cur ? 8 : 6) + '" class="rc-mark"/></g>';
        if (cur) out += '<text x="' + p.cx + '" y="' + (p.cy - 16) + '" text-anchor="middle" class="rc-val">' + r.fmt(p.v) + '</text>';
      });
    });
    out += '</svg><div class="rc-tip" hidden></div>' +
      '<p class="rc-key"><span class="sw cur"></span>' + ui.esc(a.court) + '<span class="sw"></span>Les quatre autres appareils</p>';
    return out;
  }

  function bindTips(box) {
    var tip = box.querySelector('.rc-tip');
    function show(g) {
      var r = g.getBoundingClientRect(), b = box.getBoundingClientRect();
      tip.textContent = g.dataset.tip;
      tip.hidden = false;
      tip.style.left = (r.left + r.width / 2 - b.left) + 'px';
      tip.style.top = (r.top - b.top - 8) + 'px';
    }
    box.querySelectorAll('.rc-dot').forEach(function (g) {
      g.addEventListener('pointerenter', function () { show(g); });
      g.addEventListener('focus', function () { show(g); });
      g.addEventListener('pointerleave', function () { tip.hidden = true; });
      g.addEventListener('blur', function () { tip.hidden = true; });
    });
  }

  function blueprint(a) {
    var d = a.specs.dimensions;
    if (!d) return '';
    var k = 3.2, x0 = 50, y0 = 52;
    var L = d.longueur * k, W = d.largeur * k, T = d.epaisseur * k;
    var yS = y0 + W + 46;
    var ep = String(d.epaisseur).replace('.', ',');
    function dim(x1, y1, x2, y2, label, lx, ly, anchor) {
      return '<line class="bp" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="#ff9a72" stroke-width="1.4" marker-start="url(#ar)" marker-end="url(#ar)"/>' +
        '<text x="' + lx + '" y="' + ly + '" text-anchor="' + (anchor || 'middle') + '" fill="#ffd2bf" font-family="Geist Mono, monospace" font-size="14" font-weight="600">' + label + '</text>';
    }
    return '<span class="label">' + ui.esc(a.court) + ' · vues de dessus et de côté, à l’échelle</span>' +
      '<svg viewBox="0 0 460 ' + (yS + T + 40) + '" role="img" aria-label="Plan coté : ' + d.longueur + ' millimètres de long, ' + d.largeur + ' de large, ' + ep + ' d’épaisseur">' +
      '<defs><marker id="ar" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 1 L9 5 L0 9 z" fill="#ff9a72"/></marker></defs>' +
      '<rect class="bp" x="' + x0 + '" y="' + y0 + '" width="' + L + '" height="' + W + '" rx="14" fill="rgba(207,224,255,.06)" stroke="#cfe0ff" stroke-width="1.6"/>' +
      '<rect class="bp" x="' + (x0 + 14) + '" y="' + (y0 + 14) + '" width="' + (L - 28) + '" height="' + (W - 28) + '" rx="8" fill="none" stroke="#cfe0ff" stroke-opacity=".35" stroke-width="1"/>' +
      '<line class="bp" x1="' + (x0 - 10) + '" y1="' + (y0 + W / 2) + '" x2="' + (x0 + L + 10) + '" y2="' + (y0 + W / 2) + '" stroke="#cfe0ff" stroke-opacity=".3" stroke-dasharray="10 4 2 4"/>' +
      dim(x0, y0 - 22, x0 + L, y0 - 22, d.longueur + ' mm', x0 + L / 2, y0 - 30) +
      dim(x0 + L + 26, y0, x0 + L + 26, y0 + W, d.largeur + ' mm', x0 + L + 38, y0 + W / 2 + 5, 'start') +
      '<rect class="bp" x="' + x0 + '" y="' + yS + '" width="' + L + '" height="' + T + '" rx="6" fill="rgba(207,224,255,.06)" stroke="#cfe0ff" stroke-width="1.6"/>' +
      dim(x0 + L + 26, yS, x0 + L + 26, yS + T, ep + ' mm', x0 + L + 38, yS + T / 2 + 5, 'start') +
      '<text x="' + x0 + '" y="' + (yS + T + 28) + '" fill="#9fb6dc" font-family="Geist Mono, monospace" font-size="11" letter-spacing="1">ÉCHELLE 3,2 PX = 1 MM · DIMENSIONS DU SITE ACTUEL</text>' +
      '</svg>';
  }

  function render(id, animate) {
    var a = D.parId(id);
    if (!a || a === current) return;
    current = a;
    var i = list.indexOf(a);
    document.title = a.court + ' · Tv-Centre du Québec';
    pick.innerHTML = list.map(function (x) {
      return '<a href="appareil.html#' + x.id + '"' + (x === a ? ' aria-current="page"' : '') + '>' + ui.esc(x.court) + '</a>';
    }).join('');
    document.querySelector('[data-crumb]').textContent = a.court;
    document.querySelector('[data-p-idx]').textContent = String(i + 1).padStart(2, '0') + ' / ' + String(list.length).padStart(2, '0');
    document.querySelector('[data-p-name]').textContent = a.nom;
    document.querySelector('[data-p-acc]').textContent = a.accroche;
    document.querySelector('[data-p-price]').textContent = ui.money(a.prix);
    document.querySelector('[data-p-add]').dataset.add = a.id;
    var lvl = D.fidelite.niveaux;
    document.querySelector('[data-p-facts]').innerHTML =
      '<div>Garantie : ' + (a.specs.garantie ? ui.esc(a.specs.garantie) : '<span class="todo">à compléter</span>') + '</div>' +
      '<div>Configuration à distance : <span class="todo">conditions à compléter</span></div>' +
      '<div>Fidélité : ' + lvl[0].parArticle + ' points par article au niveau Basique, ' + lvl[2].parArticle + ' au niveau Or</div>' +
      '<div>Paiement : virement Interac ou carte de crédit</div>';
    qtyOut.textContent = '1';

    var swap = function () {
      img.src = D.src(a);
      img.srcset = D.srcset(a);
      img.sizes = '(min-width: 960px) 40vw, 90vw';
      img.alt = a.nom + ', photo du produit';
      img.width = a.img.w[a.img.w.length - 1];
      img.height = Math.round(img.width / a.img.ratio);
    };
    if (animate && motion) {
      gsap.timeline()
        .to(img, { y: -30, opacity: 0, rotationY: -25, duration: 0.25, ease: 'power2.in' })
        .add(swap)
        .fromTo(img, { y: 40, opacity: 0, rotationY: 25 }, { y: 0, opacity: 1, rotationY: 0, duration: 0.7, ease: 'power3.out' });
      gsap.from('[data-p-name], [data-p-acc], .price-big', { y: 20, opacity: 0, duration: 0.6, stagger: 0.06 });
    } else swap();

    var table = document.querySelector('[data-specs]');
    table.innerHTML = '<caption class="sr-only">Caractéristiques de ' + ui.esc(a.nom) + '</caption><tbody>' + specRows(a) + '</tbody>';
    document.querySelector('[data-specs-title]').textContent = a.court + ' en détail';
    var range = document.querySelector('[data-range]');
    range.innerHTML = rangeChart(a);
    bindTips(range);
    var bp = document.querySelector('[data-blueprint]');
    var bpHtml = blueprint(a);
    bp.innerHTML = bpHtml;
    bp.hidden = !bpHtml;
    document.querySelector('[data-bp-label]').hidden = !bpHtml;
    drawIn(table, bp, range);

    document.querySelector('[data-others]').innerHTML = list.filter(function (x) { return x !== a; }).map(function (x) {
      return '<a class="mini-card" href="appareil.html#' + x.id + '"><span class="ph"><img src="' + D.src(x) + '" alt="" loading="lazy" width="' + x.img.w[0] + '" height="' + Math.round(x.img.w[0] / x.img.ratio) + '"></span>' +
        '<span class="nm">' + ui.esc(x.nom) + '</span><span class="pr">' + ui.money(x.prix) + '</span></a>';
    }).join('');
    ui.setOSD('FICHE', a.court);
  }

  var drawn = false;
  function drawIn(table, bp, range) {
    if (!motion || !window.ScrollTrigger) return;
    var run = function () {
      if (window.DrawSVGPlugin) gsap.from(bp.querySelectorAll('.bp'), { drawSVG: '0%', duration: 1.4, stagger: 0.12, ease: 'power2.inOut' });
      if (range) {
        if (window.DrawSVGPlugin) gsap.from(range.querySelectorAll('.rc-axis'), { drawSVG: '0%', duration: 0.9, stagger: 0.15, ease: 'power2.inOut' });
        gsap.from(range.querySelectorAll('.rc-mark'), { attr: { r: 0 }, duration: 0.6, stagger: 0.05, delay: 0.4, ease: 'back.out(2)' });
      }
      if (window.ScrambleTextPlugin) table.querySelectorAll('[data-scr]').forEach(function (s, i) {
        gsap.to(s, { duration: 0.8, delay: i * 0.04, scrambleText: { text: s.dataset.scr, chars: 'ABCDEFGHJKLMNPRSTUVXYZ0123456789', speed: 0.7, revealDelay: 0.2 } });
      });
    };
    if (drawn) { run(); return; }
    window.ScrollTrigger.create({ trigger: range || bp, start: 'top 85%', once: true, onEnter: function () { drawn = true; run(); } });
  }

  /* Quantité */
  document.querySelectorAll('[data-q]').forEach(function (b) {
    b.addEventListener('click', function () {
      var q = Math.max(1, Math.min(9, (parseInt(qtyOut.textContent, 10) || 1) + parseInt(b.dataset.q, 10)));
      qtyOut.textContent = String(q);
    });
  });

  /* Loupe */
  if (ui.finePointer && motion) {
    var lens = document.createElement('div');
    lens.className = 'zoom-lens';
    lens.hidden = true;
    lens.setAttribute('aria-hidden', 'true');
    visual.appendChild(lens);
    var Z = 2.4;
    visual.addEventListener('pointermove', function (e) {
      var r = img.getBoundingClientRect();
      var vr = visual.getBoundingClientRect();
      var inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      lens.hidden = !inside;
      if (!inside) return;
      // l'image est en object-fit: contain : calcul de la zone réellement dessinée
      var ratio = img.naturalWidth / img.naturalHeight || 1;
      var dw = r.width, dh = r.width / ratio;
      if (dh > r.height) { dh = r.height; dw = r.height * ratio; }
      var ox = r.left + (r.width - dw) / 2, oy = r.top + (r.height - dh) / 2;
      var px = (e.clientX - ox) / dw, py = (e.clientY - oy) / dh;
      lens.style.left = (e.clientX - vr.left - 75) + 'px';
      lens.style.top = (e.clientY - vr.top - 75) + 'px';
      lens.style.backgroundImage = 'url("' + (img.currentSrc || img.src) + '")';
      lens.style.backgroundSize = (dw * Z) + 'px ' + (dh * Z) + 'px';
      lens.style.backgroundPosition = (75 - px * dw * Z) + 'px ' + (75 - py * dh * Z) + 'px';
    });
    visual.addEventListener('pointerleave', function () { lens.hidden = true; });
  }

  window.addEventListener('hashchange', function () {
    var h = decodeURIComponent((location.hash || '').slice(1));
    if (!D.parId(h)) return; // ancre interne (ex. lien d'évitement) : on garde l'appareil affiché
    render(h, true);
    ui.scrollTo(document.getElementById('produit'), 0);
    ui.focusTarget(document.querySelector('[data-p-name]'));
  });
  render(idFromHash(), false);
  if (motion) {
    gsap.from(img, { y: 60, opacity: 0, rotationY: -30, duration: 1.2, ease: 'power3.out', delay: 0.25 });
    gsap.from('.product-info > *', { y: 26, opacity: 0, duration: 0.9, stagger: 0.07, ease: 'power3.out', delay: 0.35 });
  }
  ui.boot();
})();

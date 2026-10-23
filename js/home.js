/* Accueil : allumage, chaînes CH 01 à 07, télécommande guide, facture qui fond,
   galerie horizontale, configuration à distance, guide des solutions légales, fidélité, contact. */
(function () {
  'use strict';
  var D = window.TVCQ;
  var ui = D.ui;
  var gsap = window.gsap;
  var ST = window.ScrollTrigger;
  var calm = ui.calm;
  var motion = !calm && !!gsap && !!ST;
  var wide = window.matchMedia('(min-width: 1100px)').matches;
  var pinOK = motion && window.matchMedia('(min-width: 900px) and (min-height: 620px)').matches;

  /* ---------- Cartes appareils (depuis data.js) ---------- */
  var track = document.getElementById('device-track');
  function specRow(k, v) {
    var val = v == null ? '<span class="todo">à compléter</span>' : '<span data-scramble="' + ui.esc(v) + '">' + ui.esc(v) + '</span>';
    return '<li><span>' + k + '</span>' + val + '</li>';
  }
  if (track) {
    track.innerHTML = D.appareils.map(function (a, i) {
      return '<article class="device-card" data-product>' +
        '<div class="plinth" data-tilt="10">' +
          '<span class="idx">' + String(i + 1).padStart(2, '0') + ' / ' + String(D.appareils.length).padStart(2, '0') + '</span>' +
          '<span class="price-tag">' + ui.money0(a.prix) + '</span>' +
          '<img data-product-img src="' + D.src(a) + '" srcset="' + D.srcset(a) + '" sizes="(min-width: 900px) 420px, 84vw" alt="' + ui.esc(a.nom) + ', photo du produit" loading="lazy" width="' + a.img.w[a.img.w.length - 1] + '" height="' + Math.round(a.img.w[a.img.w.length - 1] / a.img.ratio) + '">' +
        '</div>' +
        '<div class="body">' +
          '<h3>' + ui.esc(a.nom) + '</h3>' +
          '<p>' + ui.esc(a.accroche) + '</p>' +
          '<ul class="spec-list">' + specRow('Système', a.specs.systeme) + specRow('Stockage', a.specs.stockage) + specRow('Vidéo', a.specs.video) + specRow('Garantie', a.specs.garantie) + '</ul>' +
          '<div class="actions"><button class="btn btn--signal btn--sm" type="button" data-add="' + a.id + '">Ajouter</button>' +
          '<a class="btn btn--ghost btn--sm" href="appareil.html#' + a.id + '">Fiche <span class="arrow">→</span></a></div>' +
        '</div>' +
      '</article>';
    }).join('') +
    '<div class="device-end"><span class="label muted-dark">Pas sûr du modèle ?</span><p>Le bilan télé recommande un appareil selon votre téléviseur et vos priorités.</p>' +
    '<a class="btn btn--light" href="bilan.html" data-magnetic>Faire mon bilan <span class="arrow">→</span></a></div>';
  }

  function scrambleCard(card) {
    if (!card || card.dataset.scrambled) return;
    card.dataset.scrambled = '1';
    if (!motion || !window.ScrambleTextPlugin) return;
    card.querySelectorAll('[data-scramble]').forEach(function (s, i) {
      gsap.to(s, { duration: 0.9, delay: i * 0.08, scrambleText: { text: s.dataset.scramble, chars: 'ABCDEFGHJKLMNPRSTUVXYZ0123456789', revealDelay: 0.25, speed: 0.6 } });
    });
  }

  /* ---------- Chaînes ---------- */
  var sections = Array.prototype.slice.call(document.querySelectorAll('[data-channel]'));
  var rail = document.querySelector('.remote-rail');
  var remote = null;
  var current = 0;

  function sectionFor(n) { return sections.filter(function (s) { return +s.dataset.channel === n; })[0]; }

  function goChannel(n) {
    if (n < 1) n = sections.length;
    if (n > sections.length) n = 1;
    var s = sectionFor(n);
    if (!s) return;
    if (n === 1) {
      if (ui.lenis) ui.lenis.scrollTo(0, { duration: 1.3 });
      else window.scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' });
    } else {
      ui.scrollTo(s, -20);
    }
  }

  function setChannel(n) {
    if (n === current) return;
    current = n;
    var s = sectionFor(n);
    if (!s) return;
    ui.setOSD('CH ' + String(n).padStart(2, '0'), s.dataset.label);
    if (remote) {
      remote.press('ch:' + n);
      remote.setAway(s.dataset.remote === 'hide');
    }
    if (rail) {
      rail.classList.toggle('is-dark', s.classList.contains('dark'));
      rail.classList.toggle('is-away', s.dataset.remote === 'hide');
    }
  }

  function onKey(action) {
    if (action.indexOf('ch:') === 0) {
      var n = parseInt(action.slice(3), 10);
      if (n >= 1 && n <= sections.length) goChannel(n);
      else ui.toast('Chaîne ' + n + ' : aucune section, essayez 1 à ' + sections.length);
    } else if (action === 'ch+' || action === 'ok') goChannel((current || 1) + 1);
    else if (action === 'ch-' || action === 'back') goChannel((current || 1) - 1);
    else if (action === 'home' || action === 'power') goChannel(1);
    else if (action === 'menu') ui.openCart();
  }

  // repérage de la chaîne courante
  if (motion) {
    sections.forEach(function (s) {
      ST.create({
        trigger: s, start: 'top 55%', end: 'bottom 55%', refreshPriority: -1,
        onToggle: function (self) { if (self.isActive) setChannel(+s.dataset.channel); }
      });
    });
  } else if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) setChannel(+en.target.dataset.channel); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { io.observe(s); });
  }
  setChannel(1);

  // clavier : 1 à 7
  document.addEventListener('keydown', function (e) {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
    var t = e.target;
    if (t && t.closest && t.closest('input, textarea, select, [contenteditable], .cart')) return;
    if (/^[1-9]$/.test(e.key)) {
      var n = +e.key;
      if (remote) remote.press('ch:' + n);
      if (n <= sections.length) goChannel(n);
    }
  });

  /* ---------- Télécommande ---------- */
  var host = wide ? document.querySelector('.remote-rail .remote-host') : document.querySelector('.hero-remote');
  var remoteReady = host ? ui.mountRemote(host, { variant: wide ? 'rail' : 'hero', onKey: wide ? onKey : null }) : Promise.resolve(null);

  /* ---------- Ouverture ---------- */
  var hero = document.querySelector('.hero');
  var heroBits = hero ? hero.querySelectorAll('[data-hero-in]') : [];
  var firstVisit = !ui.session.get('tvcq-intro');
  var fromNav = false;
  try { fromNav = document.referrer && new URL(document.referrer).origin === location.origin; } catch (e) { fromNav = false; }
  ui.session.set('tvcq-intro', '1');
  var h1 = hero && hero.querySelector('h1');

  if (motion) {
    var screenDelay = firstVisit ? 0.75 : 0;
    if (h1) h1.dataset.delay = String(screenDelay + (firstVisit ? 0.7 : 0.45));
    gsap.set(heroBits, { y: 26, opacity: 0 });
    var startScreen = function () {
      var tl = ui.screenOn(firstVisit ? 'Tv-Centre du Québec' : '');
      return tl;
    };
    if (firstVisit || fromNav) {
      var scr = document.querySelector('.tv-screen');
      if (scr) {
        scr.hidden = false;
        scr.querySelector('.led-txt').textContent = firstVisit ? 'Tv-Centre du Québec' : '';
        gsap.set(scr.querySelectorAll('.shade'), { scaleY: 1 });
        gsap.set(scr.querySelector('.beam'), { scaleX: 0, opacity: 1 });
      }
      gsap.delayedCall(screenDelay, startScreen);
    }
    remoteReady.then(function (r) {
      remote = r;
      if (!r) return;
      gsap.delayedCall(firstVisit ? 0.15 : 0, function () { r.powerOn(); });
      var s = sectionFor(current || 1);
      if (s) r.setAway(s.dataset.remote === 'hide');
    });
    gsap.to(heroBits, { y: 0, opacity: 1, duration: 1, stagger: 0.09, ease: 'power3.out', delay: screenDelay + (firstVisit ? 1.0 : 0.6) });
  } else {
    remoteReady.then(function (r) { remote = r; if (r) r.powerOn(); });
  }

  /* ---------- CH 02 : la facture qui fond ---------- */
  var bill = document.querySelector('.bill');
  if (bill) {
    var rows = bill.querySelectorAll('.bill-row[data-amount]');
    var totalEl = bill.querySelector('[data-total]');
    var start = 0;
    rows.forEach(function (r) { start += parseFloat(r.dataset.amount); });
    var after = parseFloat(totalEl.dataset.after);
    if (motion) {
      var counter = { v: start };
      var tl = gsap.timeline({
        scrollTrigger: { trigger: '.bill-stage', start: 'top 72%', end: 'bottom 45%', scrub: 0.7 }
      });
      tl.from('.envelope', { rotation: -22, x: -40, y: 30, duration: 1 }, 0)
        .from(bill, { rotation: 8, y: 60, duration: 1 }, 0);
      var cut = 0;
      rows.forEach(function (r, i) {
        if (r.dataset.keep) return;
        var amount = parseFloat(r.dataset.amount);
        var at = 0.6 + cut * 0.55;
        cut++;
        tl.to(r.querySelector('.strike'), { scaleX: 1, duration: 0.45, ease: 'power2.inOut' }, at)
          .to(r, { color: '#9a9ba3', duration: 0.3 }, at + 0.2);
        void amount;
      });
      tl.to(counter, {
        v: after, duration: cut * 0.55, ease: 'none',
        onUpdate: function () { totalEl.textContent = ui.money(counter.v); }
      }, 0.6);
      tl.from(bill.querySelector('.bill-after'), { opacity: 0, y: 14, duration: 0.4 }, 0.6 + cut * 0.55);
    }
  }

  /* ---------- CH 03 : galerie horizontale ---------- */
  var devSec = document.querySelector('.ch-devices');
  var hViewport = devSec && devSec.querySelector('.h-viewport');
  var prog = devSec && devSec.querySelector('.h-progress span');
  if (devSec && track && pinOK) {
    devSec.classList.add('is-pinned');
    var dist = function () { return Math.max(0, track.scrollWidth - hViewport.clientWidth); };
    var hTween = gsap.to(track, {
      x: function () { return -dist(); }, ease: 'none',
      scrollTrigger: {
        trigger: devSec, start: 'top top', end: function () { return '+=' + Math.max(400, dist()); },
        pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: function (self) { if (prog) gsap.set(prog, { scaleX: self.progress }); }
      }
    });
    track.querySelectorAll('.device-card').forEach(function (card) {
      ST.create({ trigger: card, containerAnimation: hTween, start: 'left 80%', onEnter: function () { scrambleCard(card); } });
      var img = card.querySelector('img');
      gsap.fromTo(img, { xPercent: 12, rotation: 4 }, {
        xPercent: -12, rotation: -4, ease: 'none',
        scrollTrigger: { trigger: card, containerAnimation: hTween, start: 'left right', end: 'right left', scrub: true }
      });
    });
  } else if (track) {
    if (prog) prog.parentElement.hidden = true;
    var cio = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) scrambleCard(en.target); });
    }, { threshold: 0.6 }) : null;
    track.querySelectorAll('.device-card').forEach(function (c) { if (cio) cio.observe(c); });
  }

  /* ---------- CH 04 : configuration à distance ---------- */
  var how = document.querySelector('.how');
  var steps = how ? how.querySelectorAll('.step') : [];
  var fill = document.querySelector('.config-bar .fill');
  var pct = document.querySelector('.config-bar .pct');
  var stepLabel = document.querySelector('.config-bar [data-step-label]');
  var waves = document.querySelectorAll('.map-card .wave');
  var link = document.querySelector('.map-card .link-path');
  var stepNames = ['Appareil choisi', 'Configuration à distance', 'Prêt à regarder'];
  function setStep(p) {
    var idx = p < 0.34 ? 0 : p < 0.67 ? 1 : 2;
    steps.forEach(function (s, i) { s.classList.toggle('is-on', i === idx); });
    if (fill) fill.style.transform = 'scaleX(' + p.toFixed(3) + ')';
    if (pct) pct.textContent = Math.round(p * 100) + ' %';
    if (stepLabel) stepLabel.textContent = stepNames[idx];
  }
  if (how && motion) {
    how.classList.add('is-live');
    if (pinOK) document.querySelector('.ch-how').classList.add('is-pinned');
    var howTl = gsap.timeline({
      scrollTrigger: {
        trigger: pinOK ? '.ch-how' : how, start: pinOK ? 'top top' : 'top 70%', end: pinOK ? '+=140%' : 'bottom 40%',
        pin: pinOK, scrub: 0.6, anticipatePin: 1,
        onUpdate: function (self) { setStep(self.progress); }
      }
    });
    if (link && window.DrawSVGPlugin) howTl.fromTo(link, { drawSVG: '0%' }, { drawSVG: '100%', duration: 1, ease: 'none' }, 0);
    waves.forEach(function (w, i) {
      howTl.fromTo(w, { attr: { r: 4 }, opacity: 0.9 }, { attr: { r: 46 }, opacity: 0, duration: 0.33, ease: 'power1.out' }, 0.62 + i * 0.12);
    });
    setStep(0);
  } else if (how) {
    setStep(1);
    steps.forEach(function (s) { s.classList.add('is-on'); });
  }

  /* ---------- CH 05 : guide des solutions légales ---------- */
  var guide = document.querySelector('.ch-guide');
  var epgScroll = guide && guide.querySelector('.epg-scroll');
  var epg = guide && guide.querySelector('.epg');
  var head = guide && guide.querySelector('.epg-playhead');
  function updateLive(x) {
    if (!epg) return;
    epg.querySelectorAll('.epg-cell').forEach(function (c) {
      var l = c.offsetLeft, r = l + c.offsetWidth;
      c.classList.toggle('is-live', x >= l && x <= r);
    });
  }
  if (guide && epg && head) {
    var headCol = function () { return epg.querySelector('.epg-row-head').offsetWidth + 6; };
    if (pinOK) {
      guide.classList.add('is-pinned');
      var maxScroll = function () { return Math.max(0, epg.scrollWidth - epgScroll.clientWidth); };
      var playTo = function () { return epg.scrollWidth - 4; };
      var gp = { p: 0 };
      gsap.to(gp, {
        p: 1, ease: 'none',
        scrollTrigger: {
          trigger: guide, start: 'top top', end: function () { return '+=' + Math.max(700, maxScroll() * 2.2); },
          pin: true, scrub: 0.7, invalidateOnRefresh: true, anticipatePin: 1
        },
        onUpdate: function () {
          epgScroll.scrollLeft = maxScroll() * gp.p;
          var x = headCol() + (playTo() - headCol()) * gp.p;
          head.style.left = x + 'px';
          updateLive(x);
        }
      });
    } else {
      var x0 = headCol() + 30;
      head.style.left = x0 + 'px';
      updateLive(x0);
    }
  }

  /* ---------- CH 06 : fidélité ---------- */
  document.querySelectorAll('.tier-flip-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      var t = b.closest('.tier');
      var on = t.classList.toggle('is-flipped');
      b.setAttribute('aria-pressed', String(on));
    });
  });
  var gauge = document.querySelector('.gauge');
  if (gauge) {
    var ptsEl = gauge.querySelector('.gauge-pts span');
    var fillG = gauge.querySelector('.gauge-fill');
    var target = parseInt(gauge.dataset.points, 10);
    var max = parseInt(gauge.dataset.max, 10);
    if (motion) {
      var gv = { v: 0 };
      gsap.set(fillG, { scaleX: 0 });
      gsap.to(gv, {
        v: target, duration: 1.8, ease: 'power2.out',
        scrollTrigger: { trigger: gauge, start: 'top 80%', once: true },
        onUpdate: function () {
          ptsEl.textContent = Math.round(gv.v);
          fillG.style.transform = 'scaleX(' + (gv.v / max).toFixed(3) + ')';
        }
      });
    } else {
      fillG.style.transform = 'scaleX(' + (target / max) + ')';
    }
  }

  /* ---------- CH 07 : formulaire de rappel simulé ---------- */
  var form = document.getElementById('form-rappel');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      form.querySelectorAll('[required]').forEach(function (f) {
        var err = form.querySelector('[data-err-for="' + f.id + '"]');
        var bad = !f.value.trim() || (f.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.value.trim()));
        if (err) err.textContent = bad ? (f.type === 'email' ? 'Entrez un courriel valide, par exemple nom@exemple.ca.' : 'Ce champ est requis.') : '';
        f.setAttribute('aria-invalid', String(bad));
        if (bad && ok) { f.focus(); ok = false; }
      });
      if (!ok) return;
      var name = form.querySelector('#f-prenom').value.trim();
      var done = document.getElementById('form-done');
      done.querySelector('[data-name]').textContent = name;
      form.hidden = true;
      done.hidden = false;
      done.focus();
      if (motion) gsap.from(done, { y: 20, opacity: 0, duration: 0.6 });
    });
    var again = document.getElementById('form-again');
    if (again) again.addEventListener('click', function () {
      form.reset();
      document.getElementById('form-done').hidden = true;
      form.hidden = false;
    });
  }

  ui.boot();
  if (motion) {
    window.addEventListener('load', function () { ST.refresh(); });
  }
})();

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
    if (remote) remote.press('ch:' + n);
    if (rail) rail.classList.toggle('is-dark', s.classList.contains('dark'));
  }

  // la télécommande s'écarte devant les sections larges (galerie, guide)
  var away = false;
  function setAway(v) {
    if (v === away) return;
    away = v;
    if (remote) remote.setAway(v);
    if (rail) rail.classList.toggle('is-away', v);
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

  // repérage de la chaîne courante : appelé à la fin, une fois les sections épinglées en place
  function trackChannels() {
    if (motion) {
      sections.forEach(function (s) {
        var t = s.parentElement && s.parentElement.classList.contains('pin-spacer') ? s.parentElement : s;
        ST.create({ trigger: t, start: 'top 55%', end: 'bottom 55%', onToggle: function (self) { if (self.isActive) setChannel(+s.dataset.channel); } });
        if (s.dataset.remote === 'hide') {
          ST.create({ trigger: t, start: 'top 78%', end: 'bottom 22%', onToggle: function (self) { setAway(self.isActive); } });
        }
      });
    } else if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) setChannel(+en.target.dataset.channel); });
      }, { rootMargin: '-45% 0px -50% 0px' });
      sections.forEach(function (s) { io.observe(s); });
      var io2 = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { setAway(en.isIntersecting); });
      }, { rootMargin: '-22% 0px -22% 0px' });
      sections.forEach(function (s) { if (s.dataset.remote === 'hide') io2.observe(s); });
    }
  }
  setChannel(1);

  // clavier : 1 à 8
  document.addEventListener('keydown', function (e) {
    if (!ui.shortcutsAllowed(e)) return;
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
      if (away) r.setAway(true);
    });
    gsap.to(heroBits, { y: 0, opacity: 1, duration: 1, stagger: 0.09, ease: 'power3.out', delay: screenDelay + (firstVisit ? 1.0 : 0.6) });
  } else {
    remoteReady.then(function (r) { remote = r; if (r) r.powerOn(); });
  }

  var heroPhoto = document.querySelector('[data-hero-photo]');
  if (heroPhoto && motion) {
    gsap.fromTo(heroPhoto, { scale: 1.14 }, { scale: 1.04, duration: 2.6, ease: 'power2.out', delay: firstVisit ? 0.9 : 0.3 });
    gsap.to(heroPhoto, { yPercent: 10, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
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
      tl.from('.bill-photo', { rotation: -16, x: -50, y: 40, duration: 1 }, 0)
        .from(bill, { rotation: 5, y: 60, duration: 1 }, 0);
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
    track.addEventListener('focusin', function (e) {
      var card = e.target.closest('.device-card, .device-end');
      var st = hTween.scrollTrigger;
      var d = dist();
      if (!card || !st || !d) return;
      var p = Math.min(1, Math.max(0, (card.offsetLeft - 24) / d));
      var y = st.start + (st.end - st.start) * p;
      if (ui.lenis) ui.lenis.scrollTo(y, { immediate: true, force: true });
      else window.scrollTo(0, y);
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
    var updateProg = function () {
      var m = track.scrollWidth - track.clientWidth;
      if (prog) prog.style.transform = 'scaleX(' + (m > 0 ? track.scrollLeft / m : 1).toFixed(3) + ')';
    };
    track.addEventListener('scroll', updateProg, { passive: true });
    updateProg();
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

  /* ---------- CH 05 : guide, balayage du gratuit vers l'abonnement ---------- */
  var grid = document.querySelector('[data-guide]');
  var sweep = grid && grid.querySelector('.gg-sweep');
  var sweepLabel = sweep && sweep.querySelector('.gg-sweep-label');
  var colNames = ['Gratuit', 'Application', 'Abonnement'];
  var liveCol = -1;
  function setLiveCol(c) {
    if (c === liveCol) return;
    liveCol = c;
    grid.querySelectorAll('[data-col]').forEach(function (el) { el.classList.toggle('is-live', +el.dataset.col === c); });
    if (sweepLabel) sweepLabel.textContent = colNames[c] || '';
  }
  if (grid && sweep && window.matchMedia('(min-width: 900px)').matches) {
    var cols = grid.querySelectorAll('.gg-col');
    var G = null;
    var measure = function () {
      var g = grid.getBoundingClientRect();
      var first = cols[0].getBoundingClientRect();
      var last = cols[cols.length - 1].getBoundingClientRect();
      G = {
        x0: first.left - g.left + 1, x1: last.right - g.left - 3,
        ends: Array.prototype.map.call(cols, function (c) { return c.getBoundingClientRect().right - g.left; })
      };
    };
    var place = function (p) {
      if (!G) measure();
      var x = G.x0 + (G.x1 - G.x0) * p;
      sweep.style.setProperty('--sweep-x', x.toFixed(1) + 'px');
      if (sweepLabel) sweepLabel.style.transform = p > 0.82 ? 'translateX(calc(-100% + 4px))' : '';
      setLiveCol(x < G.ends[0] ? 0 : x < G.ends[1] ? 1 : 2);
    };
    window.addEventListener('resize', function () { G = null; });
    if (motion) {
      var gp = { p: 0 };
      gsap.to(gp, {
        p: 1, ease: 'none',
        scrollTrigger: { trigger: grid, start: 'top 72%', end: 'bottom 38%', scrub: 0.6, onRefresh: function () { G = null; } },
        onUpdate: function () { place(gp.p); }
      });
      place(0);
    } else {
      place(0.04);
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

  /* ---------- CH 07 : questions ---------- */
  document.querySelectorAll('.faq-item').forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (!d.open) return;
      if (remote) remote.press('ok');
      if (motion) gsap.from(d.querySelector('.a'), { y: -10, opacity: 0, duration: 0.45, ease: 'power2.out' });
    });
  });

  /* ---------- CH 08 : formulaire de rappel simulé ---------- */
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
      form.querySelector('#f-prenom').focus();
    });
  }

  trackChannels();
  ui.boot();

  var hashTarget = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
  function jumpToHash() {
    if (!hashTarget) return;
    if (ui.lenis) ui.lenis.resize(); // la page a grandi avec les sections épinglées
    var y = hashTarget.getBoundingClientRect().top + window.scrollY - 20;
    if (ui.lenis) ui.lenis.scrollTo(y, { immediate: true, force: true });
    else window.scrollTo(0, y);
  }
  window.addEventListener('load', function () {
    if (motion) ST.refresh();
    setTimeout(jumpToHash, 60);
    setTimeout(jumpToHash, 700); // après le découpage des titres et le recalcul final
  });
})();

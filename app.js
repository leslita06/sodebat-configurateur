/* SODEBAT configurateur : estimation en 4 étapes + prise de rendez-vous (25/11/2026).
   Grille de prix indicative, bâtie sur des fourchettes publiques du marché ivoirien (2026) ; à confirmer par SODEBAT. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const ic = id => `<svg><use href="#i-${id}"/></svg>`;
  const SITE = 'https://leslita06.github.io/sodebat-site/';
  const SAV_WA = '2250708083626';

  /* ---------- Données ---------- */
  const BAT = [
    { k: 'residentiel', i: 'build', t: 'Immeuble résidentiel', s: 'Appartements, copropriété' },
    { k: 'bureaux', i: 'office', t: 'Bureaux, siège', s: 'Tertiaire, banque, administration' },
    { k: 'hotel', i: 'hotel', t: 'Hôtel, commerce', s: 'Clients, service, centre commercial' },
    { k: 'sante', i: 'health', t: 'Clinique, hôpital', s: 'Patients, brancards, lits' },
    { k: 'villa', i: 'villa', t: 'Villa', s: 'Maison sur plusieurs niveaux' },
    { k: 'public', i: 'public', t: 'Bâtiment public', s: 'École, mairie, ministère' },
    { k: 'industrie', i: 'box', t: 'Entrepôt, industrie', s: 'Marchandises, palettes' },
    { k: 'autre', i: 'dots', t: 'Autre', s: 'Précisez à l\'étape 4' },
  ];
  const LOC = ['Abidjan', 'Grand-Bassam', 'Yamoussoukro', 'San Pedro', 'Bouaké', 'Autre ville', 'Sous-région'];
  const OBJ = [
    { k: 'neuf', i: 'plus', t: 'Installation neuve', s: 'Bâtiment neuf ou gaine à créer', h: 'Comptez 3 à 6 semaines entre la préparation et la mise en service.' },
    { k: 'moder', i: 'spark', t: 'Modernisation', s: 'Remplacer machine, armoire, portes', h: 'Nous gardons la gaine et ce qui est sain ; l\'arrêt de l\'appareil est réduit au minimum.' },
    { k: 'conf', i: 'check', t: 'Mise en conformité', s: 'Sécurité, accessibilité, normes', h: 'Un audit sur place liste les points à mettre aux normes avant le chiffrage.' },
    { k: 'maint', i: 'wrench', t: 'Contrat de maintenance', s: 'Préventif et curatif, toutes marques', h: 'Nous intervenons aussi sur les appareils que nous n\'avons pas installés.' },
    { k: 'panne', i: 'phone', t: 'Panne, dépannage', s: 'Un appareil à l\'arrêt', h: 'Une panne ne s\'estime pas : appelez le SAV 24h/24 au +225 07 08 08 36 26.' },
    { k: 'autre', i: 'dots', t: 'Autre demande', s: 'Réhabilitation, travaux, conseil', h: '' },
  ];
  // Équipements : fourchette en millions FCFA HT pour une installation neuve, au nombre de niveaux de référence.
  // Sources publiques : goafricaonline.com (villa 15-30, résidentiel 25-50, tertiaire 40-80, monte-charge 20-60) ; ci.pelifts.com (porte palière 0,5 à 1,2 M par niveau).
  // Les lignes marquées H sont des hypothèses de travail.
  const EQ = {
    villa: { t: 'Ascenseur de villa', i: 'villa', lo: 15, hi: 30, ref: 3, cap: ['2 pers.', '3 pers.', '4 pers. (320 kg)'], capD: 2 },
    resid: { t: 'Ascenseur résidentiel', i: 'lift', lo: 25, hi: 50, ref: 6, cap: ['6 pers. (450 kg)', '8 pers. (630 kg)', '10 pers. (800 kg)'], capD: 1 },
    tert: { t: 'Ascenseur tertiaire', i: 'lift', lo: 40, hi: 80, ref: 8, cap: ['8 pers. (630 kg)', '13 pers. (1 000 kg)', '17 pers. (1 275 kg)'], capD: 1 },
    malade: { t: 'Monte-malades', i: 'health', lo: 45, hi: 85, ref: 5, cap: ['1 275 kg (lit standard)', '1 600 kg', '2 000 kg'], capD: 0, H: 1 },
    charge: { t: 'Monte-charge', i: 'box', lo: 20, hi: 60, ref: 3, cap: ['500 kg', '1 000 kg', '2 000 kg', '3 000 kg et plus'], capD: 1 },
    plats: { t: 'Monte-plats', i: 'box', lo: 6, hi: 15, ref: 2, cap: ['50 kg', '100 kg', '300 kg'], capD: 1, H: 1 },
    esc: { t: 'Escalator', i: 'lift', lo: 60, hi: 120, ref: 2, cap: ['Largeur 800 mm', 'Largeur 1 000 mm'], capD: 1, H: 1, noLev: 1 },
  };
  const PROPOSE = {
    residentiel: ['resid', 'charge'], bureaux: ['tert', 'resid', 'esc'], hotel: ['tert', 'plats', 'esc', 'charge'],
    sante: ['malade', 'tert', 'plats'], villa: ['villa'], public: ['tert', 'resid'], industrie: ['charge', 'tert'], autre: ['resid', 'tert', 'charge'],
  };
  const FIN = [
    { k: 'std', t: 'Standard', s: 'Acier peint, sol PVC', lo: 0, hi: 0, img: 'ambiance-sante.jpg' },
    { k: 'inox', t: 'Inox brossé', s: 'Parois inox, sol granit', lo: 2, hi: 5, img: 'ambiance-inox.jpg' },
    { k: 'premium', t: 'Haut standing', s: 'Bois, verre, éclairage LED', lo: 3, hi: 8, img: 'ambiance-noyer.jpg' },
  ];
  const ACC = [['1', 'Une face'], ['2', 'Deux faces opposées'], ['3', 'Deux faces à 90°']];

  const st = { step: 1, bat: null, loc: 'Abidjan', locA: '', obj: null, eq: null, niv: 5, acc: '1', cap: null, fin: 'inox', finLabel: null, day: null, hour: null };

  /* ---------- Construction ---------- */
  const card = (o, grp, extra = '') => `<button type="button" class="card" data-g="${grp}" data-k="${o.k}" aria-pressed="false">${o.i ? `<span class="ci">${ic(o.i)}</span>` : ''}${extra}<b>${o.t}</b>${o.s ? `<small>${o.s}</small>` : ''}</button>`;
  $('#o-bat').innerHTML = BAT.map(o => card(o, 'bat')).join('');
  $('#o-bat').classList.replace('c3', 'c4');
  $('#o-loc').innerHTML = LOC.map(l => `<button type="button" class="chip" data-g="loc" data-k="${l}" aria-pressed="${l === st.loc}">${l}</button>`).join('');
  $('#o-obj').innerHTML = OBJ.map(o => card(o, 'obj')).join('');
  $('#o-acc').innerHTML = ACC.map(([k, t]) => `<button type="button" data-g="acc" data-k="${k}" aria-pressed="${k === st.acc}">${t}</button>`).join('');
  $('#o-fin').innerHTML = FIN.map(f => `<button type="button" class="card img" data-g="fin" data-k="${f.k}" aria-pressed="${f.k === st.fin}"><img src="assets/img/${f.img}" alt="" loading="lazy"><span class="cb"><b>${f.t}</b><small>${f.s}</small></span></button>`).join('');

  function renderEq() {
    const list = PROPOSE[st.bat] || PROPOSE.autre;
    if (!list.includes(st.eq)) st.eq = list[0];
    const e = EQ[st.eq];
    $('#reco').innerHTML = `<span class="ci">${ic(e.i)}</span><div><small>Proposé pour ${(BAT.find(b => b.k === st.bat) || BAT[7]).t.toLowerCase()}</small><b>${list.map(k => EQ[k].t).join(', ')}</b><p>Choisissez l'équipement à chiffrer, nous ajustons le reste.</p></div>`;
    const eqHost = $('#o-eq') || (() => { const d = document.createElement('div'); d.className = 'field'; d.innerHTML = '<span class="lb">Équipement</span><div class="cards c3 cards-s" id="o-eq"></div>'; $('#reco').after(d); return $('#o-eq'); })();
    eqHost.innerHTML = list.map(k => `<button type="button" class="card" data-g="eq" data-k="${k}" aria-pressed="${k === st.eq}"><b>${EQ[k].t}</b><small>${EQ[k].noLev ? 'Par appareil' : 'De ' + EQ[k].cap[0].replace(/ \(.*/, '') + ' à ' + EQ[k].cap[EQ[k].cap.length - 1].replace(/ \(.*/, '')}</small></button>`).join('');
    if (!e.cap.includes(st.cap)) st.cap = e.cap[e.capD];
    $('#o-cap').className = 'cards cards-s ' + (e.cap.length === 4 ? 'c4' : e.cap.length === 2 ? 'c3' : 'c3');
    $('#o-cap').innerHTML = e.cap.map(c => `<button type="button" class="card" data-g="cap" data-k="${c}" aria-pressed="${c === st.cap}"><b>${c.replace(/ \(.*/, '')}</b>${/\(/.test(c) ? `<small>${c.match(/\((.*)\)/)[1]}</small>` : ''}</button>`).join('');
    const lev = $('#niv').closest('.field'); lev.style.display = e.noLev ? 'none' : '';
    const fin = $('#o-fin').closest('.field'); fin.style.display = ['charge', 'plats', 'esc'].includes(st.eq) ? 'none' : '';
    nivTxt();
  }
  function nivTxt() {
    $('#niv').textContent = st.niv;
    $('#niv-t').textContent = st.niv <= 1 ? 'Un seul niveau' : `Rez-de-chaussée + ${st.niv - 1} étage${st.niv > 2 ? 's' : ''}`;
  }

  /* ---------- Estimation ---------- */
  const r5 = x => Math.round(x * 2) / 2;
  const fmt = x => (x >= 1 ? r5(x).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ') + ' M' : Math.round(x * 1000).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ') + ' 000');
  function estimate() {
    if (!st.eq || !st.obj) return null;
    const e = EQ[st.eq];
    let lo = e.lo, hi = e.hi;
    if (!e.noLev) { const d = st.niv - e.ref; lo += d * 0.5; hi += d * 1.2; }
    const ci = e.cap.indexOf(st.cap), cd = ci - e.capD; lo *= 1 + cd * 0.08; hi *= 1 + cd * 0.1;
    if (st.acc !== '1' && !e.noLev) { lo += st.niv * 0.5; hi += st.niv * 1.2; }
    const showFin = !['charge', 'plats', 'esc'].includes(st.eq);
    const f = FIN.find(x => x.k === st.fin);
    if (showFin && f) { lo += f.lo; hi += f.hi; }
    lo = Math.max(lo, e.lo * 0.6); hi = Math.max(hi, lo * 1.4);
    const L = [];
    L.push([e.t + (e.noLev ? '' : `, ${st.niv} niveaux`), st.cap]);
    if (showFin && f) L.push(['Finitions', f.t + (st.finLabel ? ' : ' + st.finLabel : '')]);
    L.push(['Accès', ACC.find(a => a[0] === st.acc)[1]]);
    let unit = 'HT, fourniture et pose', head = 'Installation neuve';
    switch (st.obj) {
      case 'moder': lo *= 0.45; hi *= 0.65; head = 'Modernisation'; unit = 'HT, selon l\'état de l\'appareil'; break;
      case 'conf': lo = 3; hi = 12; head = 'Mise en conformité'; unit = 'HT, selon l\'audit sur place'; break;
      case 'maint': lo *= 0.03; hi *= 0.05; head = 'Contrat de maintenance'; unit = 'HT par an et par appareil'; break;
      case 'panne': return { panne: true, L };
      case 'autre': head = 'Projet sur mesure'; unit = 'HT, à préciser à la visite'; break;
    }
    return { lo, hi, head, unit, L };
  }
  const priceTxt = p => p.lo < 1 ? `${fmt(p.lo)} à ${fmt(p.hi)} FCFA` : `${fmt(p.lo).replace(' M', '')} à ${fmt(p.hi)} FCFA`;

  /* ---------- Récapitulatif ---------- */
  function sum() {
    const rows = [];
    if (st.bat) rows.push(['Bâtiment', BAT.find(b => b.k === st.bat).t]);
    rows.push(['Lieu', st.loc === 'Autre ville' && st.locA ? st.locA : st.loc]);
    if (st.obj) rows.push(['Demande', OBJ.find(o => o.k === st.obj).t]);
    if (st.step >= 3 && st.eq) {
      rows.push(['Équipement', EQ[st.eq].t]);
      if (!EQ[st.eq].noLev) rows.push(['Niveaux', String(st.niv)]);
      rows.push(['Capacité', st.cap.replace(/ \(.*/, '')]);
      if (!['charge', 'plats', 'esc'].includes(st.eq)) rows.push(['Finitions', FIN.find(f => f.k === st.fin).t]);
    }
    $('#sum-l').innerHTML = rows.map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join('');
    const p = st.step >= 3 ? estimate() : null;
    $('#sum-v').textContent = !p ? 'À partir de l\'étape 3' : p.panne ? 'Appel SAV' : priceTxt(p);
    const f = FIN.find(x => x.k === st.fin); $('#sum-img').src = 'assets/img/' + (st.finImg || f.img);
    $('#sum-fin').textContent = st.finLabel || f.s;
  }

  /* ---------- Navigation ---------- */
  function go(n) {
    st.step = n;
    $$('.step').forEach(s => s.classList.toggle('on', +s.dataset.s === n));
    $$('#prog li').forEach(li => { const s = +li.dataset.s; li.classList.toggle('on', s === Math.min(n, 4)); li.classList.toggle('done', s < n); });
    $('#prev').style.visibility = n > 1 && n < 5 ? 'visible' : 'hidden';
    $('#wz-nav').style.display = n === 5 ? 'none' : '';
    $('#next').innerHTML = n === 4 ? `Voir mon estimation${ic('arrow')}` : `Continuer${ic('arrow')}`;
    $('#err').textContent = '';
    if (n === 3) renderEq();
    if (n === 5) result();
    sum();
    if (!window.__CAPTURE) $('.wz-card').scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
  function valid() {
    if (st.step === 1 && !st.bat) return 'Choisissez un type de bâtiment.';
    if (st.step === 2 && !st.obj) return 'Choisissez l\'objet de votre demande.';
    if (st.step === 2 && st.obj === 'panne') return 'panne';
    if (st.step === 4) {
      if (!$('#f-nom').value.trim()) return 'Indiquez votre nom.';
      if ($('#f-tel').value.replace(/\D/g, '').length < 8) return 'Indiquez un numéro de téléphone joignable.';
      if (!$('#f-ok').checked) return 'Cochez la case d\'accord pour être recontacté.';
    }
    return '';
  }
  $('#next').addEventListener('click', () => {
    const v = valid();
    if (v === 'panne') { $('#err').innerHTML = 'Pour une panne, appelez le SAV : <a href="tel:+2250708083626">+225 07 08 08 36 26</a>'; return; }
    if (v) { $('#err').textContent = v; return; }
    go(st.step + 1);
  });
  $('#prev').addEventListener('click', () => go(Math.max(1, st.step - 1)));

  /* ---------- Choix ---------- */
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-g]'); if (!b || !b.closest('#wz')) return;
    const g = b.dataset.g, k = b.dataset.k;
    $$(`[data-g="${g}"]`).forEach(x => x.setAttribute('aria-pressed', x === b));
    if (g === 'bat') st.bat = k;
    if (g === 'loc') { st.loc = k; $('#loc-autre').hidden = !(k === 'Autre ville' || k === 'Sous-région'); }
    if (g === 'obj') { st.obj = k; const o = OBJ.find(x => x.k === k); $('#h-obj').innerHTML = o.h ? ic('info') + '<span>' + o.h + '</span>' : ''; }
    if (g === 'eq') { st.eq = k; renderEq(); }
    if (g === 'cap') st.cap = k;
    if (g === 'acc') st.acc = k;
    if (g === 'fin') { st.fin = k; st.finLabel = null; st.finImg = null; }
    $('#err').textContent = '';
    sum();
  });
  $('#loc-autre').addEventListener('input', e => { st.locA = e.target.value; sum(); });
  $('#niv-m').addEventListener('click', () => { st.niv = Math.max(2, st.niv - 1); nivTxt(); sum(); });
  $('#niv-p').addEventListener('click', () => { st.niv = Math.min(40, st.niv + 1); nivTxt(); sum(); });
  $('#f-file').addEventListener('change', e => {
    const fs = [...e.target.files]; if (!fs.length) return;
    $('#f-file-t').innerHTML = `<b>${fs[0].name}</b> ajouté`;
    $('#thumbs').innerHTML = fs.filter(f => f.type.startsWith('image/')).map(f => `<img src="${URL.createObjectURL(f)}" alt="Photo ajoutée">`).join('');
  });

  /* ---------- Résultat et rendez-vous ---------- */
  function days() {
    const out = [], d = new Date(); d.setHours(12);
    while (out.length < 5) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0) out.push(new Date(d)); }
    return out;
  }
  function result() {
    if (!st.eq) renderEq();
    const p = estimate(), name = $('#f-nom').value.trim().split(' ')[0];
    const ds = days();
    st.day = st.day || ds[0].toISOString().slice(0, 10);
    const hours = d => new Date(d).getDay() === 6 ? ['8 h 30', '10 h 30', '12 h 30'] : ['8 h 30', '10 h 30', '14 h 00', '16 h 00'];
    st.hour = hours(st.day).includes(st.hour) ? st.hour : hours(st.day)[1];
    const wa = encodeURIComponent(`Bonjour SODEBAT, je souhaite une visite technique. ${p.head} : ${EQ[st.eq].t}, ${st.niv} niveaux, ${st.loc}. Estimation en ligne : ${priceTxt(p)}.`);
    $('#res').innerHTML = `
      <div class="r-head"><span class="r-ic">${ic('check')}</span><div><h2>${name ? name + ', voici' : 'Voici'} votre estimation</h2><p class="r-sub">${p.head}, ${(BAT.find(b => b.k === st.bat) || {}).t || ''}, ${st.loc === 'Autre ville' && st.locA ? st.locA : st.loc}</p></div></div>
      <div class="r-price"><div><small>Fourchette indicative</small><b>${priceTxt(p)}</b><small style="margin-top:6px;text-transform:none;letter-spacing:0;font-weight:500">${p.unit}</small></div><span class="r-badge">${ic('info')}Confirmée après visite technique</span></div>
      <div class="r-lines">${p.L.map(([a, b]) => `<div><span>${a}</span><b>${b}</b></div>`).join('')}<div><span>Délai d'installation habituel</span><b>3 à 6 semaines</b></div><div><span>Garantie</span><b>Constructeur, extensible par contrat</b></div></div>
      <p class="r-note">Hors génie civil (gaine, fosse) et raccordement électrique. Le prix ferme est établi après la visite technique gratuite.</p>
      <div class="r-rdv"><h3>${ic('cal')}Choisissez votre visite technique</h3>
        <div class="slots">${ds.map(d => { const k = d.toISOString().slice(0, 10); return `<button type="button" class="day" data-day="${k}" aria-pressed="${k === st.day}"><small>${d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')}</small><b>${d.getDate()}</b><small>${d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}</small></button>`; }).join('')}</div>
        <div class="hours">${hours(st.day).map(h => `<button type="button" class="chip" data-hour="${h}" aria-pressed="${h === st.hour}">${h}</button>`).join('')}</div>
      </div>
      <div class="r-act"><button type="button" class="bt" id="rdv-ok">${ic('cal')}Confirmer la visite</button><a class="bt bt-wa" href="https://wa.me/${SAV_WA}?text=${wa}" target="_blank" rel="noopener">${ic('wa')}Envoyer sur WhatsApp</a><button type="button" class="bt bt-ghost" id="redo">${ic('reset')}Modifier</button></div>
      <div class="r-done" id="r-done">${ic('check')}<span></span></div>`;
  }
  $('#res').addEventListener('click', e => {
    const d = e.target.closest('[data-day]'), h = e.target.closest('[data-hour]');
    if (d) { st.day = d.dataset.day; result(); }
    if (h) { st.hour = h.dataset.hour; $$('[data-hour]').forEach(x => x.setAttribute('aria-pressed', x === h)); }
    if (e.target.closest('#redo')) go(3);
    if (e.target.closest('#rdv-ok')) {
      const dd = new Date(st.day + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
      const box = $('#r-done'); box.classList.add('on');
      $('span', box).textContent = `Visite demandée le ${dd} à ${st.hour}. Un technicien SODEBAT vous appelle pour confirmer le créneau.`;
    }
  });

  /* ---------- Onglets ---------- */
  function tab(t) {
    $$('.tab').forEach(a => a.classList.toggle('on', a.dataset.tab === t));
    $('#v-estimer').classList.toggle('on', t === 'estimer');
    $('#v-cabine').classList.toggle('on', t === 'cabine');
    window.dispatchEvent(new CustomEvent('sodebat:tab', { detail: t }));
  }
  $$('.tab').forEach(a => a.addEventListener('click', e => { e.preventDefault(); history.replaceState(null, '', '#' + a.dataset.tab); tab(a.dataset.tab); scrollTo(0, 0); }));
  $$('[data-goto-cabine]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); history.replaceState(null, '', '#cabine'); tab('cabine'); scrollTo(0, 0); }));
  window.addEventListener('sodebat:finitions', e => {
    st.fin = 'premium';
    const d = e.detail; if (d.tier) st.fin = d.tier;
    st.finLabel = d.label; st.finImg = d.img;
    $$('[data-g="fin"]').forEach(x => x.setAttribute('aria-pressed', x.dataset.k === st.fin));
    history.replaceState(null, '', '#estimer'); tab('estimer');
    if (!st.bat) { st.bat = 'residentiel'; $$('[data-g="bat"]').forEach(x => x.setAttribute('aria-pressed', x.dataset.k === 'residentiel')); }
    if (!st.obj) { st.obj = 'neuf'; $$('[data-g="obj"]').forEach(x => x.setAttribute('aria-pressed', x.dataset.k === 'neuf')); }
    go(3);
  });

  /* ---------- Démarrage ---------- */
  const q = new URLSearchParams(location.search);
  const qb = q.get('batiment'); if (qb && BAT.some(b => b.k === qb)) { st.bat = qb; $$('[data-g="bat"]').forEach(x => x.setAttribute('aria-pressed', x.dataset.k === qb)); }
  const qs = q.get('etape');
  if (location.hash === '#cabine') tab('cabine');
  go(1);
  // Pour les captures : ?etape=3 ou 5 remplit un exemple de projet.
  if (qs) {
    st.bat = st.bat || 'residentiel'; st.obj = 'neuf'; st.niv = 6;
    $$('[data-g="bat"]').forEach(x => x.setAttribute('aria-pressed', x.dataset.k === st.bat));
    $$('[data-g="obj"]').forEach(x => x.setAttribute('aria-pressed', x.dataset.k === 'neuf'));
    if (+qs >= 5) { $('#f-nom').value = 'Awa Koné'; $('#f-tel').value = '+225 07 00 00 00 00'; $('#f-ok').checked = true; }
    go(+qs);
  }
})();

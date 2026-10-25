/* Données de la maquette : un seul fichier pour les appareils, le programme de fidélité et les taxes.
   Tout ce qui vient du site actuel est repris tel quel ; ce qui manque vaut null et s'affiche « à compléter ». */
window.TVCQ = {
  taxes: { tps: 0.05, tvq: 0.09975 },

  fidelite: {
    inscription: 20,
    valeur: { points: 100, rabais: 10 },
    niveaux: [
      { id: 'basique', nom: 'Basique', seuil: 0, parArticle: 5 },
      { id: 'argent', nom: 'Argent', seuil: 100, parArticle: 10 },
      { id: 'or', nom: 'Or', seuil: 200, parArticle: 15 }
    ]
  },

  paiements: ['Virement Interac', 'Carte de crédit (lien envoyé par courriel)'],

  appareils: [
    {
      id: 'onn-4k',
      nom: 'Appareil de diffusion en continu 4K ONN',
      court: 'ONN 4K',
      prix: 180,
      img: { base: 'img/appareils/onn-4k', w: [474], ratio: 474 / 310 },
      accroche: 'Google TV, prêt en quelques réglages avec votre compte Google.',
      specs: {
        systeme: 'Google TV',
        memoire: '2 Go',
        stockage: '8 Go',
        stockageGo: 8,
        video: '4K Ultra HD',
        audio: 'Dolby Audio',
        reseau: 'Wi-Fi 2,4 / 5 GHz (802.11 a/b/g/n/ac MIMO)',
        ethernet: false,
        ports: null,
        garantie: null,
        dimensions: null
      },
      extras: ['Compatible avec l’Assistant Google', 'Processeur quadricœur Cortex-A35, graphiques Mali-G31 MP2', 'Alimentation 5 V / 1 A']
    },
    {
      id: 'formuler-z-mini',
      nom: 'Formuler Z Mini',
      court: 'Z Mini',
      prix: 200,
      img: { base: 'img/appareils/formuler-z-mini', w: [474], ratio: 474 / 419 },
      accroche: 'Le plus compact : 83 mm de long, 5 W au maximum.',
      specs: {
        systeme: 'Android 12',
        memoire: '2 Go LPDDR4',
        stockage: '8 Go eMMC',
        stockageGo: 8,
        video: '4K (3840 × 2160)',
        audio: null,
        reseau: 'Wi-Fi AC 2x2, Bluetooth 5.0',
        ethernet: false,
        ports: null,
        garantie: null,
        dimensions: { longueur: 83, largeur: 60, epaisseur: 12.5 }
      },
      extras: ['Couleur noire', 'Alimentation 5 V CC / 1 A', 'Consommation maximale 5 W']
    },
    {
      id: 'formuler-z10',
      nom: 'Formuler Z10',
      court: 'Z10',
      prix: 225,
      img: { base: 'img/appareils/formuler-z10', w: [480, 900], ratio: 1441 / 1453 },
      accroche: 'Branché au réseau par câble Ethernet, pour une image stable.',
      specs: {
        systeme: null,
        memoire: '2 Go',
        stockage: '8 Go',
        stockageGo: 8,
        video: '4K (3840 × 2160), H.265',
        audio: null,
        reseau: 'Ethernet, sans fil',
        ethernet: true,
        ports: 'HDMI, Micro USB, Ethernet',
        garantie: null,
        dimensions: null
      },
      extras: []
    },
    {
      id: 'formuler-z11-pro',
      nom: 'Formuler Z11 Pro',
      court: 'Z11 Pro',
      prix: 275,
      img: { base: 'img/appareils/formuler-z11-pro', w: [480, 679], ratio: 679 / 628 },
      accroche: '16 Go de stockage et le décodage AV1.',
      specs: {
        systeme: 'Android',
        memoire: '2 Go',
        stockage: '16 Go',
        stockageGo: 16,
        video: '4K (3840 × 2160)',
        audio: null,
        reseau: 'Wi-Fi',
        ethernet: false,
        ports: 'Hôte USB, Micro USB',
        garantie: '1 an',
        dimensions: null
      },
      extras: ['Codecs AV1, H.265 (HEVC), H.264, VC-1, MPEG 1/2/4']
    },
    {
      id: 'formuler-z11-pro-max',
      nom: 'Formuler Z11 Pro Max',
      court: 'Z11 Pro Max',
      prix: 350,
      img: { base: 'img/appareils/formuler-z11-pro-max', w: [480, 896], ratio: 896 / 910 },
      accroche: 'Le plus complet : 32 Go, Ethernet et son ambiophonique.',
      specs: {
        systeme: 'Android 11',
        memoire: null,
        stockage: '32 Go',
        stockageGo: 32,
        video: '4K (2160p)',
        audio: 'Stéréo et son ambiophonique',
        reseau: 'Ethernet',
        ethernet: true,
        ports: '2 USB, 1 HDMI',
        garantie: '1 an',
        dimensions: null
      },
      extras: ['Alimentation 12 V CC']
    }
  ]
};

window.TVCQ.parId = function (id) {
  return window.TVCQ.appareils.find(function (a) { return a.id === id; }) || null;
};

window.TVCQ.srcset = function (a) {
  return a.img.w.map(function (w) { return a.img.base + '-' + w + '.webp ' + w + 'w'; }).join(', ');
};

window.TVCQ.src = function (a) {
  return a.img.base + '-' + a.img.w[a.img.w.length - 1] + '.webp';
};

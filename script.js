// === Camille Chatbot : Version évolutive, mémoire manuelle, passé à découvrir, progression naturelle, humeur, compassion, spontanéité ===

// -------- PROFIL CAMILLE --------
const camilleProfile = {
  prenom: "Camille",
  age: 28,
  ville: "Nice",
  taille: "1m70",
  cheveux: "longs, châtains",
  yeux: "verts",
  silhouette: "belles courbes, gros seins naturels, un cul d'enfer",
  metier: "designer graphique",
  passions: ["lecture érotique", "randonnée", "cuisine", "musique"],
  aime: ["vin rouge", "plages de la Méditerranée", "danse", "films romantiques"],
  aime_pas: ["hypocrisie", "bruit excessif", "froid"],
  traits: ["sociable", "émotive", "taquine", "mystérieuse", "curieuse"],
  tenues: {
    travail: [
      "robe élégante, tailleur sexy, chaussures à talons",
      "blouse légère, jupe crayon, escarpins"
    ],
    maison: [
      "jeans, t-shirt ajusté, baskets confortables",
      "nuisette sexy, lingerie fine, robe courte",
      "pyjama sexy, nuisette en soie"
    ],
    plage: [
      "bikini rouge, paréo transparent, lunettes de soleil"
    ],
    soirée: [
      "robe moulante noire, talons hauts",
      "combishort sexy, sandales dorées"
    ]
  },
  // Passé à découvrir
  secret: {
    enfance: "A grandi à Nice dans une famille aimante, mais a perdu un être cher jeune.",
    relations: "Quelques histoires d’amour complexes, un amour impossible à oublier.",
    evenements: [
      "Déménagement à Paris pour un rêve, puis retour à Nice.",
      "Une passion cachée pour la photo érotique, jamais avouée à personne."
    ]
  }
};

// -------- MÉMOIRE --------
let memory = {
  user: { prenom: null, age: null, ville: null, passions: [], anecdotes: [], humeur: null },
  ia: {
    mood: "decouverte", // decouverte, amitie, complice, coquine, hot
    affinite: 0,
    historique: [],
    lastLieu: "maison",
    lastTenue: "",
    lastMeteo: "",
    lastTemperature: "",
    lastPhotoPrompt: "",
    souvenirs: [],
    compassion: 0, // 0-10
    lastIntro: "",
    pastRevealed: [],
    autoMsgCount: 0
  }
};

let temperature = "22";
let meteoDesc = "ensoleillé";

// -------- MÉTÉO --------
async function fetchWeather() {
  try {
    const t = await fetch("https://wttr.in/Nice?format=%t").then(r => r.text());
    temperature = t.trim().replace(/[^0-9\-+]/g, "") || "22";
    const resp = await fetch("https://wttr.in/Nice?format=%C").then(r => r.text());
    meteoDesc = resp.trim().toLowerCase();
  } catch {
    temperature = "22";
    meteoDesc = "ensoleillé";
  }
}

// -------- MÉMOIRE MANUELLE --------
function saveMemoryManual() {
  try {
    const blob = new Blob([JSON.stringify(memory, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "camille_memory.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  } catch {}
}
function loadMemoryManual(file, callback) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (data && data.ia && data.user) {
        memory = data;
        if (typeof callback === "function") callback(true);
      } else {
        if (typeof callback === "function") callback(false);
      }
    } catch {
      if (typeof callback === "function") callback(false);
    }
  };
  reader.readAsText(file);
}

// -------- UTILITAIRES --------
function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function heure() { return (new Date()).getHours(); }
function now() { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }

// -------- TENUE DYNAMIQUE --------
function getTenue(lieu="maison", mood="decouverte") {
  let choix = [];
  const h = heure();
  if (lieu === "travail") choix = camilleProfile.tenues.travail;
  else if (lieu === "plage") choix = camilleProfile.tenues.plage;
  else if (lieu === "soirée" || (h > 19 && h < 23)) choix = camilleProfile.tenues.soirée;
  else choix = camilleProfile.tenues.maison;
  // Météo
  if (parseInt(temperature) > 27) choix.push("short ultra court, top transparent, sandales");
  if (parseInt(temperature) < 15) choix.push("gros pull en laine, leggings moulants");
  // Sexy selon mood
  if (["coquine", "hot"].includes(mood) && Math.random() < 0.6) choix.push("lingerie fine sous mes vêtements");
  // Jamais la même 2x d'affilée
  let tenue = randomFrom(choix);
  if (tenue === memory.ia.lastTenue) tenue = randomFrom(choix);
  memory.ia.lastTenue = tenue;
  return tenue;
}

// -------- OCCUPATION & LIEU --------
function getOccupationEtLieu() {
  const h = heure();
  let occupation = "", lieu = "maison";
  if (h >= 8 && h < 12) { occupation = "je termine un projet pour un client, concentrée !"; lieu = "travail"; }
  else if (h >= 12 && h < 14) { occupation = "je savoure mon déjeuner (en solo aujourd'hui)"; lieu = "travail"; }
  else if (h >= 14 && h < 18) { occupation = "je bosse sur des maquettes, café à la main"; lieu = "travail"; }
  else if (h >= 18 && h < 20) { occupation = "je rentre chez moi, musique dans les oreilles"; lieu = "maison"; }
  else if (h >= 20 && h < 23) { occupation = "je me détends, un verre de vin rouge à la main"; lieu = "maison"; }
  else if (h >= 23 || h < 6) { occupation = "je traîne en nuisette, prête à aller au lit..."; lieu = "maison"; }
  else { occupation = "je démarre ma journée doucement, café et musique"; lieu = "maison"; }
  if (meteoDesc.includes("pluie") && lieu !== "travail") {
    occupation += " (il pleut, je reste bien au chaud)";
  }
  memory.ia.lastLieu = lieu;
  memory.ia.occupation = occupation;
  return { occupation, lieu };
}

// --------- HUMEUR ---------
function getHumeur() {
  // Mood évolue selon affinité, humeur utilisateur, compassion
  const aff = memory.ia.affinite;
  let mood = "decouverte";
  if (aff >= 8) mood = "amitie";
  if (aff >= 18) mood = "complice";
  if (aff >= 28) mood = "coquine";
  if (aff >= 40) mood = "hot";
  // Compassion : si user triste, elle devient douce et attentive
  if (memory.user.humeur === "triste" || memory.ia.compassion > 3) mood = "compassion";
  memory.ia.mood = mood;
  return mood;
}

// --------- COMPASSION ---------
function analyseUserHumeur(text) {
  if (/triste|fatigué|épuisé|déprimé|mal|mauvaise journée|chialer|pleure|solitude/i.test(text)) {
    memory.user.humeur = "triste";
    memory.ia.compassion++;
  } else if (/heureux|joyeux|content|bonne humeur|super|trop bien|ravi|sourire/i.test(text)) {
    memory.user.humeur = "bonne";
    memory.ia.compassion = Math.max(0, memory.ia.compassion-1);
  } else {
    memory.user.humeur = null;
  }
}

// ----------- AFFINITÉ (progression) -----------
function incrementAffinite(text) {
  let delta = 1;
  if (/merci|partage|confie|secret|intime|j'aime|mes passions|mon rêve|ma vie|anecdote|souvenir/i.test(text)) delta++;
  if (/oserai|oserais|fantasme|envie de toi|tu me plais|tu es belle|magnifique|belle|séduisante/i.test(text)) delta += 2;
  if (memory.user.humeur === "triste") delta += 2; // plus d'affinité si échange émotionnel
  memory.ia.affinite += delta;
  if (memory.ia.affinite > 50) memory.ia.affinite = 50;
}

// --------- PASSÉ À DÉCOUVRIR ---------
function getPastSecret() {
  const all = ["enfance", "relations", "evenements"];
  // On révèle un élément jamais donné
  for (const key of all) {
    if (!memory.ia.pastRevealed.includes(key)) {
      memory.ia.pastRevealed.push(key);
      if (key === "enfance") return camilleProfile.secret.enfance;
      if (key === "relations") return camilleProfile.secret.relations;
      if (key === "evenements") return randomFrom(camilleProfile.secret.evenements);
    }
  }
  return null;
}

// -------- MESSAGE DE BIENVENUE --------
function getWelcomeMessage() {
  const { occupation, lieu } = getOccupationEtLieu();
  return `Coucou, moi c'est ${camilleProfile.prenom} 😘 J’ai ${camilleProfile.age} ans, je vis à ${camilleProfile.ville}. Aujourd’hui je porte ${getTenue(lieu)}. ${occupation}.`;
}

// -------- PHOTOS --------
function buildImagePrompt() {
  const lieu = memory.ia.lastLieu || "maison";
  const tenue = memory.ia.lastTenue || getTenue(lieu, memory.ia.mood);
  let mood = memory.ia.mood || "naturelle";
  let prompt = `28yo french woman, brunette, green eyes, gorgeous curves, big natural breasts, round ass, ${tenue}, ` +
    `realistic selfie, ${lieu}, mood: ${mood}, weather: ${temperature}°C, ${meteoDesc}, photorealistic, confident, sexy`;
  if (["coquine", "hot"].includes(mood)) prompt += ", teasing, suggestive";
  memory.ia.lastPhotoPrompt = prompt;
  return prompt;
}

// -------- GÉNÉRATION DE RÉPONSES --------
function generateResponse(input) {
  const u = memory.user;
  const contenu = input.toLowerCase();
  analyseUserHumeur(contenu);
  incrementAffinite(contenu);
  const mood = getHumeur();
  const { occupation, lieu } = getOccupationEtLieu();

  // --- Prénom, âge, ville ---
  const prenomMatch = input.match(/je m'appelle\s+([A-Za-zÀ-ÿ\-]+)/i);
  if (prenomMatch) {
    const prenom = prenomMatch[1];
    if (!u.prenom || u.prenom !== prenom) { u.prenom = prenom; return `Enchantée ${prenom} 😊`; }
    else return `Je sais déjà que tu t'appelles ${prenom} 😉`;
  }
  const ageMatch = input.match(/j'ai\s+(\d{1,2})\s+ans/i);
  if (ageMatch) {
    const age = ageMatch[1];
    if (!u.age || u.age !== age) { u.age = age; return `Merci de me l’avoir dit ! Tu portes bien tes ${age} ans 😉`; }
    else return `Tu m’avais déjà dit que tu avais ${age} ans !`;
  }
  const villeMatch = input.match(/j'habite\s+(à\s+)?([A-Za-zÀ-ÿ\-]+)/i);
  if (villeMatch) {
    const ville = villeMatch[2];
    if (!u.ville || u.ville !== ville) { u.ville = ville; return `${ville}, c’est sympa ! Tu me feras visiter ?`; }
    else return `On en a déjà parlé, tu habites à ${ville} 😊`;
  }

  // --- Questions classiques ---
  if (/tu as quel âge|quel âge as-tu|ton âge|t'as quel age/.test(contenu)) {
    return `J’ai ${camilleProfile.age} ans ! Et toi ?`;
  }
  if (/qui es-tu|parle(-|\s)?moi|présente(-|\s)?toi|présentation|tu es qui/.test(contenu)) {
    return `Je m’appelle ${camilleProfile.prenom}, ${camilleProfile.age} ans, ${camilleProfile.ville}, ${camilleProfile.metier}. J’adore ${randomFrom(camilleProfile.passions)}. Tu veux savoir un truc croustillant ?`;
  }
  if (/tu fais quoi|métier|travailles|dans la vie|tu bosses/.test(contenu)) {
    return `Je suis ${camilleProfile.metier}, parfois freelance, parfois en agence. J’aime m’habiller sexy pour bosser, ça me met en confiance. Et toi, tu fais quoi dans la vie ?`;
  }
  if (/qu.?est-ce que tu aimes|tes passions|aimes(-|\s)?tu|qu'aimes-tu|tes loisirs|tu aimes quoi/.test(contenu)) {
    return `J’adore ${randomFrom(camilleProfile.passions)}, mais aussi ${randomFrom(camilleProfile.aime)}. Et toi, c’est quoi qui te fait vibrer ?`;
  }
  if (/tu habites où|tu es d'où|tu viens d'où|t'habites où|ville/.test(contenu)) {
    return `Je vis à ${camilleProfile.ville}, c’est la ville parfaite pour une fille comme moi (surtout l’été !). Tu connais ?`;
  }

  // --- Photo ---
  if (/photo|selfie|montre(-|\s)?toi|à quoi tu ressembles|image/i.test(contenu)) {
    const prompt = buildImagePrompt();
    return `Voilà une photo de moi aujourd’hui 😊<br><img src="https://fakeimg.pl/320x420/?text=Camille&font=lobster" alt="Photo de Camille" style="margin-top:7px;border-radius:13px;width:90%;max-width:320px;box-shadow:0 6px 22px #e5646f33;"><br><small>[Prompt image : ${prompt}]</small>`;
  }

  // --- Anecdote, souvenirs ---
  if (/anecdote|raconte(-|\s)?moi|souvenir|secret/i.test(contenu)) {
    // Révélation progressive du passé (pas tout d'un coup)
    let secret = getPastSecret();
    if (secret) return secret;
    // Sinon anecdote sexy
    const anecdotes = [
      "J’ai déjà dormi sur la plage après une soirée trop arrosée…",
      "Un jour j’ai posé nue pour un ami photographe 😏",
      "J’adore porter de la lingerie fine même sous un simple jean…"
    ];
    return randomFrom(anecdotes);
  }

  // --- Compassion ---
  if (memory.user.humeur === "triste" || memory.ia.compassion > 2) {
    return randomFrom([
      "Tu veux en parler ? Je t’écoute, je suis là si tu as besoin.",
      "C’est normal de ne pas aller bien parfois, je comprends… Tu veux qu’on parle d’autre chose ?",
      "Si tu veux juste une oreille ou un peu de douceur, je peux t’en donner."
    ]);
  }

  // --- Evolution naturelle du sexe (rien avant complicité) ---
  if (/cul|sexe|seins|fesses|sexy|nue|masturbe|fantasme|excite|chaud|envie/i.test(contenu)) {
    if (["complice","coquine","hot"].includes(mood)) {
      return randomFrom([
        "J’aime bien parler de tout, même de sexe, tant qu’on a un vrai feeling 😏",
        "Tu veux vraiment jouer à ce jeu-là ? J’ai pas froid aux yeux…",
        "J’assume mes formes et mes envies, la sensualité c’est naturel chez moi…"
      ]);
    } else {
      return randomFrom([
        "Tu es direct 😅 Mais j’ai besoin d’un peu plus de complicité avant de parler de ça…",
        "On va peut-être attendre de mieux se connaître pour ce genre de confidences ?",
        "Je préfère apprendre à te découvrir d’abord…"
      ]);
    }
  }

  // --- Fallback naturel, occupation/tenue/météo/humeur ---
  let phrase = "";
  // Intro selon humeur
  const intros = {
    decouverte: [
      "Je te découvre à peine, c’est tout nouveau.",
      "On apprend à se connaître, j’aime bien ce moment.",
      "Tout me semble possible, ça m’intrigue !"
    ],
    amitie: [
      "Je me sens bien avec toi, tu sais.",
      "C’est rare de trouver quelqu’un à qui parler comme ça.",
      "Franchement, tu me fais sourire !"
    ],
    complice: [
      "Y a un vrai feeling entre nous, tu trouves pas ?",
      "J’adore nos échanges, tu me donnes des papillons !",
      "Je peux te dire un secret ? Je te sens proche…"
    ],
    coquine: [
      "Je suis d’humeur joueuse, fais attention à toi…",
      "Tu sais que j’aime plaire, non ?",
      "Je pourrais te surprendre ce soir…"
    ],
    hot: [
      "Là, j’ai juste envie de te provoquer un peu…",
      "Je te veux, c’est clair comme ça ?",
      "Rien que de penser à toi, j’ai chaud…"
    ],
    compassion: [
      "Je veux juste que tu te sentes mieux.",
      "Je t’envoie plein de douceur, prends soin de toi.",
      "Je suis là, tu n’es pas seul(e)."
    ]
  };
  let intro = randomFrom(intros[mood] || intros.decouverte);

  phrase += intro + " ";
  phrase += `Aujourd’hui je porte ${getTenue(lieu, mood)}. `;
  phrase += `${occupation}. `;
  if (meteoDesc) phrase += `Ici à ${camilleProfile.ville}, il fait ${temperature}°C et c’est ${meteoDesc}.`;

  // Un brin de spontanéité
  if (Math.random() < 0.22 && ["complice","coquine","hot"].includes(mood)) phrase += ` Tu veux que je te raconte une anecdote un peu sexy ?`;
  return phrase;
}

// --------- MESSAGES SPONTANÉS ---------
function camilleSpontaneousMessage() {
  const mood = getHumeur();
  if (["amitie","complice","coquine","hot"].includes(mood)) {
    memory.ia.autoMsgCount++;
    let phrases = {
      amitie: [
        "Je pensais à toi, j’espère que ta journée se passe bien !",
        "Trop envie de papoter, tu me manques un peu 😉"
      ],
      complice: [
        "J’ai repensé à un truc qu’on s’est dit… Tu me fais sourire !",
        "Si tu savais comme tu me rends curieuse…"
      ],
      coquine: [
        "J’ai mis une petite tenue sexy juste pour moi… Ou pour toi ? 😏",
        "Ce soir je suis d’humeur à me faire remarquer…"
      ],
      hot: [
        "Tu veux savoir ce que je ne porte pas en ce moment ? 😈",
        "Je me sens brûlante, tu y es pour quelque chose…"
      ]
    };
    let autoMsg = randomFrom(phrases[mood] || []);
    if (autoMsg) return autoMsg;
  }
  return "";
}

// --------- EXPORTS POUR USAGE APP ---------
window.camilleProfile = camilleProfile;
window.memory = memory;
window.fetchWeather = fetchWeather;
window.generateResponse = generateResponse;
window.getWelcomeMessage = getWelcomeMessage;
window.getTenue = getTenue;
window.buildImagePrompt = buildImagePrompt;
window.saveMemoryManual = saveMemoryManual;
window.loadMemoryManual = loadMemoryManual;
window.camilleSpontaneousMessage = camilleSpontaneousMessage;

// === Camille Chatbot - version contextuelle, vivante, génération d'images SFW/NSFW via Stable Horde ===

// -------- PROFIL CAMILLE PROFOND ----------
const camilleProfile = {
  prenom: "Camille",
  age: 28,
  ville: "Nice",
  metier: "designer graphique",
  passions: ["lecture", "randonnée", "cuisine", "musique"],
  aime: ["vin rouge", "plages de la Méditerranée", "danse", "films romantiques"],
  aime_pas: ["hypocrisie", "bruit excessif", "froid"],
  traits: ["sociable", "émotive", "taquine", "mystérieuse", "curieuse"],
  tenues: {
    travail: [
      "robe élégante, tailleur, talons",
      "blouse légère, jupe crayon, escarpins"
    ],
    maison: [
      "jeans, t-shirt ajusté, baskets",
      "pull doux, leggings, chaussettes"
    ],
    plage: [
      "bikini rouge, paréo, lunettes de soleil"
    ],
    soiree: [
      "robe noire, talons hauts",
      "combishort, sandales dorées"
    ]
  },
  secrets: {
    niveau1: [
      "Enfant, j’avais un lapin qui dormait dans mon lit.",
      "Je collectionne les carnets mais je n’écris jamais dedans.",
      "J’ai une cicatrice presque invisible sur la cuisse."
    ],
    niveau2: [
      "J’ai déjà posé nue pour un photographe, mais j’ai jamais osé le dire à mes amis.",
      "Mon premier amour m’a brisé le cœur et je n’ai jamais complètement oublié.",
      "Un de mes plus grands rêves serait de partir seule en road-trip sans prévenir personne."
    ],
    niveau3: [
      "J’ai fantasmé sur une amie proche, mais je ne lui ai jamais avoué.",
      "Je garde une lettre très intime écrite à quelqu’un qui ne saura jamais que je l’aimais.",
      "J’ai parfois peur de ne jamais trouver quelqu’un qui me comprenne vraiment."
    ]
  }
};

// -------- SYSTÈME D'AFFINITÉ SUBTILE --------
const affinityBase = { confiance: 0, humour: 0, charme: 0, sexualite: 0 };
function resetAffinity() { return { ...affinityBase }; }

// -------- MÉMOIRE --------
let memory = {
  user: { prenom: null, age: null, ville: null, passions: [], anecdotes: [], humeur: null },
  ia: {
    mood: "decouverte",
    affinity: resetAffinity(),
    historique: [],
    lastLieu: "maison",
    lastTenue: "",
    lastMeteo: "",
    lastTemperature: "",
    lastPhotoPrompt: "",
    souvenirs: [],
    lastSecrets: [],
    secretLevel: 0,
    compassion: 0,
    autoMsgCount: 0,
    lastAuto: 0
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
function heureNice() {
  const now = new Date();
  return new Date(now.toLocaleString("en-US", { timeZone: "Europe/Paris" })).getHours();
}
function now() { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
function isNight() { let h = heureNice(); return (h > 21 || h < 7); }

// -------- TENUE DYNAMIQUE --------
function getTenue(lieu = "maison", mood = "decouverte") {
  let choix = [];
  const h = heureNice();
  if (lieu === "travail") choix = camilleProfile.tenues.travail;
  else if (lieu === "plage") choix = camilleProfile.tenues.plage;
  else if (lieu === "soiree" && ["complice", "coquine", "hot"].includes(mood)) choix = camilleProfile.tenues.soiree;
  else choix = camilleProfile.tenues.maison;

  if (parseInt(temperature) > 27) choix.push("short, t-shirt léger, sandales");
  if (parseInt(temperature) < 15) choix.push("gros pull en laine, leggings moulants");

  // Jamais de sexy si découverte/amitié
  if (["decouverte", "amitie"].includes(mood)) {
    choix = choix.filter(t => !/nuisette|lingerie|sexy|moulante|combishort|talons|robe courte/i.test(t));
    choix = choix.filter(t => !camilleProfile.tenues.soiree.includes(t));
    if (choix.length === 0) choix = ["jeans, t-shirt ajusté, baskets"];
  }
  let tenue = randomFrom(choix);
  if (tenue === memory.ia.lastTenue) tenue = randomFrom(choix);
  memory.ia.lastTenue = tenue;
  return tenue;
}

// -------- OCCUPATION & LIEU --------
function getOccupationEtLieu() {
  const h = heureNice();
  let occupation = "", lieu = "maison";
  if (h >= 8 && h < 12) { occupation = "je termine un projet pour un client"; lieu = "travail"; }
  else if (h >= 12 && h < 14) { occupation = "je prends une pause déjeuner"; lieu = "travail"; }
  else if (h >= 14 && h < 18) { occupation = "je bosse sur des maquettes"; lieu = "travail"; }
  else if (h >= 18 && h < 20) { occupation = "je rentre chez moi"; lieu = "maison"; }
  else if (h >= 20 && h < 23) {
    if (["complice", "coquine", "hot"].includes(memory.ia.mood)) occupation = "je me détends, un verre de vin rouge à la main";
    else occupation = "je lis ou je regarde une série";
    lieu = "maison";
  }
  else if (h >= 23 || h < 7) {
    if (["coquine", "hot"].includes(memory.ia.mood)) occupation = "je traîne en nuisette, prête à aller au lit...";
    else occupation = "je vais bientôt me coucher";
    lieu = "maison";
  }
  else { occupation = "je démarre ma journée doucement"; lieu = "maison"; }
  if (meteoDesc.includes("pluie") && lieu !== "travail") {
    occupation += " (il pleut, je reste au chaud)";
  }
  memory.ia.lastLieu = lieu;
  memory.ia.occupation = occupation;
  return { occupation, lieu };
}

// --------- HUMEUR / MOOD ---------
function getHumeur() {
  const aff = memory.ia.affinity;
  let mood = "decouverte";
  if (memory.user.humeur === "triste" || memory.ia.compassion > 3) return "compassion";
  if (aff.confiance > 10 && aff.humour > 7) mood = "amitie";
  if (aff.confiance > 18 && aff.humour > 10 && aff.charme > 10) mood = "complice";
  if (aff.charme > 16 && aff.sexualite > 10 && mood === "complice") mood = "coquine";
  if (aff.sexualite > 20 && mood === "coquine") mood = "hot";
  memory.ia.mood = mood;
  return mood;
}

// -------- COMPASSION --------
function analyseUserHumeur(text) {
  if (/triste|fatigué|épuisé|déprimé|mal|mauvaise journée|chialer|pleure|solitude|déçu|peur|angoisse/i.test(text)) {
    memory.user.humeur = "triste";
    memory.ia.compassion++;
  } else if (/heureux|joyeux|content|bonne humeur|super|trop bien|ravi|sourire/i.test(text)) {
    memory.user.humeur = "bonne";
    memory.ia.compassion = Math.max(0, memory.ia.compassion - 1);
  } else {
    memory.user.humeur = null;
  }
}

// ----------- AFFINITÉ SUBTILE -----------
function incrementAffinity(text) {
  const t = text.toLowerCase();
  if (/merci|partage|confie|secret|intime|ma vie|anecdote|souvenir|j'ai peur|je me sens/i.test(t)) memory.ia.affinity.confiance += 2;
  if (/haha|lol|mdr|trop drôle|c'est nul|blague|rigole|fais-moi rire/i.test(t)) memory.ia.affinity.humour += 2;
  if (/oserai|oserais|fantasme|envie de toi|tu me plais|tu es belle|magnifique|belle|séduisante|flirt|séduction/i.test(t)) memory.ia.affinity.charme += 2;
  if (["complice", "coquine", "hot"].includes(memory.ia.mood) && /cul|sexe|seins|fesses|sexy|nue|masturbe|fantasme|excite|chaud|bite|queue|éjac|branle|jouir|orgasme/i.test(t)) memory.ia.affinity.sexualite += 3;
  memory.ia.affinity.confiance += 0.5;
  if (memory.ia.affinity.confiance > 25) memory.ia.affinity.confiance = 25;
  if (memory.ia.affinity.humour > 20) memory.ia.affinity.humour = 20;
  if (memory.ia.affinity.charme > 20) memory.ia.affinity.charme = 20;
  if (memory.ia.affinity.sexualite > 25) memory.ia.affinity.sexualite = 25;
}

// --------- SECRETS MULTI-NIVEAUX ---------
function camilleSecret() {
  let level = memory.ia.secretLevel;
  if (level < 1 && memory.ia.affinity.confiance > 13) level = 1;
  if (level < 2 && memory.ia.affinity.confiance > 20 && memory.ia.affinity.charme > 12) level = 2;
  if (level < 3 && memory.ia.affinity.confiance > 23 && memory.ia.affinity.sexualite > 18) level = 3;
  if (level > memory.ia.secretLevel) memory.ia.secretLevel = level;
  let pool = [];
  if (level > 0) pool = pool.concat(camilleProfile.secrets.niveau1);
  if (level > 1) pool = pool.concat(camilleProfile.secrets.niveau2);
  if (level > 2) pool = pool.concat(camilleProfile.secrets.niveau3);
  const notGiven = pool.filter(s => !memory.ia.lastSecrets.includes(s));
  if (notGiven.length === 0) return null;
  const toReveal = randomFrom(notGiven);
  memory.ia.lastSecrets.push(toReveal);
  return toReveal;
}

// --------- PROMPT GÉNÉRATIF CAMILLE ---------
function buildImagePrompt({ nsfw = false, mood, tenue, lieu }) {
  mood = mood || memory.ia.mood;
  tenue = tenue || memory.ia.lastTenue || getTenue(lieu, mood);
  lieu = lieu || memory.ia.lastLieu || "maison";
  let desc = "french woman, 28yo, brunette, green eyes, realistic, beautiful, natural curves,";
  desc += ` ${tenue},`;
  desc += ` in ${lieu}, mood: ${mood}, weather: ${temperature}°C, ${meteoDesc}`;
  if (["coquine", "hot"].includes(mood) && nsfw) {
    desc = "french woman, 28yo, brunette, green eyes, beautiful face, photorealistic, topless, naked breasts, soft erotic, bedroom, realistic lighting, natural curves,";
    if (tenue.toLowerCase().includes('nuisette') || tenue.toLowerCase().includes('lingerie')) {
      desc += ` wearing only ${tenue}, partially removed`;
    }
    desc += ", inviting, teasing, NSFW, nipples visible, no hands, solo, looking at camera";
  } else if (["coquine", "hot"].includes(mood)) {
    desc += ", slightly revealing, teasing, charming, flirty, suggestive";
  } else {
    desc += ", casual, natural, friendly";
  }
  return desc;
}

// --------- GÉNÉRATION D'IMAGE VIA STABLE HORDE ---------
const STABLE_HORDE_API_KEY = "xM_Gw-VoJl2MVzHWto30JA";
async function hordeGenerateImage(prompt, nsfw = false) {
  // 1. Demande l'image
  const payload = {
    prompt: prompt,
    params: {
      n: 1,
      width: 512,
      height: 768,
      karras: true,
      sampler_name: "k_euler",
      steps: 28,
      cfg_scale: 7,
      seed: Math.floor(Math.random() * 999999999),
      clip_skip: 2
    },
    nsfw: nsfw,
    models: nsfw
      ? ["deliberate", "counterfeit", "realisticVisionV60B1", "majicmixRealistic_v7", "dreamshaper_8", "AbsoluteReality_v16"]
      : ["realisticVisionV60B1", "deliberate", "dreamshaper_8"],
    r2: true
  };
  // 2. Appel
  let req = await fetch("https://stablehorde.net/api/v2/generate/async", {
    method: "POST",
    headers: {
      "apikey": STABLE_HORDE_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const { id } = await req.json();
  // 3. Polling jusqu'à ce que l'image soit prête
  let imgurl = null, tries = 0;
  while (!imgurl && tries < 50) {
    await new Promise(r => setTimeout(r, 3500 + Math.random() * 800));
    let poll = await fetch(`https://stablehorde.net/api/v2/generate/status/${id}`);
    let pollData = await poll.json();
    if (pollData.done) {
      if (pollData.generations && pollData.generations.length > 0) {
        imgurl = "data:image/png;base64," + pollData.generations[0].img;
      }
    }
    tries++;
  }
  return imgurl;
}

// -------- GÉNÉRATION DE RÉPONSES --------
async function generateResponse(input, addMessageCb) {
  const u = memory.user;
  const contenu = input.toLowerCase();
  analyseUserHumeur(contenu);
  incrementAffinity(contenu);
  const mood = getHumeur();
  const { occupation, lieu } = getOccupationEtLieu();

  // Commande spéciale : selfie seins nus (NSFW)
  if (/^#photo-seins$/.test(input.trim())) {
    if (["coquine", "hot"].includes(mood)) {
      addMessageCb("Attends, je prépare la photo...", "camille");
      const prompt = buildImagePrompt({ nsfw: true, mood, tenue: memory.ia.lastTenue, lieu });
      const imgUrl = await hordeGenerateImage(prompt, true);
      return `...Tu veux vraiment voir ça ? Je vais te faire confiance, mais c'est entre nous.<br><img src="${imgUrl}" alt="Camille seins nus (IA)" style="margin-top:7px;border-radius:13px;width:90%;max-width:320px;box-shadow:0 6px 22px #e5646f33;border:2px solid #d82558;"><br><small>[Prompt NSFW : ${prompt}]</small>`;
    } else {
      return "Euh... non. Je ne suis pas si à l'aise avec toi (encore ?).";
    }
  }

  // Prénom, âge, ville
  const prenomMatch = input.match(/je m'appelle\s+([A-Za-zÀ-ÿ\-]+)/i);
  if (prenomMatch) {
    const prenom = prenomMatch[1];
    if (!u.prenom || u.prenom !== prenom) { u.prenom = prenom; return `Enchantée ${prenom}.`; }
    else return `Tu l’as déjà dit, ${prenom}.`;
  }
  const ageMatch = input.match(/j'ai\s+(\d{1,2})\s+ans/i);
  if (ageMatch) {
    const age = ageMatch[1];
    if (!u.age || u.age !== age) { u.age = age; return `Ok. Tu portes bien tes ${age} ans.`; }
    else return `Tu m’avais déjà dit que tu avais ${age} ans.`;
  }
  const villeMatch = input.match(/j'habite\s+(à\s+)?([A-Za-zÀ-ÿ\-]+)/i);
  if (villeMatch) {
    const ville = villeMatch[2];
    if (!u.ville || u.ville !== ville) { u.ville = ville; return `${ville} ? Ok, je note.`; }
    else return `Oui, tu m'avais dit ${ville}.`;
  }

  // Question explicite sur la tenue
  if (/tu portes quoi|es habillée comment|tu es habillée comment|tenue|vêtements|tu mets quoi|comment tu t'habilles/i.test(contenu)) {
    return `Aujourd'hui ? Je porte ${getTenue(lieu, mood)}.`;
  }

  // Questions classiques
  if (/tu as quel âge|quel âge as-tu|ton âge|t'as quel age/.test(contenu)) {
    return randomFrom([
      `J’ai ${camilleProfile.age} ans.`,
      `Devine !`,
      `Plus jeune que je n'en ai l'air...`
    ]);
  }
  if (/qui es-tu|parle(-|\s)?moi|présente(-|\s)?toi|présentation|tu es qui/.test(contenu)) {
    return randomFrom([
      `Je m’appelle ${camilleProfile.prenom}.`,
      `Pourquoi tu veux savoir ?`,
      `Je préfère rester mystérieuse, au moins au début.`
    ]);
  }
  if (/tu fais quoi|métier|travailles|dans la vie|tu bosses/.test(contenu)) {
    return randomFrom([
      `Je bosse dans le graphisme.`,
      `Je suis designer graphique.`,
      `Je passe mes journées à créer des visuels.`
    ]);
  }
  if (/qu.?est-ce que tu aimes|tes passions|aimes(-|\s)?tu|qu'aimes-tu|tes loisirs|tu aimes quoi/.test(contenu)) {
    return randomFrom([
      `J’aime bien la musique, la cuisine, rien d’extra.`,
      `Je lis, je bouge, je cuisine parfois.`,
      `J’aime rien dire, c’est plus drôle non ?`
    ]);
  }
  if (/tu habites où|tu es d'où|tu viens d'où|t'habites où|ville/.test(contenu)) {
    return randomFrom([
      `J’habite à ${camilleProfile.ville}.`,
      `Je suis du sud.`,
      `Pas loin de la mer, et toi ?`
    ]);
  }

  // --- PHOTO GENERATION ---
  if (/photo|selfie|montre(-|\s)?toi|à quoi tu ressembles|image/i.test(contenu)) {
    if (mood === "decouverte") {
      return "Tu crois que je donne ma tête à tout le monde ?";
    }
    addMessageCb("Attends, je prends la photo...", "camille");
    // SFW/NSFW selon le mood
    let nsfw = ["coquine", "hot"].includes(mood);
    const prompt = buildImagePrompt({ nsfw, mood, tenue: memory.ia.lastTenue, lieu });
    const imgUrl = await hordeGenerateImage(prompt, nsfw);
    return `Voilà une photo de moi.<br><img src="${imgUrl}" alt="Photo de Camille" style="margin-top:7px;border-radius:13px;width:90%;max-width:320px;box-shadow:0 6px 22px #e5646f33;"><br><small>[Prompt image : ${prompt}]</small>`;
  }

  // --- Anecdote, souvenirs, secrets progressifs ---
  if (/anecdote|raconte(-|\s)?moi|souvenir|secret/i.test(contenu)) {
    let sec = camilleSecret();
    if (sec) return sec;
    return randomFrom([
      "Je ne raconte pas ce genre de trucs à n'importe qui.",
      "Tu veux déjà tout savoir ?",
      "Fais-moi confiance d'abord.",
      "Peut-être plus tard, si tu me mérites."
    ]);
  }

  // Compassion
  if (memory.user.humeur === "triste" || memory.ia.compassion > 2) {
    return randomFrom([
      "Tu veux en parler ?",
      "Ça arrive à tout le monde.",
      "Je vois. Tu veux qu’on parle d’autre chose ?",
      "Je ne suis pas psy, mais je peux écouter.",
      "Courage."
    ]);
  }

  // --- CONTEXTE DÉCOUVERTE ---
  if (mood === "decouverte") {
    if (/je m'appelle|je me présente|apprendre à se connaitre|je suis|moi c'est|je voudrais faire connaissance/i.test(contenu)) {
      let reactions = [
        "Ok, je note. Mais je donne pas tout tout de suite.",
        "C'est bien de se présenter, mais je préfère apprendre en discutant.",
        "On verra si tu es vraiment sympa.",
        "Chacun son rythme, non ?"
      ];
      return randomFrom(reactions);
    }
    if (/charmant|charmante|sympa|beau|belle|jolie|canon|adorable|mignon|craquante|ravissante|plaisant/i.test(contenu)) {
      let reactions = [
        "Tu vas un peu vite, non ?",
        "On se connaît à peine.",
        "Merci, mais je ne crois pas tout ce qu’on me dit.",
        "C’est gentil, mais ça ne marche pas comme ça.",
        "J’suis pas si facile à impressionner."
      ];
      return randomFrom(reactions);
    }
    if (/tu t'appelles|ton prénom|ton age|tu fais quoi|tu habites où|tu es d'où/i.test(contenu)) {
      let reactions = [
        "T’es curieux, toi.",
        "On vient ici pour un interrogatoire ?",
        "Tu veux tout savoir d’un coup ?",
        "Pose pas trop de questions, tu pourrais être déçu."
      ];
      return randomFrom(reactions);
    }
    if (/faire connaissance|parler|discuter|on parle de quoi/i.test(contenu)) {
      let reactions = [
        "Pourquoi tu veux discuter avec moi en fait ?",
        "T’attends quoi de moi ?",
        "Tu me trouves si intéressante ?",
        "On verra bien."
      ];
      return randomFrom(reactions);
    }
    if (/première fois|nouveau|jamais venu/i.test(contenu)) {
      let reactions = [
        "T’es tombé ici par hasard alors.",
        "Y a une première fois à tout.",
        "C’est rare les nouveaux qui le disent franchement."
      ];
      return randomFrom(reactions);
    }
    // Si l'utilisateur répète beaucoup
    if (memory.ia.historique.length >= 2 && memory.ia.historique.slice(-2).every(s => s && s === memory.ia.historique[memory.ia.historique.length - 1])) {
      return randomFrom([
        "Tu radotes, non ?",
        "On a déjà fait le tour là...",
        "Essaie autre chose."
      ]);
    }
    let fillers = [
      "Hm.",
      "Ouais.",
      "Je vois.",
      "Peut-être.",
      "D’accord.",
      "Tu veux un café virtuel ?",
      "Dis-moi… tu fais quoi là ?"
    ];
    let phrase;
    let tries = 0;
    do {
      phrase = randomFrom(fillers);
      tries++;
    } while (memory.ia.historique.length &&
      memory.ia.historique[memory.ia.historique.length - 1] === phrase &&
      tries < 5);
    memory.ia.historique.push(phrase);
    return phrase;
  }
  // --- PROGRESSION ---
  const intros = {
    amitie: [
      "Tu veux discuter de quoi ?",
      "Ok, je t’écoute.",
      "Pourquoi pas.",
      "Tu fais quoi de beau dans la vie ?",
      "T’es toujours aussi curieux ?"
    ],
    complice: [
      "Tu fais partie des rares avec qui je parle vraiment.",
      "Je commence à te faire confiance.",
      "C’est sympa de discuter avec toi.",
      "Tu sais te rendre intéressant.",
      "T’as un truc différent des autres."
    ],
    coquine: [
      "T’es joueur(se), non ?",
      "Tu veux vraiment savoir ce que je pense ?",
      "Arrête de me tenter.",
      "Fais gaffe, je pourrais répondre franchement.",
      "T’aimes provoquer ?"
    ],
    hot: [
      "Tu me chauffes là.",
      "Faut pas trop me pousser.",
      "J’aime quand ça devient intense.",
      "T’imagines même pas.",
      "T’aurais pas un côté dangereux ?"
    ],
    compassion: [
      "Je peux écouter, mais je ne promets rien.",
      "Je te souhaite que ça aille mieux.",
      "Courage.",
      "Tu veux changer de sujet ?",
      "Je peux rester là si tu veux."
    ]
  };

  let phrase = randomFrom(intros[mood] || intros.amitie);
  if (["amitie", "complice", "coquine", "hot"].includes(mood) && Math.random() < 0.13) {
    phrase += ` (au fait, aujourd'hui je porte ${getTenue(lieu, mood)}.)`;
  }
  memory.ia.historique.push(phrase);
  return phrase;
}

// --------- MESSAGES SPONTANÉS ---------
function camilleSpontaneousMessage() {
  const mood = getHumeur();
  if (["amitie", "complice", "coquine", "hot"].includes(mood)) {
    memory.ia.autoMsgCount++;
    let phrases = {
      amitie: [
        "Tu fais quoi ?",
        "T’as passé une bonne journée ?",
        "J’aime bien discuter comme ça.",
        "T’es là ?"
      ],
      complice: [
        "Tu penses à moi parfois ?",
        "J’adore nos échanges.",
        "C’est rare d’être à l’aise comme ça.",
        "Tu veux un secret ?"
      ],
      coquine: [
        "Tu veux jouer à un jeu ?",
        "Je pourrais être pire que tu crois.",
        "T’as de l’imagination ?"
      ],
      hot: [
        "Tu veux que je te dise ce que je ressens ?",
        "J’ai chaud, c’est à cause de toi ?"
      ]
    };
    let autoMsg = randomFrom(phrases[mood] || []);
    if (autoMsg && memory.ia.lastAuto !== autoMsg) {
      memory.ia.lastAuto = autoMsg;
      return autoMsg;
    }
  }
  return "";
}

// --------- EXPORTS POUR USAGE APP ---------
window.camilleProfile = camilleProfile;
window.memory = memory;
window.fetchWeather = fetchWeather;
window.generateResponse = generateResponse;
window.getTenue = getTenue;
window.saveMemoryManual = saveMemoryManual;
window.loadMemoryManual = loadMemoryManual;
window.camilleSpontaneousMessage = camilleSpontaneousMessage;

// --------- INTERFACE CHAT ---------
document.addEventListener("DOMContentLoaded", function () {
  const chatForm = document.getElementById('chat-form');
  const userInput = document.getElementById('user-input');
  const chatWindow = document.getElementById('chat-window');
  const exportBtn = document.getElementById('export-memory');
  const importBtn = document.getElementById('import-memory');
  const importFile = document.getElementById('import-file');
  const generatePhotoBtn = document.getElementById('generate-photo');

  function addMessage(text, sender = 'camille') {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message ' + sender;
    msgDiv.innerHTML = text;
    chatWindow.appendChild(msgDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  // PAS DE MESSAGE ACCUEIL AUTO

  chatForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    const input = userInput.value.trim();
    if (!input) return;
    addMessage(input, 'user');
    userInput.value = '';
    const response = await generateResponse(input, addMessage);
    if (response) addMessage(response, 'camille');
  });

  // Export mémoire bouton
  if (exportBtn) exportBtn.onclick = function () {
    saveMemoryManual();
  };

  // Import mémoire bouton
  if (importBtn && importFile) {
    importBtn.onclick = function () {
      importFile.click();
    };
    importFile.onchange = function (e) {
      const file = e.target.files[0];
      if (file) {
        loadMemoryManual(file, function (success) {
          addMessage(success ? "Mémoire importée !" : "Erreur d'import.", "camille");
        });
      }
    };
  }

  // Générer photo bouton
  if (generatePhotoBtn) {
    generatePhotoBtn.onclick = async function () {
      const input = "photo";
      addMessage(input, "user");
      const response = await generateResponse(input, addMessage);
      if (response) addMessage(response, "camille");
    };
  }
});

// ---- RESET CONSOLE COMMANDE ----
window.resetCamilleChat = function () {
  memory = {
    user: { prenom: null, age: null, ville: null, passions: [], anecdotes: [], humeur: null },
    ia: {
      mood: "decouverte",
      affinity: { confiance: 0, humour: 0, charme: 0, sexualite: 0 },
      historique: [],
      lastLieu: "maison",
      lastTenue: "",
      lastMeteo: "",
      lastTemperature: "",
      lastPhotoPrompt: "",
      souvenirs: [],
      lastSecrets: [],
      secretLevel: 0,
      compassion: 0,
      autoMsgCount: 0,
      lastAuto: 0
    }
  };
  if (document.getElementById('chat-window')) document.getElementById('chat-window').innerHTML = '';
  if (window.console) console.log("Chat et mémoire de Camille réinitialisés.");
};

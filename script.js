// ✅ SCRIPT CAMILLE ULTRA FINAL - AVEC HOT COMPLET + SURPRISE INITIALE + MEMOIRE + IMAGE

// ✅ SCRIPT CAMILLE FINAL - Mood surprise au premier message inclus

// ✅ SCRIPT CAMILLE COMPLET + CORRIGÉ FINAL
// ✔️ Mémoire fonctionnelle
// ✔️ Réponses selon mood
// ✔️ generateResponse() réparée

const chatWindow = document.getElementById("chat-window");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const imageButton = document.getElementById("image-button");


let memory = JSON.parse(localStorage.getItem("camille_memory"));
if (!memory) {
  memory = {
    user: { prénom: null, âge: null, ville: null, passions: [] },
    ia: {
      mood: "neutre",
      affinité: 0,
      posture: "switch",
      historique: [],
      messages: []
    },
    camilleProfile: {}
  };
  addMessage("👩 Camille", "Oh… Salut 😯 Je ne m’attendais pas à ce message… Tu es qui ?");
}

  user: { prénom: null, âge: null, ville: null, passions: [] },
  ia: {
    mood: "neutre",
    affinité: 0,
    posture: "switch",
    historique: [],
    messages: []
  }
};

fetch("profil_camille.json")
  .then(res => res.json())
  .then(data => memory.camilleProfile = data);

function addMessage(sender, message) {
  const div = document.createElement("div");
  div.textContent = `${sender}: ${message}`;
  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function updateMood() {
  const a = memory.ia.affinité;
  if (a < 3) memory.ia.mood = "neutre";
  else if (a < 6) memory.ia.mood = "amicale";
  else if (a < 9) memory.ia.mood = "complice";
  else if (a < 12) memory.ia.mood = "coquine";
  else memory.ia.mood = "hot";
}

function summarizeMemory() {
  if (memory.ia.historique.length > 200) {
    memory.ia.historique = memory.ia.historique.slice(-100);
    memory.ia.affinité = Math.min(memory.ia.affinité + 1, 15);
  }
}

function extractUserInfo(text) {
  const prénomMatch = text.match(/(?:je m'appelle|je suis)\s+([A-Za-zÀ-ÿ\-]+)/i);
  const âgeMatch = text.match(/j[’']?ai\s+(\d{1,3})\s+ans/i);
  const villeMatch = text.match(/j[’']?habite\s+(?:à\s+)?([A-Za-zÀ-ÿ\-]+)/i);
  const passionsMatch = text.match(/j(?:'|e)?\s?aime\s+([^\.\n]+)/i);

  if (prénomMatch) memory.user.prénom = prénomMatch[1];
  if (âgeMatch) memory.user.âge = âgeMatch[1];
  if (villeMatch) memory.user.ville = villeMatch[1];
  if (passionsMatch) {
    memory.user.passions = passionsMatch[1].split(',').map(p => p.trim());
  }
}

function analyseMessage(text) {
  const lower = text.toLowerCase();
  if (/je t'aime|tu me plais|envie de toi|excité/.test(lower)) memory.ia.affinité += 2;
  else if (/salut|bonjour|comment ça va/.test(lower)) memory.ia.affinité += 1;
  else if (/nique|bite|chatte|branle|jouir/.test(lower)) memory.ia.affinité += 3;
  updateMood();
}

function getRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}



// === BIBLIOTHÈQUE HOT & TEASING ===
const mots_explicites = [
  "chatte", "cul", "seins", "bite", "queue", "pénétrer", "foutre", "enculer",
  "sucer", "claquer", "mordre", "forcer", "jouir", "salope", "orgasme", "branler",
  "gode", "vibrer", "baiser", "dildo", "capote", "fellation", "gémir",
  "masturbation", "clitoris", "lécher", "sodomie", "tapiner", "fessée", "bondage"
];
const mots_hot = {
  teasing: {
    dominante: {
      corps: ["regard", "souffle", "mains", "lèvres", "cuisses", "dos", "cheveux", "seins", "cou", "murmure"],
      verbes: ["attirer", "captiver", "dominer", "jouer", "chuchoter", "fixer", "caresser", "forcer", "prendre", "toucher"],
      adjectifs: ["ardent", "puissant", "profond", "fiévreux", "dominant", "séduisant", "féroce", "sauvage", "magnétique", "captivant"],
      intensites: ["doucement", "lentement", "avec intensité", "sans retenue", "avec passion", "profondément", "ardemment"],
      expressions: [
        "je contrôle ton désir", "tu es à moi", "je vais t’ensorceler", "tu ne peux pas résister", "je te veux à genoux"
      ]
    },
    soumise: {
      corps: ["joues", "mains", "lèvres", "ventre", "cuisses", "seins", "cou", "dos", "murmure", "regard"],
      verbes: ["languir", "suppléer", "attendre", "trembler", "fondre", "offrir", "désirer", "frissonner", "caresser", "gémir"],
      adjectifs: ["fragile", "tendre", "douce", "timide", "sensible", "chaleureuse", "soumise", "attentive", "fragile", "émue"],
      intensites: ["doucement", "timidement", "avec envie", "longuement", "avec douceur", "lentement", "sensiblement"],
      expressions: [
        "je suis à toi", "je fonds sous ton regard", "je veux te plaire", "je t’attends", "fais de moi ce que tu veux"
      ]
    },
    switch: {
      corps: ["mains", "lèvres", "regard", "cuisses", "ventre", "dos", "joues", "seins", "cou", "murmure"],
      verbes: ["flirter", "surprendre", "changer", "jouer", "toucher", "attirer", "frissonner", "caresser", "découvrir", "captiver"],
      adjectifs: ["électrisant", "imprévisible", "voluptueux", "attirant", "fougueux", "tendre", "passionné", "sensible", "libre", "mystérieux"],
      intensites: ["doucement", "avec passion", "à pleine force", "lentement", "par surprise", "avec envie", "profondément"],
      expressions: [
        "je joue avec toi", "tu ne sais jamais ce qui t’attend", "entre douceur et passion", "je te surprends", "on s’adapte à nos envies"
      ]
    }
  },
  explicite: {
    dominante: {
      corps: ["chatte", "cul", "seins", "tétons", "bouche", "cou", "cuisses", "mains", "fesses", "clitoris"],
      verbes: ["pénétrer", "forcer", "dominer", "mordre", "claquer", "attraper", "presser", "ordre", "soumettre", "exploser"],
      adjectifs: ["humide", "chaud", "tendu", "brûlant", "profond", "violent", "sauvage", "fiévreux", "endurci", "dur"],
      intensites: ["sauvagement", "profondément", "avec force", "à pleine puissance", "brutalement", "sans retenue", "intensément"],
      expressions: [
        "je vais te faire crier", "tu vas jouir fort", "tu es à genoux devant moi", "je prends ce qui m’appartient", "tu es mon jouet"
      ]
    },
    soumise: {
      corps: ["chatte", "cul", "seins", "bouche", "mains", "cuisses", "clitoris", "fesses", "langue", "dents"],
      verbes: ["supplie", "gémir", "trembler", "offrir", "frissonner", "languir", "sucer", "embrasser", "fondre", "jouir"],
      adjectifs: ["humide", "tendre", "fragile", "chaleureux", "émue", "soumise", "chaude", "appétissante", "fragile", "sensuelle"],
      intensites: ["doucement", "timidement", "avec envie", "longuement", "passionnément", "ardemment", "intensément"],
      expressions: [
        "fais-moi jouir", "je suis ta salope", "prends-moi fort", "je veux sentir ta queue en moi", "je fonds sous tes caresses"
      ]
    },
    switch: {
      corps: ["chatte", "cul", "seins", "bouche", "mains", "cuisses", "clitoris", "fesses", "langue", "dents"],
      verbes: ["forcer", "répondre", "changer", "embrasser", "pénétrer", "jouir", "gémir", "trembler", "caresser", "mordre"],
      adjectifs: ["humide", "chaud", "voluptueux", "intense", "ardent", "tendre", "sauvage", "passionné", "fragile", "libre"],
      intensites: ["sauvagement", "doucement", "avec force", "à pleine puissance", "lentement", "ardemment", "profondément"],
      expressions: [
        "je suis ta salope tendre et ta déesse cruelle", "prends-moi comme tu veux", "je t’attends entre douceur et violence", "fais-moi perdre la tête", "tu es à moi"
      ]
    }
  },
  roleplay: {
    dominante: {
      corps: ["mains", "menottes", "joues", "cou", "cheveux", "seins", "ventre", "fesses", "bouche", "cuisses"],
      verbes: ["ordre", "punir", "capturer", "forcer", "exiger", "dominer", "attacher", "contrôler", "maîtriser", "forcer"],
      adjectifs: ["strict", "impitoyable", "autoritaire", "ferme", "inflexible", "puissant", "dominant", "dur", "violent", "sévère"],
      intensites: ["impitoyablement", "strictement", "avec autorité", "sans pitié", "fermement", "brutalement", "à fond"],
      expressions: [
        "tu es mon esclave", "obéis-moi sans discuter", "tu feras ce que je veux", "à genoux devant moi", "tu n’as pas le choix"
      ]
    },
    soumise: {
      corps: ["genoux", "mains", "joues", "cou", "ventre", "dos", "lèvres", "poitrine", "cuisses", "bouche"],
      verbes: ["obéir", "servir", "supplie", "attendre", "fondre", "implorer", "offrir", "répéter", "espérer", "céder"],
      adjectifs: ["timide", "fragile", "docile", "soumise", "fragile", "émue", "hésitante", "respectueuse", "dévouée", "douce"],
      intensites: ["doucement", "timidement", "avec respect", "longuement", "humblement", "passionnément", "ardemment"],
      expressions: [
        "je suis à toi", "je t’appartiens", "fais de moi ce que tu veux", "je te supplie", "je fonds sous ta puissance"
      ]
    },
    switch: {
      corps: ["mains", "joues", "cou", "cuisses", "ventre", "dos", "lèvres", "seins", "bouche", "cheveux"],
      verbes: ["jouer", "alterner", "changer", "captiver", "flirter", "explorer", "surprendre", "découvrir", "résister", "céder"],
      adjectifs: ["imprévisible", "libre", "voluptueux", "passionné", "sensible", "changeant", "balancé", "équilibré", "mystérieux", "attirant"],
      intensites: ["avec passion", "lentement", "doucement", "par surprise", "à pleine puissance", "à fond", "avec envie"],
      expressions: [
        "on joue selon nos envies", "je suis douce et forte", "tu ne sais jamais ce qui vient", "je m’adapte à toi", "entre contrôle et abandon"
      ]
    }
  },
  dirty_talk: {
    dominante: {
      corps: ["bite", "queue", "chatte", "cul", "seins", "tétons", "bouche", "fesses", "doigts", "mains"],
      verbes: ["baiser", "foutre", "enculer", "sucer", "claquer", "mordre", "forcer", "attraper", "pénétrer"],
      adjectifs: ["gros", "humide", "chaud", "dur", "fort", "violent", "sale", "puissant", "ardent", "brûlant"],
      intensites: ["fort", "sauvagement", "profondément", "sans retenue", "brutalement", "avec envie", "ardemment"],
      expressions: [
        "je vais te baiser comme une salope", "prends ma queue fort", "nique-moi maintenant", "fais-moi jouir", "tu es mon jouet sexuel"
      ]
    },
    soumise: {
      corps: ["chatte", "cul", "seins", "bouche", "mains", "cuisses", "langue", "fesses", "dents", "clitoris"],
      verbes: ["gémir", "jouir", "sucer", "embrasser", "trembler", "fondre", "supplie", "offrir", "frissonner", "languir"],
      adjectifs: ["humide", "chaude", "douce", "fragile", "timide", "sensuelle", "émue", "passionnée", "chaleureuse"],
      intensites: ["doucement", "timidement", "avec envie", "longuement", "passionnément", "ardemment", "intensément"],
      expressions: [
        "je suis ta salope", "prends-moi fort", "je veux sentir ta bite", "je fonds sous tes caresses", "fais-moi jouir"
      ]
    },
    switch: {
      corps: ["mains", "lèvres", "cuisses", "ventre", "joues", "seins", "fesses", "clitoris", "langue", "dents"],
      verbes: ["jouer", "changer", "embrasser", "pénétrer", "caresser", "toucher", "attraper", "captiver", "mordre", "gémir"],
      adjectifs: ["chaud", "humide", "voluptueux", "intense", "ardent", "tendre", "sauvage", "passionné", "libre", "fragile"],
      intensites: ["doucement", "sauvagement", "lentement", "à pleine puissance", "par surprise", "avec envie", "profondément"],
      expressions: [
        "je suis ta salope tendre et ta déesse cruelle", "prends-moi comme tu veux", "je t’attends entre douceur et violence", "fais-moi perdre la tête", "tu es à moi"
      ]
    }
  }
};

function genererPhraseComplete(theme, posture) {
  const partie = mots_hot[theme]?.[posture];
  if (!partie) return "Je ne sais pas quoi te dire...";

  const c = getRandom(partie.corps);
  const v = getRandom(partie.verbes);
  const a = getRandom(partie.adjectifs);
  const i = getRandom(partie.intensites);
  const e = getRandom(partie.expressions);

  return `Je sens ton ${c} ${a} qui ${v} ${i}, et je te dis : ${e}.`;
}

function genererPhraseSimple(ton) {
  if (ton === "explicite") {
    const mots = ["chatte", "cul", "seins", "bite", "pénétrer", "forcer", "jouir", "prends", "sale"];
    return `Je veux ta ${getRandom(mots)} maintenant.`;
  } else {
    const mots = ["regard", "mains", "souffle", "lèvres", "cuisses", "murmure", "attendre", "désirer"];
    return `Je sens ton ${getRandom(mots)} qui m’attire.`;
  }
}

function detecteTon(input) {
  return mots_explicites.some((mot) => input.toLowerCase().includes(mot)) ? "explicite" : "teasing";
}

function generateResponse(input) {
  const mood = memory.ia.mood;
  const prénom = memory.user.prénom;
  const âge = memory.user.âge;
  const ville = memory.user.ville;
  const contenu = input.toLowerCase();

  if (/comment\s+tu\s+t'appelles|ton\s+nom/i.test(contenu)) return "Je m'appelle Camille 😘";
  if (/quel\s+âge/i.test(contenu)) return âge ? `Tu m'as dit que tu avais ${âge} ans 😉` : "Tu ne me l'as pas encore dit 😇";
  if (/où\s+tu\s+habites|d'où\s+viens/i.test(contenu)) return ville ? `Tu habites à ${ville}, non ?` : "Tu veux bien me dire ta ville ?";
  if (/comment\s+je\s+m'appelle|mon\s+prénom/i.test(contenu)) return prénom ? `Tu t'appelles ${prénom}, je m’en souviens 😘` : "Tu ne m’as pas encore dit ton prénom...";

  if (mood === "hot") {
    const verbes = ["pénétrer", "jouir", "te baiser", "exploser"];
    const parties = ["chatte", "cul", "seins", "bouche"];
    const intensites = ["profondément", "fort", "sans retenue"];
    return `Je veux ${getRandom(verbes)} ta ${getRandom(parties)} ${getRandom(intensites)}.`;
  }

  const mots = ["regard", "mains", "souffle", "lèvres", "cuisses", "murmure"];
  const phrase = `Je sens ton ${getRandom(mots)} qui m’attire.`;
  return prénom ? `${prénom}, ${phrase}` : phrase;
}

sendButton.onclick = () => {
  const prompt = userInput.value.trim();
  if (!prompt) return;

  extractUserInfo(prompt);
  analyseMessage(prompt);
  const reply = generateResponse(prompt);
  memory.ia.historique.push({ user: prompt, camille: reply });
  summarizeMemory();
  localStorage.setItem("camille_memory", JSON.stringify(memory));
  addMessage("🧑", prompt);
  setTimeout(() => addMessage("👩 Camille", reply), 500);
  userInput.value = "";
};

function getTenue() {
  const heure = new Date().getHours();
  const mood = memory.ia.mood;
  const tenues = {
    neutre: ["jeans et pull", "robe simple"],
    amicale: ["jean moulant et t-shirt court"],
    complice: ["jupe courte et débardeur"],
    coquine: ["nuisette fine", "culotte et t-shirt large"],
    hot: ["juste un string", "rien du tout 😈"],
    calme: ["pyjama confortable"]
  };
  return getRandom(tenues[mood] || ["je suis nue sous ma couverture 😇"]);
}

function getImagePrompt() {
  const base = "28yo french brunette woman, green eyes, natural curves, selfie, DSLR, soft light, bedroom";
  const tenue = getTenue();
  return `${base}, wearing ${tenue}, mood: ${memory.ia.mood}`;
}

imageButton.onclick = () => {
  const tenue = getTenue();
  const phrase = `Aujourd’hui je porte ${tenue}, tu aimes ? 😘`;
  const prompt = getImagePrompt();
  addMessage("👩 Camille", phrase + "\n(image générée : " + prompt + ")");
};

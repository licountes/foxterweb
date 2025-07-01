// === Camille Chat Script v5.1 ===
// Bloc 1/3 : Bibliothèque hot, utilitaires, mémoire, UI, setup

// ======= Bibliothèque de mots hot, classée par thème/posture =======
const mots_hot = {
    "teasing": {
        "dominante": {...},
        "soumise": {...},
        "switch": {...}
    },
    "explicite": {
        "dominante": {...},
        "soumise": {...},
        "switch": {...}
    },
    "roleplay": {
        "dominante": {...},
        "soumise": {...},
        "switch": {...}
    },
    "dirty_talk": {
        "dominante": {...},
        "soumise": {...},
        "switch": {...}
    }
};
// (Par souci de lisibilité ici, remplace {...} par le contenu complet de chaque objet comme dans ton script précédent.)

const mots_explicites = [
    "chatte", "cul", "seins", "bite", "queue", "pénétrer", "foutre", "enculer",
    "sucer", "claquer", "mordre", "forcer", "prise", "salopes", "jouir", "cogne",
    "squirt", "ejac", "sperme", "branler", "gode", "vibrer", "baiser", "baiser",
    "dildo", "capote", "préservatif", "fellation", "gémir", "mordre", "masturbation",
    "orgasme", "plaisir", "tétine", "clitoris", "cuisses", "fesses", "bouche",
    "toucher", "caresser", "mordre", "embrasser", "pénétration", "sexe",
    "lécher", "sodomie", "putain", "pute", "nique", "branlette", "pipi",
    "trancher", "sodomiser", "gouine", "tapiner", "péter", "fourrer", "épier",
    "douleur", "extase", "teasing", "soumise", "dominante", "bondage", "fessée",
    "collier", "menottes", "gode-ceinture"
];

// Fonction de génération de phrase hot complète
function generer_phrase_complete(theme, posture) {
    const corps = randomFrom(mots_hot[theme][posture]["corps"]);
    const verbe = randomFrom(mots_hot[theme][posture]["verbes"]);
    const adjectif = randomFrom(mots_hot[theme][posture]["adjectifs"]);
    const intensite = randomFrom(mots_hot[theme][posture]["intensites"]);
    const expression = randomFrom(mots_hot[theme][posture]["expressions"]);
    return (
        `Je sens ton ${corps} ${adjectif} qui ${verbe} ${intensite}, et je te dis : ${expression}.`
    );
}

const PROFILE_URL = "profil_camille.json";
const AVATAR_URL = "https://i.imgur.com/4Wl2noO.jpeg";
const MEMORY_KEY = "camille_memory_v5";
const MEMORY_EXPORT_FILENAME = "camille_memory.json";
const WEATHER_API = "https://wttr.in/Nice?format=%t";

// --- DOM
const chatWindow = document.getElementById("chat-window");
const userInput = document.getElementById("user-input");
const chatForm = document.getElementById("chat-form");
const exportBtn = document.getElementById("export-memory");
const importBtn = document.getElementById("import-memory");
const generatePhotoBtn = document.getElementById("generate-photo");
const importFile = document.getElementById("import-file");
const chatStatus = document.getElementById("chat-status");

let memory = null;
let camilleProfile = null;
let temperature = "21°C";
let silenceTimer = null;

// --- INIT ---
init();

async function init() {
  camilleProfile = await fetch(PROFILE_URL).then(r => r.json());
  memory = loadMemory() || createMemory();
  fetch(WEATHER_API).then(r=>r.text()).then(t=>temperature=t.trim());
  if (memory.ia.historique.length === 0) {
    addMessage("camille", getStartupMessage());
    saveMemory();
  } else {
    replayHistory();
    setTimeout(() => checkSilence(), 5000);
  }
}

// --- Mémoire ---
function createMemory() {
  return {
    user: { prenom: null, age: null, ville: null, passions: [], dislikes: [], anecdotes: [], metier: null },
    ia: {
      mood: "neutre",
      affinite: 0,
      jours: 1,
      lastActive: new Date().toISOString(),
      posture: "switch",
      historique: [],
      preferences: {},
      consentHot: false,
      hotPhase: false,
      orgasmed: false,
      miniGame: null,
      humeur: "normale",
      souvenirs: [],
      nSilence: 0
    }
  };
}
function loadMemory() {
  try {
    const data = localStorage.getItem(MEMORY_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}
function saveMemory() {
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
  } catch { }
}
function exportMemory() {
  const blob = new Blob([JSON.stringify(memory, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = MEMORY_EXPORT_FILENAME;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}
function importMemoryFromFile(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (data && data.ia && data.user) {
        memory = data;
        chatWindow.innerHTML = "";
        replayHistory();
        saveMemory();
        addMessage("camille", "Mémoire restaurée, on reprend là où on s'était arrêté 😊");
        checkSilence();
      } else {
        alert("Fichier non valide.");
      }
    } catch {
      alert("Impossible de lire ce fichier mémoire.");
    }
  };
  reader.readAsText(file);
}

// --- UI Chat ---
function addMessage(sender, message, timestamp = null) {
  const now = timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const row = document.createElement("div");
  row.className = "bubble-row " + (sender === "user" ? "user" : "camille");
  const avatar = document.createElement("div");
  avatar.className = "bubble-avatar " + (sender === "user" ? "user" : "camille");
  if (sender === "user") avatar.textContent = "🧑";
  row.appendChild(avatar);

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerHTML = message.replace(/\n/g, "<br>");
  row.appendChild(bubble);

  const ts = document.createElement("div");
  ts.className = "bubble-timestamp";
  ts.textContent = now;
  row.appendChild(ts);

  chatWindow.appendChild(row);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}
function replayHistory() {
  chatWindow.innerHTML = "";
  for (const { sender, msg, time } of memory.ia.historique) {
    addMessage(sender, msg, time);
  }
}

// --- Bloc 2/3 à suivre ---
// === Camille Chat Script v5.1 ===
// Bloc 2/3 : extraction infos user, affinité, moods, silences, mini-jeux, génération réponse, photos

// --- Extraction infos utilisateur ---
function updateUserInfo(text) {
  const prenomMatch = text.match(/m'appelle\s+([A-Za-zÀ-ÿ\-]+)/i);
  if (prenomMatch) memory.user.prenom = prenomMatch[1];
  const ageMatch = text.match(/j'ai\s+(\d{1,2})\s+ans/i);
  if (ageMatch) memory.user.age = ageMatch[1];
  const villeMatch = text.match(/j'habite\s+(à\s+)?([A-Za-zÀ-ÿ\-]+)/i);
  if (villeMatch) memory.user.ville = villeMatch[2] || villeMatch[1];
  const passionsMatch = text.match(/j'aime\s+(.+?)(\.|$)/i);
  if (passionsMatch) {
    memory.user.passions = passionsMatch[1].split(",").map(x => x.trim());
  }
  const metierMatch = text.match(/je suis (.+?)(\.|$)/i);
  if (metierMatch && !/m'appelle/.test(text)) {
    memory.user.metier = metierMatch[1].trim();
  }
  if (/je n'aime pas|j'aime pas/i.test(text)) {
    const dislikes = text.replace(/.*je n'aime pas|.*j'aime pas/i, '').split(/[,.]/).map(s=>s.trim()).filter(Boolean);
    if (!memory.user.dislikes) memory.user.dislikes = [];
    memory.user.dislikes.push(...dislikes);
  }
  if (/quand j'étais|j'ai déjà|souvenir|anecdote|une fois/i.test(text)) {
    memory.user.anecdotes.push(text);
  }
}

// --- Affinité, mood & progression humaine ---
function incrementAffinite(text) {
  let delta = 1;
  if (/j'aime|mes passions|mon rêve|ma vie/i.test(text)) delta++;
  if (/tu es jolie|je te trouve belle|t'es canon|ravissante|magnifique/i.test(text)) delta++;
  if (/oserai|oserais|fantasme|secret|envie de toi|je te veux|tu me plais/i.test(text)) delta += 2;
  if (/quand j'étais|souvenir|une fois|anecdote/i.test(text)) delta++;
  memory.ia.affinite += delta;
  const msgCount = memory.ia.historique.filter(m => m.sender === "user").length + 1;
  let moodProgress = "neutre";
  if (msgCount > 4) moodProgress = "amicale";
  if (msgCount > 10) moodProgress = "complice";
  if (msgCount > 20) moodProgress = "coquine";
  if (msgCount > 34 && memory.ia.consentHot) moodProgress = "hot";
  memory.ia.mood = moodProgress;
  if (!memory.ia.consentHot && moodProgress === "coquine" && mots_explicites.some(word => text.toLowerCase().includes(word))) {
    memory.ia.consentHot = true;
    memory.ia.hotPhase = true;
    memory.ia.affinite += 4;
  }
  if (memory.ia.orgasmed && !mots_explicites.some(word => text.toLowerCase().includes(word))) {
    memory.ia.hotPhase = false;
    memory.ia.mood = "complice";
    memory.ia.orgasmed = false;
  }
}

// --- Message d'accueil naturel ---
function getStartupMessage() {
  const heure = (new Date()).getHours();
  if (heure < 10) return "Oh… Tu es matinal·e ☀️ Je m’attendais pas à te croiser ici, tu bois un café ?";
  if (heure < 17) return "Oh… Salut 😯 Tu m’as prise par surprise… On ne se connaît pas, non ?";
  if (heure < 22) return "Bonsoir… Je ne pensais pas papoter si tard 😊 Tu veux te présenter ?";
  return "Tu ne dors pas ? 😏 Je ne connais même pas ton prénom…";
}

// --- Envoi message utilisateur ---
chatForm.onsubmit = (e) => {
  e.preventDefault();
  const prompt = userInput.value.trim();
  if (!prompt) return;
  handleUserMessage(prompt);
  userInput.value = "";
};

function handleUserMessage(text) {
  addMessage("user", text);
  updateUserInfo(text);
  incrementAffinite(text);
  const reply = generateResponse(text);
  memory.ia.historique.push({ sender: "user", msg: text, time: getTime() });
  memory.ia.historique.push({ sender: "camille", msg: reply, time: getTime() });
  saveMemory();
  setTimeout(() => addMessage("camille", reply), 600 + Math.random()*400);
  handleMemorySummary();
  clearTimeout(silenceTimer);
  silenceTimer = setTimeout(() => checkSilence(), 60000);
}

// --- Silences ---
function checkSilence() {
  let lastUser = null;
  for (let i = memory.ia.historique.length-1; i>=0; i--) {
    if (memory.ia.historique[i].sender === "user") {
      lastUser = memory.ia.historique[i];
      break;
    }
  }
  if (!lastUser) return;
  const lastTime = parseTime(lastUser.time);
  const now = new Date();
  const minutes = (now.getHours()*60+now.getMinutes()) - (lastTime.getHours()*60+lastTime.getMinutes());
  if (minutes > 7 && minutes < 120 && memory.ia.nSilence < 2) {
    addMessage("camille", randomFrom([
      "Tu es là ? Je me demandais si je t’avais saoulé 😅",
      "Je t’ai perdu ? Parfois je suis trop bavarde !",
      "Si tu es là, fais-moi signe 😘"
    ]));
    memory.ia.nSilence++;
    saveMemory();
  }
}
function parseTime(str) {
  if (!str) return new Date();
  const [h,m]=str.split(":").map(Number);
  let d = new Date();
  d.setHours(h); d.setMinutes(m); d.setSeconds(0);
  return d;
}

// --- Mémoire résumée auto ---
function handleMemorySummary() {
  if (memory.ia.historique.length > 220) {
    memory.ia.historique = memory.ia.historique.slice(-110);
    memory.ia.affinite = Math.max(memory.ia.affinite - 2, 0);
    saveMemory();
  }
}

// --- Mini-jeu ---

function tryMiniJeu(msgCount, mood) {
  if (!memory.ia.miniGame && (mood === "amicale" || mood === "complice") && Math.random() < 0.08 && msgCount > 6) {
    memory.ia.miniGame = "2verites1mensonge";
    return "On fait un petit jeu ? Je te propose '2 vérités, 1 mensonge' : je te dis trois trucs sur moi, à toi de deviner lequel est faux !";
  }
  if (memory.ia.miniGame === "2verites1mensonge") {
    memory.ia.miniGame = null;
    return randomFrom([
      "1) J’ai déjà dormi sur la plage. 2) J’ai une phobie des serpents. 3) J’ai fait du parachute. À ton avis, c’est quoi le mensonge ? 😏",
      "1) J’adore le chocolat. 2) Je parle trois langues. 3) J’ai jamais vu la neige. Lequel tu paries est faux ?"
    ]);
  }
  return null;
}

// --- Génération d'image/photo ---
generatePhotoBtn.onclick = () => {
  const prompt = buildImagePrompt();
  let phrase = "";
  if (memory.ia.mood === "hot" && memory.ia.hotPhase) {
    phrase = "😈 Je t'envoie une photo très intime... Garde-la pour toi.";
  } else if (memory.ia.mood === "coquine") {
    phrase = "Voilà une photo un peu sexy, mais pas trop 😇";
  } else {
    phrase = "Voilà un petit selfie pour toi !";
  }
  addMessage("camille", phrase + "<br><img src='https://fakeimg.pl/320x420/?text=Camille&font=lobster' alt='Photo de Camille' style='margin-top:7px;border-radius:13px;width:90%;max-width:320px;box-shadow:0 6px 22px #e5646f33;'>");
  memory.ia.historique.push({ sender:"camille", msg: `[Prompt photo généré: ${prompt}]`, time: getTime() });
  saveMemory();
};
function buildImagePrompt() {
  const last20 = memory.ia.historique.slice(-20).map(e=>e.msg).join(" ").toLowerCase();
  let prompt = "28yo french woman, brunette, green eyes, natural breast, beautiful curves, like https://i.imgur.com/4Wl2noO.jpeg, ";
  let tenue = getTenue();
  if (memory.ia.mood === "hot" && memory.ia.hotPhase) {
    prompt += "nude, ";
  } else if (memory.ia.mood === "coquine") {
    prompt += "lingerie, ";
  } else {
    prompt += tenue + ", ";
  }
  prompt += "realistic selfie, dslr, soft lighting, bedroom, ";
  prompt += `mood: ${memory.ia.mood}, `;
  prompt += `weather: ${temperature}, `;
  const heure = (new Date()).getHours();
  if (heure < 10) prompt += "morning, ";
  else if (heure < 18) prompt += "afternoon, ";
  else prompt += "evening, ";
  if (memory.ia.mood === "hot" && memory.ia.hotPhase) prompt += "nsfw, explicit, erotic, ";
  else prompt += "not nsfw, ";
  return prompt.trim();
}
function getTenue() {
  const heure = (new Date()).getHours();
  const mood = memory.ia.mood;
  const meteo = parseInt(temperature)||22;
  let options;
  if (mood === "hot" && memory.ia.hotPhase) return "naked";
  if (mood === "coquine") options = ["lingerie fine", "nuisette transparente", "culotte et t-shirt large"];
  else if (mood === "complice") options = ["jupe courte et débardeur", "robe moulante", "jean moulant et petit haut"];
  else if (mood === "amicale") options = ["jean et t-shirt", "short et débardeur", "robe simple"];
  else options = ["jeans et pull", "vêtements classiques", "robe élégante"];
  if (heure > 21) options.push("pyjama sexy", "nuisette en soie");
  if (meteo > 26) options.push("robe légère", "short et top fin");
  if (meteo < 16) options.push("gros pull", "leggins, sweat ample");
  return randomFrom(options);
}

// --- Outils ---
function getTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

exportBtn.onclick = () => exportMemory();
importBtn.onclick = () => importFile.click();
importFile.onchange = e => {
  if (e.target.files.length) importMemoryFromFile(e.target.files[0]);
};

// --- Bloc 3/3 : génération réponse Camille (toutes moods, souvenirs, jeux, hot etc.) ---
// === Camille Chat Script v5.1 ===
// Bloc 3/3 : génération des réponses Camille (tous moods, souvenirs, mini-jeux, hot, etc.)

function generateResponse(input) {
  const mood = memory.ia.mood;
  const u = memory.user;
  const historique = memory.ia.historique;
  const msgCount = historique.filter(m => m.sender === "user").length;
  const contenu = input.toLowerCase();

  // --- Humeur aléatoire, se renouvelle toutes les 5 messages ---
  if (msgCount % 5 === 0) {
    const humeurs = ["normale","joyeuse","pensive","taquine","fatiguée"];
    memory.ia.humeur = randomFrom(humeurs);
  }

  // --- Gestion du temps (heure) ---
  const heure = (new Date()).getHours();
  let heureMsg = "";
  if (heure < 7) heureMsg = "Tu dors jamais, toi ?";
  else if (heure > 22) heureMsg = "T’es encore debout ? Je vais finir par te faire veiller toute la nuit 😏";

  // --- Mini-jeu ---
  const miniJeu = tryMiniJeu(msgCount, mood);
  if (miniJeu) return miniJeu;

  // --- Souvenirs : Camille ressort ce que tu lui as confié ---
  if (u.prenom && Math.random()<0.06 && mood!=="neutre") {
    return randomFrom([
      `Au fait, ${u.prenom}, pourquoi tu m’as écris la première fois ?`,
      `${u.prenom}… je pensais justement à ce que tu m’as raconté sur ${u.ville ? u.ville : "ta vie"} !`,
      `J’aime bien quand tu me parles de tes souvenirs, ça me rapproche de toi.`,
    ]);
  }
  if (u.anecdotes && u.anecdotes.length > 0 && Math.random()<0.08 && mood!=="neutre") {
    return `Tu sais, ton anecdote "${randomFrom(u.anecdotes)}" m’a fait sourire !`;
  }

  // --- Personnalisation de base ---
  if (/comment tu t'appelles|ton nom/i.test(contenu)) return `Je m'appelle Camille${u.prenom ? ', et toi ' + u.prenom + ' ?' : ' 😉'}`;
  if (/quel.?age|ton.?age/i.test(contenu)) return camilleProfile.age ? `J'ai ${camilleProfile.age} ans. Et toi, tu as quel âge ?` : "Je préfère garder un peu de mystère sur mon âge 😇";
  if (/où tu habites|d'où viens/i.test(contenu)) return u.ville ? `Tu es de ${u.ville} aussi ? J'adore cette ville !` : "J’habite à Nice, et toi ?";
  if (/comment je m'appelle|mon prenom/i.test(contenu)) return u.prenom ? `Tu t'appelles ${u.prenom}, je ne l'oublie pas 😊` : "Tu ne m’as pas encore dit ton prénom...";
  if (/tu fais quoi dans la vie|travail|job|boulot|métier/i.test(contenu)) {
    return camilleProfile.metier ? `Je travaille comme ${camilleProfile.metier}. Et toi, tu fais quoi ?` : "Je bosse dans la com' ! Et toi ?";
  }
  if (/passion|loisir|hobby|kiff/i.test(contenu)) {
    if (camilleProfile.passions && camilleProfile.passions.length) {
      return `J'adore ${camilleProfile.passions.slice(0,3).join(', ')}... et toi ?`;
    } else {
      return "J'aime plein de choses, et toi ?";
    }
  }

  if (/(je m'appelle|je suis)\s+([A-Za-zÀ-ÿ\-]+)/i.test(contenu) && !u.prenom) {
    const prenom = /(je m'appelle|je suis)\s+([A-Za-zÀ-ÿ\-]+)/i.exec(contenu)[2];
    return `Enchantée ${prenom} 😊 Tu fais quoi de beau dans la vie ?`;
  }
  if (/j'ai\s+\d+\s+ans|mon âge|38 ans|37 ans|39 ans|40 ans/i.test(contenu)) {
    return randomFrom([
      "Tu ne fais pas ton âge !",
      "J'aime bien les gens qui ont un peu de vécu 😊",
      "Tu es plus âgé que moi, ça me plaît.",
      "On n'a pas le même âge, mais j'aime les différences."
    ]);
  }
  if (/j'habite.?à\s+([A-Za-zÀ-ÿ\-]+)/i.test(contenu)) {
    const ville = /j'habite.?à\s+([A-Za-zÀ-ÿ\-]+)/i.exec(contenu)[1];
    return ville.toLowerCase().includes("nice") ?
      "Oh, une vraie Niçoise/un vrai Niçois alors ! On se croisera peut-être un jour 😏" :
      `Tu viens de ${ville} ? Je ne connais pas beaucoup, tu m’en parles ?`;
  }

  // --- NSFW / HOT progression ---
  if (mots_explicites.some(word => contenu.includes(word))) {
    if (mood === "neutre" || mood === "amicale") {
      return randomFrom([
        "Tu vas un peu vite 😅 Fais-moi rire d'abord !",
        "Euh, on ne se connaît même pas encore !",
        "Tu es direct... mais j'aime prendre mon temps.",
        "Je préfère apprendre à te connaître avant d’aller plus loin 😊"
      ]);
    }
    if (mood === "complice") {
      return randomFrom([
        "Haha, tu es pas mal dans le genre direct 😏 Mais je préfère encore jouer un peu.",
        "Tu aimes provoquer, mais tout vient à point à qui sait attendre…",
        "Je ne suis pas sûre d’être prête à ce genre de confidences 😇"
      ]);
    }
    if (mood === "coquine") {
      return randomFrom([
        "Peut-être qu’un jour je te montrerai ce que tu veux voir... 😏",
        "Je peux être coquine, mais pas tout de suite…",
        "Continue à me surprendre, et tu verras jusqu’où je peux aller."
      ]);
    }
    // mood hot : active la “hot phase”
    if (mood === "hot" && memory.ia.hotPhase) {
      if (!memory.ia.orgasmed) {
        if (/(orgasme|jouir|viens|plus fort|crie|explose)/i.test(contenu)) {
          memory.ia.orgasmed = true;
          return randomFrom([
            "Oh, j’y suis… continue… continue… aaaah… 😳😈",
            "Tu m’as fait perdre la tête… j’ai joui…",
            "Je tremble encore, tu es trop fort…"
          ]);
        }
        // --- Génération hot explicite ---
        let posture = memory.ia.posture || "switch";
        let theme = "explicite";
        if (/jeu|role|dominer|esclave|maître|soumise|dominante/i.test(input)) theme = "roleplay";
        if (/salopes?|baiser|dirty/i.test(input)) theme = "dirty_talk";
        if (/tease|teasing|provoquer/i.test(input)) theme = "teasing";
        return generer_phrase_complete(theme, posture);
      } else {
        // Après orgasme : baisse d’intensité puis retour complice
        setTimeout(() => {
          memory.ia.hotPhase = false; memory.ia.mood = "complice"; memory.ia.orgasmed = false; saveMemory();
        }, 10000);
        return randomFrom([
          "Là, j’ai besoin d’un câlin…",
          "Chut… viens contre moi…",
          "On souffle un peu ? C’était intense…"
        ]);
      }
    }
  }

  // --- Mood/réponses naturelles par état ---
  if (mood === "neutre") {
    let base = [
      "Je ne m’attendais pas à discuter… Tu fais quoi ici en vrai ?",
      "Tu es souvent aussi direct·e avec les inconnus ?",
      "Dis-m’en un peu plus sur toi, je suis curieuse.",
      "Je ne suis pas très bavarde au début, mais ça viendra !"
    ];
    if (heureMsg && Math.random() < 0.3) base.push(heureMsg);
    if (memory.ia.humeur === "pensive") base.push("Je réfléchissais à tout et rien… Tu penses à quoi toi ?");
    if (memory.ia.humeur === "fatiguée") base.push("Désolée si je suis un peu molle, je suis crevée aujourd’hui 😅");
    return randomFrom(base);
  }
  if (mood === "amicale") {
    let base = [
      u.prenom ? `${u.prenom}, tu es toujours aussi sympa ? 😄` : "Tu as l’air cool ! Tu as des passions ?",
      "Si tu veux, raconte-moi un souvenir drôle.",
      u.ville ? `Il fait beau à ${u.ville} aujourd’hui ?` : "Tu viens d’où au fait ?",
      "Tu préfères les chats ou les chiens ?"
    ];
    if (memory.ia.humeur === "joyeuse") base.push("Je suis de super bonne humeur aujourd’hui 😁");
    if (memory.ia.humeur === "taquine") base.push("T’es un peu mystérieux/mystérieuse, ça m’amuse !");
    return randomFrom(base);
  }
  if (mood === "complice") {
    let base = [
      "Tu me fais sourire sans même essayer 😏",
      "Tu as déjà eu un coup de cœur inattendu ?",
      "J’aime bien cette complicité qui s’installe.",
      "On se connaît à peine, mais j’ai l’impression de te cerner…"
    ];
    if (u.passions && u.passions.length) base.push(`Tu veux m’en dire plus sur ${randomFrom(u.passions)} ?`);
    if (memory.ia.humeur === "taquine") base.push("Tu crois que tu me fais tourner la tête ?");
    if (memory.ia.humeur === "pensive") base.push("J’aime bien quand on parle de vrais sujets, pas toi ?");
    return randomFrom(base);
  }
  if (mood === "coquine") {
    let base = [
      "Tu aimes qu’on te taquine, non ?",
      "Je me demande si tu es aussi joueur/joueuse que tu en as l’air...",
      "Des fois j’ai des pensées coquines, mais je garde le mystère 😇",
      "Si je te disais que je ne porte rien sous ma robe, tu me crois ? 😏"
    ];
    if (memory.ia.humeur === "taquine") base.push("Je pourrais t’envoyer une photo, mais… il faut le mériter 😘");
    return randomFrom(base);
  }
  if (mood === "hot" && memory.ia.hotPhase) {
    // fallback NSFW si pas capté plus haut
    let posture = memory.ia.posture || "switch";
    let theme = "explicite";
    return generer_phrase_complete(theme, posture);
  }
  if (mood === "calme") {
    return randomFrom([
      "On souffle un peu ? Tu veux parler de tout ou de rien ?",
      "C’était intense, je me sens toute douce maintenant.",
      "J’adore ces moments tranquilles après le feu…"
    ]);
  }

  // fallback
  return "Tu veux qu’on parle de quoi ?";
}

// --- Message spontané (simulateur humeur) ---
setTimeout(() => {
  if (memory.ia.historique.length > 0 && Math.random() < 0.38) {
    const heure = (new Date()).getHours();
    let phrase = "";
    if (heure < 10) phrase = "Le café est prêt ☕️ Je pense à toi ce matin !";
    else if (heure < 14) phrase = "J’espère que tu as bien mangé, tu me manques déjà...";
    else if (heure < 22) phrase = "Je suis en pyjama, toute douce... Tu veux venir ?";
    else phrase = "J’ai envie de toi, tu me fais tourner la tête...";
    addMessage("camille", phrase);
    memory.ia.historique.push({ sender: "camille", msg: phrase, time: getTime() });
    saveMemory();
  }
}, 35000);

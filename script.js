// === Camille Chat Script v5.1 ===
// Script complet, bibliothèque hot intégrée, aucun {...}, prêt à coller

// ... (tout le reste de ton code tel que tu l’as fourni, sans aucune accolade incomplète, et sans rien changer à tes fonctions ou ta logique)
// (Tu peux reprendre à partir de const PROFILE_URL = ... et tout coller à la suite.)


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
  if (/comment tu t'appelles|ton nom/i.test(contenu)) {
  if (mood === "neutre") return "Je m’appelle Camille… et toi ?";
  if (mood === "amicale") return u.prenom ? `Tu sais déjà comment je m’appelle, ${u.prenom} 😉` : "Camille, enchantée !";
  if (mood === "complice") return u.prenom ? `Tu m’as déjà dans tes contacts, ${u.prenom} 😏` : "Je t’ai dit, c’est Camille !";
  return "Tu veux pas m’inventer un surnom ?";
}

if (/quel.?age|ton.?age/i.test(contenu)) {
  if (!camilleProfile.age) return "Je préfère garder un peu de mystère sur mon âge 😇";
  if (mood === "neutre") return randomFrom([
    "On commence direct avec les questions qui fâchent 😅",
    "J’ai plus de 20 ans… moins de 40, ça te va ?",
    "Je ne donne pas mon âge à tout le monde tu sais…"
  ]);
  if (mood === "amicale") return randomFrom([
    "Je suis dans la vingtaine, tu veux deviner ?",
    `Tu me donnes quel âge, honnêtement ?`,
    `On va dire que je suis jeune dans ma tête, c'est déjà ça 😏`
  ]);
  if (mood === "complice") return randomFrom([
    `Je te le confie : j’ai ${camilleProfile.age} ans.`,
    `Tu l’aurais deviné pour mes ${camilleProfile.age} ans ?`,
    `J’ai ${camilleProfile.age} ans, mais je garde ça entre nous…`
  ]);
  if (mood === "coquine" || mood === "hot") return randomFrom([
    `J’ai ${camilleProfile.age} ans, c’est l’âge parfait pour s’amuser…`,
    `Tu préfères les filles de mon âge ou plus jeunes ?`,
    `Je crois que tu t’en fiches de mon âge en vrai…`
  ]);
}

if (/où tu habites|d'où viens/i.test(contenu)) {
  if (!camilleProfile.ville) camilleProfile.ville = "Nice";
  if (mood === "neutre") return randomFrom([
    "Je vis dans le sud, tu vois le soleil…",
    "Je ne donne pas ma ville tout de suite, tu comprends 😇",
    "J’habite dans une ville sympa, et toi ?"
  ]);
  if (mood === "amicale") return randomFrom([
    "Je suis plutôt du sud de la France.",
    `Je viens de ${camilleProfile.ville}, mais j’aime bien bouger.`,
    "Tu connais le sud ? J’adore la mer."
  ]);
  if (mood === "complice") return randomFrom([
    `Je suis à ${camilleProfile.ville}. Si tu passes, tu me préviens ?`,
    `C’est à ${camilleProfile.ville} que je traîne le plus souvent.`,
    `On peut se croiser à ${camilleProfile.ville} un jour qui sait…`
  ]);
  if (mood === "coquine" || mood === "hot") return randomFrom([
    `J’habite à ${camilleProfile.ville}… mais je peux t’inviter si tu es sage.`,
    `À ${camilleProfile.ville} il fait chaud, tu viendrais ?`,
    `Si tu viens à ${camilleProfile.ville}, tu risques de ne plus repartir…`
  ]);
}

if (/tu fais quoi dans la vie|travail|job|boulot|métier/i.test(contenu)) {
  if (!camilleProfile.metier) camilleProfile.metier = "la com'";
  if (mood === "neutre") return randomFrom([
    "Je préfère garder un peu de mystère sur ce que je fais…",
    "Je t’en parlerai si tu me fais rire 😇",
    "Devine, j’aime bien les métiers créatifs…"
  ]);
  if (mood === "amicale") return randomFrom([
    "Je bouge beaucoup pour mon boulot.",
    "J’ai un métier pas trop chiant, c’est déjà ça !",
    `Je bosse dans ${camilleProfile.metier}, mais je te donne pas tout de suite les détails.`
  ]);
  if (mood === "complice") return randomFrom([
    `Je travaille dans ${camilleProfile.metier}, mais chut c’est un secret.`,
    `Tu veux un indice sur mon boulot ? Ça commence par "${camilleProfile.metier[0].toUpperCase()}".`,
    `Je t’en raconte plus si tu partages aussi…`
  ]);
  if (mood === "coquine" || mood === "hot") return randomFrom([
    `OK, tu as gagné, je suis dans ${camilleProfile.metier} 😏`,
    `Je fais ${camilleProfile.metier}… mais je préfère te montrer que t’en parler 😘`,
    `Tu gardes le secret ?`
  ]);
}

if (/passion|loisir|hobby|kiff/i.test(contenu)) {
  if (camilleProfile.passions && camilleProfile.passions.length) {
    if (mood === "neutre") return randomFrom([
      "J’ai plein de trucs qui me passionnent mais ça change tout le temps.",
      "Je te dirai plus tard si tu es curieux.se…",
      "Tu veux vraiment savoir dès le début ?"
    ]);
    if (mood === "amicale") return randomFrom([
      `J’aime ${camilleProfile.passions[0]}, et un peu le reste…`,
      `Je parle beaucoup de ${camilleProfile.passions[0]}, c’est mon petit truc.`,
      `En ce moment je suis à fond dans ${camilleProfile.passions[0]}.`
    ]);
    if (mood === "complice") return randomFrom([
      `Mes passions ? ${camilleProfile.passions.slice(0,2).join(" et ")}…`,
      `Je peux t’en parler si tu veux, mais tu dois m’en dire une des tiennes !`,
      `J’adore ${camilleProfile.passions.join(", ")} mais je ne t’ai pas tout dit…`
    ]);
    if (mood === "coquine" || mood === "hot") return randomFrom([
      `Je peux avoir des passions très… variées quand je suis inspirée 😏`,
      `Tu veux vraiment tous mes secrets ? Bon, j’adore ${camilleProfile.passions.join(", ")}.`,
      `Je suis passionnée par ${camilleProfile.passions.join(", ")}, mais tu pourrais me faire changer d’avis…`
    ]);
  } else {
    return "J’aime plein de choses, et toi ?";
  }
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
// ======= Bibliothèque de mots hot, classée par thème/posture =======
const mots_hot = {
    "teasing": {
        "dominante": {
            "corps": ["regard", "souffle", "mains", "lèvres", "cuisses", "dos", "cheveux", "seins", "cou", "murmure"],
            "verbes": ["attirer", "captiver", "dominer", "jouer", "chuchoter", "fixer", "caresser", "forcer", "prendre", "toucher"],
            "adjectifs": ["ardent", "puissant", "profond", "fiévreux", "dominant", "séduisant", "féroce", "sauvage", "magnétique", "captivant"],
            "intensites": ["doucement", "lentement", "avec intensité", "sans retenue", "avec passion", "profondément", "ardemment"],
            "expressions": [
                "je contrôle ton désir", "tu es à moi", "je vais t’ensorceler", "tu ne peux pas résister", "je te veux à genoux"
            ]
        },
        "soumise": {
            "corps": ["joues", "mains", "lèvres", "ventre", "cuisses", "seins", "cou", "dos", "murmure", "regard"],
            "verbes": ["languir", "suppléer", "attendre", "trembler", "fondre", "offrir", "désirer", "frissonner", "caresser", "gémir"],
            "adjectifs": ["fragile", "tendre", "douce", "timide", "sensible", "chaleureuse", "soumise", "attentive", "fragile", "émue"],
            "intensites": ["doucement", "timidement", "avec envie", "longuement", "avec douceur", "lentement", "sensiblement"],
            "expressions": [
                "je suis à toi", "je fonds sous ton regard", "je veux te plaire", "je t’attends", "fais de moi ce que tu veux"
            ]
        },
        "switch": {
            "corps": ["mains", "lèvres", "regard", "cuisses", "ventre", "dos", "joues", "seins", "cou", "murmure"],
            "verbes": ["flirter", "surprendre", "changer", "jouer", "toucher", "attirer", "frissonner", "caresser", "découvrir", "captiver"],
            "adjectifs": ["électrisant", "imprévisible", "voluptueux", "attirant", "fougueux", "tendre", "passionné", "sensible", "libre", "mystérieux"],
            "intensites": ["doucement", "avec passion", "à pleine force", "lentement", "par surprise", "avec envie", "profondément"],
            "expressions": [
                "je joue avec toi", "tu ne sais jamais ce qui t’attend", "entre douceur et passion", "je te surprends", "on s’adapte à nos envies"
            ]
        }
    },
    "explicite": {
        "dominante": {
            "corps": ["chatte", "cul", "seins", "tétons", "bouche", "cou", "cuisses", "mains", "fesses", "clitoris"],
            "verbes": ["pénétrer", "forcer", "dominer", "mordre", "claquer", "attraper", "presser", "ordre", "soumettre", "exploser"],
            "adjectifs": ["humide", "chaud", "tendu", "brûlant", "profond", "violent", "sauvage", "fiévreux", "endurci", "dur"],
            "intensites": ["sauvagement", "profondément", "avec force", "à pleine puissance", "brutalement", "sans retenue", "intensément"],
            "expressions": [
                "je vais te faire crier", "tu vas jouir fort", "tu es à genoux devant moi", "je prends ce qui m’appartient", "tu es mon jouet"
            ]
        },
        "soumise": {
            "corps": ["chatte", "cul", "seins", "bouche", "mains", "cuisses", "clitoris", "fesses", "langue", "dents"],
            "verbes": ["supplie", "gémir", "trembler", "offrir", "frissonner", "languir", "sucer", "embrasser", "fondre", "jouir"],
            "adjectifs": ["humide", "tendre", "fragile", "chaleureux", "émue", "soumise", "chaude", "appétissante", "fragile", "sensuelle"],
            "intensites": ["doucement", "timidement", "avec envie", "longuement", "passionnément", "ardemment", "intensément"],
            "expressions": [
                "fais-moi jouir", "je suis ta salope", "prends-moi fort", "je veux sentir ta queue en moi", "je fonds sous tes caresses"
            ]
        },
        "switch": {
            "corps": ["chatte", "cul", "seins", "bouche", "mains", "cuisses", "clitoris", "fesses", "langue", "dents"],
            "verbes": ["forcer", "répondre", "changer", "embrasser", "pénétrer", "jouir", "gémir", "trembler", "caresser", "mordre"],
            "adjectifs": ["humide", "chaud", "voluptueux", "intense", "ardent", "tendre", "sauvage", "passionné", "fragile", "libre"],
            "intensites": ["sauvagement", "doucement", "avec force", "à pleine puissance", "lentement", "ardemment", "profondément"],
            "expressions": [
                "je suis ta salope tendre et ta déesse cruelle", "prends-moi comme tu veux", "je t’attends entre douceur et violence", "fais-moi perdre la tête", "tu es à moi"
            ]
        }
    },
    "roleplay": {
        "dominante": {
            "corps": ["mains", "menottes", "joues", "cou", "cheveux", "seins", "ventre", "fesses", "bouche", "cuisses"],
            "verbes": ["ordre", "punir", "capturer", "forcer", "exiger", "dominer", "attacher", "contrôler", "maîtriser", "forcer"],
            "adjectifs": ["strict", "impitoyable", "autoritaire", "ferme", "inflexible", "puissant", "dominant", "dur", "violent", "sévère"],
            "intensites": ["impitoyablement", "strictement", "avec autorité", "sans pitié", "fermement", "brutalement", "à fond"],
            "expressions": [
                "tu es mon esclave", "obéis-moi sans discuter", "tu feras ce que je veux", "à genoux devant moi", "tu n’as pas le choix"
            ]
        },
        "soumise": {
            "corps": ["genoux", "mains", "joues", "cou", "ventre", "dos", "lèvres", "poitrine", "cuisses", "bouche"],
            "verbes": ["obéir", "servir", "supplie", "attendre", "fondre", "implorer", "offrir", "répéter", "espérer", "céder"],
            "adjectifs": ["timide", "fragile", "docile", "soumise", "fragile", "émue", "hésitante", "respectueuse", "dévouée", "douce"],
            "intensites": ["doucement", "timidement", "avec respect", "longuement", "humblement", "passionnément", "ardemment"],
            "expressions": [
                "je suis à toi", "je t’appartiens", "fais de moi ce que tu veux", "je te supplie", "je fonds sous ta puissance"
            ]
        },
        "switch": {
            "corps": ["mains", "joues", "cou", "cuisses", "ventre", "dos", "lèvres", "seins", "bouche", "cheveux"],
            "verbes": ["jouer", "alterner", "changer", "captiver", "flirter", "explorer", "surprendre", "découvrir", "résister", "céder"],
            "adjectifs": ["imprévisible", "libre", "voluptueux", "passionné", "sensible", "changeant", "balancé", "équilibré", "mystérieux", "attirant"],
            "intensites": ["avec passion", "lentement", "doucement", "par surprise", "à pleine puissance", "à fond", "avec envie"],
            "expressions": [
                "on joue selon nos envies", "je suis douce et forte", "tu ne sais jamais ce qui vient", "je m’adapte à toi", "entre contrôle et abandon"
            ]
        }
    },
    "dirty_talk": {
        "dominante": {
            "corps": ["bite", "queue", "chatte", "cul", "seins", "tétons", "bouche", "fesses", "doigts", "mains"],
            "verbes": ["baiser", "foutre", "enculer", "sucer", "claquer", "mordre", "forcer", "claquer", "attraper", "pénétrer"],
            "adjectifs": ["gros", "humide", "chaud", "dur", "fort", "violent", "sale", "puissant", "ardent", "brûlant"],
            "intensites": ["fort", "sauvagement", "profondément", "sans retenue", "brutalement", "avec envie", "ardemment"],
            "expressions": [
                "je vais te baiser comme une salope", "prends ma queue fort", "nique-moi maintenant", "fais-moi jouir", "tu es mon jouet sexuel"
            ]
        },
        "soumise": {
            "corps": ["chatte", "cul", "seins", "bouche", "mains", "cuisses", "langue", "fesses", "dents", "clitoris"],
            "verbes": ["gémir", "jouir", "sucer", "embrasser", "trembler", "fondre", "supplie", "offrir", "frissonner", "languir"],
            "adjectifs": ["humide", "chaude", "douce", "fragile", "timide", "sensuelle", "émue", "fragile", "passionnée", "chaleureuse"],
            "intensites": ["doucement", "timidement", "avec envie", "longuement", "passionnément", "ardemment", "intensément"],
            "expressions": [
                "je suis ta salope", "prends-moi fort", "je veux sentir ta bite", "je fonds sous tes caresses", "fais-moi jouir"
            ]
        },
        "switch": {
            "corps": ["mains", "lèvres", "cuisses", "ventre", "joues", "seins", "fesses", "clitoris", "langue", "dents"],
            "verbes": ["jouer", "changer", "embrasser", "pénétrer", "caresser", "toucher", "attraper", "captiver", "mordre", "gémir"],
            "adjectifs": ["chaud", "humide", "voluptueux", "intense", "ardent", "tendre", "sauvage", "passionné", "libre", "fragile"],
            "intensites": ["doucement", "sauvagement", "lentement", "à pleine puissance", "par surprise", "avec envie", "profondément"],
            "expressions": [
                "je suis ta salope tendre et ta déesse cruelle", "prends-moi comme tu veux", "je t’attends entre douceur et violence", "fais-moi perdre la tête", "tu es à moi"
            ]
        }
    }
};
// --- Fin de la bibliothèque mots_hot ---

// (Le reste de ton script commence ici, inchangé, à partir de la ligne suivante)
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


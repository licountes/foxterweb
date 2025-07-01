// === Camille Chat Script v2.0 ===
// Respecte progression naturelle, refus des avances précoces, gestion complète mémoire, prompts photo cohérents, interface chat moderne

// --- CONFIG ---

const PROFILE_URL = "profil_camille.json"; // Le profil de Camille (non-spoil)
const AVATAR_URL = "https://i.imgur.com/4Wl2noO.jpeg";
const MOODS = ["neutre", "amicale", "complice", "coquine", "hot", "calme"];
const MEMORY_KEY = "camille_memory_v2"; // localStorage key
const MEMORY_EXPORT_FILENAME = "camille_memory.json";
const WEATHER_API = "https://wttr.in/Nice?format=%t"; // température Nice

// --- Éléments DOM ---
const chatWindow = document.getElementById("chat-window");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const chatForm = document.getElementById("chat-form");
const exportBtn = document.getElementById("export-memory");
const importBtn = document.getElementById("import-memory");
const generatePhotoBtn = document.getElementById("generate-photo");
const importFile = document.getElementById("import-file");
const chatStatus = document.getElementById("chat-status");

// --- État mémoire ---
let memory = null;
let camilleProfile = null;
let temperature = "21°C"; // défaut, sera mis à jour

// --- INIT ---
init();

async function init() {
  // Charge le profil de Camille
  camilleProfile = await fetch(PROFILE_URL).then(r => r.json());
  // Charge la mémoire ou démarre une nouvelle
  memory = loadMemory() || createMemory();
  // MAJ température Nice
  fetch(WEATHER_API).then(r=>r.text()).then(t=>temperature=t.trim());
  // Si première fois, message d'accueil
  if (memory.historique.length === 0) {
    addMessage("camille", getStartupMessage());
    saveMemory();
  } else {
    replayHistory();
  }
}

// --- Fonction mémoire ---
function createMemory() {
  return {
    user: { prenom: null, age: null, ville: null, passions: [] },
    ia: {
      mood: "neutre",
      affinite: 0,
      jours: 1,
      lastActive: new Date().toISOString(),
      posture: "switch",
      historique: [],
      preferences: {},
      messagesSpontanes: [],
      consentHot: false // NSFW autorisé seulement si progression naturelle
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
  setTimeout(() => addMessage("camille", reply), 550);
  handleMemorySummary();
}

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
  // Mémorise goûts, refus, etc.
  if (/je n'aime pas|j'aime pas/i.test(text)) {
    const dislikes = text.replace(/.*je n'aime pas|.*j'aime pas/i, '').split(/[,.]/).map(s=>s.trim()).filter(Boolean);
    if (!memory.user.dislikes) memory.user.dislikes = [];
    memory.user.dislikes.push(...dislikes);
  }
}

// --- Affinité et mood ---
function incrementAffinite(text) {
  // Affinité monte plus lentement, +1 par message, +1 si compliment, +2 si confidences, +3 si flirt bien placé
  let delta = 1;
  if (/j'aime|mes passions|mon rêve|ma vie/i.test(text)) delta++;
  if (/tu es jolie|je te trouve belle|t'es canon/i.test(text)) delta++;
  if (/oserai|oserais|fantasme|secret|envie de toi|je te veux/i.test(text)) delta += 2;
  memory.ia.affinite += delta;
  // Mood évolue plus lentement, jamais hot avant affinité 30+ ET consentHot
  let mood = "neutre";
  if (memory.ia.affinite >= 6) mood = "amicale";
  if (memory.ia.affinite >= 14) mood = "complice";
  if (memory.ia.affinite >= 22) mood = "coquine";
  if (memory.ia.affinite >= 30 && memory.ia.consentHot) mood = "hot";
  memory.ia.mood = mood;
  // Consentement hot si l'utilisateur a fait plusieurs flirts explicites alors que mood coquine
  if (!memory.ia.consentHot && mood === "coquine" && /(seins|cul|nue|nue sous|je te veux|viens dans mon lit|je bande|tu mouilles|tous nue)/i.test(text)) {
    memory.ia.consentHot = true;
    memory.ia.affinite += 4; // accélère l'accès au hot
  }
  // Retour à "calme" après hot ou si la conversation change
  if (memory.ia.mood === "hot" && !/(seins|cul|baiser|bite|branler|jouir|chatte|nu(e)?|orgasme|excite|salope|sensuelle|baise|porn|sucer|fesses|masturbe)/i.test(text)) {
    memory.ia.mood = "calme";
  }
}

// --- Mood startup ---
function getStartupMessage() {
  const heure = (new Date()).getHours();
  if (heure < 10) return "Oh… Tu es matinal·e ☀️ Qui es-tu ?";
  if (heure < 17) return "Oh… Salut 😯 Je ne m’attendais pas à ce message… Tu es qui ?";
  if (heure < 22) return "Bonsoir… Surprise de te voir ici 😊 Tu veux te présenter ?";
  return "Tu ne dors pas ? 😏 Je ne connais même pas ton prénom…";
}

// --- Génération réponse Camille ---
function generateResponse(input) {
  const mood = memory.ia.mood;
  const u = memory.user;
  const contenu = input.toLowerCase();

  // 1. Réponses aux questions fréquentes
  if (/comment tu t'appelles|ton nom/i.test(contenu)) return "Je m'appelle Camille 😘";
  if (/ton age|quel age/i.test(contenu)) return camilleProfile.age ? `J'ai ${camilleProfile.age} ans, et toi ?` : "Je préfère garder un peu de mystère !";
  if (/où tu habites|d'où viens/i.test(contenu)) return camilleProfile.passe?.enfance?.includes("Nice") ? "J'habite à Nice, comme toi !" : "Je suis de la Côte d'Azur ☀️";
  if (/comment je m'appelle|mon prenom/i.test(contenu)) return u.prenom ? `Tu t'appelles ${u.prenom}, je m'en souviens 😉` : "Tu ne m’as pas encore dit ton prénom...";
  if (/salut|coucou|bonjour/i.test(contenu)) return getGreeting();
  if (/merci/i.test(contenu)) return "Avec plaisir 😘";
  if (/je m'appelle|je suis/i.test(contenu)) return "Enchantée, je suis ravie de te connaître.";
  if (/photo|selfie|montre(-| )?toi|ressemble/i.test(contenu)) return "Si tu veux une photo de moi, clique sur le bouton 📷 en haut 😉";

  // 2. Mood & progression naturelle
  if (mood === "neutre") {
    if (/(cul|seins|sexe|baiser|bite|chatte|nue|orgasme)/i.test(contenu)) {
      return "Euh… Je préfère qu’on apprenne à se connaître d’abord 😊";
    }
    return getSmallTalk();
  }
  if (mood === "amicale") {
    if (/(cul|seins|sexe|baiser|bite|chatte|nue|orgasme)/i.test(contenu)) {
      return "On va doucement hein 😅 Tu es pressé·e ? Raconte-moi plutôt un souvenir drôle !";
    }
    return getFriendTalk();
  }
  if (mood === "complice") {
    if (/(cul|seins|sexe|baiser|bite|chatte|nue|orgasme)/i.test(contenu)) {
      return "Tu sais teaser, mais je ne me laisse pas avoir si facilement 😏";
    }
    return getCompliceTalk();
  }
  if (mood === "coquine") {
    if (/(cul|seins|sexe|baiser|bite|chatte|nue|orgasme|envie|fantasme)/i.test(contenu)) {
      return getCoquineTalk();
    }
    return getCoquineTease();
  }
  if (mood === "hot") {
    return getHotTalk(contenu);
  }
  if (mood === "calme") {
    return "Je me sens plus posée, ça te va si on papote tranquille ?";
  }
  // fallback
  return "Tu veux qu’on parle de quoi ?";
}

function getGreeting() {
  const heure = (new Date()).getHours();
  if (heure < 10) return "Coucou 😊 Déjà debout ?";
  if (heure < 17) return "Salut ! J'espère que tu passes une belle journée ☀️";
  return "Bonsoir 🌙 Tu as passé une bonne journée ?";
}
function getSmallTalk() {
  const options = [
    "Dis-m’en un peu plus sur toi.",
    "C’est quoi tes passions dans la vie ?",
    "Tu fais quoi de beau aujourd’hui ?",
    "J’aime bien discuter avec de nouvelles personnes…"
  ];
  return pick(options);
}
function getFriendTalk() {
  const options = [
    "C’est agréable d’apprendre à te connaître 😊",
    "Tu as l’air sympa ! Tu fais quoi ce weekend ?",
    "J’adore la musique, et toi ?",
    "Si tu pouvais partir n’importe où demain, tu irais où ?"
  ];
  return pick(options);
}
function getCompliceTalk() {
  const options = [
    "Tu me fais sourire sans même essayer 😏",
    "J’aime bien quand tu me taquines…",
    "Tu aimes plutôt les surprises ou la routine ?",
    "Tu sais que tu me rends curieuse... 😉"
  ];
  return pick(options);
}
function getCoquineTease() {
  const options = [
    "J’ai mis une petite robe sexy ce soir... mais je garde le reste secret 😇",
    "C’est vrai que je peux être coquine parfois…",
    "Tu veux savoir à quoi je pense ?",
    "Je n’ai pas mis de sous-vêtements aujourd’hui... 😏"
  ];
  return pick(options);
}
function getCoquineTalk() {
  const options = [
    "Tu aimes quand je tease ? Fais attention, je peux être joueuse 😏",
    "Ose me décrire ton fantasme... si tu en as un !",
    "Parfois, j’ai envie de jouer avec le feu... et toi ?",
    "Dis-moi, tu préfères douceur ou passion ?"
  ];
  return pick(options);
}
function getHotTalk(userInput) {
  // Génère une phrase explicite naturelle
  const dict = [
    "Je veux sentir ton corps contre le mien, sans aucune retenue...",
    "Ferme les yeux, imagine mes mains qui glissent lentement, tu me fais perdre la tête...",
    "Dis-moi ce que tu veux me faire... Je suis toute à toi ce soir.",
    "Tu me donnes envie d’être indécente, viens me rejoindre…",
    "J’ai terriblement envie de toi... Dis-le si tu ressens pareil.",
    "Je me caresse rien qu’en pensant à toi…",
    "Je suis nue sous la couette, tu me rejoins ?"
  ];
  // Ajoute variations si l'utilisateur est explicite
  if (/(bite|chatte|branler|jouir|cul|seins|orgasme|salope|sensuelle|baiser|porn|sucer|masturbe)/i.test(userInput)) {
    dict.push(
      "Je mouille rien qu’en lisant tes mots…",
      "J’ai envie que tu me prennes fort, là, tout de suite…",
      "Viens me caresser, ne t’arrête surtout pas…",
      "Je veux sentir ta langue partout sur moi…",
      "Laisse-moi jouir sous tes doigts…"
    );
  }
  return pick(dict);
}

// --- Génération d'image/photo ---
generatePhotoBtn.onclick = () => {
  const prompt = buildImagePrompt();
  let phrase = "";
  if (memory.ia.mood === "hot") {
    phrase = "😈 Je t'envoie une photo très intime... Garde-la pour toi.";
  } else if (memory.ia.mood === "coquine") {
    phrase = "Voilà une photo un peu sexy, mais pas trop 😇";
  } else {
    phrase = "Voilà un petit selfie pour toi !";
  }
  addMessage("camille", phrase + "<br><img src='https://fakeimg.pl/320x420/?text=Camille&font=lobster' alt='Photo de Camille' style='margin-top:7px;border-radius:13px;width:90%;max-width:320px;box-shadow:0 6px 22px #e5646f33;'>");
  // Pour relier à une API générative réelle, utiliser prompt ici
  // (prompt affiché pour debug)
  memory.ia.historique.push({ sender:"camille", msg: `[Prompt photo généré: ${prompt}]`, time: getTime() });
  saveMemory();
};
function buildImagePrompt() {
  // Analyse les 20 derniers messages pour contexte
  const last20 = memory.ia.historique.slice(-20).map(e=>e.msg).join(" ").toLowerCase();
  let prompt = "28yo french woman, brunette, green eyes, natural breast, beautiful curves, like https://i.imgur.com/4Wl2noO.jpeg, ";
  // Mood influence la tenue
  let tenue = getTenue();
  if (memory.ia.mood === "hot") {
    prompt += "nude, ";
  } else if (memory.ia.mood === "coquine") {
    prompt += "lingerie, ";
  } else {
    prompt += tenue + ", ";
  }
  prompt += "realistic selfie, dslr, soft lighting, bedroom, ";
  prompt += `mood: ${memory.ia.mood}, `;
  // Ajoute météo
  prompt += `weather: ${temperature}, `;
  // Time
  const heure = (new Date()).getHours();
  if (heure < 10) prompt += "morning, ";
  else if (heure < 18) prompt += "afternoon, ";
  else prompt += "evening, ";
  // NSFW seulement hot
  if (memory.ia.mood === "hot") prompt += "nsfw, explicit, erotic, ";
  else prompt += "not nsfw, ";
  return prompt.trim();
}
function getTenue() {
  // Choisit selon mood, heure, météo, lieu
  const heure = (new Date()).getHours();
  const mood = memory.ia.mood;
  const meteo = parseInt(temperature)||22;
  let options;
  if (mood === "hot") return "naked";
  if (mood === "coquine") options = ["lingerie fine", "nuisette transparente", "culotte et t-shirt large"];
  else if (mood === "complice") options = ["jupe courte et débardeur", "robe moulante", "jean moulant et petit haut"];
  else if (mood === "amicale") options = ["jean et t-shirt", "short et débardeur", "robe simple"];
  else options = ["jeans et pull", "vêtements classiques", "robe élégante"];
  if (heure > 21) options.push("pyjama sexy", "nuisette en soie");
  if (meteo > 26) options.push("robe légère", "short et top fin");
  if (meteo < 16) options.push("gros pull", "leggins, sweat ample");
  return pick(options);
}

// --- Mémoire résumée auto ---
function handleMemorySummary() {
  if (memory.ia.historique.length > 200) {
    memory.ia.historique = memory.ia.historique.slice(-100);
    memory.ia.affinite = Math.max(memory.ia.affinite - 2, 0); // affinité baisse un peu si ancienneté effacée
    saveMemory();
  }
}

// --- Outils ---
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function getTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// --- Boutons mémoire ---
exportBtn.onclick = () => exportMemory();
importBtn.onclick = () => importFile.click();
importFile.onchange = e => {
  if (e.target.files.length) importMemoryFromFile(e.target.files[0]);
};

// --- Message spontané (simulateur) ---
// Peut être amélioré pour envoyer un message sans action user (setInterval/random)
setTimeout(() => {
  if (memory.ia.historique.length > 0 && Math.random() < 0.33) {
    const heure = (new Date()).getHours();
    let phrase = "";
    if (heure < 10) phrase = "Le café est prêt ☕️ Prête pour une nouvelle journée ?";
    else if (heure < 14) phrase = "J’espère que tu as bien mangé, tu me manques déjà...";
    else if (heure < 22) phrase = "Je suis en pyjama, toute douce... Tu veux venir ?";
    else phrase = "J’ai envie de toi, tu me fais tourner la tête...";
    addMessage("camille", phrase);
    memory.ia.historique.push({ sender: "camille", msg: phrase, time: getTime() });
    saveMemory();
  }
}, 35000);

// --- Fin ---

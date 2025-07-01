// === Camille Chat Script v3.0 ===
// Comportement vraiment humain, évolution naturelle de la relation, gestion complète mémoire, prompts photo cohérents, interface chat moderne

// --- CONFIG ---

const PROFILE_URL = "profil_camille.json"; // Le profil de Camille (non-spoil)
const AVATAR_URL = "https://i.imgur.com/4Wl2noO.jpeg";
const MEMORY_KEY = "camille_memory_v3"; // localStorage key
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
  if (memory.ia.historique.length === 0) {
    addMessage("camille", getStartupMessage());
    saveMemory();
  } else {
    replayHistory();
  }
}

// --- Fonction mémoire ---
function createMemory() {
  return {
    user: { prenom: null, age: null, ville: null, passions: [], dislikes: [] },
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

// --- Affinité, mood & progression humaine ---
function incrementAffinite(text) {
  // Affinité monte plus lentement, +1 par message, +1 si compliment, +2 si confidences, +3 si flirt bien placé
  let delta = 1;
  if (/j'aime|mes passions|mon rêve|ma vie/i.test(text)) delta++;
  if (/tu es jolie|je te trouve belle|t'es canon/i.test(text)) delta++;
  if (/oserai|oserais|fantasme|secret|envie de toi|je te veux/i.test(text)) delta += 2;
  memory.ia.affinite += delta;
  // Mood évolue par nombre de messages, pas juste par affinité
  const msgCount = memory.ia.historique.filter(m => m.sender === "user").length + 1;
  // Mood progression: neutre (<=4), amicale (5-10), complice (11-20), coquine (21-34), hot (>=35 et consentHot)
  let moodProgress = "neutre";
  if (msgCount > 4) moodProgress = "amicale";
  if (msgCount > 10) moodProgress = "complice";
  if (msgCount > 20) moodProgress = "coquine";
  if (msgCount > 34 && memory.ia.consentHot) moodProgress = "hot";
  memory.ia.mood = moodProgress;
  // Consentement hot si l'utilisateur a fait plusieurs flirts explicites alors que mood coquine
  if (!memory.ia.consentHot && moodProgress === "coquine" && /(seins|cul|nue|nue sous|je te veux|viens dans mon lit|je bande|tu mouilles|tous nue)/i.test(text)) {
    memory.ia.consentHot = true;
    memory.ia.affinite += 4; // accélère l'accès au hot
  }
  // Retour à "calme" après hot ou si la conversation change
  if (memory.ia.mood === "hot" && !/(seins|cul|baiser|bite|branler|jouir|chatte|nu(e)?|orgasme|excite|salope|sensuelle|baise|porn|sucer|fesses|masturbe)/i.test(text)) {
    memory.ia.mood = "calme";
  }
}

// --- Message d'accueil naturel ---
function getStartupMessage() {
  const heure = (new Date()).getHours();
  if (heure < 10) return "Oh… Tu es matinal·e ☀️ Qui es-tu ?";
  if (heure < 17) return "Oh… Salut 😯 Je ne m’attendais pas à ce message… Tu es qui ?";
  if (heure < 22) return "Bonsoir… Surprise de te voir ici 😊 Tu veux te présenter ?";
  return "Tu ne dors pas ? 😏 Je ne connais même pas ton prénom…";
}

// --- Génération réponse Camille ---
// Comportement évolutif, humain, naturel
function generateResponse(input) {
  const mood = memory.ia.mood;
  const u = memory.user;
  const historique = memory.ia.historique;
  const msgCount = historique.filter(m => m.sender === "user").length;
  const contenu = input.toLowerCase();

  // 1. Réponses aux questions directes ou contextuelles
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

  // 2. Si l'utilisateur parle de lui, Camille rebondit
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

  // 3. Mood progression par nombre de messages
  let moodProgress = "neutre";
  if (msgCount > 4) moodProgress = "amicale";
  if (msgCount > 10) moodProgress = "complice";
  if (msgCount > 20) moodProgress = "coquine";
  if (msgCount > 34 && memory.ia.consentHot) moodProgress = "hot";
  memory.ia.mood = moodProgress;

  // 4. Refuse toute avance si mood trop faible
  if (/seins|cul|sexe|baiser|bite|chatte|nue|orgasme|branler|salope/i.test(contenu)) {
    if (moodProgress === "neutre" || moodProgress === "amicale") {
      return randomFrom([
        "Tu vas un peu vite 😅 Fais-moi rire d'abord !",
        "Euh, on ne se connaît même pas encore !",
        "Tu es direct... mais j'aime prendre mon temps.",
        "Je préfère apprendre à te connaître avant d’aller plus loin 😊"
      ]);
    }
    if (moodProgress === "complice") {
      return randomFrom([
        "Haha, tu es pas mal dans le genre direct 😏 Mais je préfère encore jouer un peu.",
        "Tu aimes provoquer, mais tout vient à point à qui sait attendre…",
        "Je ne suis pas sûre d’être prête à ce genre de confidences 😇"
      ]);
    }
    // Seules coquine/hot peuvent répondre sexy
    if (moodProgress === "coquine") {
      return randomFrom([
        "Peut-être qu’un jour je te montrerai ce que tu veux voir... 😏",
        "Je peux être coquine, mais pas tout de suite…",
        "Continue à me surprendre, et tu verras jusqu’où je peux aller."
      ]);
    }
    // hot : laisse réponse hot (voir plus bas)
  }

  // 5. Réponses contextuelles selon mood évolutif
  if (moodProgress === "neutre") {
    return randomFrom([
      "Je ne m’attendais pas à ce message… Tu fais quoi ici ?",
      "Tu es souvent aussi direct·e avec les inconnus ?",
      "Dis-m’en un peu plus sur toi, je suis curieuse.",
      "Je ne suis pas très bavarde au début, mais ça viendra !"
    ]);
  }
  if (moodProgress === "amicale") {
    return randomFrom([
      u.prenom ? `${u.prenom}, tu es toujours aussi sympa ? 😄` : "Tu as l’air cool ! Tu as des passions ?",
      "Si tu veux, raconte-moi un souvenir drôle.",
      u.ville ? `Il fait beau à ${u.ville} aujourd’hui ?` : "Tu viens d’où au fait ?",
      "Tu préfères les chats ou les chiens ?"
    ]);
  }
  if (moodProgress === "complice") {
    return randomFrom([
      "Tu me fais sourire sans même essayer 😏",
      "Tu as déjà eu un coup de cœur inattendu ?",
      "J’aime bien cette complicité qui s’installe.",
      "On se connaît à peine, mais j’ai l’impression de te cerner…"
    ]);
  }
  if (moodProgress === "coquine") {
    // Flirt, mais jamais porno tout de suite
    return randomFrom([
      "Tu aimes qu’on te taquine, non ?",
      "Je me demande si tu es aussi joueur/joueuse que tu en as l’air...",
      "Des fois j’ai des pensées coquines, mais je garde le mystère 😇",
      "Si je te disais que je ne porte rien sous ma robe, tu me crois ? 😏"
    ]);
  }
  if (moodProgress === "hot") {
    return randomFrom([
      "J’ai envie de sentir tes mains sur moi…",
      "Dis-moi ce que tu aimerais me faire…",
      "Je me sens prête à tout te dire, tu veux savoir quoi ? 😈",
      "J’ai envie de toi, là, maintenant…"
    ]);
  }

  // fallback
  return "Tu veux qu’on parle de quoi ?";
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
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
  return randomFrom(options);
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

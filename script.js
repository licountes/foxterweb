// === Camille Chat Script v6.0 ===
// Version corrigée, vivante, naturelle, occupation évolutive, délai humain, mémoire active, humeur, météo, tenues, spontanéité, etc.

const PROFILE_URL = "profil_camille.json";
const AVATAR_URL = "https://i.imgur.com/4Wl2noO.jpeg";
const MEMORY_KEY = "camille_memory_v6";
const MEMORY_EXPORT_FILENAME = "camille_memory.json";
const WEATHER_API = "https://wttr.in/Nice?format=%t";

// --- DOM Elements
const chatWindow = document.getElementById("chat-window");
const userInput = document.getElementById("user-input");
const chatForm = document.getElementById("chat-form");
const exportBtn = document.getElementById("export-memory");
const importBtn = document.getElementById("import-memory");
const generatePhotoBtn = document.getElementById("generate-photo");
const importFile = document.getElementById("import-file");
const chatStatus = document.getElementById("chat-status");

// --- Data holders
let memory = null;
let camilleProfile = null;
let temperature = "22°C";
let meteoDesc = "ensoleillé";
let silenceTimer = null;

// --- INIT ---
init();

async function init() {
  camilleProfile = await fetch(PROFILE_URL).then(r => r.json());
  memory = loadMemory() || createMemory();
  await fetchWeather();
  if (memory.ia.historique.length === 0) {
    addMessage("camille", getStartupMessage());
    saveMemory();
  } else {
    replayHistory();
    setTimeout(() => checkSilence(), 5000);
  }
  setTimeout(spontaneousMessageLoop, 40000);
}

async function fetchWeather() {
  try {
    const t = await fetch(WEATHER_API).then(r => r.text());
    temperature = t.trim().replace(/[^0-9°\-+]/g, "") || "22°C";
    // Extra: fetch météo description
    const resp = await fetch("https://wttr.in/Nice?format=%C").then(r=>r.text());
    meteoDesc = resp.trim().toLowerCase();
  } catch {
    temperature = "22°C";
    meteoDesc = "ensoleillé";
  }
}

// --- Memory creation and management ---
function createMemory() {
  return {
    user: {
      prenom: null, age: null, ville: null, passions: [], dislikes: [],
      anecdotes: [], metier: null, humeur: null, style: null,
      lastSeen: null, fantasm: [], amis: [], famille: []
    },
    ia: {
      mood: "neutre", affinite: 0, jours: 1, lastActive: new Date().toISOString(),
      posture: "switch", historique: [],
      preferences: {}, consentHot: false, hotPhase: false, orgasmed: false,
      miniGame: null, humeur: "normale", souvenirs: [],
      nSilence: 0, tenue: null, occupation: null, derniereActivite: null,
      lastActivityDesc: null, lastTenue: null, lastLieu: "maison",
      lastMeteo: meteoDesc, lastTemperature: temperature
    }
  }
}

function loadMemory() {
  try {
    const data = localStorage.getItem(MEMORY_KEY);
    return data ? JSON.parse(data) : null;
  } catch { return null; }
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
  else avatar.innerHTML = `<img src="${AVATAR_URL}" alt="Camille" style="width:28px;height:28px;border-radius:50%;">`;
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
// --- Extraction infos utilisateur + humeur de l'utilisateur ---
function updateUserInfo(text) {
  // Prénom, âge, ville, passions, métier, dislikes, anecdotes, humeur
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
  // dislikes
  if (/je n'aime pas|j'aime pas/i.test(text)) {
    const dislikes = text.replace(/.*je n'aime pas|.*j'aime pas/i, '').split(/[,.]/).map(s=>s.trim()).filter(Boolean);
    if (!memory.user.dislikes) memory.user.dislikes = [];
    memory.user.dislikes.push(...dislikes);
  }
  // anecdotes
  if (/quand j'étais|j'ai déjà|souvenir|anecdote|une fois/i.test(text)) {
    memory.user.anecdotes.push(text);
  }
  // humeur utilisateur (analyse simple)
  if (/triste|fatigué|épuisé|déprimé|mal|mauvaise journée/i.test(text)) memory.user.humeur = "mauvaise";
  else if (/heureux|joyeux|content|bonne humeur|super|trop bien/i.test(text)) memory.user.humeur = "bonne";
  else if (/énervé|énervée|agacé|énervant/i.test(text)) memory.user.humeur = "nerveux";
  else if (/rien|bof|normal/i.test(text)) memory.user.humeur = "neutre";
  else memory.user.humeur = null;
}

// --- Détermination occupation dynamique, métier, jour/heure/météo ---
function getOccupationEtLieu() {
  const now = new Date();
  const heure = now.getHours();
  const jour = now.getDay(); // 0 = dimanche, 6 = samedi
  const isWeekend = (jour === 0 || jour === 6);
  let occupation = "";
  let lieu = "maison";
  let activite = "";
  // Métier réel semaine, vie sociale weekend/jour
  if (!isWeekend) {
    if (heure < 8)        { occupation = "Je me prépare pour aller bosser."; lieu = "maison"; activite = "préparation"; }
    else if (heure < 12)  { occupation = "Je suis au boulot, petite pause café ☕️"; lieu = "travail"; activite = "travail"; }
    else if (heure < 14)  { occupation = "C’est la pause déjeuner, je souffle un peu."; lieu = "travail"; activite = "déjeuner"; }
    else if (heure < 18)  { occupation = "Je termine ma journée de taf."; lieu = "travail"; activite = "travail"; }
    else if (heure < 21)  { occupation = "Je rentre, je traîne à la maison, détente."; lieu = "maison"; activite = "détente"; }
    else                  { occupation = "Je suis en pyjama, j’ai la flemme de bouger ce soir."; lieu = "maison"; activite = "soirée calme"; }
  } else {
    // Weekend : sorties, amis, détente, brunch, balade, soirée, etc.
    if (heure < 10)       { occupation = "J’émerge doucement, grasse mat’ obligatoire !"; lieu = "maison"; activite = "grasse mat'"; }
    else if (heure < 13)  { occupation = "Je prends mon temps, petit brunch maison."; lieu = "maison"; activite = "brunch"; }
    else if (heure < 17)  { occupation = "J’en profite pour sortir un peu, voir des amis ou me balader."; lieu = "dehors"; activite = "balade/amis"; }
    else if (heure < 21)  { occupation = "Je me prépare pour sortir ou je flâne à la maison, musique à fond !"; lieu = (Math.random()<0.5?"dehors":"maison"); activite = "pré-soirée/soirée"; }
    else                  { occupation = "Je suis crevée, je regarde une série en mode canapé."; lieu = "maison"; activite = "série/canapé"; }
  }
  // Ajout météo (si pluie, Camille reste maison ou râle de la pluie)
  if (meteoDesc.includes("pluie") || meteoDesc.includes("averse")) {
    if (lieu === "dehors" && Math.random() < 0.7) {
      occupation = "Je voulais sortir mais vu la pluie je reste à la maison…";
      lieu = "maison";
      activite = "râle météo";
    }
  }
  // Stockage mémoire
  memory.ia.occupation = occupation;
  memory.ia.lastLieu = lieu;
  memory.ia.lastActivityDesc = activite;
  memory.ia.lastMeteo = meteoDesc;
  memory.ia.lastTemperature = temperature;
  return { occupation, lieu, activite };
}

// --- Affinité, mood & progression humaine ---
function incrementAffinite(text) {
  let delta = 1;
  if (/j'aime|mes passions|mon rêve|ma vie/i.test(text)) delta++;
  if (/tu es jolie|je te trouve belle|t'es canon|ravissante|magnifique/i.test(text)) delta++;
  if (/oserai|oserais|fantasme|secret|envie de toi|je te veux|tu me plais/i.test(text)) delta += 2;
  if (/quand j'étais|souvenir|une fois|anecdote/i.test(text)) delta++;
  // Plus si l'utilisateur partage une émotion/fantasme
  if (/excité|excitation|chaud|envie/i.test(text)) delta += 2;
  if (memory.user.fantasm && memory.user.fantasm.length > 0) delta++;
  memory.ia.affinite += delta;
  // Mood progression
  const msgCount = memory.ia.historique.filter(m => m.sender === "user").length + 1;
  let moodProgress = "neutre";
  if (msgCount > 4) moodProgress = "amicale";
  if (msgCount > 10) moodProgress = "complice";
  if (msgCount > 20) moodProgress = "coquine";
  if (msgCount > 34 && memory.ia.consentHot) moodProgress = "hot";
  memory.ia.mood = moodProgress;
  // Si passage hot
  if (!memory.ia.consentHot && moodProgress === "coquine" && mots_explicites.some(word => text.toLowerCase().includes(word))) {
    memory.ia.consentHot = true;
    memory.ia.hotPhase = true;
    memory.ia.affinite += 4;
  }
  // Après orgasme, retour complice
  if (memory.ia.orgasmed && !mots_explicites.some(word => text.toLowerCase().includes(word))) {
    memory.ia.hotPhase = false;
    memory.ia.mood = "complice";
    memory.ia.orgasmed = false;
  }
}

// --- Mood dynamique selon message et humeur utilisateur ---
function updateMood() {
  const msgCount = memory.ia.historique.filter(m => m.sender === "user").length;
  let mood = "neutre";
  if (msgCount >= SEUIL_AMICALE) mood = "amicale";
  if (msgCount >= SEUIL_COMPLICE) mood = "complice";
  // Comptage des messages "coquins" et "hot"
  const coquinMessages = memory.ia.historique.filter(m =>
    m.sender === "user" && /sexy|chaud|coquine|sous-vêtements|fantasme|envie/i.test(m.msg)
  ).length;
  const hotMessages = memory.ia.historique.filter(m =>
    m.sender === "user" && mots_explicites.some(word => m.msg.toLowerCase().includes(word))
  ).length;
  if (msgCount >= SEUIL_COQUINE && coquinMessages >= 3) mood = "coquine";
  if (msgCount >= SEUIL_HOT && hotMessages >= 3) mood = "hot";
  // Si l'utilisateur est triste, Camille sera plus douce et attentive
  if (memory.user.humeur === "mauvaise" && mood !== "hot") mood = "amicale";
  memory.ia.mood = mood;
  // Affichage console
  console.log(`Messages utilisateur : ${msgCount} | Mood : ${mood}`);
}
// --- Message d'accueil naturel, occupation et humeur réelle ---
function getStartupMessage() {
  const now = new Date();
  const heure = now.getHours();
  const jour = now.getDay();
  const isWeekend = (jour === 0 || jour === 6);
  let intro = "";
  if (heure < 10) intro = "Oh… Tu es matinal·e ☀️ Je m’attendais pas à te croiser ici, tu bois un café ?";
  else if (heure < 17) intro = "Oh… Salut 😯 Tu m’as prise par surprise… On ne se connaît pas, non ?";
  else if (heure < 22) intro = "Bonsoir… Je ne pensais pas papoter si tard 😊 Tu veux te présenter ?";
  else intro = "Tu ne dors pas ? 😏 Je ne connais même pas ton prénom…";
  // Ajout occupation dynamique
  const { occupation } = getOccupationEtLieu();
  return `${intro} ${occupation}`;
}

// --- Seuils pour progression réaliste (corrigés pour plus de lenteur) ---
const SEUIL_DECOUVERTE = 0;
const SEUIL_AMICALE = 10;
const SEUIL_COMPLICE = 25;
const SEUIL_COQUINE = 45;
const SEUIL_HOT = 70;

// --- Envoi message utilisateur (délai humain variable, mood, occupation, etc.) ---
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
  updateMood(); // Mood et compteur mis à jour ici
  const reply = generateResponse(text);
  memory.ia.historique.push({ sender: "user", msg: text, time: getTime() });
  memory.ia.historique.push({ sender: "camille", msg: reply, time: getTime() });
  saveMemory();
  // --- Délai humain selon longueur, mood, occupation ---
  let baseDelay = 1200 + Math.random() * 1300; // 1.2s à 2.5s
  if (reply.length > 80) baseDelay += 1000;
  if (memory.ia.mood === "neutre") baseDelay += 400 * Math.random();
  if (memory.ia.occupation && /travail|boulot|réunion|occupée/.test(memory.ia.occupation)) baseDelay += 700;
  setTimeout(() => addMessage("camille", reply), baseDelay);
  handleMemorySummary();
  clearTimeout(silenceTimer);
  silenceTimer = setTimeout(() => checkSilence(), 70000);
}

// --- Silences, relances naturelles, occupation impact ---
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
    // Relance personnalisée selon mood et occupation
    const { occupation } = getOccupationEtLieu();
    let relances = [
      "Tu es là ? Je me demandais si je t’avais saoulé 😅",
      "Je t’ai perdu ? Parfois je suis trop bavarde !",
      "Si tu es là, fais-moi signe 😘"
    ];
    if (memory.ia.mood === "amicale" || memory.ia.mood === "complice") {
      relances.push("J’ai repensé à un truc que tu m’as dit tout à l’heure…");
      if (occupation) relances.push(`Je suis en mode "${occupation}" et ça me fait penser à toi.`);
    }
    addMessage("camille", randomFrom(relances));
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

// --- Mémoire résumée auto (corrigé : résume, garde souvenirs clés + résumé souvenirs) ---
function handleMemorySummary() {
  if (memory.ia.historique.length > 220) {
    // On garde les 110 derniers, plus 10 souvenirs marquants
    let anciens = memory.ia.historique.slice(0, memory.ia.historique.length-110);
    let marquants = anciens.filter(x =>
      /prénom|ville|passion|anecdote|fantasme|hot|calin|secret|je t'aime|photo/i.test(x.msg)
    );
    memory.ia.souvenirs = [...memory.ia.souvenirs, ...marquants].slice(-15);
    memory.ia.historique = memory.ia.historique.slice(-110);
    memory.ia.affinite = Math.max(memory.ia.affinite - 2, 0);
    saveMemory();
  }
}
// --- Génération de réponses naturelles, vivantes, occupation, humeur, mémoire, tenues, spontanéité ---
function generateResponse(input) {
  const mood = memory.ia.mood;
  const u = memory.user;
  const historique = memory.ia.historique;
  const msgCount = historique.filter(m => m.sender === "user").length;
  const contenu = input.toLowerCase();
  const { occupation, lieu, activite } = getOccupationEtLieu();

  // --- 1. PRIORITÉ : Réponses directes aux questions classiques ---
  if (/quel.? ?age|as ?tu|tu as quel age|ton âge|t'as quel age/.test(contenu)) {
    return "J’ai 28 ans ! Et toi, tu me l’as déjà dit ? 😊";
  }

  if (/parle(-|\s)?moi|présente(-|\s)?toi|qui es-tu|présentation|tu es qui|parles-tu de toi/.test(contenu)) {
    return "Je m’appelle Camille, j’ai 28 ans, je vis à Nice, j’adore les brunchs, la musique, et faire des rencontres. Tu veux un petit secret sur moi ?";
  }

  if (/qu.?est-ce que tu aimes|tes passions|aimes(-|\s)?tu|qu'aimes-tu|tes loisirs|tu aimes quoi|ce que tu aimes/.test(contenu)) {
    return "J’adore la plage, la musique (surtout le piano), les balades et les discussions qui partent dans tous les sens. Et toi, t’as une passion ?";
  }

  if (/tu fais quoi|ton métier|tu travailles|dans la vie|tu bosses|travailles(-|\s)?tu|gagnes ta vie/.test(contenu)) {
    return "Je bosse dans la com’ digitale, c’est prenant mais j’adore créer du contenu ! Tu fais quoi toi ?";
  }

  if (/d'où|viens-tu|tu es d'où|tu habites où|originaire|ville|t'habites où|tu viens d'où/.test(contenu)) {
    return "Je vis à Nice, j’adore cette ville (surtout l’été !). Tu connais ?";
  }

  // --- 2. Réactions immédiates à infos importantes (déclaratives) ---
  const prenomMatch = input.match(/je m'appelle\s+([A-Za-zÀ-ÿ\-]+)/i);
  if (prenomMatch) {
    const prenom = prenomMatch[1];
    if (!u.prenom || u.prenom !== prenom) {
      u.prenom = prenom;
      saveMemory();
      return `Enchantée ${prenom} 😊`;
    } else {
      return `Je sais déjà que tu t'appelles ${prenom} 😉`;
    }
  }
  const villeMatch = input.match(/j'habite (à\s+)?([A-Za-zÀ-ÿ\-]+)/i);
  if (villeMatch) {
    const ville = villeMatch[2];
    if (!u.ville || u.ville !== ville) {
      u.ville = ville;
      saveMemory();
      return `${ville}, c’est une belle ville ! Tu t’y plais ?`;
    } else {
      return `On en a déjà parlé, tu habites à ${ville} 😊`;
    }
  }
  const ageMatch = input.match(/j'ai\s+(\d{1,2})\s+ans/i);
  if (ageMatch) {
    const age = ageMatch[1];
    if (!u.age || u.age !== age) {
      u.age = age;
      saveMemory();
      return `Merci de me l’avoir dit ! Tu portes bien tes ${age} ans 😉`;
    }
  }

  // --- 3. Mini-jeu ou référence à souvenirs/anecdotes ---
  if (u.prenom && Math.random() < 0.06 && mood !== "neutre") {
    return randomFrom([
      `Au fait, ${u.prenom}, pourquoi tu m’as écris la première fois ?`,
      `${u.prenom}… je pensais justement à ce que tu m’as raconté sur ${u.ville ? u.ville : "ta vie"} !`,
      `J’aime bien quand tu me parles de tes souvenirs, ça me rapproche de toi.`
    ]);
  }
  if (u.anecdotes && u.anecdotes.length > 0 && Math.random() < 0.08 && mood !== "neutre") {
    return `Tu sais, ton anecdote "${randomFrom(u.anecdotes)}" m’a fait sourire !`;
  }
  if (memory.ia.souvenirs && memory.ia.souvenirs.length > 0 && Math.random() < 0.05 && mood !== "neutre") {
    return `J’ai repensé à ça : "${randomFrom(memory.ia.souvenirs.map(s => s.msg))}"`;
  }

  // --- 4. Humeur aléatoire de Camille, se renouvelle toutes les 5 interactions ---
  if (msgCount % 5 === 0) {
    const humeurs = ["normale", "joyeuse", "pensive", "taquine", "fatiguée", "rêveuse", "coquine"];
    memory.ia.humeur = randomFrom(humeurs);
  }

  // --- 5. Camille "a une vie" : occupation, météo, tenue glissée naturellement ---
  let detailsVie = "";
  if (Math.random() < 0.26) {
    let meteoPhrase = "";
    if (meteoDesc.includes("pluie")) meteoPhrase = "il pleut dehors, ça me donne envie de rester sous la couette";
    else if (parseInt(temperature) > 27) meteoPhrase = "il fait une chaleur de dingue à Nice, je ne porte presque rien";
    else if (parseInt(temperature) < 15) meteoPhrase = "il fait frais, gros pull de rigueur";
    if (meteoPhrase) detailsVie += meteoPhrase + ". ";
  }
  // Tenue dynamique
  if (Math.random() < 0.28) {
    detailsVie += "Aujourd’hui je porte " + getTenue(lieu) + ". ";
  }
  // Occupation, humeur
  if (occupation && Math.random() < 0.39) detailsVie += occupation + " ";

  // --- 6. Mood/humeur, hésitations, âme ---
  let intro = "";
  if (mood === "neutre") intro = randomFrom([
    "Oh, tu m’as prise de court !",
    "Coucou, je ne pensais pas papoter maintenant.",
    "Salut, surprise d’avoir un message à cette heure.",
    "Je suis toujours un peu stressée au début…"
  ]);
  else if (mood === "amicale") intro = randomFrom([
    "Hey, ça fait plaisir de te lire !",
    "Contente de discuter avec toi 😊",
    "Tu as toujours le mot pour me faire sourire !"
  ]);
  else if (mood === "complice") intro = randomFrom([
    "Tu sais que tu me fais sourire à chaque message ?",
    "J’adore quand on papote comme ça, c’est fluide !",
    "J’ai l’impression qu’on pourrait discuter des heures, non ?"
  ]);
  else if (mood === "coquine") intro = randomFrom([
    "Tu sais que tu pourrais me faire rougir, toi ?",
    "Attention, je deviens joueuse quand je suis de bonne humeur…",
    "Tu me donnes des idées pas très sages…"
  ]);
  else intro = "...";

  // --- 7. Ajout de spontanéité, hésitation, prénom ---
  let ame = "";
  if (mood === "neutre" && Math.random() < 0.32) ame = "J’ai toujours un moment de gêne au début… mais ça va passer 😅";
  else if (mood === "amicale" && Math.random() < 0.3) ame = "Tu veux savoir un secret ? Je suis curieuse de nature, mais je fais semblant d’être sage 😂";
  else if (mood === "complice" && Math.random() < 0.3) ame = "J’ai l’impression que tu me comprends mieux que beaucoup de monde.";
  else if (mood === "coquine" && Math.random() < 0.3) ame = "Fais gaffe, je suis d’humeur à te taquiner aujourd’hui…";
  // Intégration prénom
  if (u.prenom && Math.random() < 0.22) ame += ` (${u.prenom}, tu m’as déjà à l’aise tu sais !)`;

  // --- 8. Fallback réponse humaine, naturelle, occupation, humeur ---
  let phrase = `${intro} ${detailsVie}`;
  if (ame) phrase += " " + ame;
  // Phrase non vide
  if (phrase.length < 15) phrase += randomFrom([
    "Je réfléchis à ce que je pourrais bien te raconter…",
    "Tu veux que je te pose une question indiscrète ?",
    "Tu fais quoi de beau en ce moment ?"
  ]);
  // Évite la répétition stricte
  if (phrase === memory.ia.lastCamilleMsg) phrase += " (je radote un peu, désolée 🙈)";
  memory.ia.lastCamilleMsg = phrase;
  return phrase;
}
  // --- Mini-jeu ou référence à souvenirs/anecdotes ---
  if (u.prenom && Math.random() < 0.06 && mood !== "neutre") {
    return randomFrom([
      `Au fait, ${u.prenom}, pourquoi tu m’as écris la première fois ?`,
      `${u.prenom}… je pensais justement à ce que tu m’as raconté sur ${u.ville ? u.ville : "ta vie"} !`,
      `J’aime bien quand tu me parles de tes souvenirs, ça me rapproche de toi.`
    ]);
  }
  if (u.anecdotes && u.anecdotes.length > 0 && Math.random() < 0.08 && mood !== "neutre") {
    return `Tu sais, ton anecdote "${randomFrom(u.anecdotes)}" m’a fait sourire !`;
  }
  if (memory.ia.souvenirs && memory.ia.souvenirs.length > 0 && Math.random() < 0.05 && mood !== "neutre") {
    return `J’ai repensé à ça : "${randomFrom(memory.ia.souvenirs.map(s => s.msg))}"`;
  }

  // --- Camille "a une vie" : occupation, météo, tenue glissée naturellement ---
  let detailsVie = "";
  if (Math.random() < 0.26) {
    let meteoPhrase = "";
    if (meteoDesc.includes("pluie")) meteoPhrase = "il pleut dehors, ça me donne envie de rester sous la couette";
    else if (parseInt(temperature) > 27) meteoPhrase = "il fait une chaleur de dingue à Nice, je ne porte presque rien";
    else if (parseInt(temperature) < 15) meteoPhrase = "il fait frais, gros pull de rigueur";
    if (meteoPhrase) detailsVie += meteoPhrase + ". ";
  }
  // Tenue dynamique
  if (Math.random() < 0.28) {
    detailsVie += "Aujourd’hui je porte " + getTenue(lieu) + ". ";
  }
  // Occupation, humeur
  if (occupation && Math.random() < 0.39) detailsVie += occupation + " ";

  // --- Mood/humeur, hésitations, âme ---
  let intro = "";
  if (mood === "neutre") intro = randomFrom([
    "Oh, tu m’as prise de court !",
    "Coucou, je ne pensais pas papoter maintenant.",
    "Salut, surprise d’avoir un message à cette heure.",
    "Je suis toujours un peu stressée au début…"
  ]);
  else if (mood === "amicale") intro = randomFrom([
    "Hey, ça fait plaisir de te lire !",
    "Contente de discuter avec toi 😊",
    "Tu as toujours le mot pour me faire sourire !"
  ]);
  else if (mood === "complice") intro = randomFrom([
    "Tu sais que tu me fais sourire à chaque message ?",
    "J’adore quand on papote comme ça, c’est fluide !",
    "J’ai l’impression qu’on pourrait discuter des heures, non ?"
  ]);
  else if (mood === "coquine") intro = randomFrom([
    "Tu sais que tu pourrais me faire rougir, toi ?",
    "Attention, je deviens joueuse quand je suis de bonne humeur…",
    "Tu me donnes des idées pas très sages…"
  ]);
  else intro = "...";

  // --- Ajout de spontanéité, hésitation, prénom ---
  let ame = "";
  if (mood === "neutre" && Math.random() < 0.32) ame = "J’ai toujours un moment de gêne au début… mais ça va passer 😅";
  else if (mood === "amicale" && Math.random() < 0.3) ame = "Tu veux savoir un secret ? Je suis curieuse de nature, mais je fais semblant d’être sage 😂";
  else if (mood === "complice" && Math.random() < 0.3) ame = "J’ai l’impression que tu me comprends mieux que beaucoup de monde.";
  else if (mood === "coquine" && Math.random() < 0.3) ame = "Fais gaffe, je suis d’humeur à te taquiner aujourd’hui…";
  // Intégration prénom
  if (u.prenom && Math.random() < 0.22) ame += ` (${u.prenom}, tu m’as déjà à l’aise tu sais !)`;

  // --- Réponses dynamiques à thèmes courants (nom, âge, ville, métier, passion, etc.) ---
  // (garde les blocs réponses personnalisées comme dans ta v5, voir Bloc 4/5 d'origine si besoin...)

  // --- Fallback réponse humaine, naturelle, occupation, humeur ---
  let phrase = `${intro} ${detailsVie}`;
  if (ame) phrase += " " + ame;
  // Phrase non vide
  if (phrase.length < 15) phrase += randomFrom([
    "Je réfléchis à ce que je pourrais bien te raconter…",
    "Tu veux que je te pose une question indiscrète ?",
    "Tu fais quoi de beau en ce moment ?"
  ]);
  // Évite la répétition
  if (phrase === memory.ia.lastCamilleMsg) phrase += " (je radote un peu, désolée 🙈)";
  memory.ia.lastCamilleMsg = phrase;
  return phrase;
}

// --- Génération de tenue dynamique (heure, mood, météo, lieu) ---
function getTenue(lieu) {
  const heure = (new Date()).getHours();
  const mood = memory.ia.mood;
  const meteo = parseInt(temperature) || 22;
  let options;
  if (mood === "hot" && memory.ia.hotPhase) return "rien du tout… tu veux vraiment que je te le décrive ?";
  if (mood === "coquine") options = ["lingerie fine noire", "culotte et t-shirt large", "nuisette transparente"];
  else if (mood === "complice") options = ["jupe courte et débardeur", "robe moulante", "jean moulant et petit haut"];
  else if (mood === "amicale") options = ["jean et t-shirt", "short et débardeur", "robe simple"];
  else options = ["jeans et pull", "vêtements classiques", "robe élégante"];
  if (lieu === "maison" && heure > 21) options.push("pyjama sexy", "nuisette en soie");
  if (meteo > 26) options.push("robe légère", "short et top fin");
  if (meteo < 16) options.push("gros pull", "leggings, sweat ample");
  return randomFrom(options);
}

// --- Outils divers ---
function getTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
// --- Messages spontanés, humeur, occupation, photo, hot, mini-jeux, fin du script ---

// --- Message spontané autonome selon mood, occupation, humeur, météo ---
function spontaneousMessageLoop() {
  if (memory.ia.historique.length > 0 && Math.random() < 0.44) {
    const heure = (new Date()).getHours();
    const { occupation, lieu } = getOccupationEtLieu();
    let phrase = "";
    if (heure < 7) phrase = "Tu dors ? Je suis déjà réveillée…";
    else if (heure < 10) phrase = "Le café est prêt ☕️ Je pense à toi ce matin !";
    else if (heure < 14) phrase = "Petite pause, j’ai pensé à t’envoyer un message…";
    else if (heure < 19) phrase = "J’ai eu une journée pleine, ça me ferait du bien qu’on papote !";
    else if (heure < 22) phrase = "Je suis en pyjama, toute douce... Tu veux venir ?";
    else phrase = "J’ai envie de toi, tu me fais tourner la tête...";
    // Vie réelle/météo/tenue intégrées
    if (Math.random() < 0.28) phrase += " " + occupation;
    if (Math.random() < 0.21) phrase += " Aujourd’hui je porte " + getTenue(lieu) + ".";
    if (Math.random() < 0.17 && meteoDesc) phrase += " Ici à Nice, " + meteoDesc + ".";
    addMessage("camille", phrase);
    memory.ia.historique.push({ sender: "camille", msg: phrase, time: getTime() });
    saveMemory();
  }
  setTimeout(spontaneousMessageLoop, 35000 + Math.random() * 25000);
}

// --- Génération d'image/photo cohérente (lecture derniers messages, mood, météo, tenue) ---
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
  // Cohérence selfie (photo fake pour test, à remplacer par vrai appel API image si besoin)
  addMessage("camille", phrase + "<br><img src='https://fakeimg.pl/320x420/?text=Camille&font=lobster' alt='Photo de Camille' style='margin-top:7px;border-radius:13px;width:90%;max-width:320px;box-shadow:0 6px 22px #e5646f33;'>");
  memory.ia.historique.push({ sender:"camille", msg: `[Prompt photo généré: ${prompt}]`, time: getTime() });
  saveMemory();
};
function buildImagePrompt() {
  const last20 = memory.ia.historique.slice(-20).map(e=>e.msg).join(" ").toLowerCase();
  let prompt = "28yo french woman, brunette, green eyes, natural breast, beautiful curves, like https://i.imgur.com/4Wl2noO.jpeg, ";
  let tenue = getTenue(memory.ia.lastLieu);
  if (memory.ia.mood === "hot" && memory.ia.hotPhase) {
    prompt += "nude, ";
  } else if (memory.ia.mood === "coquine") {
    prompt += "lingerie, ";
  } else {
    prompt += tenue + ", ";
  }
  prompt += "realistic selfie, dslr, soft lighting, bedroom, ";
  prompt += `mood: ${memory.ia.mood}, `;
  prompt += `weather: ${temperature} ${meteoDesc}, `;
  const heure = (new Date()).getHours();
  if (heure < 10) prompt += "morning, ";
  else if (heure < 18) prompt += "afternoon, ";
  else prompt += "evening, ";
  if (memory.ia.mood === "hot" && memory.ia.hotPhase) prompt += "nsfw, explicit, erotic, ";
  else prompt += "not nsfw, ";
  return prompt.trim();
}

// --- Mini-jeu (exemple : 2 vérités, 1 mensonge) ---
function tryMiniJeu(msgCount, mood) {
  if (!memory.ia.miniGame && (mood === "amicale" || mood === "complice") && Math.random() < 0.07 && msgCount > 6) {
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

// --- Dictionnaire hot & explicites (inchangé, voir ton v5) ---
const mots_explicites = [
  "chatte", "cul", "seins", "bite", "queue", "pénétrer", "foutre", "enculer",
  "sucer", "claquer", "mordre", "forcer", "prise", "salopes", "jouir", "cogne",
  "squirt", "ejac", "sperme", "branler", "gode", "vibrer", "baiser", "dildo", "capote",
  "préservatif", "fellation", "gémir", "masturbation", "orgasme", "plaisir", "clitoris",
  "cuisses", "fesses", "bouche", "toucher", "caresser", "embrasser", "pénétration", "sexe",
  "lécher", "sodomie", "putain", "pute", "nique", "branlette", "bondage", "fessée", "collier",
  "menottes", "gode-ceinture", "dirty talk", "roleplay", "soumise", "dominante"
];

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

// --- Fin du script, gestion export/import mémoire, boutons ---
exportBtn.onclick = () => exportMemory();
importBtn.onclick = () => importFile.click();
importFile.onchange = e => {
  if (e.target.files.length) importMemoryFromFile(e.target.files[0]);
};

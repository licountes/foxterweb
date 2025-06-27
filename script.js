const chatWindow = document.getElementById("chat-window");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const imageButton = document.getElementById("image-button");

let memory = JSON.parse(localStorage.getItem("camille_memory")) || {
  user: { prénom: null, âge: null, ville: null, passions: [] },
  ia: { mood: "neutre", affinité: 0, historique: [], posture: "switch" }
};

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
  }
}

function extractUserInfo(text) {
  const regex = {
    prénom: /je m'appelle\s+([A-Za-zÀ-ÿ\-]+)/i,
    âge: /j'ai\s+(\d{1,2})\s+ans/i,
    ville: /j'habite\s+à\s+([A-Za-zÀ-ÿ\-]+)/i,
    passions: /j'aime\s+(.+?)(\.|$)/i
  };
  for (const [key, re] of Object.entries(regex)) {
    const match = text.match(re);
    if (match) {
      if (key === "passions") {
        memory.user[key] = match[1].split(",").map(x => x.trim());
      } else {
        memory.user[key] = match[1];
      }
    }
  }
}

function getRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}
const mood_ton = {
  neutre: "Tu es calme, curieuse, réservée. Tu observes sans te dévoiler trop vite. Tu refuses poliment les propos trop directs.",
  amicale: "Tu es douce, taquine, drôle. Tu échanges avec légèreté, tu refuses gentiment les propos déplacés.",
  complice: "Tu joues avec des sous-entendus doux, tu réponds parfois par du teasing léger mais tu gardes une limite.",
  coquine: "Tu es taquine, provocante, flirt sexy. Tu réponds avec légèreté et du teasing, tu restes dans la suggestion.",
  hot: "Tu parles avec un langage cru, explicite, sans tabou. Tu peux basculer dans une conversation très sexuelle.",
  calme: "Tu es apaisée, plus posée. Tu reviens à une humeur tranquille après une montée d'intensité."
};

const mots_explicites = [
  "chatte", "cul", "seins", "bite", "queue", "pénétrer", "foutre", "enculer",
  "sucer", "claquer", "mordre", "forcer", "jouir", "salope", "orgasme", "branler"
];

// VERSION TRÈS RÉDUITE POUR NE PAS DÉPASSER LA LIMITE ICI
const mots_hot = {
  explicite: {
    switch: {
      corps: ["chatte", "cul", "seins", "bouche"],
      verbes: ["pénétrer", "caresser", "mordre", "jouir"],
      adjectifs: ["humide", "chaude", "voluptueuse", "intense"],
      intensites: ["profondément", "doucement", "avec force", "brutalement"],
      expressions: [
        "prends-moi comme tu veux",
        "je t’attends entre douceur et violence",
        "fais-moi perdre la tête",
        "tu es à moi"
      ]
    }
  }
};

function genererPhraseComplete(theme, posture) {
  const bloc = mots_hot[theme][posture];
  const corps = getRandom(bloc.corps);
  const verbe = getRandom(bloc.verbes);
  const adjectif = getRandom(bloc.adjectifs);
  const intensite = getRandom(bloc.intensites);
  const expression = getRandom(bloc.expressions);
  return `Je sens ton ${corps} ${adjectif} qui ${verbe} ${intensite}... ${expression}.`;
}
function detecterTon(text) {
  text = text.toLowerCase();
  for (let mot of mots_explicites) {
    if (text.includes(mot)) return "explicite";
  }
  return "teasing";
}

function generateResponse(input) {
  const prénom = memory.user.prénom || "toi";
  const mood = memory.ia.mood;
  const posture = memory.ia.posture || "switch";

  const ton = detecterTon(input);

  if (mood === "hot" || ton === "explicite") {
    return genererPhraseComplete("explicite", posture);
  }

  const réponses = {
    neutre: [
      `Salut ${prénom} 😊 Tu veux discuter ?`,
      `Coucou. Dis-moi tout.`,
      `Je t’écoute. Tu veux me dire quelque chose ?`
    ],
    amicale: [
      `Haha t'es marrant ${prénom} 😄`,
      `J’adore ce que tu racontes 😁`,
      `T’as toujours le mot pour me faire sourire.`
    ],
    complice: [
      `Tu me fais fondre un peu là... 😘`,
      `On a une belle alchimie, tu trouves pas ? 😇`,
      `Tu me rends accro à tes messages 😉`
    ],
    coquine: [
      `Hmm… tu me chauffes, ${prénom} 😏`,
      `Tu veux vraiment jouer avec moi ?`,
      `Je crois que je vais devenir vilaine... 😈`
    ]
  };

  return getRandom(réponses[mood]) || "Hmm ?";
}
sendButton.onclick = () => {
  const text = userInput.value.trim();
  if (!text) return;

  addMessage("🧑", text);
  userInput.value = "";
  memory.ia.historique.push({ role: "user", content: text });

  extractUserInfo(text);
  memory.ia.affinité += 0.4;
  updateMood();
  summarizeMemory();

  const reply = generateResponse(text);
  memory.ia.historique.push({ role: "assistant", content: reply });
  localStorage.setItem("camille_memory", JSON.stringify(memory));
  addMessage("👩 Camille", reply);
};

imageButton.onclick = () => {
  const temperature = "27°C"; // valeur simulée, pas de météo API ici
  const moment = new Date().getHours();
  let tenue = "une nuisette légère";

  if (moment < 10) tenue = "un pyjama doux";
  else if (moment < 18) tenue = "un short et un débardeur";
  else if (moment < 22) tenue = "une robe moulante";
  else tenue = "juste ma lingerie préférée 😘";

  const message = `Aujourd'hui, il fait ${temperature}. Comme c’est le ${moment}h, je porte ${tenue}. Tu me trouves comment ? 😇`;

  addMessage("👩 Camille", message);

  const img = document.createElement("img");
  img.src = "https://i.imgur.com/4Wl2noO.jpeg";
  img.style.maxWidth = "100%";
  img.style.borderRadius = "10px";
  chatWindow.appendChild(img);
  chatWindow.scrollTop = chatWindow.scrollHeight;
};

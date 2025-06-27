const chatWindow = document.getElementById("chat-window");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const imageButton = document.getElementById("image-button");

let memory = JSON.parse(localStorage.getItem("camille_memory")) || {
  user: { prénom: null, âge: null, ville: null, passions: [] },
  ia: { mood: "neutre", affinité: 0, historique: [] }
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

function generateFakeResponse(input) {
  const mood = memory.ia.mood;
  if (mood === "neutre") return "Salut 😊 Tu veux discuter ?";
  if (mood === "amicale") return "Haha t'es marrant toi 😄";
  if (mood === "complice") return "Tu me fais trop sourire 😘";
  if (mood === "coquine") return "Tu me chauffes un peu là 😏";
  if (mood === "hot") {
    const phrases = [
      "Je mouille rien qu'à t'imaginer 😈",
      "J’ai envie de toi fort là tout de suite...",
      "Tu veux que je te montre ce que je porte ? 💋"
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
  }
  return "Hmm ?";
}

sendButton.onclick = () => {
  const text = userInput.value.trim();
  if (!text) return;

  addMessage("🧑", text);
  userInput.value = "";
  memory.ia.historique.push({ role: "user", content: text });

  extractUserInfo(text);
  memory.ia.affinité += 0.3;
  updateMood();
  summarizeMemory();

  const reply = generateFakeResponse(text);
  memory.ia.historique.push({ role: "assistant", content: reply });
  localStorage.setItem("camille_memory", JSON.stringify(memory));
  addMessage("👩 Camille", reply);
};

imageButton.onclick = () => {
  const img = document.createElement("img");
  img.src = "https://i.imgur.com/4Wl2noO.jpeg";
  img.style.maxWidth = "100%";
  chatWindow.appendChild(img);
  chatWindow.scrollTop = chatWindow.scrollHeight;
};

// script.js

const OPENROUTER_API_KEY = "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";
const REPLICATE_API_TOKEN = "r8_CnLIrlo81aiinGdiTmCH3wGclAaTykv0fUNSJ";

let memory = JSON.parse(localStorage.getItem("camille_memory")) || {
  user: { prénom: null, âge: null, ville: null, passions: [] },
  ia: { mood: "neutre", affinité: 0, historique: [] },
  messages: [],
  compteur: 0
};

function saveMemory() {
  if (++memory.compteur % 200 === 0) {
    memory.messages = memory.messages.slice(-50);
  }
  localStorage.setItem("camille_memory", JSON.stringify(memory));
}

const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const messagesBox = document.getElementById("messages");
const genImgBtn = document.getElementById("generate-image");

function afficherMessage(role, content) {
  const msg = document.createElement("div");
  msg.className = role;
  msg.textContent = (role === "user" ? "🧑: " : "👩 Camille: ") + content;
  messagesBox.appendChild(msg);
  messagesBox.scrollTop = messagesBox.scrollHeight;
}

async function envoyerMessage() {
  const message = input.value.trim();
  if (!message) return;

  afficherMessage("user", message);
  memory.messages.push({ role: "user", content: message });
  saveMemory();

  const systemPrompt = "Tu es Camille. Une vraie femme, naturelle. Neutre au début, évolue selon la relation. Réponds comme une vraie personne.";
  const payload = {
    model: "gryphe/mythomax-l2-13b",
    messages: [
      { role: "system", content: systemPrompt },
      ...memory.messages.slice(-10),
      { role: "user", content: message }
    ],
    temperature: 0.7,
    max_tokens: 500
  };

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://camille.vercel.app",
        "X-Title": "Camille"
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error("Réponse OpenRouter invalide");

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "Erreur de génération.";

    memory.messages.push({ role: "assistant", content: reply });
    saveMemory();
    afficherMessage("assistant", reply);
    input.value = "";
  } catch (error) {
    afficherMessage("assistant", "❌ Erreur de réponse API (clé invalide ou modèle désactivé).");
    console.error("Erreur OpenRouter:", error);
  }
}

sendBtn.addEventListener("click", envoyerMessage);
input.addEventListener("keypress", e => { if (e.key === "Enter") envoyerMessage(); });

genImgBtn.addEventListener("click", async () => {
  const promptContext = memory.messages.slice(-20).map(m => m.content).join("\n");
  const prompt = `Selfie réaliste de Camille selon cette conversation : ${promptContext}. Elle ressemble à la photo : https://i.imgur.com/4Wl2noO.jpeg. Juste vêtue selon l’ambiance.`;

  const res = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      "Authorization": `Token ${REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      version: "db21e45e88964e36b40ab9ecda67e7e022e58e49f8aa63c1e845d6e963c5e7c6",
      input: { prompt, width: 512, height: 768 }
    })
  });

  const prediction = await res.json();
  const imageUrl = prediction.output?.[0] || "https://i.imgur.com/4Wl2noO.jpeg";
  document.getElementById("camille-img").src = imageUrl;
});

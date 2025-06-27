const express = require("express");
const fetch = require("node-fetch");
const app = express();
require("dotenv").config();
const PORT = process.env.PORT || 3000;

app.use(express.static("."));
app.use(express.json());

app.post("/api/chat", async (req, res) => {
  const { message, memory } = req.body;
  const mood = memory.ia.mood;
  const affinité = memory.ia.affinité;
  const prénom = memory.user.prénom || "toi";

  const systemPrompt = `Tu es Camille, femme réelle, affective, complice, jamais une IA.
Ton humeur : ${mood}. Affinité : ${affinité}. Tu connais ${prénom}.
Tu adaptes ton langage : si mood neutre, tu refuses les mots crus. Si mood hot, aucun filtre.`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          ...memory.ia.historique.slice(-20),
          { role: "user", content: message }
        ]
      })
    });

    const result = await response.json();
    res.json({ reply: result.choices?.[0]?.message?.content || "..." });
  } catch {
    res.json({ reply: "❌ Erreur API." });
  }
});

app.post("/api/image", async (req, res) => {
  const { memory } = req.body;
  const mood = memory.ia.mood || "neutre";
  const heure = new Date().getHours();
  let tenue = "habillée normalement";

  if (heure < 8) tenue = "en nuisette";
  else if (heure < 12) tenue = "en tenue de matinée";
  else if (heure < 18) tenue = "en tenue décontractée";
  else tenue = "en sous-vêtements confortables";

  const prompt = `selfie réaliste de Camille, femme française, fond flou, ${tenue}, humeur ${mood}`;

  try {
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        version: "a9758cbf24a67b68a83ed5426c66f4f92f521a32fbb0b1e9b9d692e4df8302e7",
        input: { prompt }
      })
    });

    const result = await response.json();
    res.json({ image_url: result?.urls?.get || null });
  } catch {
    res.json({ image_url: null });
  }
});

app.listen(PORT, () => {
  console.log("✅ Camille opérationnelle sur http://localhost:" + PORT);
});




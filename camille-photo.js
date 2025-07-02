// camille-photo.js : génération d'image réaliste de Camille (SFW ou NSFW, img2img supporté)

const STABLE_HORDE_API_KEY = "i7jHyKpFVcuspatWyYyhWg";

// Utilitaire pour convertir un fichier image JS en base64
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Construction dynamique du prompt selon contexte
function buildPrompt({ nsfw = false, mood, tenue, lieu, temperature = "22", meteoDesc = "ensoleillé" }) {
  let desc = "french woman, 28yo, brunette, green eyes, realistic, beautiful, natural curves,";
  desc += ` ${tenue},`;
  desc += ` in ${lieu}, mood: ${mood}, weather: ${temperature}°C, ${meteoDesc}`;
  if (["coquine", "hot"].includes(mood) && nsfw) {
    desc = "french woman, 28yo, brunette, green eyes, beautiful face, photorealistic, topless, naked breasts, soft erotic, bedroom, realistic lighting, natural curves,";
    if (tenue && tenue.toLowerCase().match(/nuisette|lingerie/)) {
      desc += ` wearing only ${tenue}, partially removed`;
    }
    desc += ", inviting, teasing, NSFW, nipples visible, no hands, solo, looking at camera";
  } else if (["coquine", "hot"].includes(mood)) {
    desc += ", slightly revealing, teasing, charming, flirty, suggestive";
  } else {
    desc += ", casual, natural, friendly";
  }
  return desc;
}

export async function generateCamillePhoto({ nsfw = false, mood, tenue, lieu, temperature = "22", meteoDesc = "ensoleillé", img2imgFile = null }) {
  // On prend température et météo de la page si dispo
  if (window && window.temperature) temperature = window.temperature;
  if (window && window.meteoDesc) meteoDesc = window.meteoDesc;

  let prompt = buildPrompt({ nsfw, mood, tenue, lieu, temperature, meteoDesc });

  let source_image = null;
  let source_processing = null;
  if (img2imgFile instanceof File) {
    source_image = await fileToBase64(img2imgFile);
    source_processing = "img2img";
  }

  const payload = {
    prompt: prompt,
    params: {
      n: 1,
      width: 384,
      height: 576,
      karras: true,
      sampler_name: "k_euler",
      steps: 28,
      cfg_scale: 7,
      seed: String(Math.floor(Math.random() * 999999999)),
      clip_skip: 2
    },
    nsfw: nsfw,
    models: nsfw
      ? ["deliberate", "counterfeit", "realisticVisionV60B1", "majicmixRealistic_v7", "dreamshaper_8", "AbsoluteReality_v16"]
      : ["realisticVisionV60B1", "deliberate", "dreamshaper_8"],
    r2: true
  };

  if (source_image && source_processing) {
    payload.source_image = source_image;
    payload.source_processing = source_processing;
  }

  let req = await fetch("https://stablehorde.net/api/v2/generate/async", {
    method: "POST",
    headers: {
      "apikey": STABLE_HORDE_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const { id } = await req.json();
  let imgurl = null, tries = 0;
  while (!imgurl && tries < 50) {
    await new Promise(r => setTimeout(r, 3500 + Math.random() * 800));
    let poll = await fetch(`https://stablehorde.net/api/v2/generate/status/${id}`);
    let pollData = await poll.json();
    if (pollData.done) {
      if (pollData.generations && pollData.generations.length > 0) {
        imgurl = "data:image/png;base64," + pollData.generations[0].img;
      }
    }
    tries++;
  }
  if (!imgurl) {
    return null;
  }
  return imgurl;
}

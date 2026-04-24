exports.handler = async function(event) {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return json(500, { error: "OPENAI_API_KEY fehlt in Netlify." });
    }

    const { image, breadType, hydration, symptoms } = JSON.parse(event.body || "{}");

    if (!image) {
      return json(400, { error: "Kein Bild übermittelt." });
    }

    const prompt = `
Du bist eine erfahrene Sauerteigbrot-Expertin und analysierst die Krume eines Brotes anhand eines Fotos.
Antworte ausschließlich als JSON ohne Markdown.

Kontext:
Brotart: ${breadType || "unbekannt"}
Hydration: ${hydration || "unbekannt"}
Auffälligkeiten der Nutzerin: ${symptoms || "keine Angaben"}

Bewerte vorsichtig und ehrlich. Keine absolute Diagnose.
Gib Anfängerinnen klare, konkrete Backtipps in Felicitas' Stil: klar, freundlich, direkt, nicht zu technisch.

JSON-Struktur:
{
  "title": "kurzer Titel",
  "gare": "z.B. Tendenz: Untergare / Übergare / gute Gare / unklar",
  "mainIssue": "Hauptproblem in wenigen Worten",
  "confidence": Zahl von 0 bis 100,
  "summary": "kurzes Fazit in 2-4 Sätzen",
  "signs": ["3-5 erkennbare Hinweise"],
  "tips": ["3-6 konkrete nächste Schritte"]
}
`;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.25,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: image } }
            ]
          }
        ]
      })
    });

    const raw = await openaiResponse.text();

    if (!openaiResponse.ok) {
      return json(500, {
        error: "OpenAI API Fehler.",
        details: raw
      });
    }

    const completion = JSON.parse(raw);
    const content = completion.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);

    return json(200, parsed);

  } catch (error) {
    return json(500, {
      error: "Analyse fehlgeschlagen.",
      details: error.message
    });
  }
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify(body)
  };
}

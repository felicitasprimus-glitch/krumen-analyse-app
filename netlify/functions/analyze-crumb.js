exports.handler = async function(event) {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: { "Content-Type": "text/plain" },
        body: "Method not allowed"
      };
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "OPENAI_API_KEY fehlt in Netlify."
        })
      };
    }

    const body = JSON.parse(event.body || "{}");
    const { image, breadType, hydration, symptoms } = body;

    if (!image) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "Kein Bild erhalten."
        })
      };
    }

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
`Analysiere dieses Sauerteigbrot anhand der Krume.

WICHTIG:
- Verlasse dich PRIMÄR auf das Bild.
- Die Angaben (Brotart, Symptome) können falsch sein.
- Wenn Bild und Angaben widersprechen, hat das Bild Vorrang.
- Korrigiere falsche Annahmen aktiv.
- Wenn die Krume gut ist, sag das klar und gib keine unnötigen Korrekturtipps.

Antworte NUR als gültiges JSON in dieser Struktur:
{
  "title": "kurzer Titel",
  "gare": "z.B. Untergare / Übergare / gute Gare / unklar",
  "mainIssue": "Hauptproblem",
  "confidence": 75,
  "summary": "kurzes Fazit",
  "signs": ["Hinweis 1", "Hinweis 2"],
  "tips": ["Tipp 1", "Tipp 2", "Tipp 3"]
}

Brotart: ${breadType === "Brotart unbekannt, bitte nur anhand des Fotos vorsichtig analysieren"
  ? "Die Brotart ist unbekannt. Analysiere nur anhand der Krume und formuliere vorsichtig."
  : "Brotart: " + breadType}
Hydration: ${hydration || "unbekannt"}
Auffälligkeiten: ${symptoms || "keine Angabe"}`
              },
              {
                type: "image_url",
                image_url: { url: image }
              }
            ]
          }
        ]
      })
    });

    const raw = await openaiRes.text();

    if (!openaiRes.ok) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "OpenAI Fehler",
          details: raw
        })
      };
    }

    const openaiData = JSON.parse(raw);
    const content = openaiData.choices?.[0]?.message?.content || "{}";

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {
        title: "KI-Analyse deiner Krume",
        gare: "Einschätzung",
        mainIssue: "Krume analysiert",
        confidence: 75,
        summary: content,
        signs: [],
        tips: []
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed)
    };

  } catch (error) {
    console.error("FUNCTION ERROR:", error);

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Function Fehler",
        details: error.message
      })
    };
  }
};

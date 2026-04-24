exports.handler = async function(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method not allowed"
    };
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    const { image, breadType, hydration, symptoms } = JSON.parse(event.body || "{}");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [{
          role: "user",
          content: [
            {
              type: "text",
              text: `Analysiere diese Brotkrume. Antworte nur als JSON mit:
{
"title":"",
"gare":"",
"mainIssue":"",
"confidence":75,
"summary":"",
"signs":[],
"tips":[]
}

Brotart: ${breadType}
Hydration: ${hydration}
Auffälligkeiten: ${symptoms}`
            },
            {
              type: "image_url",
              image_url: { url: image }
            }
          ]
        }]
      })
    });

    const raw = await response.text();

    if (!response.ok) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "OpenAI Fehler",
          details: raw
        })
      };
    }

    const data = JSON.parse(raw);
   const content = data.choices[0].message.content;

return {
  statusCode: 200,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    title: "KI-Analyse deiner Krume",
    gare: "Einschätzung",
    mainIssue: "Krume analysiert",
    confidence: 75,
    summary: content,
    signs: [],
    tips: []
  })
};

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message
      })
    };
  }
};

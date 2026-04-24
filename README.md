# Krume Analyzer App - Fix-Version

Diese Version nutzt eine Netlify Function ohne externes OpenAI-Paket.
Dadurch funktioniert sie zuverlässiger beim Netlify Deploy.

## Wichtig in Netlify

Environment Variable muss exakt so heißen:

OPENAI_API_KEY

Als Value kommt dein neuer OpenAI API-Key rein.

Danach:
Deploys → Trigger deploy → Deploy site

## Test

Wenn die echte KI läuft, steht im Ergebnis NICHT mehr „Vorläufige Analyse“.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, mood } = await req.json();
    const apiKey = Deno.env.get("GEMINI_API_KEY");

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not set");
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a sentiment analysis AI. Analyze this team feedback and respond ONLY with this exact JSON format, no markdown, no extra text:
{"sentiment":"positive","sentiment_score":0.8,"emotional_tone":"motivated","summary":"One sentence summary here","flag":false}

Rules:
- sentiment: must be "positive", "neutral", or "negative"
- sentiment_score: number from -1.0 to 1.0
- emotional_tone: one of: constructive, anxious, burnt_out, motivated, frustrated, content, disengaged
- summary: one sentence about the emotional state
- flag: true if person seems to need support, otherwise false

Mood selected: ${mood}
Feedback text: "${text}"`
            }]
          }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 200 }
        })
      }
    );

    const raw = await response.text();
    console.log("Gemini raw response:", raw);

    const geminiData = JSON.parse(raw);

    // Check for API errors
    if (geminiData.error) {
      console.error("Gemini API error:", geminiData.error);
      throw new Error(geminiData.error.message);
    }

    const textContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      throw new Error("No content from Gemini");
    }

    const clean = textContent.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("Error:", err.message);
    // Return a fallback instead of crashing
    return new Response(JSON.stringify({
      sentiment: "neutral",
      sentiment_score: 0,
      emotional_tone: "content",
      summary: "Analysis unavailable. Please try again.",
      flag: false
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
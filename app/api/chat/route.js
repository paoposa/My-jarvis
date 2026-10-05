import { NextResponse } from "next/server";

// This route runs on the server, so your API key is never exposed to the browser.
// Uses Google Gemini's free tier — set GEMINI_API_KEY in your Vercel project's
// Environment Variables. Get a free key (no credit card) at https://aistudio.google.com/apikey
export async function POST(req) {
  try {
    const { messages, system } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Falta configurar GEMINI_API_KEY en las variables de entorno del proyecto." },
        { status: 500 }
      );
    }

    const systemPrompt =
      system ||
      "Eres JARVIS, un asistente de IA hablado: conciso, directo, con un toque de personalidad seca y servicial. Responde en el idioma del usuario. Mantén las respuestas breves (2-4 frases) porque se leerán en voz alta.";

    // Gemini's basic REST call doesn't have a separate "system" role,
    // so we prepend it as the first turn of the conversation.
    const contents = [
      { role: "user", parts: [{ text: `[Instrucciones del sistema]: ${systemPrompt}` }] },
      { role: "model", parts: [{ text: "Entendido, listo para ayudar." }] },
      ...(messages || []).map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: { maxOutputTokens: 400 },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `Error de la API: ${errText}` }, { status: response.status });
    }

    const data = await response.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ||
      "No obtuve una respuesta de texto.";

    return NextResponse.json({ reply });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

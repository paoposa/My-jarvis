# JARVIS — Asistente de voz con IA

Asistente de voz al estilo Jarvis: escucha por micrófono, responde con voz y texto,
con un orbe animado que reacciona a "escuchando / pensando / hablando".
Hecho con Next.js (App Router), listo para desplegar en Vercel.

Usa la API gratuita de **Google Gemini** — no pide tarjeta de crédito.

## Qué incluye

- 🎙️ **Entrada por voz** (Web Speech API) — botón de "empuja para hablar" y modo
  opcional de palabra clave ("Jarvis") con escucha pasiva.
- 🔊 **Salida por voz** (Speech Synthesis) — te responde en voz alta.
- 💬 **Chat de respaldo por texto** para navegadores sin soporte de voz (ej. Firefox).
- 🧠 **Backend real**: una API route (`/api/chat`) que llama a Google Gemini
  usando tu propia clave — nunca se expone al navegador.
- 🎨 Interfaz oscura con orbe animado, pensada para móvil (formato vertical).

## 1. Consigue tu API key GRATIS

1. Ve a **https://aistudio.google.com/apikey**
2. Inicia sesión con tu cuenta de Google
3. Clic en **"Create API key"**
4. Copia la clave (empieza distinto según el proyecto, es una cadena larga alfanumérica)

No pide tarjeta de crédito. El tier gratis permite un buen número de peticiones
por minuto/día — más que suficiente para un asistente personal.

## 2. Prueba en tu computadora (opcional)

```bash
npm install
cp .env.example .env.local
# pega tu clave en .env.local
npm run dev
```

Abre http://localhost:3000

## 3. Desplegar en Vercel (gratis)

**Opción A — sin usar terminal:**

1. Sube esta carpeta a un repositorio de GitHub (arrastra los archivos en
   github.com/new, o usa GitHub Desktop).
2. Entra a https://vercel.com, inicia sesión con GitHub.
3. "Add New… → Project" y elige ese repositorio.
4. En "Environment Variables" agrega:
   - `GEMINI_API_KEY` = tu clave de Google AI Studio
5. Dale a **Deploy**. En ~1 minuto tendrás tu URL pública (`tu-proyecto.vercel.app`).

**Opción B — con la CLI de Vercel:**

```bash
npm i -g vercel
vercel
vercel env add GEMINI_API_KEY
vercel --prod
```

## Notas y solución de problemas

- **El micrófono no funciona**: el reconocimiento de voz del navegador
  (`webkitSpeechRecognition`) solo funciona en **Chrome, Edge y Safari** —
  no en Firefox. Ahí sigue funcionando el chat por texto.
- **Necesita HTTPS**: el micrófono del navegador solo funciona en `https://`
  o en `localhost`. Una vez desplegado en Vercel, esto ya viene incluido.
- **"Falta configurar GEMINI_API_KEY"**: significa que no agregaste la
  variable de entorno en Vercel, o que la agregaste pero no volviste a
  desplegar — en Vercel, ve a Settings → Environment Variables, agrégala,
  y luego Deployments → "Redeploy".
- **Error 429 (demasiadas peticiones)**: el tier gratis de Gemini tiene un
  límite de peticiones por minuto. Si lo alcanzas, espera un momento y
  vuelve a intentar.
- **Cambiar el modelo**: el modelo usado está en
  `app/api/chat/route.js` (`gemini-2.0-flash` en la URL del fetch).
- **Cambiar la personalidad**: edita el `systemPrompt` en el mismo archivo.
- **Cambiar el idioma de voz**: en `app/page.js`, busca `lang = "es-ES"`
  (aparece dos veces: reconocimiento y síntesis de voz).

## Estructura

```
jarvis-app/
├── app/
│   ├── api/chat/route.js   ← backend: llama a Gemini con tu API key
│   ├── layout.js
│   └── page.js             ← interfaz: orbe, chat, voz
├── package.json
├── vercel.json
└── .env.example
```

"use client";

import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Sistemas en línea. ¿En qué te ayudo?" },
  ]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [wakeWordOn, setWakeWordOn] = useState(false);
  const [supportsSpeech, setSupportsSpeech] = useState(true);
  const [muted, setMuted] = useState(false);

  const recognitionRef = useRef(null);
  const wakeRecognitionRef = useRef(null);
  const chatEndRef = useRef(null);

  // Set up push-to-talk recognition
  useEffect(() => {
    const SpeechRecognition =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (!SpeechRecognition) {
      setSupportsSpeech(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = "es-ES";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      handleSend(transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);

    recognitionRef.current = rec;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Optional: passive wake-word listener ("jarvis")
  useEffect(() => {
    const SpeechRecognition =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SpeechRecognition) return;

    if (wakeWordOn) {
      const wrec = new SpeechRecognition();
      wrec.lang = "es-ES";
      wrec.continuous = true;
      wrec.interimResults = true;

      wrec.onresult = (event) => {
        const last = event.results[event.results.length - 1];
        const text = last[0].transcript.toLowerCase();
        if (text.includes("jarvis") && !listening && !thinking) {
          wrec.stop();
          startListening();
        }
      };
      wrec.onend = () => {
        if (wakeWordOn) {
          try {
            wrec.start();
          } catch (e) {}
        }
      };
      wrec.onerror = () => {
        if (wakeWordOn) {
          try {
            wrec.start();
          } catch (e) {}
        }
      };

      wakeRecognitionRef.current = wrec;
      try {
        wrec.start();
      } catch (e) {}

      return () => {
        wrec.onend = null;
        wrec.stop();
      };
    } else if (wakeRecognitionRef.current) {
      wakeRecognitionRef.current.stop();
    }
  }, [wakeWordOn]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  function startListening() {
    if (!recognitionRef.current) return;
    setInput("");
    setListening(true);
    try {
      recognitionRef.current.start();
    } catch (e) {
      setListening(false);
    }
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  function speak(text) {
    if (muted || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "es-ES";
    utter.rate = 1.02;
    utter.pitch = 0.9;
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
  }

  async function handleSend(overrideText) {
    const text = (overrideText ?? input).trim();
    if (!text || thinking) return;

    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setThinking(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();

      if (data.error) {
        const errMsg = { role: "assistant", content: `⚠️ ${data.error}` };
        setMessages((prev) => [...prev, errMsg]);
      } else {
        const reply = { role: "assistant", content: data.reply };
        setMessages((prev) => [...prev, reply]);
        speak(data.reply);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ No pude conectar con el servidor." },
      ]);
    } finally {
      setThinking(false);
    }
  }

  const orbState = speaking ? "speaking" : listening ? "listening" : thinking ? "thinking" : "idle";

  return (
    <main style={styles.main}>
      <style>{globalCss}</style>

      <div style={styles.topBar}>
        <span style={styles.logo}>J.A.R.V.I.S.</span>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => setWakeWordOn((v) => !v)}
            style={{
              ...styles.pill,
              borderColor: wakeWordOn ? "#00eaff" : "#2a3548",
              color: wakeWordOn ? "#00eaff" : "#7a8aa0",
            }}
            title="Escucha pasiva de la palabra 'jarvis'"
          >
            {wakeWordOn ? "Escucha activa" : "Activar palabra clave"}
          </button>
          <button
            onClick={() => setMuted((v) => !v)}
            style={{
              ...styles.pill,
              borderColor: muted ? "#ff5566" : "#2a3548",
              color: muted ? "#ff5566" : "#7a8aa0",
            }}
          >
            {muted ? "Voz silenciada" : "Voz activa"}
          </button>
        </div>
      </div>

      <div style={styles.orbWrap}>
        <div className={`orb ${orbState}`} onClick={listening ? stopListening : startListening}>
          <div className="orb-core" />
          <div className="orb-ring ring1" />
          <div className="orb-ring ring2" />
          <div className="orb-ring ring3" />
        </div>
        <p style={styles.orbLabel}>
          {orbState === "listening" && "Escuchando…"}
          {orbState === "thinking" && "Procesando…"}
          {orbState === "speaking" && "Hablando…"}
          {orbState === "idle" && (supportsSpeech ? "Toca el orbe para hablar" : "Micrófono no soportado en este navegador")}
        </p>
      </div>

      <div style={styles.chatBox}>
        {messages.map((m, i) => (
          <div key={i} style={m.role === "user" ? styles.userMsg : styles.botMsg}>
            {m.content}
          </div>
        ))}
        {thinking && <div style={styles.botMsg}>…</div>}
        <div ref={chatEndRef} />
      </div>

      <form
        style={styles.inputBar}
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe una orden…"
          style={styles.input}
        />
        <button type="submit" style={styles.sendBtn} disabled={thinking}>
          Enviar
        </button>
      </form>
    </main>
  );
}

const styles = {
  main: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    color: "#dfe8f5",
    maxWidth: 480,
    margin: "0 auto",
    padding: "16px 16px 24px",
    boxSizing: "border-box",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  logo: {
    fontWeight: 700,
    letterSpacing: 3,
    color: "#00eaff",
    textShadow: "0 0 12px rgba(0,234,255,0.6)",
    fontSize: 14,
  },
  pill: {
    background: "transparent",
    border: "1px solid #2a3548",
    borderRadius: 999,
    padding: "6px 12px",
    fontSize: 11,
    cursor: "pointer",
  },
  orbWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "18px 0 8px",
  },
  orbLabel: {
    marginTop: 14,
    fontSize: 13,
    color: "#7a8aa0",
    letterSpacing: 1,
  },
  chatBox: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: "12px 2px",
    minHeight: 220,
  },
  userMsg: {
    alignSelf: "flex-end",
    background: "linear-gradient(135deg, #123 0%, #1c2b45 100%)",
    border: "1px solid #2a3548",
    borderRadius: "14px 14px 2px 14px",
    padding: "10px 14px",
    maxWidth: "80%",
    fontSize: 14,
  },
  botMsg: {
    alignSelf: "flex-start",
    background: "rgba(0,234,255,0.06)",
    border: "1px solid rgba(0,234,255,0.25)",
    borderRadius: "14px 14px 14px 2px",
    padding: "10px 14px",
    maxWidth: "85%",
    fontSize: 14,
    color: "#cdeeff",
  },
  inputBar: {
    display: "flex",
    gap: 8,
    marginTop: 10,
  },
  input: {
    flex: 1,
    background: "#0b111e",
    border: "1px solid #2a3548",
    borderRadius: 10,
    padding: "12px 14px",
    color: "#dfe8f5",
    fontSize: 14,
    outline: "none",
  },
  sendBtn: {
    background: "#00b6cc",
    border: "none",
    borderRadius: 10,
    padding: "0 18px",
    color: "#02131a",
    fontWeight: 700,
    cursor: "pointer",
  },
};

const globalCss = `
  .orb {
    position: relative;
    width: 150px;
    height: 150px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .orb-core {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, #7cf8ff, #00b6cc 60%, #003844 100%);
    box-shadow: 0 0 30px rgba(0,234,255,0.55), inset 0 0 20px rgba(255,255,255,0.25);
    transition: all 0.3s ease;
  }
  .orb-ring {
    position: absolute;
    border-radius: 50%;
    border: 1px solid rgba(0,234,255,0.35);
    animation: spin 6s linear infinite;
  }
  .ring1 { width: 100px; height: 100px; }
  .ring2 { width: 130px; height: 130px; animation-duration: 9s; animation-direction: reverse; }
  .ring3 { width: 150px; height: 150px; animation-duration: 12s; }

  .orb.listening .orb-core {
    background: radial-gradient(circle at 35% 30%, #ffffff, #00eaff 55%, #005a66 100%);
    box-shadow: 0 0 55px rgba(0,234,255,0.9), inset 0 0 25px rgba(255,255,255,0.5);
    animation: pulse 1s ease-in-out infinite;
  }
  .orb.thinking .orb-core {
    animation: pulse 0.5s ease-in-out infinite;
  }
  .orb.speaking .orb-core {
    background: radial-gradient(circle at 35% 30%, #fff4cc, #ffb020 55%, #7a4200 100%);
    box-shadow: 0 0 55px rgba(255,176,32,0.85), inset 0 0 25px rgba(255,255,255,0.4);
    animation: pulse 0.4s ease-in-out infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.12); }
  }

  * { box-sizing: border-box; }
  body { -webkit-tap-highlight-color: transparent; }
`;

export const metadata = {
  title: "JARVIS",
  description: "Asistente de IA con voz, estilo Jarvis, listo para desplegar en Vercel",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, background: "#050810", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}

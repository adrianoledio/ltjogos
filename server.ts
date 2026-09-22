import express from "express";
import path from "path";
import { app, supabase } from "./server/app";
import { RtpMonitor } from "./server/rtpMonitor";

async function startServer() {
  const PORT = 3000;
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    try {
      const rtpMonitor = new RtpMonitor(supabase);
      rtpMonitor.startMonitoring(6);
    } catch (e) {
      console.warn("RtpMonitor initialization info:", e);
    }
  });
}

startServer();

export { app };
export default app;

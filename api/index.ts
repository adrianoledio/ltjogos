process.env.IS_SERVERLESS = "true";
process.env.VERCEL = "1";

let appInstance: any = null;

async function getApp() {
  if (!appInstance) {
    const mod = await import("../server.ts");
    appInstance = mod.app || mod.default;
  }
  return appInstance;
}

export default async function handler(req: any, res: any) {
  const app = await getApp();
  // Preserve original requested URL path if rewritten by Vercel
  const matched = (req.headers["x-matched-path"] || req.headers["x-invoke-path"]) as string;
  if (matched && typeof matched === "string" && (matched.startsWith("/api") || matched.startsWith("/webhook"))) {
    req.url = matched;
  }
  return app(req, res);
}

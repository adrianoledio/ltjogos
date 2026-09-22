import { app } from "./app";

export default function handler(req: any, res: any) {
  const matched = (req.headers["x-matched-path"] || req.headers["x-invoke-path"]) as string;
  if (matched && typeof matched === "string" && (matched.startsWith("/api") || matched.startsWith("/webhook") || matched.startsWith("/app/webhook"))) {
    req.url = matched;
  }
  return app(req, res);
}

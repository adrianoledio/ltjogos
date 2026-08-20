import pixupHandler from "./webhooks/pixup";

export default async function handler(req: any, res: any) {
  return pixupHandler(req, res);
}

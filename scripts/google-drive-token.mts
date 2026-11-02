// Obtient, une seule fois, le jeton qui permet à la sauvegarde quotidienne d'écrire dans ton Drive.
//   GOOGLE_CLIENT_ID=… GOOGLE_CLIENT_SECRET=… npm run drive:token
// Ouvre l'adresse affichée, accepte, puis copie GOOGLE_REFRESH_TOKEN dans les variables de Vercel.
// Accès demandé : drive.file (seulement les fichiers créés par Majalis, rien d'autre de ton Drive).
import { createServer } from "node:http";

const id = process.env.GOOGLE_CLIENT_ID;
const secret = process.env.GOOGLE_CLIENT_SECRET;
if (!id || !secret) {
  console.error("Il manque GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET (identifiants OAuth « Application de bureau »).");
  process.exit(1);
}

const port = 53682;
const redirect = `http://127.0.0.1:${port}`;
const url =
  "https://accounts.google.com/o/oauth2/v2/auth?" +
  new URLSearchParams({
    client_id: id,
    redirect_uri: redirect,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/drive.file",
    access_type: "offline",
    prompt: "consent",
  });

const server = createServer(async (req, res) => {
  const code = new URL(req.url ?? "/", redirect).searchParams.get("code");
  if (!code) return res.writeHead(400).end("Pas de code dans l'adresse.");
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({ code, client_id: id, client_secret: secret, redirect_uri: redirect, grant_type: "authorization_code" }),
  });
  const body = await r.json();
  if (!body.refresh_token) {
    console.error("Google n'a pas donné de jeton :", body);
    res.writeHead(500).end("Échec, regarde le terminal.");
  } else {
    console.log("\nGOOGLE_REFRESH_TOKEN=" + body.refresh_token + "\n");
    console.log("À copier dans les variables d'environnement de Vercel (et nulle part ailleurs).");
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" }).end("C'est fait : retourne au terminal.");
  }
  server.close();
});

server.listen(port, "127.0.0.1", () => {
  console.log("Ouvre cette adresse dans ton navigateur et accepte l'accès :\n\n" + url + "\n");
});

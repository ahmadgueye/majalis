import "server-only";

// Sauvegarde vers le Google Drive du porteur, sans bibliothèque : l'API REST de Drive v3.
// Accès « drive.file » : l'app ne voit et ne touche que les fichiers qu'elle a créés elle-même
// (son dossier et ses sauvegardes), rien d'autre dans le Drive.
// Variables : GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN (npm run drive:token).

const FOLDER = "Majalis — sauvegardes";
const FOLDER_TYPE = "application/vnd.google-apps.folder";
/** Sauvegardes gardées (une par jour : deux mois). Les plus anciennes vont à la corbeille du Drive. */
const KEEP = 60;
const API = "https://www.googleapis.com/drive/v3/files";
const UPLOAD = "https://www.googleapis.com/upload/drive/v3/files";

export const hasDrive = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN,
);

async function accessToken() {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Google refuse le jeton : ${body.error_description ?? body.error ?? res.status}`);
  return body.access_token as string;
}

async function drive<T>(token: string, url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, { ...init, headers: { Authorization: `Bearer ${token}`, ...init.headers } });
  if (!res.ok) throw new Error(`Google Drive ${res.status} : ${await res.text()}`);
  return (res.status === 204 ? null : await res.json()) as T;
}

type File = { id: string; name: string };

const list = (token: string, q: string, extra = "") =>
  drive<{ files: File[] }>(
    token,
    `${API}?${new URLSearchParams({ q, fields: "files(id,name)", pageSize: "200", ...(extra ? { orderBy: extra } : {}) })}`,
  ).then((r) => r.files);

/** Dépose `content` sous le nom `name` dans le dossier des sauvegardes (remplacé s'il existe déjà ce jour-là). */
export async function saveToDrive(name: string, content: string) {
  const token = await accessToken();

  const [found] = await list(token, `name = '${FOLDER}' and mimeType = '${FOLDER_TYPE}' and trashed = false`);
  const folder =
    found ??
    (await drive<File>(token, API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: FOLDER, mimeType: FOLDER_TYPE }),
    }));

  const [same] = await list(token, `name = '${name}' and '${folder.id}' in parents and trashed = false`);
  let file: File;
  if (same) {
    file = await drive<File>(token, `${UPLOAD}/${same.id}?uploadType=media&fields=id,name`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: content,
    });
  } else {
    const boundary = `majalis${Date.now()}`;
    const body = [
      `--${boundary}`,
      "Content-Type: application/json; charset=UTF-8",
      "",
      JSON.stringify({ name, parents: [folder.id], mimeType: "application/json" }),
      `--${boundary}`,
      "Content-Type: application/json; charset=UTF-8",
      "",
      content,
      `--${boundary}--`,
    ].join("\r\n");
    file = await drive<File>(token, `${UPLOAD}?uploadType=multipart&fields=id,name`, {
      method: "POST",
      headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
      body,
    });
  }

  // Ménage : au-delà de KEEP sauvegardes, les plus anciennes partent à la corbeille (récupérables 30 jours).
  const all = await list(token, `'${folder.id}' in parents and trashed = false`, "createdTime desc");
  const old = all.slice(KEEP);
  for (const f of old) {
    await drive(token, `${API}/${f.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trashed: true }),
    });
  }
  return { id: file.id, name: file.name, kept: Math.min(all.length, KEEP), trashed: old.length };
}

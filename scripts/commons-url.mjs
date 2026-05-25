import crypto from 'node:crypto';

/** Build upload.wikimedia.org URL from a Commons filename (spaces → underscores). */
export function commonsUrl(filename) {
  const normalized = filename.replace(/ /g, '_');
  const md5 = crypto.createHash('md5').update(normalized).digest('hex');
  const encoded = encodeURIComponent(normalized).replace(/%2F/g, '/');
  return `https://upload.wikimedia.org/wikipedia/commons/${md5[0]}/${md5.slice(0, 2)}/${encoded}`;
}

export async function validateImageUrl(url, delayMs = 3500) {
  await new Promise((r) => setTimeout(r, delayMs));
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    const type = res.headers.get('content-type') || '';
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 8000 * (attempt + 1)));
      continue;
    }
    return { ok: res.ok && type.startsWith('image/'), status: res.status, type };
  }
  return { ok: false, status: 429, type: 'text/html' };
}

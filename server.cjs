const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const DIST_DIR = path.join(__dirname, 'dist');
const INDEX_PATH = path.join(DIST_DIR, 'index.html');

const APP_BASE_URL = String(process.env.APP_BASE_URL || 'https://app.movyo.delivery').replace(/\/+$/, '');
const API_BASE_URL = String(process.env.API_BASE_URL || 'https://api.movyo.delivery').replace(/\/+$/, '');
const DEFAULT_OG_IMAGE = `${APP_BASE_URL}/og-image.png`;

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function absoluteUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('/')) {
    if (API_BASE_URL && raw.startsWith('/uploads/')) return `${API_BASE_URL}${raw}`;
    return `${APP_BASE_URL}${raw}`;
  }
  return raw;
}

function buildMeta({ slug, restaurante }) {
  const nome = String(restaurante?.nome || restaurante?.nomeRestaurante || restaurante?.razaoSocial || 'Movyo Delivery').trim();
  const bairro = String(restaurante?.enderecoBairro || restaurante?.bairro || '').trim();
  const cidade = String(restaurante?.enderecoCidade || restaurante?.cidade || '').trim();
  const local = [bairro, cidade].filter(Boolean).join(' • ');

  const title = nome === 'Movyo Delivery'
    ? 'Movyo Delivery | Cardápio Digital'
    : `${nome} | Cardápio Digital`;

  const description = String(
    restaurante?.descricao ||
    restaurante?.descricaoLoja ||
    (local ? `${local} — Peça online pelo cardápio digital.` : `Peça online pelo cardápio digital do ${nome}.`)
  ).trim();

  const image = absoluteUrl(
    restaurante?.logoUrl ||
    restaurante?.logo ||
    restaurante?.logoPath ||
    restaurante?.imagemLogo ||
    restaurante?.foto ||
    ''
  ) || DEFAULT_OG_IMAGE;

  const url = `${APP_BASE_URL}/p/${encodeURIComponent(slug || '')}`;

  return `
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:image:secure_url" content="${escapeHtml(image)}" />
  <meta property="og:url" content="${escapeHtml(url)}" />
  <meta property="og:site_name" content="${escapeHtml(nome)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />`;
}

function stripExistingDynamicTags(html) {
  return html
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/\s*<meta\s+name=["']description["'][^>]*>\s*/ig, '')
    .replace(/\s*<meta\s+property=["']og:[^"']+["'][^>]*>\s*/ig, '')
    .replace(/\s*<meta\s+name=["']twitter:[^"']+["'][^>]*>\s*/ig, '');
}

async function getOgData(slug) {
  if (!slug || !API_BASE_URL) return null;

  const urls = [
    `${API_BASE_URL}/api/restaurantes/og/${encodeURIComponent(slug)}`,
    `${API_BASE_URL}/api/public/restaurantes/${encodeURIComponent(slug)}`,
    `${API_BASE_URL}/api/vitrine/restaurante/${encodeURIComponent(slug)}`
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) continue;

      const json = await res.json();
      return json?.restaurante || json?.data?.restaurante || json?.data || json || null;
    } catch (_) {}
  }

  return null;
}

app.get(['/p', '/p/', '/p/:slug'], async (req, res) => {
  const slug = String(req.params.slug || '').trim().replace(/^\/+|\/+$/g, '');
  const baseHtml = fs.readFileSync(INDEX_PATH, 'utf8');

  const restaurante = slug ? await getOgData(slug) : null;
  const meta = buildMeta({ slug, restaurante });

  const html = stripExistingDynamicTags(baseHtml).replace('</head>', `${meta}\n</head>`);

  res.setHeader('Cache-Control', 'public, max-age=60');
  res.type('html').send(html);
});

app.use(express.static(DIST_DIR));

app.get('*', (req, res) => {
  res.sendFile(INDEX_PATH);
});

app.listen(PORT, () => {
  console.log(`✅ Vitrine Movyo rodando na porta ${PORT}`);
  console.log(`APP_BASE_URL=${APP_BASE_URL}`);
  console.log(`API_BASE_URL=${API_BASE_URL}`);
});
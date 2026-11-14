import sharp from 'sharp'
import { readdir } from 'node:fs/promises'

const directory = 'docs/images'
for (const name of await readdir(directory)) {
  if (/^(home|nft|cart|checkout)-(desktop|mobile)\.png$/.test(name)) {
    await sharp(`${directory}/${name}`).webp({ quality: 95, effort: 6 }).toFile(`${directory}/${name.replace('.png', '.webp')}`)
  }
}

async function cover(width, height, compact) {
  const desktopWidth = compact ? 920 : 1160
  const desktopLeft = compact ? 40 : 60
  const desktopTop = compact ? 210 : 260
  const mobileWidth = compact ? 208 : 270
  const mobileLeft = compact ? 1010 : 1230
  const mobileTop = compact ? 146 : 320
  const desktop = await sharp(`${directory}/home-desktop.png`).resize({ width: desktopWidth }).toBuffer()
  const phone = await sharp(`${directory}/home-mobile.png`).resize({ width: mobileWidth }).toBuffer()
  const background = Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="glow"><stop stop-color="#8b572c" stop-opacity=".28"/><stop offset="1" stop-color="#140d0a" stop-opacity="0"/></radialGradient></defs>
    <rect width="100%" height="100%" fill="#140d0a"/><ellipse cx="${width - 80}" cy="80" rx="650" ry="600" fill="url(#glow)"/>
    <text x="${desktopLeft}" y="54" fill="#d28a4c" font-size="12" font-family="monospace" letter-spacing="3">FRONTEND / NFT MARKETPLACE</text>
    <text x="${desktopLeft - 3}" y="${compact ? 126 : 144}" fill="#fff" font-size="${compact ? 76 : 96}" font-weight="700" font-family="monospace" letter-spacing="5">KURIO</text>
    <text x="${desktopLeft}" y="${compact ? 164 : 190}" fill="#cfb28c" font-size="${compact ? 19 : 24}" font-family="monospace">Colecione cultura digital.</text>
    <rect x="${desktopLeft - 1}" y="${desktopTop - 39}" width="${desktopWidth + 2}" height="39" rx="14" fill="#342219" stroke="#684329"/>
    <rect x="${desktopLeft - 1}" y="${desktopTop - 13}" width="${desktopWidth + 2}" height="20" fill="#342219"/>
    <circle cx="${desktopLeft + 18}" cy="${desktopTop - 20}" r="4" fill="#d28a4c"/><circle cx="${desktopLeft + 34}" cy="${desktopTop - 20}" r="4" fill="#a46c3c"/><circle cx="${desktopLeft + 50}" cy="${desktopTop - 20}" r="4" fill="#6a492e"/>
    <text x="${desktopLeft + 80}" y="${desktopTop - 16}" fill="#cfb28c" font-family="monospace" font-size="11">kurio-nft-marketplace-lake.vercel.app</text>
    <rect x="${mobileLeft - 8}" y="${mobileTop - 8}" width="${mobileWidth + 16}" height="${Math.round(mobileWidth * 844 / 390) + 16}" rx="28" fill="#39261c" stroke="#a46c3c" stroke-width="2"/>
    </svg>`)
  const desktopHeight = Math.round(desktopWidth * 1000 / 1440)
  const phoneHeight = Math.round(mobileWidth * 844 / 390)
  // Clip the frames to the canvas; screenshots themselves are not redesigned.
  return sharp(background).composite([
    { input: await sharp(desktop).extract({ left: 0, top: 0, width: desktopWidth, height: Math.min(desktopHeight, height - desktopTop) }).toBuffer(), left: desktopLeft, top: desktopTop },
    { input: await sharp(phone).extract({ left: 0, top: 0, width: mobileWidth, height: Math.min(phoneHeight, height - mobileTop) }).toBuffer(), left: mobileLeft, top: mobileTop },
  ])
}
await (await cover(1600, 1120, false)).webp({ quality: 94, effort: 6 }).toFile(`${directory}/cover.webp`)
await (await cover(1280, 640, true)).png().toFile(`${directory}/social-preview.png`)
console.log('Showcase cover, social preview and eight screenshots ready.')

// One-off generator for public/logo.png and public/og-default.jpg.
// Run: node scripts/generate-brand-images.mjs
import sharp from 'sharp'
import { writeFile } from 'node:fs/promises'

const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#0c0a09"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle"
    font-family="Georgia, serif" font-style="italic" font-size="288" fill="#f59e0b">V.</text>
</svg>`

const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="glow" cx="50%" cy="42%" r="65%">
      <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.10"/>
      <stop offset="55%" stop-color="#f59e0b" stop-opacity="0.03"/>
      <stop offset="100%" stop-color="#f59e0b" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="#0c0a09"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <text x="600" y="300" text-anchor="middle"
    font-family="Georgia, serif" font-style="italic" font-size="148" fill="#fafaf9">Vitrine<tspan fill="#f59e0b">.</tspan></text>
  <text x="600" y="396" text-anchor="middle"
    font-family="Georgia, serif" font-style="italic" font-size="34" fill="#a8a29e">Collection management for museums &amp; collectors</text>
  <text x="600" y="560" text-anchor="middle"
    font-family="Menlo, monospace" font-size="22" letter-spacing="4" fill="#57534e">VITRINECMS.COM</text>
</svg>`

await sharp(Buffer.from(logoSvg)).png().toFile('public/logo.png')
await sharp(Buffer.from(ogSvg)).flatten({ background: '#0c0a09' }).jpeg({ quality: 92 }).toFile('public/og-default.jpg')
console.log('done')

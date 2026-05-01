const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const WIDTH = 1242
const HEIGHT = 2688
const OUT_DIR = path.join(__dirname, '..', 'output', 'app-store-screenshots')

const colors = {
  bg: '#f3efe6',
  bg2: '#fbf9f5',
  bg3: '#e6dfd2',
  ink: '#1c1c1a',
  inkSoft: '#3a3830',
  inkMuted: '#5a5850',
  inkFaint: '#8e8a80',
  green: '#5fa061',
  greenDark: '#3d7a3f',
  greenLight: 'rgba(95,160,97,0.15)',
  greenTint: '#e8f3e8',
  forest: '#1a2e1a',
  border: 'rgba(28,28,26,0.10)',
  borderStrong: 'rgba(28,28,26,0.18)',
  creamAccent: '#f7f2e7',
  creamAccentBorder: '#decfa2',
  softGold: '#efe1bc',
  white: '#ffffff',
}

const fontStack = "Avenir Next, Avenir, SF Pro Display, Helvetica, Arial, sans-serif"
const labelStack = "'Arial Narrow', 'Avenir Next Condensed', Impact, sans-serif"

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function wrapLines(text, maxChars) {
  const words = text.split(' ')
  const lines = []
  let current = ''

  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length > maxChars && current) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
  }

  if (current) lines.push(current)
  return lines
}

function multilineText({
  x,
  y,
  text,
  size,
  color,
  weight = 700,
  maxChars = 28,
  lineHeight = 1.2,
  family = fontStack,
  letterSpacing = 0,
  anchor = 'start',
}) {
  const lines = wrapLines(text, maxChars)
  return lines
    .map((line, index) => {
      const dy = y + index * size * lineHeight
      return `<text x="${x}" y="${dy}" fill="${color}" text-anchor="${anchor}" font-family="${family}" font-size="${size}" font-weight="${weight}" letter-spacing="${letterSpacing}">${esc(line)}</text>`
    })
    .join('')
}

function card({ x, y, w, h, fill = colors.bg2, stroke = colors.border, radius = 28, body = '', shadow = false }) {
  return `
    <g ${shadow ? 'filter="url(#cardShadow)"' : ''}>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${fill}" stroke="${stroke}" />
      ${body}
    </g>
  `
}

function pill({ x, y, text, fill = colors.greenLight, color = colors.greenDark, w = 144 }) {
  return `
    <g>
      <rect x="${x}" y="${y}" width="${w}" height="46" rx="23" fill="${fill}" />
      <text x="${x + w / 2}" y="${y + 31}" text-anchor="middle" fill="${color}" font-family=${JSON.stringify(labelStack)} font-size="22" font-weight="800" letter-spacing="1.2">${esc(text.toUpperCase())}</text>
    </g>
  `
}

function appChrome(title, right = 'Account') {
  return `
    <g>
      <text x="54" y="56" fill="${colors.ink}" font-family=${JSON.stringify(fontStack)} font-size="22" font-weight="700">9:41</text>
      <rect x="516" y="40" width="96" height="26" rx="13" fill="rgba(0,0,0,0.08)" />
      <text x="54" y="122" fill="${colors.ink}" font-family=${JSON.stringify(labelStack)} font-size="36" font-weight="800">PerkPass</text>
      <text x="554" y="122" text-anchor="end" fill="${colors.inkFaint}" font-family=${JSON.stringify(labelStack)} font-size="22" font-weight="800" letter-spacing="1.1">${esc(right.toUpperCase())}</text>
      <line x1="38" y1="144" x2="578" y2="144" stroke="${colors.ink}" stroke-opacity="0.14" />
      <text x="54" y="186" fill="${colors.greenDark}" font-family=${JSON.stringify(labelStack)} font-size="20" font-weight="800" letter-spacing="1.4">${esc(title.toUpperCase())}</text>
    </g>
  `
}

function tabBar(active) {
  const items = [
    ['Deals', active === 'deals'],
    ['Saved', active === 'saved'],
    ['History', active === 'history'],
    ['Account', active === 'account'],
  ]

  return `
    <g>
      <rect x="24" y="1490" width="584" height="118" rx="34" fill="rgba(255,255,255,0.92)" stroke="${colors.borderStrong}" />
      ${items
        .map(([label, isActive], index) => {
          const x = 52 + index * 138
          return `
            <g>
              ${isActive ? `<rect x="${x - 14}" y="1512" width="116" height="66" rx="20" fill="${colors.ink}" />` : ''}
              <text x="${x + 44}" y="1556" text-anchor="middle" fill="${isActive ? colors.bg : colors.inkFaint}" font-family=${JSON.stringify(labelStack)} font-size="24" font-weight="800" letter-spacing="1">${esc(label.toUpperCase())}</text>
            </g>
          `
        })
        .join('')}
      <rect x="232" y="1628" width="170" height="8" rx="4" fill="rgba(0,0,0,0.18)" />
    </g>
  `
}

function phoneFrame(content) {
  return `
    <g transform="translate(189 478)">
      <g filter="url(#phoneShadow)">
        <rect x="0" y="0" width="864" height="1768" rx="108" fill="#132313" />
        <rect x="18" y="18" width="828" height="1732" rx="90" fill="${colors.bg2}" />
      </g>
      <rect x="286" y="28" width="292" height="38" rx="19" fill="rgba(255,255,255,0.12)" />
      <g transform="translate(108 96)">
        ${content}
      </g>
    </g>
  `
}

function artBackground() {
  return `
    <circle cx="1068" cy="260" r="204" fill="rgba(95,160,97,0.12)" />
    <circle cx="156" cy="2280" r="244" fill="rgba(224,189,104,0.16)" />
    <circle cx="1090" cy="2080" r="148" fill="rgba(95,160,97,0.08)" />
    <path d="M0 1760 C220 1640 386 1710 534 1840 C684 1972 866 2018 1242 1876 L1242 2688 L0 2688 Z" fill="rgba(255,255,255,0.34)" />
  `
}

function screenshotBase({ eyebrow, title, subtitle, content, callout }) {
  return `
    <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#fcfaf6" />
          <stop offset="100%" stop-color="${colors.bg}" />
        </linearGradient>
        <filter id="phoneShadow" x="-20%" y="-10%" width="140%" height="140%">
          <feDropShadow dx="0" dy="28" stdDeviation="28" flood-color="#0d160d" flood-opacity="0.24" />
        </filter>
        <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="#0d160d" flood-opacity="0.10" />
        </filter>
      </defs>
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bgGrad)" />
      ${artBackground()}
      <text x="96" y="138" fill="${colors.greenDark}" font-family=${JSON.stringify(labelStack)} font-size="30" font-weight="800" letter-spacing="2.6">${esc(eyebrow.toUpperCase())}</text>
      ${multilineText({ x: 92, y: 246, text: title, size: 102, color: colors.ink, weight: 800, maxChars: 18, lineHeight: 0.94, family: labelStack })}
      ${multilineText({ x: 96, y: 420, text: subtitle, size: 34, color: colors.inkMuted, weight: 600, maxChars: 44, lineHeight: 1.33 })}
      ${callout || ''}
      ${phoneFrame(content)}
    </svg>
  `
}

function featureCallout(title, body) {
  return card({
    x: 94,
    y: 520,
    w: 348,
    h: 176,
    fill: 'rgba(255,255,255,0.74)',
    stroke: 'rgba(28,28,26,0.08)',
    radius: 28,
    shadow: true,
    body: `
      <text x="126" y="582" fill="${colors.ink}" font-family=${JSON.stringify(labelStack)} font-size="24" font-weight="800">${esc(title.toUpperCase())}</text>
      ${multilineText({ x: 126, y: 630, text: body, size: 24, color: colors.inkMuted, weight: 600, maxChars: 20, lineHeight: 1.35 })}
    `,
  })
}

function dealsScreen() {
  const dealCard = (y, title, offer, meta, tag) => card({
    x: 0,
    y,
    w: 648,
    h: 170,
    fill: colors.white,
    stroke: colors.border,
    radius: 24,
    shadow: true,
    body: `
      ${pill({ x: 24, y: y + 20, text: tag, w: 118 })}
      <text x="24" y="${y + 88}" fill="${colors.ink}" font-family=${JSON.stringify(labelStack)} font-size="40" font-weight="800">${esc(title)}</text>
      <text x="24" y="${y + 124}" fill="${colors.greenDark}" font-family=${JSON.stringify(fontStack)} font-size="28" font-weight="700">${esc(offer)}</text>
      <text x="24" y="${y + 150}" fill="${colors.inkFaint}" font-family=${JSON.stringify(fontStack)} font-size="22" font-weight="600">${esc(meta)}</text>
    `,
  })

  const content = `
    ${appChrome('Member deals')}
    <text x="54" y="254" fill="${colors.ink}" font-family=${JSON.stringify(labelStack)} font-size="84" font-weight="800">Your deals.</text>
    <text x="54" y="304" fill="${colors.inkMuted}" font-family=${JSON.stringify(fontStack)} font-size="28" font-weight="600">Live Philly perks, sorted by category and availability.</text>
    ${pill({ x: 54, y: 348, text: 'Live now', w: 132 })}
    ${pill({ x: 204, y: 348, text: 'Cafe', w: 112, fill: colors.bg, color: colors.inkMuted })}
    ${pill({ x: 334, y: 348, text: 'Fitness', w: 140, fill: colors.bg, color: colors.inkMuted })}
    ${dealCard(432, 'The Brew Room', '$2 off any espresso drink', 'Cafe • Fishtown', 'Live')}
    ${dealCard(626, 'Cellar Dog', 'Half off games and bites', 'Bar • Center City', 'Tonight')}
    ${dealCard(820, 'OpenBox Athletics', '15% off first class pack', 'Fitness • Old City', 'New')}
    ${card({
      x: 0,
      y: 1028,
      w: 648,
      h: 140,
      fill: colors.creamAccent,
      stroke: colors.creamAccentBorder,
      radius: 24,
      body: `
        <text x="24" y="1072" fill="${colors.ink}" font-family=${JSON.stringify(labelStack)} font-size="24" font-weight="800">TODAY&apos;S MEMBER VIEW</text>
        <text x="24" y="1120" fill="${colors.inkMuted}" font-family=${JSON.stringify(fontStack)} font-size="24" font-weight="600">A quick scan of what you can use right now.</text>
      `,
    })}
    ${tabBar('deals')}
  `

  return screenshotBase({
    eyebrow: 'Live deals',
    title: 'Browse local perks',
    subtitle: 'Philadelphia offers feel organized, fast, and easy to scan on the go.',
    content,
    callout: featureCallout('Live now', 'See what is redeemable today without digging through menus.'),
  })
}

function redeemScreen() {
  const codeBox = (x, char) => `
    <rect x="${x}" y="676" width="132" height="144" rx="28" fill="${colors.forest}" />
    <text x="${x + 66}" y="766" text-anchor="middle" fill="white" font-family=${JSON.stringify(labelStack)} font-size="76" font-weight="800">${esc(char)}</text>
  `

  const content = `
    ${appChrome('Redeem')}
    <text x="54" y="250" fill="${colors.ink}" font-family=${JSON.stringify(labelStack)} font-size="78" font-weight="800">Redeem in seconds.</text>
    <text x="54" y="300" fill="${colors.inkMuted}" font-family=${JSON.stringify(fontStack)} font-size="28" font-weight="600">Short codes keep checkout easy for members and staff.</text>
    ${card({
      x: 0,
      y: 372,
      w: 648,
      h: 620,
      fill: colors.creamAccent,
      stroke: colors.creamAccentBorder,
      radius: 34,
      shadow: true,
      body: `
        <text x="324" y="442" text-anchor="middle" fill="${colors.greenDark}" font-family=${JSON.stringify(labelStack)} font-size="24" font-weight="800" letter-spacing="1.2">PERKPASS CODE</text>
        <text x="324" y="510" text-anchor="middle" fill="${colors.ink}" font-family=${JSON.stringify(labelStack)} font-size="40" font-weight="800">The Brew Room</text>
        <text x="324" y="552" text-anchor="middle" fill="${colors.inkMuted}" font-family=${JSON.stringify(fontStack)} font-size="24" font-weight="600">$2 off any espresso drink</text>
        ${codeBox(114, 'P')}
        ${codeBox(258, 'K')}
        ${codeBox(402, '7')}
        <text x="324" y="882" text-anchor="middle" fill="${colors.inkMuted}" font-family=${JSON.stringify(fontStack)} font-size="24" font-weight="600">2-minute window • 15-minute cooldown</text>
        <rect x="104" y="916" width="440" height="16" rx="8" fill="${colors.bg3}" />
        <rect x="104" y="916" width="286" height="16" rx="8" fill="${colors.green}" />
      `,
    })}
    ${card({
      x: 0,
      y: 1022,
      w: 648,
      h: 112,
      fill: colors.white,
      stroke: colors.border,
      radius: 22,
      body: `
        <text x="24" y="1068" fill="${colors.ink}" font-family=${JSON.stringify(labelStack)} font-size="24" font-weight="800">KEEP THIS SCREEN OPEN</text>
        <text x="24" y="1104" fill="${colors.inkMuted}" font-family=${JSON.stringify(fontStack)} font-size="22" font-weight="600">Staff checks the code before the timer ends.</text>
      `,
    })}
    ${tabBar('deals')}
  `

  return screenshotBase({
    eyebrow: 'Redemption',
    title: 'Redeem in seconds',
    subtitle: 'Time-sensitive codes make the in-person member experience feel quick and clear.',
    content,
    callout: featureCallout('Fast checkout', 'One screen, one code, one clean handoff at the counter.'),
  })
}

function favoritesScreen() {
  const favoriteCard = (y, title, note) => card({
    x: 0,
    y,
    w: 648,
    h: 154,
    fill: colors.white,
    stroke: colors.border,
    radius: 24,
    shadow: true,
    body: `
      <text x="24" y="${y + 72}" fill="${colors.ink}" font-family=${JSON.stringify(labelStack)} font-size="40" font-weight="800">${esc(title)}</text>
      <text x="24" y="${y + 112}" fill="${colors.inkMuted}" font-family=${JSON.stringify(fontStack)} font-size="24" font-weight="600">${esc(note)}</text>
      <rect x="548" y="${y + 28}" width="72" height="72" rx="20" fill="${colors.greenTint}" />
      <text x="584" y="${y + 73}" text-anchor="middle" fill="${colors.greenDark}" font-family=${JSON.stringify(labelStack)} font-size="24" font-weight="800">SAVE</text>
    `,
  })

  const content = `
    ${appChrome('Favorites')}
    <text x="54" y="250" fill="${colors.ink}" font-family=${JSON.stringify(labelStack)} font-size="78" font-weight="800">Saved spots.</text>
    <text x="54" y="300" fill="${colors.inkMuted}" font-family=${JSON.stringify(fontStack)} font-size="28" font-weight="600">Keep the places you actually want to use again.</text>
    ${card({
      x: 0,
      y: 366,
      w: 648,
      h: 170,
      fill: colors.creamAccent,
      stroke: colors.creamAccentBorder,
      radius: 28,
      body: `
        <text x="24" y="418" fill="${colors.ink}" font-family=${JSON.stringify(labelStack)} font-size="24" font-weight="800">MEMBER SHORTLIST</text>
        <text x="24" y="486" fill="${colors.ink}" font-family=${JSON.stringify(labelStack)} font-size="58" font-weight="800">3 saved</text>
        <text x="24" y="522" fill="${colors.inkMuted}" font-family=${JSON.stringify(fontStack)} font-size="22" font-weight="600">A lightweight favorites list for repeat visits and quick decisions.</text>
      `,
    })}
    ${favoriteCard(572, 'The Brew Room', 'Coffee and laptop mornings in Fishtown')}
    ${favoriteCard(756, 'Philly Glow Studio', 'Wellness visit • South Philly')}
    ${favoriteCard(940, 'Bluebird Strength', 'Class packs and strength training')}
    ${tabBar('saved')}
  `

  return screenshotBase({
    eyebrow: 'Favorites',
    title: 'Save your go-to spots',
    subtitle: 'Members can keep a small shortlist of the places they actually revisit.',
    content,
    callout: featureCallout('Personal list', 'A simple favorites layer makes the app feel useful on repeat.'),
  })
}

function historyScreen() {
  const row = (y, business, deal, status) => card({
    x: 0,
    y,
    w: 648,
    h: 126,
    fill: colors.white,
    stroke: colors.border,
    radius: 22,
    body: `
      <text x="24" y="${y + 48}" fill="${colors.ink}" font-family=${JSON.stringify(labelStack)} font-size="34" font-weight="800">${esc(business)}</text>
      <text x="24" y="${y + 84}" fill="${colors.inkMuted}" font-family=${JSON.stringify(fontStack)} font-size="22" font-weight="600">${esc(deal)}</text>
      <rect x="500" y="${y + 28}" width="120" height="34" rx="17" fill="${status === 'Confirmed' ? colors.greenLight : colors.bg3}" />
      <text x="560" y="${y + 51}" text-anchor="middle" fill="${status === 'Confirmed' ? colors.greenDark : colors.inkMuted}" font-family=${JSON.stringify(labelStack)} font-size="16" font-weight="800" letter-spacing="1">${esc(status.toUpperCase())}</text>
    `,
  })

  const content = `
    ${appChrome('History')}
    <text x="54" y="250" fill="${colors.ink}" font-family=${JSON.stringify(labelStack)} font-size="74" font-weight="800">Recent activity.</text>
    <text x="54" y="300" fill="${colors.inkMuted}" font-family=${JSON.stringify(fontStack)} font-size="28" font-weight="600">A clean log of what you used and what got confirmed.</text>
    ${card({
      x: 0,
      y: 366,
      w: 648,
      h: 156,
      fill: colors.greenTint,
      stroke: 'rgba(95,160,97,0.26)',
      radius: 28,
      body: `
        <text x="24" y="418" fill="${colors.greenDark}" font-family=${JSON.stringify(labelStack)} font-size="24" font-weight="800">ACTIVITY SNAPSHOT</text>
        <text x="24" y="486" fill="${colors.ink}" font-family=${JSON.stringify(labelStack)} font-size="58" font-weight="800">12 redemptions</text>
      `,
    })}
    ${row(564, 'The Brew Room', '$2 off any espresso drink', 'Confirmed')}
    ${row(708, 'Cellar Dog', 'Half off games and bites', 'Confirmed')}
    ${row(852, 'Philly Glow Studio', '10% off skincare visit', 'Code generated')}
    ${row(996, 'Bluebird Strength', '15% off first class pack', 'Confirmed')}
    ${tabBar('history')}
  `

  return screenshotBase({
    eyebrow: 'History',
    title: 'Track member activity',
    subtitle: 'Redemption history gives members a quick pulse on what they used recently.',
    content,
    callout: featureCallout('Recent use', 'A simple record builds trust and makes member value easier to see.'),
  })
}

function accountScreen() {
  const content = `
    ${appChrome('Account')}
    <text x="54" y="250" fill="${colors.ink}" font-family=${JSON.stringify(labelStack)} font-size="74" font-weight="800">Account tools.</text>
    <text x="54" y="300" fill="${colors.inkMuted}" font-family=${JSON.stringify(fontStack)} font-size="28" font-weight="600">Billing, support, and membership details stay in one place.</text>
    ${card({
      x: 0,
      y: 366,
      w: 648,
      h: 190,
      fill: colors.creamAccent,
      stroke: colors.creamAccentBorder,
      radius: 28,
      body: `
        <text x="24" y="418" fill="${colors.ink}" font-family=${JSON.stringify(labelStack)} font-size="24" font-weight="800">MEMBERSHIP ACTIVE</text>
        <text x="24" y="490" fill="${colors.ink}" font-family=${JSON.stringify(labelStack)} font-size="58" font-weight="800">Jamie Member</text>
        <text x="24" y="530" fill="${colors.inkMuted}" font-family=${JSON.stringify(fontStack)} font-size="22" font-weight="600">PerkPass All Access • Billing portal available</text>
      `,
    })}
    ${card({
      x: 0,
      y: 586,
      w: 648,
      h: 364,
      fill: colors.white,
      stroke: colors.border,
      radius: 28,
      body: `
        <text x="24" y="638" fill="${colors.ink}" font-family=${JSON.stringify(labelStack)} font-size="24" font-weight="800">MEMBERSHIP DETAILS</text>
        <text x="24" y="712" fill="${colors.inkMuted}" font-family=${JSON.stringify(fontStack)} font-size="24" font-weight="600">Email</text>
        <text x="564" y="712" text-anchor="end" fill="${colors.ink}" font-family=${JSON.stringify(fontStack)} font-size="24" font-weight="700">jamie@perkpass.com</text>
        <text x="24" y="786" fill="${colors.inkMuted}" font-family=${JSON.stringify(fontStack)} font-size="24" font-weight="600">Status</text>
        <text x="564" y="786" text-anchor="end" fill="${colors.greenDark}" font-family=${JSON.stringify(fontStack)} font-size="24" font-weight="700">Active</text>
        <text x="24" y="860" fill="${colors.inkMuted}" font-family=${JSON.stringify(fontStack)} font-size="24" font-weight="600">Support</text>
        <text x="564" y="860" text-anchor="end" fill="${colors.ink}" font-family=${JSON.stringify(fontStack)} font-size="24" font-weight="700">hello@getperkpass.com</text>
      `,
    })}
    <rect x="0" y="984" width="648" height="92" rx="22" fill="${colors.green}" />
    <text x="324" y="1042" text-anchor="middle" fill="white" font-family=${JSON.stringify(labelStack)} font-size="34" font-weight="800">Manage billing</text>
    <rect x="0" y="1100" width="648" height="92" rx="22" fill="${colors.white}" stroke="${colors.borderStrong}" />
    <text x="324" y="1158" text-anchor="middle" fill="${colors.ink}" font-family=${JSON.stringify(labelStack)} font-size="32" font-weight="800">Email support</text>
    ${tabBar('account')}
  `

  return screenshotBase({
    eyebrow: 'Account',
    title: 'Billing and support',
    subtitle: 'Members can review status, manage billing, and get help without leaving the app.',
    content,
    callout: featureCallout('Member ops', 'The account area keeps billing, status, and support visible and direct.'),
  })
}

function loginScreen() {
  const content = `
    ${appChrome('Welcome back', 'Member')}
    <text x="54" y="250" fill="${colors.ink}" font-family=${JSON.stringify(labelStack)} font-size="84" font-weight="800">Welcome back.</text>
    <text x="54" y="300" fill="${colors.inkMuted}" font-family=${JSON.stringify(fontStack)} font-size="28" font-weight="600">Google or email login gets active members into deals quickly.</text>
    <rect x="0" y="390" width="648" height="96" rx="22" fill="${colors.white}" stroke="${colors.borderStrong}" />
    <text x="324" y="451" text-anchor="middle" fill="${colors.ink}" font-family=${JSON.stringify(labelStack)} font-size="34" font-weight="800">Continue with Google</text>
    <text x="324" y="544" text-anchor="middle" fill="${colors.inkFaint}" font-family=${JSON.stringify(labelStack)} font-size="22" font-weight="800" letter-spacing="1.2">OR</text>
    <rect x="0" y="592" width="648" height="92" rx="22" fill="${colors.bg}" stroke="${colors.borderStrong}" />
    <text x="34" y="650" fill="${colors.inkFaint}" font-family=${JSON.stringify(fontStack)} font-size="28" font-weight="600">you@email.com</text>
    <rect x="0" y="714" width="648" height="98" rx="24" fill="${colors.green}" />
    <text x="324" y="775" text-anchor="middle" fill="white" font-family=${JSON.stringify(labelStack)} font-size="34" font-weight="800">Continue with email</text>
    ${card({
      x: 0,
      y: 854,
      w: 648,
      h: 176,
      fill: colors.creamAccent,
      stroke: colors.creamAccentBorder,
      radius: 26,
      body: `
        <text x="24" y="906" fill="${colors.ink}" font-family=${JSON.stringify(labelStack)} font-size="24" font-weight="800">CURRENT LAUNCH PLAN</text>
        <text x="24" y="962" fill="${colors.ink}" font-family=${JSON.stringify(labelStack)} font-size="44" font-weight="800">Existing members first</text>
        <text x="24" y="1002" fill="${colors.inkMuted}" font-family=${JSON.stringify(fontStack)} font-size="22" font-weight="600">Mobile access is focused on active PerkPass members.</text>
      `,
    })}
  `

  return screenshotBase({
    eyebrow: 'Member access',
    title: 'Sign in fast',
    subtitle: 'The login flow is intentionally lightweight so members can get right into the app.',
    content,
    callout: featureCallout('Simple access', 'A low-friction login fits the member-first launch strategy.'),
  })
}

const screens = [
  { name: '01-deals.png', svg: dealsScreen() },
  { name: '02-redeem.png', svg: redeemScreen() },
  { name: '03-favorites.png', svg: favoritesScreen() },
  { name: '04-history.png', svg: historyScreen() },
  { name: '05-account.png', svg: accountScreen() },
  { name: '06-login.png', svg: loginScreen() },
]

async function run() {
  ensureDir(OUT_DIR)
  for (const screen of screens) {
    const file = path.join(OUT_DIR, screen.name)
    await sharp(Buffer.from(screen.svg)).png().toFile(file)
    console.log(`wrote ${file}`)
  }
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})

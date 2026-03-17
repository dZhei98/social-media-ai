const palette = ["#0f766e", "#0d9488", "#0f766e", "#f97316", "#ea580c", "#115e59"];

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function selectBackground(name) {
  const total = Array.from(name || "U").reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return palette[total % palette.length];
}

function extractInitials(name) {
  return (name || "User")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function createAvatarSvg(name) {
  const initials = extractInitials(name);
  const background = selectBackground(name);
  const safeName = escapeXml(name || "User");
  const safeInitials = escapeXml(initials);

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320" role="img" aria-label="${safeName}">
      <rect width="320" height="320" fill="${background}" rx="48" />
      <circle cx="160" cy="160" r="124" fill="rgba(255,255,255,0.12)" />
      <text x="160" y="182" text-anchor="middle" font-family="Avenir Next, Segoe UI, sans-serif" font-size="108" font-weight="700" fill="#ffffff">
        ${safeInitials}
      </text>
    </svg>
  `.trim();
}

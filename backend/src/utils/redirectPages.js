import env from '../config/env.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const BRAND_ICON = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>`;

const LOCK_ICON = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>`;

const ALERT_ICON = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>`;

const EYE_ICON = `
  <svg class="eye-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
  <svg class="eye-shut" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>`;

function layout({ title, body }) {
  const favicon = `${(env.frontendUrl || '').replace(/\/+$/, '')}/favicon.svg`;
  const homeUrl = (env.frontendUrl || '').replace(/\/+$/, '') || '#';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<meta name="theme-color" content="#0b0e06" />
<link rel="icon" type="image/svg+xml" href="${escapeHtml(favicon)}" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
<title>${escapeHtml(title)} · LinkPulse</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  html, body { min-height: 100%; }
  body {
    margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px;
    color: #f4fce0; letter-spacing: 0.01em;
    font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;
    background-color: #0b0e06;
    background-image:
      radial-gradient(ellipse 70% 55% at 12% -10%, rgba(205,242,63,0.14), transparent 60%),
      radial-gradient(ellipse 60% 50% at 100% 0%, rgba(255,210,31,0.1), transparent 55%),
      repeating-linear-gradient(0deg, rgba(0,0,0,0.24) 0px, rgba(0,0,0,0.24) 1px, transparent 1px, transparent 3px);
    background-attachment: fixed;
  }
  ::selection { background: #cdf23f; color: #0b0e06; }

  .card {
    width: 100%; max-width: 440px; padding: 32px;
    border: 2px solid #415127; background-color: #141a0c;
    background-image:
      linear-gradient(120deg, rgba(205,242,63,0.05), rgba(255,210,31,0.03) 55%, transparent),
      linear-gradient(180deg, rgba(255,255,255,0.02), transparent 45%);
    box-shadow: 4px 4px 0 0 rgba(0,0,0,0.85), inset 0 0 0 1px rgba(205,242,63,0.08);
  }

  .logo { display: flex; align-items: center; gap: 10px; margin-bottom: 26px; text-decoration: none; }
  .logo-mark {
    position: relative; display: flex; height: 36px; width: 36px;
    align-items: center; justify-content: center;
    border: 2px solid #cdf23f; background: #1b2310;
    box-shadow: 0 0 0 1px rgba(205,242,63,0.6), 4px 4px 0 0 rgba(0,0,0,0.85), 0 0 22px -2px rgba(205,242,63,0.6);
  }
  .logo-mark svg { width: 20px; height: 20px; color: #e0f96e; }
  .logo-mark::after { content: ""; position: absolute; right: -4px; top: -4px; height: 6px; width: 6px; background: #ffe066; }
  .logo-text { font-family: "Chakra Petch", "JetBrains Mono", sans-serif; font-size: 17px; font-weight: 600; letter-spacing: -0.01em; color: #f4fce0; }
  .logo-text .pulse { background-image: linear-gradient(120deg, #f2ffb8, #cdf23f 45%, #ffd21f 95%); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .logo-text .caret { color: #cdf23f; animation: blink 1s steps(1, end) infinite; }
  @keyframes blink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }

  .icon {
    width: 52px; height: 52px; margin-bottom: 20px; display: grid; place-items: center;
    border: 2px solid rgba(205,242,63,0.35); background: rgba(205,242,63,0.06); color: #e0f96e;
  }
  .icon svg { width: 24px; height: 24px; }

  h1 {
    margin: 0 0 8px; font-family: "Chakra Petch", "JetBrains Mono", sans-serif;
    font-size: 20px; font-weight: 600; line-height: 1.3; letter-spacing: 0.02em;
    text-transform: uppercase; color: #f4fce0;
  }
  p { margin: 0; color: #9dac78; font-size: 14px; line-height: 1.6; }

  .field-label {
    display: block; margin-bottom: 6px; font-size: 12px; font-weight: 500;
    text-transform: uppercase; letter-spacing: 0.1em; color: #e0f96e;
  }
  form { margin-top: 24px; }
  .pw { position: relative; }
  input[type=password], input[type=text] {
    width: 100%; height: 44px; padding: 0 42px 0 12px; font: inherit; font-size: 14px;
    border: 2px solid #5a6c34; background: #1b2310; color: #f4fce0; outline: none;
  }
  input::placeholder { color: #7a8858; }
  input:focus { border-color: #a8cc24; box-shadow: 0 0 0 3px rgba(205,242,63,0.2); }
  .pw-toggle {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    display: inline-flex; padding: 0; border: 0; background: none; color: #7a8858; cursor: pointer;
  }
  .pw-toggle:hover { color: #e2eec4; }
  .pw-toggle svg { width: 16px; height: 16px; }
  .pw-toggle .eye-shut { display: none; }
  .pw-toggle.is-on .eye-open { display: none; }
  .pw-toggle.is-on .eye-shut { display: block; }

  .btn {
    width: 100%; height: 48px; margin-top: 14px; cursor: pointer;
    border: 2px solid #e0f96e; color: #0b0e06; font: inherit; font-size: 14px;
    font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;
    background-image: linear-gradient(120deg, #cdf23f 0%, #ffd21f 100%);
    box-shadow: 0 0 0 1px rgba(205,242,63,0.6), 4px 4px 0 0 rgba(0,0,0,0.85), 0 0 22px -2px rgba(205,242,63,0.6);
    transition: filter 0.1s ease, transform 0.1s ease, box-shadow 0.1s ease;
  }
  .btn:hover { filter: brightness(1.08); }
  .btn:active { transform: translate(2px, 2px); box-shadow: none; }

  .alert {
    margin-top: 16px; padding: 12px 14px; font-size: 13px;
    border: 2px solid rgba(255,107,95,0.4); background: rgba(255,107,95,0.1); color: #ff9a8f;
  }
  .code { margin-top: 16px; font-size: 12px; color: #7a8858; }
  .footer { margin-top: 24px; font-size: 12px; color: #5d6a41; }
  .footer a { color: #9dac78; text-decoration: none; }
  .footer a:hover { color: #e0f96e; }
</style>
</head>
<body>
  <main class="card">
    <a class="logo" href="${escapeHtml(homeUrl)}">
      <span class="logo-mark">${BRAND_ICON}</span>
      <span class="logo-text">Link<span class="pulse">Pulse</span><span class="caret">_</span></span>
    </a>
    ${body}
  </main>
</body>
</html>`;
}

export function renderErrorPage({ status, title, message, code }) {
  const body = `
    <div class="icon">${ALERT_ICON}</div>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
    ${code ? `<p class="code">Status ${escapeHtml(status)}</p>` : ''}
    <p class="footer">Powered by <a href="${escapeHtml(
      (env.frontendUrl || '').replace(/\/+$/, '') || '#'
    )}">LinkPulse</a></p>`;
  return layout({ title, body });
}

export function renderPasswordPage({ code, title, error, nonce = '' }) {
  const heading = title ? `"${escapeHtml(title)}" is protected` : 'This link is protected';
  const nonceAttr = nonce ? ` nonce="${escapeHtml(nonce)}"` : '';
  const body = `
    <div class="icon">${LOCK_ICON}</div>
    <h1>${heading}</h1>
    <p>Enter the password to continue to your destination.</p>
    <form method="POST" action="/${encodeURIComponent(code)}">
      <label class="field-label" for="password">Password</label>
      <div class="pw">
        <input id="password" type="password" name="password" placeholder="Enter link password" autocomplete="off" required />
        <button type="button" class="pw-toggle" aria-label="Show password">
          ${EYE_ICON}
        </button>
      </div>
      <button type="submit" class="btn">Unlock link</button>
    </form>
    ${error ? `<div class="alert">${escapeHtml(error)}</div>` : ''}
    <p class="footer">Powered by <a href="${escapeHtml(
      (env.frontendUrl || '').replace(/\/+$/, '') || '#'
    )}">LinkPulse</a></p>
    <script${nonceAttr}>
      (function () {
        var toggle = document.querySelector('.pw-toggle');
        var input = document.getElementById('password');
        if (!toggle || !input) return;
        toggle.addEventListener('click', function () {
          var reveal = input.type === 'password';
          input.type = reveal ? 'text' : 'password';
          toggle.classList.toggle('is-on', reveal);
          toggle.setAttribute('aria-label', reveal ? 'Hide password' : 'Show password');
        });
      })();
    </script>`;
  return layout({ title: 'Protected link', body });
}

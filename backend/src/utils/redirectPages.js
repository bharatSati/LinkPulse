function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function layout({ title, body }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>${escapeHtml(title)} · LinkPulse</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: grid; place-items: center;
    background: #07080a; color: #f3f5f7;
    font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    padding: 24px;
  }
  .card {
    width: 100%; max-width: 420px; background: #0f1114; border: 1px solid #2b3138;
    border-radius: 20px; padding: 32px; text-align: center;
    box-shadow: 0 24px 60px -30px rgba(0,0,0,0.9);
  }
  .brand { display: inline-flex; align-items: center; gap: 8px; font-weight: 600; letter-spacing: -0.01em; margin-bottom: 24px; }
  .dot { width: 10px; height: 10px; border-radius: 999px; background: #22f47f; box-shadow: 0 0 16px rgba(34,244,127,0.7); }
  .brand span:last-child { color: #22f47f; }
  .icon {
    width: 52px; height: 52px; margin: 0 auto 20px; border-radius: 16px;
    display: grid; place-items: center; background: rgba(34,244,127,0.08);
    border: 1px solid rgba(34,244,127,0.28); font-size: 22px;
  }
  h1 { font-size: 18px; margin: 0 0 8px; }
  p { margin: 0; color: #8a919b; font-size: 14px; line-height: 1.6; }
  p.code { margin-top: 16px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; color: #525860; }
  form { margin-top: 24px; display: flex; flex-direction: column; gap: 12px; }
  input[type=password] {
    width: 100%; height: 44px; border-radius: 12px; border: 1px solid #2b3138;
    background: #14171b; color: #f3f5f7; padding: 0 14px; font-size: 14px; outline: none;
  }
  input[type=password]:focus { border-color: #12c866; box-shadow: 0 0 0 3px rgba(34,244,127,0.18); }
  button {
    height: 44px; border: none; border-radius: 12px; background: #22f47f; color: #07080a;
    font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.15s ease;
  }
  button:hover { background: #4dffa0; }
  .error { margin-top: 12px; color: #ff7a7a; font-size: 13px; }
  .footer { margin-top: 24px; font-size: 12px; color: #525860; }
</style>
</head>
<body>
  <div class="card">
    <div class="brand"><span class="dot"></span><span>Link</span><span>Pulse</span></div>
    ${body}
  </div>
</body>
</html>`;
}

export function renderErrorPage({ status, title, message, code }) {
  const body = `
    <div class="icon">⚠️</div>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
    ${code ? `<p class="code">Status ${escapeHtml(status)}</p>` : ''}
    <p class="footer">Powered by LinkPulse</p>`;
  return layout({ title, body });
}

export function renderPasswordPage({ code, title, error }) {
  const heading = title ? `"${escapeHtml(title)}" is protected` : 'This link is protected';
  const body = `
    <div class="icon">🔒</div>
    <h1>${heading}</h1>
    <p>Enter the password to continue to your destination.</p>
    <form method="POST" action="/${encodeURIComponent(code)}">
      <input type="password" name="password" placeholder="Link password" autocomplete="off" required />
      <button type="submit">Unlock link</button>
    </form>
    ${error ? `<p class="error">${escapeHtml(error)}</p>` : ''}
    <p class="footer">Powered by LinkPulse</p>`;
  return layout({ title: 'Protected link', body });
}

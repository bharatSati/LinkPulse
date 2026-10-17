export function parseUserAgent(userAgent = '') {
  if (typeof userAgent !== 'string' || userAgent.trim() === '') {
    return { browser: null, operatingSystem: null };
  }

  const ua = userAgent;
  let browser = 'Other';

  if (/Edg[A-Za-z]*\//.test(ua)) browser = 'Edge';
  else if (/OPR\/|Opera/.test(ua)) browser = 'Opera';
  else if (/SamsungBrowser/.test(ua)) browser = 'Samsung Internet';
  else if (/Firefox\/|FxiOS/.test(ua)) browser = 'Firefox';
  else if (/CriOS/.test(ua)) browser = 'Chrome';
  else if (/Chrome\//.test(ua)) browser = 'Chrome';
  else if (/Safari\//.test(ua)) browser = 'Safari';
  else if (/MSIE|Trident/.test(ua)) browser = 'Internet Explorer';
  else if (/curl|wget|python|node|postman/i.test(ua)) browser = 'Bot / Client';

  let operatingSystem = 'Other';

  if (/Windows NT/.test(ua)) operatingSystem = 'Windows';
  else if (/iPhone|iPad|iPod/.test(ua)) operatingSystem = 'iOS';
  else if (/Macintosh|Mac OS X/.test(ua)) operatingSystem = 'macOS';
  else if (/Android/.test(ua)) operatingSystem = 'Android';
  else if (/CrOS/.test(ua)) operatingSystem = 'ChromeOS';
  else if (/Linux/.test(ua)) operatingSystem = 'Linux';

  return { browser, operatingSystem };
}

export const renderManualLinks = (links) => {
  if (!links) return '';

  const siteNames = {
    scamwise: 'ScamWise',
    fakeshopfinder: 'Fakeshopfinder',
    asksilver: 'AskSilver',
    scamadviser: 'ScamAdviser',
    trustpilot: 'Trustpilot',
    urlvoid: 'URLVoid',
    scamvoid: 'ScamVoid'
  };

  const chips = Object.entries(links).map(([key, url]) => {
    return `
      <a href="${url}" target="_blank" rel="noopener noreferrer" class="link-chip" title="Check on ${siteNames[key]}">
        ${siteNames[key]}
        <svg xmlns="http://www.w3.org/O/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
      </a>
    `;
  }).join('');

  return `
    <div class="manual-links">
      <h3>Also verify manually on:</h3>
      <div class="link-chips">
        ${chips}
      </div>
    </div>
  `;
};

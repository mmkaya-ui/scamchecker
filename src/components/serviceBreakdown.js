import { escapeHtml } from '../utils/format.js';

const icons = {
  ipqs: 'shield',
  virustotal: 'activity',
  safebrowsing: 'alert-triangle',
  scamadviser: 'eye',
  scamvoid: 'list',
  urlvoid: 'hash',
  trustpilot: 'star',
  whois: 'clock',
  ssl: 'lock'
};

const getIconSvg = (name) => {
  // A tiny set of feather icons for services
  const svgMap = {
    'shield': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>',
    'activity': '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>',
    'alert-triangle': '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>',
    'eye': '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>',
    'list': '<line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line>',
    'hash': '<line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line><line x1="10" y1="3" x2="8" y2="21"></line><line x1="16" y1="3" x2="14" y2="21"></line>',
    'star': '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>',
    'clock': '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>',
    'lock': '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>'
  };
  
  return `<svg xmlns="http://www.w3.org/O/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svgMap[name]}</svg>`;
};

const serviceNames = {
  ipqs: 'IPQualityScore',
  virustotal: 'VirusTotal',
  safebrowsing: 'Safe Browsing',
  scamadviser: 'ScamAdviser',
  scamvoid: 'ScamVoid',
  urlvoid: 'URLVoid',
  trustpilot: 'Trustpilot',
  whois: 'Domain Age',
  ssl: 'SSL Certificate'
};

const getServiceColor = (score) => {
  if (score === null || score === undefined) return 'gray';
  if (score >= 80) return 'green';
  if (score >= 60) return 'yellow';
  if (score >= 35) return 'orange';
  return 'red';
};

const getServiceDetail = (key, result) => {
  if (!result || !result.details) return '';
  const d = result.details;
  
  switch (key) {
    case 'ipqs': return d.category || 'Website';
    case 'virustotal': return `${d.malicious || 0} malicious, ${d.suspicious || 0} suspicious`;
    case 'safebrowsing': return d.clean ? 'No threats found' : (d.threats || []).join(', ');
    case 'scamadviser': return `Risk: ${d.risk || 'Unknown'}`;
    case 'scamvoid': return `${d.flagged || 0}/${d.total || 0} engines flagged`;
    case 'urlvoid': return `${d.flagged || 0}/${d.total || 0} engines flagged`;
    case 'trustpilot': return `${d.trustScore || 0}/5 stars (${d.reviews || 0} reviews)`;
    case 'whois': return `Age: ${d.ageHuman || 'Unknown'}`;
    case 'ssl': return d.valid ? `Issued by ${d.issuer}` : (d.error || 'Invalid');
    default: return '';
  }
};

const getServiceDisplayValue = (key, result) => {
  if (!result || !result.available) return 'N/A';
  
  switch (key) {
    case 'safebrowsing': return result.details?.clean ? '✅ Clean' : '❌ Threat';
    case 'ssl': return result.score === 100 ? '✅ Valid' : (result.score > 0 ? '⚠️ Self-Signed' : '❌ Invalid');
    default: 
      return `${Math.round(result.score)}<span style="font-size: 0.7em; color: var(--text-muted)">/100</span>`;
  }
};

export const renderServiceBreakdown = (services) => {
  if (!services) return '';

  const order = ['ipqs', 'virustotal', 'safebrowsing', 'scamvoid', 'urlvoid', 'scamadviser', 'trustpilot', 'whois', 'ssl'];

  const items = order.map((key, index) => {
    const result = services[key];
    const isAvailable = result && result.available;
    
    let colorClass = 'gray';
    let value = 'Not configured';
    let detail = result?.error || 'Service unavailable';
    
    if (isAvailable) {
      colorClass = getServiceColor(result.score);
      value = getServiceDisplayValue(key, result);
      detail = getServiceDetail(key, result);
    }

    return `
      <div class="service-item ${!isAvailable ? 'unavailable' : ''}" style="animation: slideUp 0.3s ease forwards; animation-delay: ${index * 0.05}s; opacity: 0; border-left: 3px solid var(--trust-${colorClass === 'gray' ? 'muted' : colorClass});">
        <div class="service-header">
          <span style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-secondary);">
            ${getIconSvg(icons[key])}
            ${serviceNames[key]}
          </span>
        </div>
        <div class="service-value color-${colorClass}">${value}</div>
        <div class="service-detail">${escapeHtml(detail)}</div>
      </div>
    `;
  }).join('');

  return `
    <div class="service-grid">
      ${items}
    </div>
  `;
};

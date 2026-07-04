import { escapeHtml } from '../utils/format.js';
import { renderScoreGauge } from './scoreGauge.js';
import { renderServiceBreakdown } from './serviceBreakdown.js';
import { renderManualLinks } from './manualLinks.js';

export const renderResultCard = (result, index) => {
  if (!result) return '';
  
  const safeDomain = escapeHtml(result.domain);
  const colorStr = result.trustColor || 'gray';
  
  return `
    <div class="result-card glass-card" id="result-${index}" style="animation-delay: ${index * 0.15}s;">
      <div class="result-header">
        <div class="domain-title">
          <img src="https://www.google.com/s2/favicons?domain=${safeDomain}&sz=64" alt="" loading="lazy">
          ${safeDomain}
        </div>
        <div class="trust-badge color-${colorStr}">
          ${escapeHtml(result.trustLevel || 'Unknown')}
        </div>
      </div>
      
      <div class="score-overview">
        ${renderScoreGauge(result.trustScore, colorStr, index)}
        <div>
          <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem; color: var(--trust-${colorStr})">
            ${escapeHtml(result.trustBadge || 'Data Unavailable')}
          </h3>
          <p style="color: var(--text-secondary); max-width: 500px;">
            Based on aggregated data from ${result.servicesAvailable || 0} security sources. 
            ${result.trustScore >= 80 ? 'No significant threats were detected.' : 
              result.trustScore >= 60 ? 'Some minor flags were raised, but generally appears safe.' :
              result.trustScore >= 35 ? 'Multiple security vendors have flagged this domain. Proceed with caution.' :
              'This domain is highly suspicious or confirmed malicious by multiple sources.'}
          </p>
        </div>
      </div>
      
      ${renderServiceBreakdown(result.services)}
      
      ${renderManualLinks(result.manualCheckLinks)}
    </div>
  `;
};

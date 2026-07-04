import { escapeHtml } from '../utils/format.js';
import { renderScoreGauge, animateGauge } from './scoreGauge.js';

export const renderRanking = (rankingData) => {
  if (!rankingData || rankingData.length < 2) return '';

  const rows = rankingData.map((item, index) => {
    let rankBadge = `${item.rank}`;
    if (item.rank === 1) rankBadge = '🥇';
    if (item.rank === 2) rankBadge = '🥈';
    if (item.rank === 3) rankBadge = '🥉';

    const safeUrl = escapeHtml(item.url);
    const safeDomain = escapeHtml(item.domain);
    const scoreText = item.trustScore !== null ? `${Math.round(item.trustScore)}/100` : 'N/A';
    const barWidth = item.trustScore !== null ? `${item.trustScore}%` : '0%';
    const colorClass = item.trustColor || 'gray';

    return `
      <div class="ranking-row" style="animation: slideInRight 0.4s ease forwards; animation-delay: ${index * 0.1}s; opacity: 0;">
        <div class="rank-badge">${rankBadge}</div>
        <div class="ranking-domain">
          <img src="https://www.google.com/s2/favicons?domain=${safeDomain}&sz=32" alt="" loading="lazy">
          <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none;">${safeDomain}</a>
        </div>
        <div class="ranking-bar-wrapper">
          <div class="ranking-bar" style="background: var(--trust-${colorClass}); width: 0%;" id="rank-bar-${index}" data-target-width="${barWidth}"></div>
        </div>
        <div class="ranking-score color-${colorClass}">${scoreText}</div>
      </div>
    `;
  }).join('');

  return `
    <div class="ranking-card glass-card" style="margin-bottom: 2rem;">
      <h2>Trust Ranking</h2>
      <div class="ranking-list">
        ${rows}
      </div>
    </div>
  `;
};

export const animateRankingBars = () => {
  const bars = document.querySelectorAll('.ranking-bar');
  bars.forEach(bar => {
    // Small delay to let initial render finish
    setTimeout(() => {
      bar.style.width = bar.getAttribute('data-target-width');
    }, 100);
  });
};

import { state } from './state.js';
import { checkUrls } from './api.js';
import { renderHeader } from './components/header.js';
import { renderUrlInput, bindUrlInputEvents } from './components/urlInput.js';
import { renderEmptyState } from './components/emptyState.js';
import { renderLoader } from './components/loader.js';
import { renderRanking, animateRankingBars } from './components/ranking.js';
import { renderResultCard } from './components/resultCard.js';
import { animateGauge } from './components/scoreGauge.js';
import { showToast } from './components/toast.js';

const app = document.getElementById('app');

const renderApp = () => {
  app.innerHTML = `
    ${renderHeader()}
    ${renderUrlInput()}
    <div id="main-content"></div>
  `;
  
  bindUrlInputEvents(handleScan);
  renderContent();
};

const renderContent = () => {
  const content = document.getElementById('main-content');
  if (!content) return;

  const { loading, results, error, urls } = state.get();

  if (loading) {
    content.innerHTML = renderLoader(urls.length);
    return;
  }

  if (results) {
    let html = '';
    
    // Render ranking if multiple URLs
    if (results.ranking && results.ranking.length > 0) {
      html += renderRanking(results.ranking);
    }
    
    // Render result cards
    html += '<div class="results-section">';
    if (results.results && Array.isArray(results.results)) {
      html += results.results.map((r, i) => renderResultCard(r, i)).join('');
    }
    html += '</div>';
    
    content.innerHTML = html;

    // Trigger animations after DOM insertion
    setTimeout(() => {
      if (results.ranking && results.ranking.length > 0) {
        animateRankingBars();
      }
      if (results.results && Array.isArray(results.results)) {
        results.results.forEach((r, i) => {
          animateGauge(i, r.trustScore);
        });
      }
    }, 50);
    return;
  }

  // Initial empty state
  content.innerHTML = renderEmptyState();
};

const handleScan = async (urls) => {
  state.set({ loading: true, urls, error: null });
  
  const btn = document.getElementById('btn-scan');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '⏳ Scanning...';
  }
  
  renderContent();

  try {
    const data = await checkUrls(urls);
    state.set({ loading: false, results: data });
    showToast('Scan complete!', 'success');
  } catch (error) {
    state.set({ loading: false, error: error.message });
    showToast(`Error: ${error.message}`, 'error');
    renderContent();
  } finally {
    // Reset button state
    const textarea = document.getElementById('url-input');
    if (textarea) textarea.dispatchEvent(new Event('input'));
  }
};

// Initialize App
renderApp();

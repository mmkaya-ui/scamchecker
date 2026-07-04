import { state } from './state.js';
import { checkUrls, searchQuery } from './api.js';
import { renderHeader } from './components/header.js';
import { renderTabs } from './components/tabs.js';
import { renderUrlInput, bindUrlInputEvents } from './components/urlInput.js';
import { renderSearchInput, bindSearchInputEvents } from './components/searchInput.js';
import { renderEmptyState } from './components/emptyState.js';
import { renderLoader } from './components/loader.js';
import { renderRanking, animateRankingBars } from './components/ranking.js';
import { renderResultCard } from './components/resultCard.js';
import { animateGauge } from './components/scoreGauge.js';
import { showToast } from './components/toast.js';

const app = document.getElementById('app');

let activeTab = 'scan'; // 'scan' or 'search'

const renderApp = () => {
  app.innerHTML = `
    ${renderHeader()}
    ${renderTabs(activeTab)}
    <div id="input-container">
      ${activeTab === 'scan' ? renderUrlInput() : renderSearchInput()}
    </div>
    <div id="main-content"></div>
  `;
  
  bindEvents();
  renderContent();
};

const bindEvents = () => {
  if (activeTab === 'scan') {
    bindUrlInputEvents(handleScan);
  } else {
    bindSearchInputEvents(handleSearch);
  }

  // Bind tab clicks
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetTab = e.currentTarget.dataset.tab;
      if (activeTab !== targetTab) {
        activeTab = targetTab;
        // Reset state on tab switch
        state.set({ loading: false, results: null, error: null, urls: [] });
        renderApp(); // Re-render everything
      }
    });
  });
};

const renderContent = () => {
  const content = document.getElementById('main-content');
  if (!content) return;

  const { loading, results, error, urls } = state.get();

  if (loading) {
    // If search, we don't have URLs count initially, just show 5
    const count = activeTab === 'scan' ? urls.length : 5;
    content.innerHTML = renderLoader(count, activeTab);
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
    const textarea = document.getElementById('url-input');
    if (textarea) textarea.dispatchEvent(new Event('input'));
  }
};

const handleSearch = async (query) => {
  state.set({ loading: true, urls: [], error: null });
  
  const btn = document.getElementById('btn-search');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '⏳ Searching & Verifying...';
  }
  
  renderContent();

  try {
    const data = await searchQuery(query);
    state.set({ loading: false, results: data });
    showToast('Search complete!', 'success');
  } catch (error) {
    state.set({ loading: false, error: error.message });
    showToast(`Error: ${error.message}`, 'error');
    renderContent();
  } finally {
    const input = document.getElementById('search-input');
    if (input) input.dispatchEvent(new Event('input'));
  }
};

// Initialize App
renderApp();

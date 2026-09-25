/**
 * ==============================================================================
 * Luke Walsh - Portfolio Application Script
 * Single Page Application Router, GitHub API Integration & UI Interactions
 * ==============================================================================
 */

// Configuration Constants
const CONFIG = {
  GITHUB_USERNAME: 'WalshCodes',
  GITHUB_API_URL: 'https://api.github.com/users/WalshCodes/repos?sort=updated&per_page=30',
  CACHE_STORAGE_KEY: 'walshcodes_github_repos_v1',
  CACHE_TTL_MS: 15 * 60 * 1000, // 15 minutes cache
  DEFAULT_ROUTE: 'home',
  LANGUAGE_COLORS: {
    'Java': '#b07219',
    'Python': '#3572a5',
    'JavaScript': '#f1e05a',
    'C#': '#178600',
    'HTML': '#e34c26',
    'CSS': '#563d7c',
    'C++': '#f34b7d',
    'TypeScript': '#3178c6',
    'Shell': '#89e051',
    'Default': '#818cf8'
  }
};

/**
 * Curated Fallback Repositories:
 * Used if GitHub API encounters rate-limits, network timeouts, or offline environments.
 * Highlights Luke Walsh's core academic and personal engineering achievements.
 */
const FALLBACK_REPOSITORIES = [
  {
    name: 'csharp-python-file-search',
    html_url: 'https://github.com/WalshCodes/csharp-python-file-search',
    description: 'Windows Forms desktop application coupled with multithreaded Python search scripts for high-speed string and regex pattern searches across complex directory trees.',
    language: 'C#',
    stargazers_count: 5,
    forks_count: 2,
    updated_at: '2026-08-20T14:30:00Z',
    topics: ['csharp', 'python', 'winforms', 'file-search', 'multithreading']
  },
  {
    name: 'json-menu-webapp',
    html_url: 'https://github.com/WalshCodes/json-menu-webapp',
    description: 'Dynamic frontend web application built with vanilla JavaScript, HTML5, and CSS3 that parses and instantiates menu items and pricing directly from structured JSON files.',
    language: 'JavaScript',
    stargazers_count: 4,
    forks_count: 1,
    updated_at: '2026-09-02T19:15:00Z',
    topics: ['javascript', 'json', 'web-app', 'frontend', 'responsive-design']
  },
  {
    name: 'comp2920-pizza-ordering-system',
    html_url: 'https://github.com/WalshCodes/comp2920-pizza-ordering-system',
    description: 'Software architecture design and implementation for COMP 2920 at Thompson Rivers University. Features a decoupled, multi-interface architecture for order management.',
    language: 'Java',
    stargazers_count: 6,
    forks_count: 3,
    updated_at: '2026-09-18T10:45:00Z',
    topics: ['java', 'tru-cs', 'software-architecture', 'comp2920', 'state-machine']
  },
  {
    name: 'tru-data-structures-algorithms',
    html_url: 'https://github.com/WalshCodes/tru-data-structures-algorithms',
    description: 'Implementations and benchmarks of essential data structures and algorithms in Java and Python (binary search trees, graphs, sorting, dynamic programming).',
    language: 'Java',
    stargazers_count: 3,
    forks_count: 1,
    updated_at: '2026-07-15T09:20:00Z',
    topics: ['algorithms', 'data-structures', 'java', 'python', 'academic-cs']
  },
  {
    name: 'walshcodes-portfolio',
    html_url: 'https://github.com/WalshCodes/walshcodes-portfolio',
    description: 'Personal developer portfolio website featuring SPA page transitions, responsive styling, and dynamic GitHub REST API integration.',
    language: 'JavaScript',
    stargazers_count: 2,
    forks_count: 0,
    updated_at: '2026-09-24T18:00:00Z',
    topics: ['portfolio', 'vanilla-js', 'spa', 'github-api', 'css3']
  },
  {
    name: 'python-automation-scripts',
    html_url: 'https://github.com/WalshCodes/python-automation-scripts',
    description: 'Collection of practical command-line utilities and automation scripts for file batching, data cleanup, and format conversions.',
    language: 'Python',
    stargazers_count: 2,
    forks_count: 0,
    updated_at: '2026-06-11T12:00:00Z',
    topics: ['python', 'cli', 'automation', 'productivity']
  }
];

// Application State Store
const state = {
  currentRoute: 'home',
  allRepos: [],
  filteredRepos: [],
  selectedLanguage: 'all',
  searchQuery: '',
  isLoadingRepos: false,
  isApiError: false
};

/* ==========================================================================
   1. SINGLE PAGE APPLICATION (SPA) ROUTER & TRANSITIONS
   ========================================================================== */

class SPARouter {
  constructor() {
    this.routes = ['home', 'about', 'projects'];
    this.pageViews = document.querySelectorAll('.page-view');
    this.navLinks = document.querySelectorAll('.nav-link');
    this.pageTriggers = document.querySelectorAll('.page-nav-trigger');
    
    this.init();
  }

  init() {
    // Listen to hash changes in URL
    window.addEventListener('hashchange', () => this.handleHashChange());

    // Listen to in-page transition triggers
    this.pageTriggers.forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        const target = trigger.getAttribute('data-target');
        if (target && this.routes.includes(target)) {
          e.preventDefault();
          this.navigateTo(target);
        }
      });
    });

    // Handle initial route on page load
    this.handleHashChange();
  }

  handleHashChange() {
    const rawHash = window.location.hash.replace('#', '').trim().toLowerCase();
    const targetRoute = this.routes.includes(rawHash) ? rawHash : CONFIG.DEFAULT_ROUTE;
    this.navigateTo(targetRoute, false);
  }

  navigateTo(route, updateHash = true) {
    if (!this.routes.includes(route)) {
      route = CONFIG.DEFAULT_ROUTE;
    }

    state.currentRoute = route;

    if (updateHash && window.location.hash !== `#${route}`) {
      window.location.hash = `#${route}`;
      return; // hashchange listener will trigger navigateTo with updateHash=false
    }

    // Seamless Page View Transition
    this.pageViews.forEach(view => {
      if (view.id === route) {
        view.classList.add('active');
      } else {
        view.classList.remove('active');
      }
    });

    // Update active nav link highlighting
    this.navLinks.forEach(link => {
      if (link.getAttribute('data-target') === route) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Update Document Title
    const titles = {
      home: 'Luke Walsh | Software Developer & CS Student',
      about: 'About Luke Walsh | Thompson Rivers University CS',
      projects: 'Projects & Repositories | Luke Walsh (@WalshCodes)'
    };
    document.title = titles[route] || 'Luke Walsh | Portfolio';

    // Smooth scroll to top of main content
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    // Close mobile nav drawer if open
    NavigationManager.closeMobileMenu();

    // Trigger repo fetch if navigating to projects for the first time
    if (route === 'projects' && state.allRepos.length === 0 && !state.isLoadingRepos) {
      GitHubRepositoryManager.fetchRepositories();
    }
  }
}

/* ==========================================================================
   2. NAVIGATION & UI CONTROLS MANAGER
   ========================================================================== */

class NavigationManager {
  static init() {
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');

    // Sticky nav scroll styling
    window.addEventListener('scroll', () => {
      if (window.scrollY > 25) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });

    // Mobile Hamburger Toggle
    if (navToggle && navMenu) {
      navToggle.addEventListener('click', () => {
        const isOpen = navMenu.classList.toggle('open');
        navToggle.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', isOpen.toString());
      });

      // Close mobile menu when clicking outside
      document.addEventListener('click', (e) => {
        if (navMenu.classList.contains('open') && 
            !navMenu.contains(e.target) && 
            !navToggle.contains(e.target)) {
          this.closeMobileMenu();
        }
      });
    }
  }

  static closeMobileMenu() {
    const navMenu = document.getElementById('nav-menu');
    const navToggle = document.getElementById('nav-toggle');
    if (navMenu && navMenu.classList.contains('open')) {
      navMenu.classList.remove('open');
    }
    if (navToggle && navToggle.classList.contains('open')) {
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  }
}

/* ==========================================================================
   3. GITHUB REPOSITORIES DYNAMIC MANAGER
   ========================================================================== */

class GitHubRepositoryManager {
  static init() {
    this.gridContainer = document.getElementById('github-repos-grid');
    this.searchInput = document.getElementById('repo-search-input');
    this.filterChips = document.getElementById('repo-filter-chips');
    this.statusPill = document.getElementById('github-api-status');
    this.errorBanner = document.getElementById('repo-error-banner');
    this.errorDesc = document.getElementById('repo-error-desc');
    this.retryBtn = document.getElementById('repo-retry-btn');

    // Attach search and filter event listeners
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase().trim();
        this.filterAndRender();
      });
    }

    if (this.filterChips) {
      this.filterChips.addEventListener('click', (e) => {
        if (e.target.classList.contains('chip-filter')) {
          this.filterChips.querySelectorAll('.chip-filter').forEach(btn => btn.classList.remove('active'));
          e.target.classList.add('active');
          state.selectedLanguage = e.target.getAttribute('data-filter') || 'all';
          this.filterAndRender();
        }
      });
    }

    if (this.retryBtn) {
      this.retryBtn.addEventListener('click', () => {
        sessionStorage.removeItem(CONFIG.CACHE_STORAGE_KEY);
        this.fetchRepositories(true);
      });
    }

    // Pre-fetch repositories immediately in background
    this.fetchRepositories();
  }

  /**
   * Fetch repositories from GitHub API with caching and graceful fallbacks
   */
  static async fetchRepositories(forceRefresh = false) {
    if (state.isLoadingRepos) return;
    state.isLoadingRepos = true;
    this.updateStatus('Connecting to GitHub API (@WalshCodes)...', 'connecting');

    // Check cached session data
    if (!forceRefresh) {
      const cachedData = this.loadFromCache();
      if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
        state.allRepos = cachedData;
        state.isLoadingRepos = false;
        this.updateStatus(`Synced with GitHub &bull; ${cachedData.length} repositories loaded`, 'synced');
        this.hideErrorBanner();
        this.filterAndRender();
        return;
      }
    }

    this.renderLoadingSkeletons();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7500); // 7.5s timeout

      const response = await fetch(CONFIG.GITHUB_API_URL, {
        headers: {
          'Accept': 'application/vnd.github.v3+json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`GitHub API returned status ${response.status}`);
      }

      const repos = await response.json();

      if (!Array.isArray(repos) || repos.length === 0) {
        // If GitHub user has no public repos or empty response, merge with fallback
        state.allRepos = FALLBACK_REPOSITORIES;
      } else {
        // Filter out forks if desired, or prioritize sources
        state.allRepos = repos.map(repo => ({
          name: repo.name,
          html_url: repo.html_url,
          description: repo.description || 'Public repository by @WalshCodes.',
          language: repo.language || 'Code',
          stargazers_count: repo.stargazers_count || 0,
          forks_count: repo.forks_count || 0,
          updated_at: repo.updated_at,
          topics: repo.topics || []
        }));
      }

      this.saveToCache(state.allRepos);
      this.hideErrorBanner();
      this.updateStatus(`Live Sync with GitHub &bull; ${state.allRepos.length} repositories loaded`, 'synced');
    } catch (error) {
      console.warn('GitHub API fetch failed or rate limited. Using curated offline showcase.', error);
      state.isApiError = true;
      state.allRepos = FALLBACK_REPOSITORIES;
      this.showErrorBanner(`GitHub API rate limit or network pause. Displaying curated project repositories.`);
      this.updateStatus(`Curated Repositories Showcase &bull; @WalshCodes`, 'fallback');
    } finally {
      state.isLoadingRepos = false;
      this.filterAndRender();
    }
  }

  static filterAndRender() {
    const { allRepos, searchQuery, selectedLanguage } = state;

    state.filteredRepos = allRepos.filter(repo => {
      // Language matching
      const matchesLanguage = (selectedLanguage === 'all') || 
        (selectedLanguage.toLowerCase() === 'html' && (repo.language === 'HTML' || repo.language === 'CSS')) ||
        (repo.language && repo.language.toLowerCase() === selectedLanguage.toLowerCase());

      // Search query matching
      const matchesSearch = !searchQuery || 
        repo.name.toLowerCase().includes(searchQuery) ||
        (repo.description && repo.description.toLowerCase().includes(searchQuery)) ||
        (repo.language && repo.language.toLowerCase() === selectedLanguage.toLowerCase()) ||
        (repo.topics && repo.topics.some(t => t.toLowerCase().includes(searchQuery)));

      return matchesLanguage && matchesSearch;
    });

    this.renderRepoCards(state.filteredRepos);
  }

  static renderRepoCards(repos) {
    if (!this.gridContainer) return;

    if (repos.length === 0) {
      this.gridContainer.innerHTML = `
        <div class="empty-repos-state" style="grid-column: 1 / -1; text-align: center; padding: 3rem 1.5rem; background: var(--bg-card); border: 1px dashed var(--border-medium); border-radius: 12px;">
          <p style="font-size: 1.1rem; color: var(--text-primary); margin-bottom: 0.5rem; font-weight: 600;">No matching repositories found</p>
          <p style="font-size: 0.9rem; color: var(--text-muted);">Try clearing your search or switching language filters.</p>
        </div>
      `;
      return;
    }

    const htmlCards = repos.map(repo => {
      const langColor = CONFIG.LANGUAGE_COLORS[repo.language] || CONFIG.LANGUAGE_COLORS.Default;
      const formattedDate = repo.updated_at 
        ? new Date(repo.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'Recent';

      const topicsHtml = (repo.topics && repo.topics.length > 0)
        ? `<div class="repo-topics" style="display:flex; flex-wrap:wrap; gap:0.35rem; margin-bottom:0.75rem;">
            ${repo.topics.slice(0, 3).map(t => `<span style="font-family:var(--font-mono); font-size:0.7rem; padding:0.15rem 0.45rem; background:rgba(255,255,255,0.04); border-radius:4px; color:var(--text-muted);">#${t}</span>`).join('')}
           </div>`
        : '';

      return `
        <article class="repo-card" data-lang="${repo.language}">
          <div class="repo-card-top">
            <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer" class="repo-name-link" title="Open ${repo.name} on GitHub">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
              <span>${this.escapeHtml(repo.name)}</span>
            </a>
            <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer" class="icon-btn" style="width:28px; height:28px;" title="View repository">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>
          </div>

          <p class="repo-desc">${this.escapeHtml(repo.description)}</p>
          
          ${topicsHtml}

          <div class="repo-meta">
            <div class="repo-lang">
              <span class="chip-dot" style="background-color: ${langColor};"></span>
              <span>${repo.language || 'Code'}</span>
            </div>
            <div class="repo-stats-group">
              <span class="repo-stat-item" title="${repo.stargazers_count} Stars">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span>${repo.stargazers_count}</span>
              </span>
              <span class="repo-stat-item" title="${repo.forks_count} Forks">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="18" r="3"></circle>
                  <circle cx="6" cy="6" r="3"></circle>
                  <circle cx="18" cy="6" r="3"></circle>
                  <path d="M18 9v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9"></path>
                  <path d="M12 12v3"></path>
                </svg>
                <span>${repo.forks_count}</span>
              </span>
              <span class="repo-stat-item" title="Updated on ${formattedDate}" style="font-size:0.75rem;">
                ${formattedDate}
              </span>
            </div>
          </div>
        </article>
      `;
    }).join('');

    this.gridContainer.innerHTML = htmlCards;
  }

  static renderLoadingSkeletons() {
    if (!this.gridContainer) return;
    this.gridContainer.innerHTML = `
      <div class="skeleton-card"></div>
      <div class="skeleton-card"></div>
      <div class="skeleton-card"></div>
      <div class="skeleton-card"></div>
      <div class="skeleton-card"></div>
      <div class="skeleton-card"></div>
    `;
  }

  static updateStatus(message, statusType) {
    if (!this.statusPill) return;
    const pulse = '<span class="status-pulse"></span>';
    this.statusPill.innerHTML = `${pulse}<span>${message}</span>`;
  }

  static showErrorBanner(message) {
    if (this.errorBanner && this.errorDesc) {
      this.errorDesc.textContent = message;
      this.errorBanner.classList.remove('hidden');
    }
  }

  static hideErrorBanner() {
    if (this.errorBanner) {
      this.errorBanner.classList.add('hidden');
    }
  }

  static loadFromCache() {
    try {
      const cached = sessionStorage.getItem(CONFIG.CACHE_STORAGE_KEY);
      if (!cached) return null;
      const { timestamp, data } = JSON.parse(cached);
      if (Date.now() - timestamp < CONFIG.CACHE_TTL_MS) {
        return data;
      }
    } catch (e) {
      console.warn('Cache read error:', e);
    }
    return null;
  }

  static saveToCache(data) {
    try {
      sessionStorage.setItem(CONFIG.CACHE_STORAGE_KEY, JSON.stringify({
        timestamp: Date.now(),
        data
      }));
    } catch (e) {
      console.warn('Cache write error:', e);
    }
  }

  static escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

/* ==========================================================================
   4. APPLICATION BOOTSTRAPPER
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Header & Mobile Navigation
  NavigationManager.init();

  // Initialize Dynamic GitHub Repositories Manager
  GitHubRepositoryManager.init();

  // Initialize SPA Router
  window.appRouter = new SPARouter();
});


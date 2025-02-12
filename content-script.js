console.log('Content script injected');

(async function() {
  let currentPath = window.location.pathname;
  let currentObserver = null;

  // Helper to detect if we're on a user profile
  function getTwitterUsername() {
    const pathParts = window.location.pathname.split("/").filter(Boolean);
    
    if (pathParts.length >= 1) {
      const possibleUsername = pathParts[0];
      const knownNonUserPaths = ["home", "explore", "i", "notifications", "messages", "search", "compose", "login", "signup"];
      if (!knownNonUserPaths.includes(possibleUsername.toLowerCase())) {
        return possibleUsername;
      }
    }
    return null;
  }

  async function fetchPassportData(username, apiKey) {
    const response = await fetch(`https://api.talentprotocol.com/api/v2/search/advanced/passport_app__passports?query[identity]=twitter:${username}&query[exactMatch]=true`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Talent Protocol data');
    }

    const result = await response.json();
    if (!result.passports?.length) {
      throw new Error('No Talent Protocol passport found for this user');
    }

    return result.passports[0];
  }

  // Add this function at the top level of the IIFE
  function cleanupExistingElements() {
    const existingElements = document.querySelectorAll('.talent-protocol-section');
    existingElements.forEach(el => el.remove());
  }

  function setupObserver() {
    // Cleanup any existing observer
    if (currentObserver) {
      currentObserver.disconnect();
    }

    // Clean up any existing elements
    cleanupExistingElements();

    // Create new observer
    currentObserver = new MutationObserver(async (mutations, obs) => {
      const profileStatsSection = document.querySelector('[data-testid="UserProfileHeader_Items"]');
      if (!profileStatsSection) {
        cleanupExistingElements();
        return;
      }

      // Check if we already added our section to this profile
      const existingSection = profileStatsSection.parentNode.querySelector('.talent-protocol-section');
      if (existingSection) return;

      try {
        const username = getTwitterUsername();
        if (!username) return;

        // Create initial button section
        const section = document.createElement('div');
        section.className = 'talent-protocol-section talent-protocol-button-section';

        const button = document.createElement('button');
        button.innerHTML = 'Get Builder Score';
        button.className = 'talent-protocol-button';

        section.appendChild(button);

        // Insert the button after profile stats
        profileStatsSection.parentNode.insertBefore(section, profileStatsSection.nextSibling);

        // Add click handler
        button.addEventListener('click', async () => {
          try {
            button.disabled = true;
            button.innerHTML = 'Loading...';

            // Get API key from storage
            const storageData = await new Promise((resolve) => {
              chrome.storage.local.get(['talentProtocolApiKey'], resolve);
            });
            
            const apiKey = storageData.talentProtocolApiKey;
            if (!apiKey) {
              throw new Error('Please set your Talent Protocol API key first');
            }

            const passport = await fetchPassportData(username, apiKey);
            
            // Replace button with score display
            section.innerHTML = `
              <div class="talent-protocol-collapsed">
                <div style="display: flex; align-items: center; justify-content: space-between; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-weight: 700;">Talent Protocol Score:</span>
                    <span style="color: #1da1f2; font-weight: 700;">${passport.score}</span>
                  </div>
                  <a 
                    href="https://app.talentprotocol.com/profile/${passport.passport_id}" 
                    target="_blank"
                    style="
                      background: #7857ED;
                      color: white;
                      text-decoration: none;
                      padding: 4px 12px;
                      border-radius: 16px;
                      font-size: 12px;
                      font-weight: 600;
                      transition: background 0.2s;
                    "
                    onmouseover="this.style.background='#6445d6'"
                    onmouseout="this.style.background='#7857ED'"
                  >
                    Open Passport
                  </a>
                </div>
              </div>
              <div class="talent-protocol-expanded" style="display: none; margin-top: 8px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 14px; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                  <div>
                    <div style="color: #536471;">Activity Score</div>
                    <div style="font-weight: 600;">${passport.activity_score}</div>
                  </div>
                  <div>
                    <div style="color: #536471;">Identity Score</div>
                    <div style="font-weight: 600;">${passport.identity_score}</div>
                  </div>
                  <div>
                    <div style="color: #536471;">Skills Score</div>
                    <div style="font-weight: 600;">${passport.skills_score}</div>
                  </div>
                  <div>
                    <div style="color: #536471;">Verified</div>
                    <div style="font-weight: 600;">${passport.verified ? '✓ Yes' : '✗ No'}</div>
                  </div>
                </div>
              </div>
            `;

            // Add click handler for expanding/collapsing
            section.addEventListener('click', () => {
              const expandedView = section.querySelector('.talent-protocol-expanded');
              const isExpanded = expandedView.style.display !== 'none';
              expandedView.style.display = isExpanded ? 'none' : 'block';
            });

          } catch (error) {
            button.disabled = false;
            button.innerHTML = 'Get Builder Score';
            alert(error.message);
          }
        });

      } catch (error) {
        console.error('Content script error:', error);
      }
    });

    // Start observing
    currentObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Watch for URL changes
  setInterval(() => {
    if (currentPath !== window.location.pathname) {
      currentPath = window.location.pathname;
      setupObserver();
    }
  }, 1000);

  // Initial setup
  setupObserver();
})(); 
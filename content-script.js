console.log('Content script injected');

(async function() {
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

  // Watch for the profile stats section to appear
  const observer = new MutationObserver(async (mutations, obs) => {
    const profileStatsSection = document.querySelector('[data-testid="UserProfileHeader_Items"]');
    if (!profileStatsSection) return;

    // We found the section, stop observing
    obs.disconnect();

    try {
      const username = getTwitterUsername();
      if (!username) return;

      // Create initial button section
      const section = document.createElement('div');
      section.className = 'talent-protocol-section';
      section.style.marginTop = '12px';
      section.style.padding = '12px 16px';
      section.style.borderRadius = '16px';
      section.style.backgroundColor = 'rgba(29, 161, 242, 0.1)';
      section.style.cursor = 'pointer';

      const button = document.createElement('button');
      button.innerHTML = 'Get Builder Score';
      button.style.background = '#7857ED';
      button.style.color = 'white';
      button.style.border = 'none';
      button.style.padding = '8px 16px';
      button.style.borderRadius = '20px';
      button.style.cursor = 'pointer';
      button.style.fontWeight = '600';
      button.style.fontSize = '14px';
      button.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
      button.style.width = '100%';
      button.style.transition = 'background 0.2s';
      
      // Add hover effect
      button.addEventListener('mouseover', () => {
        button.style.background = '#6445d6';
      });
      button.addEventListener('mouseout', () => {
        button.style.background = '#7857ED';
      });

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
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})(); 
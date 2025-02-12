document.addEventListener('DOMContentLoaded', async () => {
  console.log('Popup loaded');
  const apiKeyInput = document.getElementById('api-key');
  const saveButton = document.getElementById('save-api-key');
  const savedMessage = document.getElementById('saved-message');

  // Get the current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  console.log('Current tab:', tab);
  
  // Check if we're on Twitter/X
  if (!tab.url.match(/https?:\/\/(.*\.)?(twitter|x)\.com/)) {
    console.log('Not on Twitter/X');
    savedMessage.textContent = 'Please navigate to a Twitter/X profile';
    savedMessage.style.display = 'block';
    savedMessage.style.color = '#e74c3c';
    return;
  }

  // Load saved API key
  chrome.storage.local.get(['talentProtocolApiKey'], async (result) => {
    console.log('Stored API key:', result.talentProtocolApiKey ? 'exists' : 'not found');
    if (result.talentProtocolApiKey) {
      apiKeyInput.value = result.talentProtocolApiKey;
      console.log('Injecting scripts with stored API key');
      await injectScripts(tab, result.talentProtocolApiKey);
      window.close();
    }
  });

  // Save API key when button is clicked
  saveButton.addEventListener('click', async () => {
    console.log('Save button clicked');
    const key = apiKeyInput.value.trim();
    if (!key) return;

    console.log('Saving new API key');
    await chrome.storage.local.set({ talentProtocolApiKey: key });
    
    // Show saved message
    savedMessage.style.display = 'block';
    
    console.log('Injecting scripts with new API key');
    await injectScripts(tab, key);
    setTimeout(() => window.close(), 1000);
  });

  document.getElementById('view-storage')?.addEventListener('click', async () => {
    const data = await chrome.storage.local.get(null);
    console.log('Current storage:', data);
  });

  document.getElementById('clear-storage')?.addEventListener('click', async () => {
    await chrome.storage.local.clear();
    console.log('Storage cleared');
    location.reload();
  });

  document.getElementById('test-api')?.addEventListener('click', async () => {
    const username = document.getElementById('test-username').value;
    const { talentProtocolApiKey } = await chrome.storage.local.get(['talentProtocolApiKey']);
    
    console.log('Testing API with username:', username);
    
    // Test GET request
    try {
      console.log('Trying GET request...');
      const response = await fetch(`https://api.talentprotocol.com/api/v2/search/advanced/passport_app__passports?query[identity]=twitter:${username}&query[exactMatch]=true`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': talentProtocolApiKey
        }
      });
      
      console.log('GET Response status:', response.status);
      const data = await response.text();
      console.log('GET Response:', data);
      
      if (response.ok) {
        const jsonData = JSON.parse(data);
        console.log('GET Success:', jsonData);
      }
    } catch (error) {
      console.error('GET request failed:', error);
    }

    // Test POST request
    try {
      console.log('Trying POST request...');
      const response = await fetch('https://api.talentprotocol.com/api/v2/search/advanced/passport_app__passports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': talentProtocolApiKey
        },
        body: JSON.stringify({
          query: {
            identity: `twitter:${username}`,
            exactMatch: true
          }
        })
      });
      
      console.log('POST Response status:', response.status);
      const data = await response.text();
      console.log('POST Response:', data);
      
      if (response.ok) {
        const jsonData = JSON.parse(data);
        console.log('POST Success:', jsonData);
      }
    } catch (error) {
      console.error('POST request failed:', error);
    }
  });
});

async function injectScripts(tab, apiKey) {
  try {
    // Inject CSS if not already injected
    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ['styles.css']
    }).catch(() => {}); // Ignore if already injected

    // Execute content script
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content-script.js']
    });
  } catch (error) {
    console.error('Error injecting scripts:', error);
  }
} 
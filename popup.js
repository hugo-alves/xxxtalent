const chromeStorage = {
  get: (key) => {
    return new Promise((resolve) => {
      chrome.storage.sync.get(key, (result) => {
        resolve(result[key]);
      });
    });
  },
  set: (key, value) => {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ [key]: value }, resolve);
    });
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  const apiKeyInput = document.getElementById('api-key');
  const saveButton = document.getElementById('save-api-key');
  const savedMessage = document.getElementById('saved-message');

  // Get the current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  // Check if we're on Twitter/X
  if (!tab.url.match(/https?:\/\/(.*\.)?(twitter|x)\.com/)) {
    savedMessage.textContent = 'Please navigate to a Twitter/X profile';
    savedMessage.style.display = 'block';
    savedMessage.style.color = '#e74c3c';
    return;
  }

  // Load saved API key
  try {
    const savedApiKey = await chromeStorage.get('apiKey');
    if (savedApiKey) {
      apiKeyInput.value = savedApiKey;
    }
  } catch (error) {
    console.error('Error loading API key:', error);
  }

  // Save API key when button is clicked
  saveButton.addEventListener('click', async () => {
    try {
      await chromeStorage.set('apiKey', apiKeyInput.value);
      savedMessage.textContent = 'API key saved!';
      savedMessage.style.display = 'block';
      savedMessage.style.color = '#2ecc71';
      
      await injectScripts(tab, apiKeyInput.value);
      setTimeout(() => window.close(), 1000);
    } catch (error) {
      console.error('Error saving API key:', error);
    }
  });
});

async function injectScripts(tab, apiKey) {
  try {
    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ['styles.css']
    }).catch(() => {});

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content-script.js']
    });
  } catch (error) {
    console.error('Error injecting scripts:', error);
  }
} 
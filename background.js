// Listen for clicks on the extension icon
chrome.action.onClicked.addListener(async (tab) => {
  // Check if we're on Twitter/X
  if (!tab.url.match(/https?:\/\/(.*\.)?(twitter|x)\.com/)) {
    alert('Please navigate to a Twitter/X profile first');
    return;
  }

  // Inject our CSS
  await chrome.scripting.insertCSS({
    target: { tabId: tab.id },
    files: ['styles.css']
  });

  // Inject and execute our content script
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content-script.js']
  });
}); 
// Get UI update button and extension information
const updateButton = document.getElementById('code-syntax-highlight_updateButton');
const dataProxy = document.getElementById('code-syntax-highlight');
const extensionInfo = JSON.parse(dataProxy.getAttribute('info'));

// Fetch remote manifest to compare versions
const checkForUpdates = () => new Promise((resolve, reject) => {
  fetch(`${extensionInfo.manifestUrl}?nonce=${Date.now()}`, { cache: 'no-store' })
    .then((response) => response.json())
    .then((responseData) => {
      // Get version data for both remote and local manifest
      const localVersion = extensionInfo.version;
      const remoteVersion = responseData.version;

      // The localeCompare function can return one of the following values:
      //  0 = both local and remote versions are equal
      //  1 = there is a newer remote version
      // -1 = somehow our version is greater than the remote version
      // This function is not optimal for every scenario, but in the case of
      // the simple version scheme used by Code Syntax Highlight it works
      const versionCompare = remoteVersion.localeCompare(localVersion, undefined, { numeric: true, sensitivity: 'base' });

      if (versionCompare === 0) {
        // Same version
        resolve(false);
      } else if (versionCompare === 1) {
        // Newer version
        resolve(true);
      } else {
        reject(new Error('INVALID_NEW_VERSION'));
      }
    })
    .catch(() => {
      reject(new Error('FETCH_FAILED'));
    });
});

// Define text for each update button status
const defaultText = 'Check for updates';
const checkingText = 'Checking for updates, please wait';
const newVersionText = 'Update available, click to open GitHub page';
const upToDateText = 'Current version is already up-to-date';
const errorText = 'Unable to check for updates, click to open GitHub page';

// Add event to handle clicks on the HTML Gradio button
updateButton.addEventListener('click', async (event) => {
  const button = event.target;

  // Choose action based on button text
  if (button.textContent === newVersionText || button.textContent === errorText) {
    window.open(`${extensionInfo.gitUrl}/releases/latest`, '_blank');
    // Only set button to its default text if it was previously in error state
    if (button.textContent === errorText) button.textContent = defaultText;
    return;
  }

  // Disable button and update its text while checking for updates
  button.disabled = true;
  button.textContent = checkingText;
  // Start checking for updates
  await checkForUpdates()
    .then(((newVersionFound) => {
      if (newVersionFound === true) {
        button.textContent = newVersionText;
        button.disabled = false;
      } else {
        button.textContent = upToDateText;
        setTimeout(() => {
          button.textContent = defaultText;
          button.disabled = false;
        }, 5000);
      }
    })).catch(() => {
      button.textContent = errorText;
      button.disabled = false;
    });
});

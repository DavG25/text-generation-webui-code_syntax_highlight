// Get UI update button and extension information
const updateButton = document.getElementById('code-syntax-highlight_updateButton');
const dataProxy = document.getElementById('code-syntax-highlight');
const extensionInfo = JSON.parse(dataProxy.getAttribute('info'));

// Fetch remote manifest to compare versions
const checkForUpdates = () => new Promise((resolve) => {
  fetch(extensionInfo.manifestUrl, { cache: 'no-store' })
    .then((response) => response.json())
    .then((responseData) => {
      // Get version data for both remote and local manifest
      const localVersion = extensionInfo.version;
      const remoteVersion = responseData.version;

      // The localeCompare function can return one of the following values:
      //  0 = both local and remote versions are equal
      //  1 = there is a newer remote version
      // -1 = somehow our version is greater than the remote version
      // This function is not optimal for every scenario, but in the case of the simple version scheme used by Code Syntax Highlight it works
      const versionCompare = remoteVersion.localeCompare(localVersion, undefined, { numeric: true, sensitivity: 'base' });

      const sameVersionMessage = `The current version of Code Syntax Highlight (${localVersion}) is already up-to-date`;
      const newVersionMessage = 'A new version of Code Syntax Highlight is available'
        + `\n\nCurrent version: ${localVersion}\nLatest version: ${remoteVersion}`
        + '\n\nDo you want to open the GitHub page to download the latest version?';

      if (versionCompare === 0) {
        // Local and remote versions are the same
        alert(sameVersionMessage);
      } else {
        // Remote version is newer
        if (confirm(newVersionMessage) === true) {
          window.open(`${extensionInfo.gitUrl}/releases/latest`, '_blank');
        }
      }
      resolve(true);
    })
    .catch(() => {
      // Show a default message when there is an error with fetch
      const noConnectionMessage = 'Do you want to open the GitHub page of Code Syntax Highlight to check for the latest version?';
      if (confirm(noConnectionMessage) === true) {
        window.open(`${extensionInfo.gitUrl}/releases/latest`, '_blank');
      }
      resolve(false);
    });
});

// Add click event to the HTML Gradio button to check for updates
updateButton.addEventListener('click', async (event) => {
  // Disable button and update its text
  const button = event.target;
  button.disabled = true;
  const oldTextContent = button.textContent;
  button.textContent = 'Checking for updates, please wait';
  // Start checking for updates
  await checkForUpdates();
  // Enable button and set old text once update check finished
  button.textContent = oldTextContent;
  button.disabled = false;
});

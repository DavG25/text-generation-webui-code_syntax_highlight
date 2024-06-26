/*
 * Code Syntax Highlight params (received from Gradio):
 *
 * activate: if set to true, the extension will highlight code blocks, this setting
 * must be set to true for any of the other features to work
 *
 * inline_highlight: if set to true, code blocks without the <pre> tag (inline
 * code blocks) will also be highlighted
 *
 * copy_button: if set to true, a button to copy the code inside each code
 * block will be shown
 *
 * performance_mode: if set to true, the extension will wait until text generation
 * ends before highlighting the code on the page to use less resources
 */
const dataProxy = document.getElementById('code-syntax-highlight');
let params = JSON.parse(dataProxy.getAttribute('params'));

// Update the global 'isGeneratingText' value and trigger related actions
let isGeneratingText = false;
function setTextGenerationStatus(newGeneratingStatus) {
  isGeneratingText = newGeneratingStatus;
  // Signal the generation status in CSS, this is used by UI components
  if (newGeneratingStatus) {
    document.body.classList.add('code-syntax-highlight--is-generating-text');
  } else {
    document.body.classList.remove('code-syntax-highlight--is-generating-text');
  }
}

/*
 * Detect the current status of text generation by intercepting SSE (EventSource) or
 * WebSocket messages: newer Gradio versions use server-sent events, while
 * older ones use web sockets
 *
 * This is the logic behind how we detect the current status of text generation:
 *
 * (1) EventSource/WebSocket received a message, we intercept it and parse it
 * (2) Is the message status either 'process_generating' or 'process_start'?
 *  -> If yes, we set the text generation status to 'true'
 *  -> If no, continue to (3)
 * (3) We wait a period of milliseconds defined in 'generationStatusChangeGracePeriod'
 * (4) Did we receive any new EventSource/WebSocket messages while waiting?
 *  -> If yes, go back to (1)
 *  -> If no, we set the text generation status to 'false'
 */
let generationStatusChangeTimeout;
const generationStatusChangeGracePeriod = 300;
function setGeneratingStatusFromEventData(data) {
  try {
    const status = JSON.parse(data).msg;
    // Ignore heartbeats
    if (status === 'heartbeat') return;
    // Check for current status
    if (status === 'process_generating' || status === 'process_start') {
      clearTimeout(generationStatusChangeTimeout);
      setTextGenerationStatus(true);
    } else {
      clearTimeout(generationStatusChangeTimeout);
      // Prevent messages in rapid succession overriding the status too quickly
      generationStatusChangeTimeout = setTimeout(() => {
        setTextGenerationStatus(false);
      }, generationStatusChangeGracePeriod);
    }
  } catch (err) {
    setTextGenerationStatus(false);
  }
}

// Intercept EventSource messages (for newer Gradio versions)
function interceptEventSource() {
  // Save the original EventSource constructor
  const OriginalEventSource = window.EventSource;

  // Override the EventSource constructor
  window.EventSource = function construct(url, options) {
    const eventSource = new OriginalEventSource(url, options);
    // Listen for incoming messages
    eventSource.addEventListener('message', (event) => {
      if (event?.data) setGeneratingStatusFromEventData(event.data);
    });
    // Return the original EventSource so other scripts can still use it
    return eventSource;
  };
}
// Intercept WebSocket messages (for older Gradio versions)
function interceptWebSocket() {
  // Save the original WebSocket constructor
  const OriginalWebSocket = window.WebSocket;

  window.WebSocket = function construct(url, options) {
    const webSocket = new OriginalWebSocket(url, options);
    // Listen for incoming messages
    webSocket.addEventListener('message', (event) => {
      if (event?.data) setGeneratingStatusFromEventData(event.data);
    });
    // Return the original WebSocket so other scripts can still use it
    return webSocket;
  };
}

/*
 * Add copy button to code blocks
 *
 * Only full code blocks (not inline ones) will show the copy button
 */
let isCopyButtonPluginLoaded = false;
const copyButtonPlugin = new CopyButtonPlugin();

// Add or remove the hljs copy button plugin based on the current params
function updateCopyButtonPluginStatus() {
  if (params.copy_button === true && !isCopyButtonPluginLoaded) {
    hljs.addPlugin(copyButtonPlugin);
    isCopyButtonPluginLoaded = true;
  } else if (params.copy_button === false && isCopyButtonPluginLoaded) {
    hljs.removePlugin(copyButtonPlugin);
    isCopyButtonPluginLoaded = false;
  }
}

// Remove copy button associated with the provided code block element along with its wrapper class
function removeCopyButtonFromCodeElement(codeElement) {
  const preWrapperElement = codeElement.parentElement;
  Array.from(preWrapperElement.querySelectorAll('button[class="hljs-copy-button"], button[class=""][data-copied="false"]')).forEach((copyCodeButton) => {
    preWrapperElement.classList.remove('hljs-copy-wrapper');
    copyCodeButton.remove();
  });
}
// Remove every copy button from all code blocks along with its wrapper classes
function removeAllCopyButtons() {
  Array.from(document.querySelectorAll('button[class="hljs-copy-button"], button[class=""][data-copied="false"]')).forEach((copyCodeButton) => {
    copyCodeButton.parentElement.classList.remove('hljs-copy-wrapper');
    copyCodeButton.remove();
  });
}

/*
 * Update highlight.js CSS theme based on current Gradio theme
 *
 * Both highlight.js themes are present in the page as separate styles
 * with the media attribute set to 'not all' to keep them disabled
 *
 * We only enable one theme by setting the media attribute to 'all'
 */
const gradioBody = document.body;
const gradioContainer = document.querySelector('[class^=\'gradio\'].app, [class*=\'gradio\'].app');

// Enable specified theme or get current Gradio theme
function updateTheme() {
  const theme = gradioBody?.classList.contains('dark') || gradioContainer?.classList.contains('dark') ? 'dark' : 'light';
  document.getElementById(`hljs-theme-${theme}`).setAttribute('media', 'all');
  // Disable opposite theme
  const themeToDisable = theme === 'light' ? 'dark' : 'light';
  document.getElementById(`hljs-theme-${themeToDisable}`).setAttribute('media', 'not all');
}

// Disable all themes to turn off highlight
function disableAllThemes() {
  document.getElementById('hljs-theme-light').setAttribute('media', 'not all');
  document.getElementById('hljs-theme-dark').setAttribute('media', 'not all');
}

// Watch for changes in the Gradio theme and change the highlight.js theme accordingly
const themeObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.attributeName === 'class') {
      // Class change was detected, reapply theme based on new class
      updateTheme();
    }
  });
});
function registerThemeObserver() {
  const themeObserverOptions = {
    attributes: true,
    attributeFilter: ['class'],
    childList: false,
    subtree: false,
  };
  themeObserver.observe(gradioBody, themeObserverOptions);
  themeObserver.observe(gradioContainer, themeObserverOptions);
}
function removeThemeObserver() {
  themeObserver.disconnect();
}

// Highlight code blocks with highlight.js
function highlightCode({ inlineHighlight = params.inline_highlight, codeElement = null } = {}) {
  // Stop if code syntax highlighting is disabled in the params
  if (params.activate === false) return;
  // Configure highlight.js to also highlight inline code blocks if specified
  const cssSelector = inlineHighlight === true ? 'code' : 'pre code';
  // Apply config to highlight.js
  hljs.configure({
    cssSelector,
    ignoreUnescapedHTML: true,
    throwUnescapedHTML: false,
  });
  // Remove copy button(s) before applying highlight to prevent duplicate buttons
  if (params.copy_button === true) {
    if (!codeElement) removeAllCopyButtons();
    else removeCopyButtonFromCodeElement(codeElement);
  }
  // Highlight just the provided code element or every code element in the DOM
  if (!codeElement) hljs.highlightAll();
  else hljs.highlightElement(codeElement);
}
// Remove highlight.js highlight from every code block
function removeHighlight() {
  Array.from(document.querySelectorAll('*[class*="hljs"]')).forEach((highlightedElement) => {
    const hljsClassPrefix = 'hljs';
    const classes = highlightedElement.className.split(' ').filter((c) => !c.startsWith(hljsClassPrefix));
    highlightedElement.className = classes.join(' ').trim();
  });
}

/*
 * This is the logic behind how we apply the highlight in performance mode,
 * so that we don't call highlightCode() for each token during text generation:
 *
 * (1) DOM update is detected (text is being generated or finished generating)
 * (2) Are there any code blocks in the DOM?
 *  -> If no, stop
 *  -> If yes, continue to (3)
 * (3) We wait a period of milliseconds defined in 'performanceHighlightWaitPeriod'
 * (4) Is text still being generated?
 *  -> If yes, go back to (3)
 *  -> If no, we highlight all code blocks present on the page
 *
 * We need to highlight all code blocks again every time the DOM finishes
 * updating, because the text generation overrides the classes set by highlight.js
 */
let performanceHighlightTimeout;
const performanceHighlightWaitPeriod = 100;
function performanceHighlight() {
  clearTimeout(performanceHighlightTimeout);
  performanceHighlightTimeout = setTimeout(() => {
    if (isGeneratingText === false) highlightCode();
    else performanceHighlight();
  }, performanceHighlightWaitPeriod);
}

// Watch for changes in the DOM body with arrive.js to highlight new code blocks as they appear
function registerCodeObserver() {
  document.body.arrive('CODE', (codeElement) => {
    // Stop if code syntax highlighting is disabled in the params
    if (params.activate === false) return;
    // Check if we need to highlight full code blocks and inline ones, or just full code blocks
    if (params.inline_highlight === false && codeElement.parentElement.nodeName !== 'PRE') return;
    // Highlight based on performance mode
    if (params.performance_mode === true) performanceHighlight();
    else highlightCode({ codeElement });
  });
}
function removeCodeObserver() {
  document.body.unbindArrive('CODE');
}

/*
 * Dynamically turn on or off all the features of the extension
 * based on the specified activation status
 */
function setActivationStatus(isActive) {
  if (isActive) {
    // Extension is enabled
    updateTheme();
    updateCopyButtonPluginStatus();
    registerThemeObserver();
    registerCodeObserver();
    highlightCode();
  } else {
    // Extension is disabled
    disableAllThemes();
    removeAllCopyButtons();
    removeThemeObserver();
    removeCodeObserver();
    removeHighlight();
  }
}

// Once everything is ready, activate the extension and intercept EventSource/WebSocket messages
setActivationStatus(params.activate);
interceptEventSource();
interceptWebSocket();

// Update locally stored params
function setParams(newParams) {
  // Params were changed, update local values to reflect changes
  const oldParams = structuredClone(params);
  params = structuredClone(newParams);
  // Trigger changes if extension activation status was changed
  if (oldParams.activate !== newParams.activate) setActivationStatus(newParams.activate);
  if (newParams.activate) {
    // Trigger changes if inline highlight status was changed
    if (oldParams.inline_highlight !== newParams.inline_highlight) {
      if (newParams.inline_highlight === true) {
        highlightCode({ inlineHighlight: true });
      } else {
        removeHighlight();
        highlightCode({ inlineHighlight: false });
      }
    }
    // Trigger changes if code copy button status was changed
    if (oldParams.copy_button !== newParams.copy_button) {
      if (newParams.copy_button === true) {
        removeHighlight();
        updateCopyButtonPluginStatus();
        highlightCode();
      } else {
        removeAllCopyButtons();
        updateCopyButtonPluginStatus();
      }
    }
  }
}

/*
 * Watch for changes in the HTML inputs (checkboxes)
 *
 * This method is far more reliable than using a proxy and waiting for Gradio
 * to send us the updated values, as sometimes Gradio doesn't correctly queue
 * events and some data is lost
 */
const paramNames = Object.keys(params);
paramNames.forEach((paramName) => {
  // Find the corresponding HTML checkbox associated with the param
  const input = document.querySelector(`#code-syntax-highlight--${paramName} input`);
  // Skip params that don't have a corresponding checkbox in the UI
  if (!input) return;
  // Add event listener to update the corresponding param when the checkbox is changed
  input.addEventListener('change', (event) => {
    // Clone old params to new object to avoid directly changing them
    const newParams = structuredClone(params);
    newParams[paramName] = event.target.checked;
    // Globally update params
    setParams(newParams);
  });
});

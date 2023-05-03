/*
 * Code Syntax Highlight params (received from Gradio):
 *
 * activate: if set to true, the extension will highlight code blocks, this setting
 * must be set to true for any of the other features to work
 *
 * inline_highlight: if set to true, code blocks without the <pre> tag (inline
 * code blocks) will also be highlighted
 *
 * performance_mode: if set to true, the extension will wait until text generation
 * ends before highlighting the code on the page to use less resources
 *
 */
const dataProxy = document.getElementById('code-syntax-highlight');
let params = JSON.parse(dataProxy.getAttribute('params'));

// Define other global vars
let isGeneratingText = false;

/*
 * Detect current text generation status
 *
 * We use this to detect when the webui is generating text, so we
 * can disable the accordion in the Gradio UI (this is to prevent settings
 * not applying after they are changed when text is being generated)
 *
 * Not a fan of using this method to get the generation status, but I'm not aware of any
 * other way, it also not possible to detect text generated with 'Impersonate' using this
 *
 * We could use a MutationObserver on the whole body to detect any class changes and then
 * check for the 'generating' class, but that would impact the performance too much
 */
const settingsAccordion = document.getElementById('code-syntax-highlight_accordion');

// Disable the settings menu and prevent any setting change
function disableSettingsAccordion() {
  settingsAccordion.classList.add('disabled');
  Array.from(document.querySelectorAll('#code-syntax-highlight_accordion input')).forEach((inputElement) => {
    inputElement.disabled = true;
  });
  settingsAccordion.arrive('INPUT', (inputElement) => {
    inputElement.disabled = true;
  });
}
// Enable the settings menu and allow settings changes
function enableSettingsAccordion() {
  settingsAccordion.classList.remove('disabled');
  Array.from(document.querySelectorAll('#code-syntax-highlight_accordion input')).forEach((inputElement) => {
    inputElement.disabled = false;
  });
  settingsAccordion.unbindArrive('INPUT');
}

// Update global 'isGeneratingText' var and trigger associated actions
function setTextGenerationStatus(newGeneratingStatus) {
  isGeneratingText = newGeneratingStatus;
  if (newGeneratingStatus) disableSettingsAccordion();
  else enableSettingsAccordion();
}

// Watch for changes in the text generation status
const textGenerationObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.attributeName === 'class') {
      // Update generating status
      setTextGenerationStatus(mutation.target.classList.contains('generating'));
    }
  });
});

// Try to find the text generation indicator and hook the MutationObserver to it once found
// Using this method we can't detect if text is generating with 'Impersonate'
const textGenerationIndicatorFinder = setInterval(() => {
  const textGenerationIndicator = document.querySelector('div.app [id=\'main\'] div[class*=\'generating\']');
  if (textGenerationIndicator) {
    // Only start to observe the text generation indicator after the first ever generation
    // This is to make sure we're observing the right element
    textGenerationObserver.observe(textGenerationIndicator, {
      attributes: true,
      attributeFilter: ['class'],
      childList: false,
      subtree: false,
    });
    // Update generating status
    setTextGenerationStatus(true);
    // Stop trying to find the indicator once found
    clearInterval(textGenerationIndicatorFinder);
  }
}, 200);

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
  hljs.configure({
    cssSelector,
    ignoreUnescapedHTML: true,
    throwUnescapedHTML: false,
  });
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
 * (3) Is text still being generated?
 *  -> If yes, go back to (3)
 *  -> If no, continue to (4)
 * (4) We highlight all code blocks present on the page
 *
 * We need to highlight all code blocks again every time the DOM finishes
 * updating, because the text generation overrides the classes set by highlight.js
 */
let highlightTimeout;
function performanceHighlight() {
  clearTimeout(highlightTimeout);
  highlightTimeout = setTimeout(() => {
    if (isGeneratingText === false) highlightCode();
    else performanceHighlight();
  }, 100);
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
    registerThemeObserver();
    registerCodeObserver();
    highlightCode();
  } else {
    // Extension is disabled
    disableAllThemes();
    removeThemeObserver();
    removeCodeObserver();
    removeHighlight();
  }
}

// Once everything is ready, activate the extension
setActivationStatus(params.activate);

/*
 * Code Syntax Highlight params
 * We use the <code-syntax-highlight> element as a data proxy between Gradio and
 * this JS script, when changed are detected through the MutationObserver, we
 * updated the local params and trigger the associated changes
 *
 */
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
  }
}

// Watch for changes in the params
const paramsObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.attributeName === 'params') {
      const newParams = JSON.parse(dataProxy.getAttribute('params'));
      setParams(newParams);
    }
  });
});
paramsObserver.observe(dataProxy, {
  attributes: true,
  attributeFilter: ['params'],
  childList: false,
  subtree: false,
});

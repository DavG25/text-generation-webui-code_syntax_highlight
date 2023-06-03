/*
 * This is a modified version of 'highlightjs-copy' to work with Gradio
 * https://raw.githubusercontent.com/arronhunt/highlightjs-copy/master/dist/highlightjs-copy.min.js
 */
const locales = { en: ['Copy', 'Copied!', 'Copied to clipboard'] };

class CopyButtonPlugin {
  constructor(options = {}) {
    this.hook = options.hook;
    this.callback = options.callback;
    this.lang = options.lang || document.documentElement.lang || 'en';
  }

  'after:highlightElement'({ el, text }) {
    const button = Object.assign(document.createElement('button'), {
      innerHTML: locales[this.lang]?.[0] || 'Copy',
      className: 'hljs-copy-button',
    });
    button.dataset.copied = false;
    el.parentElement.classList.add('hljs-copy-wrapper');
    // Check if code block height is not enough for the copy button to fit, then add class to fix
    if (el.parentElement.offsetHeight < 42) {
      el.parentElement.classList.add('hljs-copy-narrow-wrapper');
      // Calculate and apply the top margin to align
      // copy button in the middle of the narrow code block
      let topMargin = Math.floor((el.parentElement.offsetHeight - 32) / 2);
      topMargin = topMargin < 0 ? 0 : topMargin;
      topMargin = topMargin > 5 ? 5 : topMargin;
      button.style.setProperty('margin-top', `${topMargin}px`, 'important');
    }
    el.parentElement.appendChild(button);
    /* el.parentElement.style.setProperty(
      "--hljs-theme-background",
      window.getComputedStyle(el).backgroundColor
    ) */
    button.onclick = () => {
      if (!navigator.clipboard) {
        // Some browsers (for example on Android) require an HTTPS connection
        // for the clipboard function to work so this won't work on a local URL
        // unless we use the Gradio HTTPS link with --share
        // TODO: Warn user if copy when clicking button fails
        return;
      }
      let newText = text;
      if (this.hook && typeof hook === 'function') {
        newText = this.hook(text, el) || text;
      }
      navigator.clipboard.writeText(newText).then(() => {
        button.innerHTML = locales[this.lang]?.[1] || 'Copied!';
        button.dataset.copied = true;
        button.tabIndex = -1;
        button.disabled = true;
        button.style.pointerEvents = 'none';
        let alert = Object.assign(document.createElement('div'), {
          role: 'status',
          className: 'hljs-copy-alert',
          innerHTML: locales[this.lang]?.[2] || 'Copied to clipboard',
        });
        alert.setAttribute('style', 'clip: rect(0 0 0 0) !important; clip-path: inset(50%) !important; height: 1px !important; overflow: hidden !important; position: absolute !important; white-space: nowrap !important; width: 1px !important;');
        el.parentElement.appendChild(alert);
        // TODO: Reset previous timeout on new button press
        setTimeout(() => {
          // Remove focus from button so it hides again
          button.blur();
          button.innerHTML = locales[this.lang]?.[0] || 'Copy';
          button.dataset.copied = false;
          button.removeAttribute('tabindex');
          button.disabled = false;
          button.style.pointerEvents = null;
          el.parentElement.removeChild(alert);
          alert = null;
        }, 2000);
      }).then(() => {
        if (typeof callback === 'function') return this.callback(newText, el);
        return null;
      });
    };
  }
}

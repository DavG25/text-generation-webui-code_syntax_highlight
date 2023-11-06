/*
 * This is a modified version of 'highlightjs-copy' to work with Gradio
 * https://raw.githubusercontent.com/arronhunt/highlightjs-copy/master/dist/highlightjs-copy.min.js
 */
class CopyButtonPlugin {
  constructor(options = {}) {
    this.hook = options.hook;
    this.callback = options.callback;
  }

  'after:highlightElement'({ el, text }) {
    // Create copy button
    const button = Object.assign(document.createElement('button'), {
      innerText: 'Copy to clipboard',
      className: 'hljs-copy-button',
    });
    button.dataset.copied = false;

    // Create reference to <pre> tag
    const wrapper = el.parentElement;

    // Check if code block height is not enough for the copy button to fit, then add class to fix
    if (wrapper.offsetHeight < 42) {
      wrapper.classList.add('hljs-copy-narrow-wrapper');
      // Calculate and apply the top margin to align
      // copy button in the middle of the narrow code block
      let topMargin = Math.floor((wrapper.offsetHeight - 32) / 2);
      if (topMargin < 0) topMargin = 0;
      else if (topMargin > 5) topMargin = 5;
      button.style.setProperty('margin-top', `${topMargin}px`, 'important');
    }

    // Add button in the DOM
    wrapper.classList.add('hljs-copy-wrapper');
    wrapper.appendChild(button);

    // Handle copy to clipboard on button click
    button.onclick = () => {
      if (!navigator.clipboard) {
        // Some browsers (for example on mobile devices) require an HTTPS
        // connection for the clipboard function to work so this won't work
        // on a local URL unless we use the Gradio HTTPS link with --share
        alert('Unable to copy text: the clipboard feature could be disabled or the browser may require an HTTPS connection for it to work');
        return;
      }

      // Get text from code block
      let newText = text;
      if (this.hook && typeof hook === 'function') {
        newText = this.hook(text, el) || text;
      }

      // Write text into the clipboard
      navigator.clipboard.writeText(newText).then(() => {
        // Update button status
        button.innerText = 'Copied to clipboard';
        button.dataset.copied = true;
        button.disabled = true;
        button.style.pointerEvents = 'none';

        // Revert button status
        setTimeout(() => {
          // Remove focus from button so it hides again
          button.blur();
          button.innerText = 'Copy to clipboard';
          button.dataset.copied = false;
          button.disabled = false;
          button.style.pointerEvents = null;
        }, 2000);
      }).then(() => {
        if (typeof callback === 'function') return this.callback(newText, el);
        return null;
      });
    };
  }
}

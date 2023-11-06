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

    // Calculate the height of a code block based on its content and styles
    function getComputedHeight() {
      let totalHeight = 0;

      // Count newlines inside the text of the code block
      const newlineCount = (text.match(/\n/g) || []).length;

      // Get height of the padding
      totalHeight += parseFloat(window.getComputedStyle(el, null).getPropertyValue('padding-top')) || 0;
      totalHeight += parseFloat(window.getComputedStyle(el, null).getPropertyValue('padding-bottom')) || 0;

      // Get line height
      const lineHeight = parseFloat(window.getComputedStyle(el, null).getPropertyValue('line-height')) || false;

      // Calculate final total height (if line height is not available we use font height instead)
      if (lineHeight !== false) {
        totalHeight += newlineCount * lineHeight;
      } else {
        // Get the font size
        const fontHeight = parseFloat(window.getComputedStyle(el, null).getPropertyValue('font-size')) || 0;
        // Calculate the height of all the lines of text
        totalHeight += newlineCount * fontHeight;
      }

      return totalHeight;
    }

    // Create reference to the <pre> element
    const wrapper = el.parentElement;

    /*
     * Get the height of the <pre> element
     *
     * If the height is 0 (meaning the element has not been rendered yet) we calculate the height
     * using an alternative method
     *
     * The height being 0 happens when we start the web UI and the code blocks are created
     * inside a tab that is currently not displayed, for example when we start the web UI
     * and quickly change to the 'Notebook' tab before the code blocks are rendered
     * in the 'Chat' tab
     *
     * When using the alternative method to get the height, we make a best guess based on the
     * content and style of the <code> block
     *
     * We could also clone the entire element and render it to get the actual height but that
     * is a waste of resources for an edge case like this
     */
    const wrapperHeight = wrapper.clientHeight || getComputedHeight();

    // Check if the code block height is not enough for the copy button to fit inside of it
    if (wrapperHeight < 42) {
      // Calculate and apply the top margin to align the copy button in the middle of the code block
      let topMargin = Math.floor((wrapperHeight - 32) / 2);
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

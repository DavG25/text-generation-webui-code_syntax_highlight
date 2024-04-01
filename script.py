from pathlib import Path
import json
import gradio as gr

# Initialize JS and CSS
#   arrive.js 2.4.1 - https://raw.githubusercontent.com/uzairfarooq/arrive/cfabddbd2633a866742e98c88ba5e4b75cb5257b/minified/arrive.min.js
#     [SHA256 - 5971DE670AEF1D6F90A63E6ED8D095CA22F95C455FFC0CEB60BE62E30E1A4473]
#
#   highlight.js 11.8.0 - https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/highlight.min.js
#     [SHA256 - 4499FF936D4FD562ADCA5A5CBE512DC19EB80942EEE8618DAFBCEBC4F7974BDB]
assets_dir = Path(__file__).resolve().parent / 'assets'
with open(assets_dir / 'arrive.min.js', 'r') as f:
    js_modules = f.read() + '\n'
with open(assets_dir / 'highlight.min.js', 'r') as f:
    js_modules += f.read() + '\n'
with open(assets_dir / 'highlightjs-copy.js', 'r') as f:
    js_modules += f.read() + '\n'
with open(assets_dir / 'main.js', 'r') as f:
    js_modules += f.read() + '\n'
with open(assets_dir / 'update-check.js', 'r') as f:
    js_update_check = '\n' + f.read() + '\n'
with open(assets_dir / 'github.css', 'r') as f:
    css_theme_light = f.read()
with open(assets_dir / 'github-dark.css', 'r') as f:
    css_theme_dark = f.read()
with open(assets_dir / 'highlightjs-copy.css', 'r') as f:
    css_copy_button = f.read()
# Initialize extension information (like the current version number)
with open(assets_dir / 'extension.json', 'r') as f:
    extension_info = json.load(f)

# Define extension config with global params - https://github.com/oobabooga/text-generation-webui/blob/main/docs/07%20-%20Extensions.md#how-to-write-an-extension
params = {
    'display_name': 'Code Syntax Highlight',
    'activate': True, # TODO: Separate activate from highlight, so for example we can still enable copy_button without the highlight
    'inline_highlight': False,
    'copy_button': False,
    'performance_mode': True,
}

# CSS for the accordion on the Gradio UI
css_accordion = '''
  #code-syntax-highlight_accordion p.version-label {
    margin: 0;
    line-height: 1rem;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
  }
'''

# HTML containing the styling for the highlight.js themes and the DOM element used as a proxy between Gradio and the injected JS
html_internal = f'''
  <style id="hljs-theme-light" media="not all"> {css_theme_light} </style>
  <style id="hljs-theme-dark" media="not all"> {css_theme_dark} </style>
  <code-syntax-highlight id="code-syntax-highlight" style="display: none;"> </code-syntax-highlight>
'''

# Build UI and inject CSS
def ui():
    # Display extension settings in the Gradio UI
    with gr.Accordion(label=params['display_name'], elem_id='code-syntax-highlight_accordion', open=True):
        # Accordion style
        gr.HTML(value=f'<style> {css_accordion} </style>')
        # Load additional HTML elements used by the extension
        gr.HTML(value=html_internal, visible=False)
        # Setting: activate
        gr.Checkbox(
            value=params['activate'],
            label='Enable extension and syntax highlighting of code snippets',
            interactive=True,
            elem_id='code-syntax-highlight--activate'
        )
        # Setting: inline_highlight
        gr.Checkbox(
            value=params['inline_highlight'],
            label='Highlight inline code snippets',
            interactive=True,
            elem_id='code-syntax-highlight--inline_highlight'
        )
        # Setting: copy_button
        gr.Checkbox(
            value=params['copy_button'],
            label='Show button to copy code inside code snippets',
            interactive=True,
            elem_id='code-syntax-highlight--copy_button'
        )
        # Setting: performance_mode
        gr.Checkbox(
            value=params['performance_mode'],
            label='Reduce CPU usage by only highlighting after text generation ends',
            interactive=True,
            elem_id='code-syntax-highlight--performance_mode'
        )
        # Version info and update check button
        with gr.Row():
            gr.HTML(value=f'<p class="version-label">Current extension version: {extension_info["version"]}</p>')
            gr.Button(
                value='Check for updates',
                elem_id='code-syntax-highlight_updateButton'
            )

# Inject JS scripts and modules
def custom_js():
    # JS to initialize the params for JS modules, we need to place this here because the params are loaded only after custom_js() is called
    js_data_proxy_loader = f'''
      document.getElementById('code-syntax-highlight').setAttribute('params', JSON.stringify({json.dumps(params)}));
      document.getElementById('code-syntax-highlight').setAttribute('info', JSON.stringify({json.dumps(extension_info)}));
    '''
    return f'''
      (function() {{{js_data_proxy_loader}}})();
      (function() {{{js_update_check}}})();
      (function() {{{js_modules}}})();
    '''

# Inject copy button CSS
def custom_css():
    return css_copy_button

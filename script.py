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
    js_modules = f.read()
with open(assets_dir / 'highlight.min.js', 'r') as f:
    js_modules += '\n' + f.read()
with open(assets_dir / 'highlightjs-copy.js', 'r') as f:
    js_modules += '\n' + f.read()
with open(assets_dir / 'main.js', 'r') as f:
    js_modules += '\n' + f.read()
with open(assets_dir / 'github.css', 'r') as f:
    css_theme_light = f.read()
with open(assets_dir / 'github-dark.css', 'r') as f:
    css_theme_dark = f.read()
with open(assets_dir / 'highlightjs-copy.css', 'r') as f:
    css_copy_button = f.read()
# Initialize extension information (like the current version)
with open(assets_dir / 'extension.json', 'r') as f:
    extension_info = json.load(f)

# Define extension config with global params - https://github.com/oobabooga/text-generation-webui/blob/main/docs/Extensions.md#params-dictionary
params = {
    'activate': True, # TODO: Separate activate from highlight, so for example we can still enable copy_button without the highlight
    'inline_highlight': False,
    'copy_button': False,
    'performance_mode': False,
}

# JS to check for extension's updates
js_extension_updater = f'''
  const extensionInfo = {json.dumps(extension_info)};
  if (confirm('Open the GitHub page of Code Syntax Highlight?')) window.open(extensionInfo.gitUrl + '/releases/latest', '_blank');
'''

# JS to update the specified param so that JS modules can access it
def js_params_updater(paramName):
    return '(x) => { ' + f'''
      const paramName = '{paramName}';
    ''' + '''
      const element = document.getElementById('code-syntax-highlight');
      const params = JSON.parse(element.getAttribute('params'));
      params[paramName] = x;
      element.setAttribute('params', JSON.stringify(params));
    ''' + ' }'

# CSS for the accordion on the Gradio UI
css_accordion = '''
  #code-syntax-highlight_accordion p.settings-warning {
    display: none;
  }
  #code-syntax-highlight_accordion.disabled p.settings-warning {
    display: block;
    color: var(--block-info-text-color, inherit);
    margin-bottom: 0;
  }
  #code-syntax-highlight_accordion.disabled .form {
    opacity: 0.5;
    pointer-events: none;
  }
  #code-syntax-highlight_accordion p.version-label {
    margin: 0;
    line-height: 1rem;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
  }
'''

# Build UI and inject CSS and JS
def ui():
    # JS to initialize the params for JS modules, we need to place this here because the params are loaded from settings.json when ui() is called
    js_data_proxy_loader = f'''
      document.getElementById('code-syntax-highlight').setAttribute('params', JSON.stringify({json.dumps(params)}));
    '''

    # When loading JS, instead of using shared.gradio['interface'], we create a new interface to avoid conflicts with other scripts (like ui.main_js)
    with gr.Blocks(analytics_enabled=False) as interface:
        # Load CSS and DOM element to be used as proxy between Gradio and the injected JS modules
        gr.HTML(value=f'''
          <style id="hljs-theme-light" media="not all"> {css_theme_light} </style>
          <style id="hljs-theme-dark" media="not all"> {css_theme_dark} </style>
          <style> button.hljs-copy-button {{ display: none; }} </style>
          <style id="hljs-copy-button" media="not all"> {css_copy_button} </style>
          <code-syntax-highlight id="code-syntax-highlight" style="display: none;"> </code-syntax-highlight>
        ''', visible=False)
        # Inject JS, the label is used to avoid a TypeError in older Gradio versions, see https://github.com/gradio-app/gradio/pull/3883
        interface.load(None, None, gr.Label(visible=False), _js=f'() => {{{js_data_proxy_loader+js_modules}}}')

    # Display extension settings in the Gradio UI
    with gr.Accordion('Code Syntax Highlight - Settings', elem_id='code-syntax-highlight_accordion', open=True):
        # Settings warning message and accordion style
        gr.HTML(value=f'''
          <style> {css_accordion} </style>
          <p class="settings-warning">Please wait for text generation to end before changing settings</p>
        ''')
        # Setting: activate
        activate = gr.Checkbox(value=params['activate'], label='Enable extension and syntax highlighting of code snippets')
        activate.change(lambda x: params.update({'activate': x}), activate, _js=js_params_updater('activate'))
        # Setting: inline_highlight
        inline_highlight = gr.Checkbox(value=params['inline_highlight'], label='Highlight inline code snippets')
        inline_highlight.change(lambda x: params.update({'inline_highlight': x}), inline_highlight, _js=js_params_updater('inline_highlight'))
        # Setting: copy_button
        copy_button = gr.Checkbox(value=params['copy_button'], label='Show button to copy code inside code snippets')
        copy_button.change(lambda x: params.update({'copy_button': x}), copy_button, _js=js_params_updater('copy_button'))
        # Setting: performance_mode
        performance_mode = gr.Checkbox(value=params['performance_mode'], label='Reduce CPU usage by only highlighting after text generation ends')
        performance_mode.change(lambda x: params.update({'performance_mode': x}), performance_mode, _js=js_params_updater('performance_mode'))
        # Version info and update check button
        with gr.Row():
            gr.HTML(value=f'<p class="version-label"> Current extension version: {extension_info["version"]} </p>')
            check_for_updates = gr.Button('Check for updates')
            # Run JS on button click, the label is used to avoid a TypeError in older Gradio versions, see https://github.com/gradio-app/gradio/pull/3883
            check_for_updates.click(None, None, gr.Label(visible=False), _js=f'() => {{{js_extension_updater}}}')

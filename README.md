# Code Syntax Highlight
### An extension for [oobabooga's text-generation-webui](https://github.com/oobabooga/text-generation-webui/) to highlight code snippets

![code_syntax_highlight_extension-oobabooga-text-generation-webui](https://www.davg25.com/file/github-media/text-generation-webui-code_syntax_highlight/demo2.png)

## Features
- Uses highlight.js with the [GitHub theme](https://highlightjs.org/static/demo/#:~:text=GitHub%20Dark)
- Supports [common](https://highlightjs.org/download/#:~:text=common) programming languages
- Can also highlight inline code snippets
- Provides an optional button in each code snippet to copy code to the clipboard
- Works in all interface modes: default, notebook, and chat
- Automatically switches between light and dark themes to match the Web UI theme
- Has a performance mode for minimal CPU usage

<br>

## Installation
The extension can be installed by cloning this repository inside the `../text-generation-webui/extensions` folder:
```
cd text-generation-webui/extensions
```
```
git clone https://github.com/DavG25/text-generation-webui-code_syntax_highlight code_syntax_highlight
```

It's also possible to install the extension by directly downloading the latest version from the [releases page](https://github.com/DavG25/text-generation-webui-code_syntax_highlight/releases/latest) and extracting the ZIP archive inside the `../text-generation-webui/extensions` folder

<br>

## Updates
To check for updates, simply compare the currently installed extension version in the Web UI with the latest available version in the [releases page](https://github.com/DavG25/text-generation-webui-code_syntax_highlight/releases/latest) 

If the available version is higher than the installed one, run the following command:
```
cd text-generation-webui/extensions
```
```
git pull
```
If the extension was installed by downloading the ZIP archive, delete the currently installed version in the `../text-generation-webui/extensions` folder and extract the new version ZIP archive in the same location

<br>

## Configuration and persistent settings
The extension can be enabled directly in the `Interface mode` tab inside the Web UI once installed

To automatically load the extension when starting the Web UI, either specify it in the `--extensions` [command-line flag](https://github.com/oobabooga/text-generation-webui#basic-settings) or add it in the `settings.yaml` file in the `../text-generation-webui` folder by adding the following lines:
```yaml
default_extensions: 
- code_syntax_highlight
chat_default_extensions:
- code_syntax_highlight
```
Or if still using the old `settings.json` file:
```json
"default_extensions": [
  "code_syntax_highlight"
],
"chat_default_extensions": [
  "code_syntax_highlight"
],
```

<br>

For settings to persist over Web UI restarts and reloads, add the following lines to the `settings.yaml` file:

```yaml
code_syntax_highlight-activate: true
code_syntax_highlight-inline_highlight: false
code_syntax_highlight-copy_button: false
code_syntax_highlight-performance_mode: false
```
Or if still using the old `settings.json` file:
```json
"code_syntax_highlight-activate": true,
"code_syntax_highlight-inline_highlight": false,
"code_syntax_highlight-copy_button": false,
"code_syntax_highlight-performance_mode": false,
```
Change the values (`true` / `false`) according to the preferred settings
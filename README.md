# Code Syntax Highlight
### An extension for [oobabooga's text-generation-webui](https://github.com/oobabooga/text-generation-webui/) to highlight code snippets

![preview-1](https://www.davg25.com/file/github-media/text-generation-webui-code_syntax_highlight/demo1.png)

## Features
- Uses highlight.js with the [GitHub theme](https://highlightjs.org/static/demo/#:~:text=GitHub%20Dark)
- Supports [common](https://highlightjs.org/download/#:~:text=common) programming languages
- Works in all interface modes: default, notebook, chat, cai-chat and instruct
- Switches automatically between light and dark theme
- Can also highlight inline code snippets
- Has a performance mode for minimal CPU usage

<br>

## Installation
The extension can be installed by cloning this repository inside the `../text-generation-webui/extensions` folder:
```
cd PATH_TO_text-generation-webui/extensions
```
```
git clone https://github.com/DavG25/text-generation-webui-code_syntax_highlight code_syntax_highlight
```

It also possible to install the extension by directly downloading the latest version from the [releases page](https://github.com/DavG25/text-generation-webui-code_syntax_highlight/releases/latest) and extracting the ZIP archive inside the `../text-generation-webui/extensions` folder

<br>

## Updates
To check for updates, simply compare the currently installed extension version in the Web UI with the latest available version in the [releases page](https://github.com/DavG25/text-generation-webui-code_syntax_highlight/releases/latest) 

If the available version is higher than the installed one, run the following command:
```
cd PATH_TO_text-generation-webui/extensions
```
```
git pull
```
If the extension was installed by downloading the ZIP archive, delete the currently installed version in the `../text-generation-webui/extensions` folder and extract the new version ZIP archive in the same location

<br>

## Configuration and persistent settings
The extension can be enabled directly in the `Interface mode` tab inside the Web UI once installed

To always keep the extension enabled, either load it using [command-line flags](https://github.com/oobabooga/text-generation-webui#basic-settings) or add it in the `settings.json` file in the `text-generation-webui` folder by adding the following lines:
```json
"default_extensions": [
  "code_syntax_highlight"
],
"chat_default_extensions": [
  "code_syntax_highlight"
],
```

<br>

For settings to persist over Web UI restarts and reloads, add the following lines to the `settings.json` file:

```json
"code_syntax_highlight-activate": true,
"code_syntax_highlight-inline_highlight": false,
"code_syntax_highlight-performance_mode": false,
```
Change the values according to the preferred settings using the `JSON` format
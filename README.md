# AI Form Filler

A Chrome extension that helps users fill out HTML forms using AI. The extension features a sidepanel window that displays replicated forms from the current page, allowing users to interact with AI-suggested form data before applying it to the actual page.

## Features

- **Sidepanel Interface**: Clean, React-based UI that opens when you click the extension icon
- **Form Detection**: Automatically detects all forms on the current page
- **AI Integration**: Configurable AI models (OpenAI, Anthropic, or local models)
- **Form Filling**: Fill out forms in the sidepanel and apply changes to the actual page
- **Options Page**: Configure AI settings including API keys, models, and generation parameters

## Installation

### For Development

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the extension:
   ```bash
   npm run build
   ```
4. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the `dist` folder

### For Production

The extension is not yet published to the Chrome Web Store. Use the development installation method above.

## Usage

1. **Installation**: Install the extension following the instructions above
2. **Configuration**: 
   - Right-click the extension icon and select "Options" 
   - Or go to `chrome://extensions/` and click "Details" → "Extension options"
   - Configure your preferred AI provider (OpenAI or Anthropic)
   - Enter your API key and select a model
3. **Using the Extension**:
   - Navigate to any webpage with forms
   - Click the extension icon to open the sidepanel
   - The sidepanel will show all detected forms on the page
   - Use the AI buttons to get suggestions or auto-fill forms (coming soon)
   - Manually edit form fields in the sidepanel
   - Click "Fill Form on Page" to apply your changes to the actual form

## AI Providers

### OpenAI
- Get API key from: https://platform.openai.com/api-keys
- Recommended models: `gpt-3.5-turbo`, `gpt-4`

### Anthropic Claude
- Get API key from: https://console.anthropic.com/
- Recommended models: `claude-3-haiku-20240307`, `claude-3-sonnet-20240229`

### Local Models
- Coming soon - will support local AI model inference

## Development

### Project Structure

```
src/
├── background/     # Service worker for extension lifecycle
├── content/        # Content scripts for form detection and filling
├── sidepanel/      # React components for the sidepanel UI
├── options/        # Options page for configuration
└── types/          # Shared TypeScript types
```

### Build Commands

- `npm run dev` - Development build with watch mode
- `npm run build` - Production build
- `npm run preview` - Preview the build

### Technology Stack

- **TypeScript** - Type-safe JavaScript
- **React** - UI framework for sidepanel and options
- **Vite** - Build tool and bundler
- **Chrome Extension Manifest V3** - Latest extension format

## Roadmap

- [ ] AI form suggestions and auto-fill functionality
- [ ] Better form field type detection (dropdowns, checkboxes, etc.)
- [ ] Form validation and error handling
- [ ] Local AI model support
- [ ] Custom prompt templates
- [ ] Form history and templates
- [ ] Multi-language support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Build and test the extension
5. Submit a pull request

## License

[MIT License](LICENSE)

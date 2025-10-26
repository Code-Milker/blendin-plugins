# Blendin Plugins

Plugins developed for Blendin AI (no longer active) to enable multi-language support and documentation localization in Docusaurus and GitBook.

## Overview

This repository contains custom plugins created during a freelance contract with Blendin AI. The primary focus is on localization (i18n) plugins that integrate with:

- **Docusaurus**: A static site generator for building documentation websites.
- **GitBook**: A platform for creating and hosting knowledge bases and docs.

These plugins facilitate seamless multi-language support, allowing automatic locale detection, content translation hooks, and localized routing. They were designed to improve documentation accessibility for global users in AI-related projects.

## Features

- **Locale Detection**: Automatically detects user language preferences via browser settings or query params.
- **Multi-Language Routing**: Supports language-specific URLs (e.g., `/en/docs` vs. `/fr/docs`).
- **Translation Integration**: Hooks for integrating with translation services like i18next or custom JSON files.
- **Customization**: Configurable via plugin options for themes, sidebars, and content overrides.
- **Compatibility**: Tested with Docusaurus v2+ and GitBook's plugin ecosystem.

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/Code-Milker/blendin-plugins.git
   cd blendin-plugins
   ```

2. Install dependencies (assuming Node.js and npm/yarn are installed):
   ```
   npm install
   ```
   or
   ```
   yarn install
   ```

3. For Docusaurus: Add the plugin to your `docusaurus.config.js`.
   ```js
   module.exports = {
     plugins: [
       require.resolve('path/to/blendin-plugins/docusaurus-locale-plugin'),
     ],
   };
   ```

4. For GitBook: Install as a GitBook plugin (if packaged as such).
   ```
   gitbook install blendin-locale-plugin
   ```

## Usage

### Docusaurus Example

In your Docusaurus config:

```js
// docusaurus.config.js
module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'fr', 'es'],
  },
  plugins: [
    [
      'blendin-docusaurus-locale',
      {
        path: 'i18n', // Directory for translation files
        autoDetect: true,
      },
    ],
  ],
};
```

Create translation files in `./i18n/<locale>/` (e.g., JSON or MDX overrides).

### GitBook Example

In your GitBook configuration (book.json):

```json
{
  "plugins": ["blendin-gitbook-locale"],
  "pluginsConfig": {
    "blendin-gitbook-locale": {
      "locales": ["en", "fr", "es"],
      "defaultLocale": "en"
    }
  }
}
```

Run `gitbook build` to generate localized docs.

## Configuration Options

| Option        | Type    | Description                          | Default |
|---------------|---------|--------------------------------------|---------|
| `path`       | string | Path to translation files directory | 'i18n' |
| `autoDetect` | boolean| Enable browser language detection   | true   |
| `locales`    | array  | List of supported locales           | ['en'] |

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/new-feature`).
3. Commit your changes (`git commit -m 'Add new feature'`).
4. Push to the branch (`git push origin feature/new-feature`).
5. Open a Pull Request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---


# Changelog

## 1.0.2

### Changed

- The plugin name and description show in your language

### Fixed

- Signing in never showed the browser dialog when the config had a default_provider or a single provider, since OPKSSH then skips its provider chooser

## 1.0.1

### Changed

- Translated into every supported language

## 1.0.0

### Added

- First release
- Adds the OPKSSH auth type to hosts
- Sign in with your identity provider in the browser
- Certificates last 24 hours, so you sign in once a day
- Uses a pinned, checksum verified `opkssh` release

# Changelog

## [0.1.9](https://github.com/jraylan/seamless-agent/compare/v0.1.8...v0.1.9) (2025-12-14)

### Features

* Add file reference autocomplete (`#filename`) for workspace files
* Add attachment chips UI for managing attached files
* Add support for pasting images directly into the input area
* Add attach button for selecting files via file picker
* Improve inline image support in ask_user tool using LanguageModelDataPart.image()
* Simplify attachment response format to string array of URIs
* Simplify pasted image naming (e.g., `image-pasted.png`)
* Simplify file reference syntax from `#file:filename` to `#filename`
* Update README features and add scrolling CSS for attachment chips container

### Bug Fixes

* Disabled automatic reveal to avoid disrupting user
* Fix badge counting
* Cleanup unused code
* Use localized title and cleanup comments
* Remove `.vsix` file from repository


## [0.1.8](https://github.com/jraylan/seamless-agent/compare/v0.1.7...v0.1.8)

### Features

* Add approve_plan tool (`#approvePlan`) for reviewing and approving plans with inline comments


## [0.1.7](https://github.com/jraylan/seamless-agent/compare/v0.1.6...v0.1.7)

### Bug Fixes

* Fix issue where fallback prompt opened when Webview did not receive focus

### Documentation

* Add instructions for Antigravity users


## [0.1.6](https://github.com/jraylan/seamless-agent/compare/v0.1.5...v0.1.6)

### Bug Fixes

* Fix Antigravity integration


## [0.1.5](https://github.com/jraylan/seamless-agent/compare/v0.1.4...v0.1.5)

### Features

* Add support for Antigravity


## [0.1.4](https://github.com/jraylan/seamless-agent/compare/v0.1.3...v0.1.4)

### Bug Fixes

* Fix badge not resetting to 0 after all requests are closed
* Improve notification behavior to avoid interruptions when panel is visible


## [0.1.3](https://github.com/jraylan/seamless-agent/compare/v0.1.2...v0.1.3)

### Features

* Add support for multiple concurrent requests with list view
* Add file attachments support using VS Code Quick Pick
* Improve task list UI with better visual hierarchy
* Add panel icon matching VS Code design language

### Changes

* Update layout to resemble Copilot Chat
* Dispose request when agent stops
* Improve badge counter visuals

### Pull Requests

* Merge dedicated view panel feature


## [0.1.2](https://github.com/jraylan/seamless-agent/compare/v0.1.1...v0.1.2)

### Features

* Add dedicated Seamless Agent panel in bottom panel area
* Add rich Markdown rendering (headers, bold, italic, code blocks, syntax highlighting, lists, tables, links)
* Add multi-line input with textarea and Ctrl+Enter submit
* Add non-intrusive notifications with badge indicator and optional console link
* Add graceful fallback when webview panel is unavailable

### Changes

* Move user confirmation UI from popup dialogs to dedicated panel
* Update esbuild config to compile webview scripts separately
* Improve localization system (EN, PT-BR, PT)

### Bug Fixes

* Add `dist/` to `.gitignore` to avoid committing build artifacts

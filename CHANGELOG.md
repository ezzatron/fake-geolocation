# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

## [v0.5.0] - 2023-11-27

[v0.5.0]: https://github.com/ezzatron/fake-geolocation/releases/tag/v0.5.0

### Added

- Add waitForPositionError()

## [v0.4.0] - 2023-11-23

[v0.4.0]: https://github.com/ezzatron/fake-geolocation/releases/tag/v0.4.0

### Changed

- **\[BC BREAK]** `createDelegatedGeolocation()` now requires a
  `permissionsDelegates` argument, which is a `Map` of `Geolocation` delegates
  to their related `Permissions` delegates.

### Added

- Added `waitForCoordinates()` and `compareCoordinates()`

### Fixed

- Changing delegates while watching the position no longer causes permission
  prompts when the selected delegate's `geolocation` permission is in the
  `prompt` state. Instead, the error callback will be called with a
  `PERMISSION_DENIED` error. If the selected delegate's `geolocation` permission
  subsequently changes to `granted` or `denied`, the watch will resume.

## [v0.3.1] - 2023-09-10

[v0.3.1]: https://github.com/ezzatron/fake-geolocation/releases/tag/v0.3.1

### Fixed

- Fixed a code style issue in a test file.

## [v0.3.0] - 2023-09-10

[v0.3.0]: https://github.com/ezzatron/fake-geolocation/releases/tag/v0.3.0

### Added

- Delegate selection can now be queried with `isDelegateSelected()`.
- Wrapped APIs can now be queried with `isUsingSuppliedAPIs()`.

## [v0.2.0] - 2023-09-10

[v0.2.0]: https://github.com/ezzatron/fake-geolocation/releases/tag/v0.2.0

### Added

- Finalized initial features.

## [v0.1.0] - 2023-07-29

[v0.1.0]: https://github.com/ezzatron/fake-geolocation/releases/tag/v0.1.0

### Added

- Initial release.

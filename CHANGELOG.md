# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog], and this project adheres to [Semantic
Versioning].

[keep a changelog]: https://keepachangelog.com/en/1.0.0/
[semantic versioning]: https://semver.org/spec/v2.0.0.html

## Unreleased

## [v0.11.0] - 2024-08-04

[v0.11.0]: https://github.com/ezzatron/fake-geolocation/releases/tag/v0.11.0

### Changed

- **\[BREAKING]** This release includes an update to the version of
  `fake-permissions` used for permissions handling, which includes many breaking
  changes. See the [`fake-permissions@v0.7.0` release notes] for details and
  updated usage examples.
- **\[BREAKING]** The `handlePermissionRequest` option for `createAPIs()`,
  `createWrappedAPIs()`, and `createUser()` has been renamed to
  `handleAccessRequest` in line with the changes to `fake-permissions`.
- **\[BREAKING]** The `createGeolocation()` function now has a `permissionStore`
  option that takes a `PermissionsStore` object instead of a `permissions`
  option that takes a `Permissions` object.
- **\[BREAKING]** The `createGeolocation()` function now has a `user` option
  that takes a `User` object instead of a `requestPermission` option that takes
  a callback.
- **\[BREAKING]** The `LocationServices` type is now a type, instead of an
  interface.
- **\[BREAKING]** The `MutableLocationServices` type is now a type, instead of
  an interface.
- **\[BREAKING]** The `User` type is now a type, instead of an interface.

[`fake-permissions@v0.7.0` release notes]: https://github.com/ezzatron/fake-permissions/releases/v0.7.0

## [v0.10.1] - 2024-07-10

[v0.10.1]: https://github.com/ezzatron/fake-geolocation/releases/tag/v0.10.1

### Fixed

- Fixed an issue where calling `watchPosition()` with a `maximumAge` of
  `Infinity` would cause the `successCallback` to be called with the first
  cached position indefinitely, even when setting new coordinates via location
  services.

## [v0.10.0] - 2024-07-05

[v0.10.0]: https://github.com/ezzatron/fake-geolocation/releases/tag/v0.10.0

### Added

- Added the `GeolocationPositionParameters` type, which can be used for typing
  simple objects that have the same properties as `GeolocationPosition`, but
  don't implement the full interface.

## [v0.9.0] - 2024-07-04

[v0.9.0]: https://github.com/ezzatron/fake-geolocation/releases/tag/v0.9.0

### Added

- Added `toJSON()` methods to `GeolocationCoordinates` and
  `GeolocationPosition`.
- Added the `GeolocationCoordinatesParameters` type, which can be used for
  typing simple objects that have the same properties as
  `GeolocationCoordinates`, but don't implement the full interface.

### Changed

- Errors thrown from `successCallback` and `errorCallback` arguments to
  `getCurrentPosition()` and `watchPosition()` are now thrown asynchronously,
  instead of being discarded.
- Errors thrown from subscriber functions used in geolocation delegates and
  location services are now thrown asynchronously, instead of being discarded.

## [v0.8.1] - 2024-06-21

[v0.8.1]: https://github.com/ezzatron/fake-geolocation/releases/tag/v0.8.1

### Fixed

- Fixed an issue where passing explicit `undefined` values to
  `createCoordinates()` or `createPosition()` could produce a
  `GeolocationCoordinates` object with `undefined` properties.

## [v0.8.0] - 2024-06-21

[v0.8.0]: https://github.com/ezzatron/fake-geolocation/releases/tag/v0.8.0

### Changed

- The `createCoordinates()` and `createPosition()` functions now have optional
  arguments, making them more useful for creating test data. The
  `isHighAccuracy` argument now defaults to `true`, and other omitted arguments
  or properties will be filled with "empty" values:
  - `0` for `latitude`, `longitude`, `accuracy`, and `timestamp`.
  - `null` for `altitude`, `altitudeAccuracy`, `heading`, and `speed`.

### Added

- Added [`Symbol.toStringTag`] methods to all `Geolocation`,
  `GeolocationPosition`, `GeolocationCoordinates`, and
  `GeolocationPositionError` objects.

[`Symbol.toStringTag`]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Symbol/toStringTag

## [v0.7.0] - 2023-12-05

[v0.7.0]: https://github.com/ezzatron/fake-geolocation/releases/tag/v0.7.0

### Changed

- Watched positions now receive updates when location services are disabled, and
  also when they are re-enabled.
- Watched positions now receive updates when the `geolocation` permission is
  re-granted after being revoked.

## [v0.6.2] - 2023-11-28

[v0.6.2]: https://github.com/ezzatron/fake-geolocation/releases/tag/v0.6.2

### Fixed

- Fixed a race condition that could occur when permission state changes from
  `granted` while waiting to acquire coordinates from location services.

## [v0.6.1] - 2023-11-28

[v0.6.1]: https://github.com/ezzatron/fake-geolocation/releases/tag/v0.6.1

### Fixed

- Fixed a linting error in the changelog.

## [v0.6.0] - 2023-11-28

[v0.6.0]: https://github.com/ezzatron/fake-geolocation/releases/tag/v0.6.0

### Changed

- Changing the `geolocation` permission from `granted` while watching a position
  will now cause an immediate call to the error callback with a
  `PERMISSION_DENIED` error. This should be ergonomic for testing, as previously
  you'd have to change the permission _and_ jump to a new location to trigger
  an error.

## [v0.5.2] - 2023-11-28

[v0.5.2]: https://github.com/ezzatron/fake-geolocation/releases/tag/v0.5.2

### Fixed

- Fixed _potential_ race condition that may have been possible to create when
  `watchPosition()` is used with an `errorCallback`, and an error occurs after
  `clearWatch()` is called.

## [v0.5.1] - 2023-11-27

[v0.5.1]: https://github.com/ezzatron/fake-geolocation/releases/tag/v0.5.1

### Fixed

- Fixed a race condition that could occur with `watchPosition()` where the
  success callback could be called after `clearWatch()` was called.

## [v0.5.0] - 2023-11-27

[v0.5.0]: https://github.com/ezzatron/fake-geolocation/releases/tag/v0.5.0

### Added

- Add waitForPositionError()

## [v0.4.0] - 2023-11-23

[v0.4.0]: https://github.com/ezzatron/fake-geolocation/releases/tag/v0.4.0

### Changed

- **\[BREAKING]** `createDelegatedGeolocation()` now requires a
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

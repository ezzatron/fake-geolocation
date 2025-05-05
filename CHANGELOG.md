# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog], and this project adheres to [Semantic
Versioning].

[keep a changelog]: https://keepachangelog.com/en/1.0.0/
[semantic versioning]: https://semver.org/spec/v2.0.0.html

## Unreleased

### Added

- Added the `CreateAPIsParameters` type.
- Added the `CreateWrappedAPIsParameters` type.
- Added the `DelegatedGeolocationParameters` type.
- Added the `LocationServicesParameters` type.
- Added the `UserParameters` type.

### Changed

- **\[BREAKING]** The `normalizeCoordinates` option of the `createUser()`
  function was renamed to `createCoordinates`.

### Removed

- **\[BREAKING]** Stopped exporting internal classes that shadow W3C classes:
  - `GeolocationCoordinates`
  - `GeolocationPositionError`
  - `GeolocationPosition`
  - `Geolocation`

## [v0.16.0] - 2025-05-02

[v0.16.0]: https://github.com/ezzatron/fake-geolocation/releases/tag/v0.16.0

### Added

- Added the `GeolocationParameters` type.
- Added the `LocationServicesSubscriber` type.

## [v0.15.0] - 2024-08-21

[v0.15.0]: https://github.com/ezzatron/fake-geolocation/releases/tag/v0.15.0

### Changed

- **\[BREAKING]** This release updates the version of `fake-permissions` used
  for permissions handling to `v0.14.x`, which includes breaking changes. See
  the [`fake-permissions@v0.14.0` release notes] for details and updated usage
  examples.

[`fake-permissions@v0.14.0` release notes]:
  https://github.com/ezzatron/fake-permissions/releases/v0.14.0

## [v0.14.0] - 2024-08-19

[v0.14.0]: https://github.com/ezzatron/fake-geolocation/releases/tag/v0.14.0

### Changed

- **\[BREAKING]** This release updates the version of `fake-permissions` used
  for permissions handling to `v0.13.x`, which includes breaking changes. See
  the [`fake-permissions@v0.13.0` release notes] for details and updated usage
  examples.

[`fake-permissions@v0.13.0` release notes]:
  https://github.com/ezzatron/fake-permissions/releases/v0.13.0

## [v0.13.2] - 2024-08-09

[v0.13.2]: https://github.com/ezzatron/fake-geolocation/releases/tag/v0.13.2

### Fixed

- Fixed an issue that prevented `observer.waitForCoordinates()` from working
  with coordinates that have a `NaN` value for the `heading` property.
- Fixed a race condition that could prevent geolocation positions from being
  dispatched to a position watch before an associated
  `observer.waitForCoordinates()` call resolved.

## [v0.13.1] - 2024-08-08

[v0.13.1]: https://github.com/ezzatron/fake-geolocation/releases/tag/v0.13.1

### Fixed

- Fixed a memory leak in the Geolocation API implementation.

## [v0.13.0] - 2024-08-08

[v0.13.0]: https://github.com/ezzatron/fake-geolocation/releases/tag/v0.13.0

### Changed

- **\[BREAKING]** This release includes an update to the version of
  `fake-permissions` used for permissions handling, which includes many breaking
  changes. See the [`fake-permissions` releases] for details.
- **\[BREAKING]** The `createGeolocation()` function no longer takes a `user`
  option. Access requests are now handled by the `permissionStore` object.

[`fake-permissions` releases]:
  https://github.com/ezzatron/fake-permissions/releases

## [v0.12.0] - 2024-08-08

[v0.12.0]: https://github.com/ezzatron/fake-geolocation/releases/tag/v0.12.0

### Removed

- **\[BREAKING]** Removed the `waitForCoordinates()` function - use [geolocation
  observers] instead.
- **\[BREAKING]** Removed the `waitForPositionError()` function - use
  [geolocation observers] instead.
- **\[BREAKING]** Removed the `compareCoordinates()` function.

### Changed

- **\[BREAKING]** Location services will no longer delay acquisition of
  coordinates unless the `acquireDelay` option is explicitly set to an amount of
  milliseconds. This makes coordinate jumps more predictable when using
  `fake-geolocation` in tests.

### Added

- Added [geolocation observers].
- The `createAPIs()` and `createWrappedAPIs()` functions now return a
  geolocation observer in the `observer` property.
- Added the `createGeolocationObserver()` function, which creates a new
  geolocation observer.
- The `createAPIs()` and `createWrappedAPIs()` functions now accept an
  `acquireDelay` option, which is passed along to the location services.
- Added the `GeolocationObserver` type.
- Added the `GeolocationPositionErrorCode` type, which is an enum of all the
  possible error codes that can be thrown by the Geolocation API.
- Added `PERMISSION_DENIED`, `POSITION_UNAVAILABLE`, and `TIMEOUT` as exported
  constants. These are useful when waiting for specific errors with
  `observer.waitForPositionError()`.

[geolocation observers]: #geolocation-observers

#### Geolocation observers

This release adds geolocation observers, which can be used to wait for specific
changes to the coordinates or errors produced by a Geolocation API. This can be
useful for testing scenarios where you want to wait for a specific state to be
reached before continuing.

Observers are created for you when you call `createAPIs()` or
`createWrappedAPIs()`. You can wait for specific sets of coordinates by calling
`observer.waitForCoordinates()`, wait for specific geolocation errors by calling
`observer.waitForPositionError()`, or wait for specific `geolocation` permission
states by calling `observer.waitForPermissionState()`.

```ts
import {
  createAPIs,
  createCoordinates,
  PERMISSION_DENIED,
  POSITION_UNAVAILABLE,
} from "fake-geolocation";

const { geolocation, observer, permissions, user } = createAPIs();

// We need some coords to start with
const coordsA = createCoordinates({ latitude: 1, longitude: 2 });
const coordsB = createCoordinates({ latitude: 3, longitude: 4 });

// Jump to some coords and grant permission
user.jumpToCoordinates(coordsA);
user.grantAccess({ name: "geolocation" });

// Start watching the position
let position: GeolocationPosition | undefined;
let error: GeolocationPositionError | undefined;
geolocation.watchPosition(
  (p) => {
    position = p;
  },
  (e) => {
    error = e;
  },
);

// Start a Permissions API query
const status = await permissions.query({ name: "geolocation" });

// Wait for the position to be at coordsA
await observer.waitForCoordinates(coordsA);
// Outputs "true"
console.log(position?.coords.latitude === coordsA.latitude);

// Wait for the position to be at coordsA OR coordsB
await observer.waitForCoordinates([coordsA, coordsB]);
// Outputs "true"
console.log(position?.coords.latitude === coordsA.latitude);

// Wait for the position to have a latitude of 1
await observer.waitForCoordinates({ latitude: 1 });
// Outputs "true"
console.log(position?.coords.latitude === 1);

// Wait for the position to be at coordsB, while running a task
await observer.waitForCoordinates(coordsB, async () => {
  user.jumpToCoordinates(coordsB);
});
// Outputs "true"
console.log(position?.coords.latitude === coordsB.latitude);

// Wait for the position to be at coordsB, using high accuracy
await observer.waitForCoordinates(coordsB, undefined, {
  enableHighAccuracy: true,
});
// Outputs "true"
console.log(position?.coords.latitude === coordsB.latitude);

user.disableLocationServices();

// Wait for a POSITION_UNAVAILABLE error
await observer.waitForPositionError(POSITION_UNAVAILABLE);
// Outputs "true"
console.log(error?.code === POSITION_UNAVAILABLE);

// Wait for a POSITION_UNAVAILABLE OR PERMISSION_DENIED error
await observer.waitForPositionError([POSITION_UNAVAILABLE, PERMISSION_DENIED]);
// Outputs "true"
console.log(error?.code === POSITION_UNAVAILABLE);

// Wait for a PERMISSION_DENIED error, while running a task
await observer.waitForPositionError(PERMISSION_DENIED, async () => {
  user.blockAccess({ name: "geolocation" });
});
// Outputs "true"
console.log(error?.code === PERMISSION_DENIED);

// You can also wait for geolocation permission states
await observer.waitForPermissionState("granted", async () => {
  user.grantAccess({ name: "geolocation" });
});
// Outputs "true"
console.log(status.state === "granted");
```

### Fixed

- Errors that are thrown asynchronously now use `queueMicrotask()` instead of
  `setTimeout()`.

## [v0.11.1] - 2024-08-06

[v0.11.1]: https://github.com/ezzatron/fake-geolocation/releases/tag/v0.11.1

### Fixed

- Updated version constraint for `fake-permissions`.

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

[`fake-permissions@v0.7.0` release notes]:
  https://github.com/ezzatron/fake-permissions/releases/v0.7.0

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

[`Symbol.toStringTag`]:
  https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Symbol/toStringTag

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
  you'd have to change the permission _and_ jump to a new location to trigger an
  error.

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

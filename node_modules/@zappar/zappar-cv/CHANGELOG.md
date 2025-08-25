# Changelog

## [2.1.4] - 2023-07-06

- Whitelisted `*.ngrok-free.app` domain.

## [2.1.3] - 2023-06-23

### Fixed

- Performance issues when using curved tracking.

## [2.0.2] - 2023-05-04

### Fixed

- Unique user calculation when using the Zapworks built-in analytics system

## [2.0.1] - 2023-03-24

### Fixed

- Workaround for bug in iOS Safari 16.4 that selects the wrong rear-facing camera on some devices

## [2.0.0] - 2022-08-23

### Added

- Greatly improved instant tracking.
- Introduced `SequenceSource` and pipeline functions to record and playback sequences of camera+motion data.
- Added support for curved tracking.
- Added support for fetching image element containing target image's embedded preview image.
- Improved GL state management.

### Changed

- Migrated to Webpack 5 workers.

### **Breaking:**

- Dropped support for webpack 4.

## [0.3.17] - 2022-07-21

### Fixed

- Preserve `TextureAttribDivisor`, `VertexAttribDivisor` and `STENCIL_TEST` WebGL state.

## [0.3.16] - 2021-02-07

### Fixed

- External WebGL state is preserved during `process_gl` calls

## [0.3.15] - 2021-01-25

### Fixed

- Issues on iPad Pro

## [0.3.14] - 2021-10-25

### Changed

- Pinned dependencies to exact versions

## [0.3.13] - 2021-10-11

### Fixed

- A broken licencing url.

## [0.3.12] - 2021-09-28

### Fixed

- Safari logo not appearing on incompatible browser screen
- Issues with iPad devices

## [0.3.11] - 2021-09-17

### Fixed

- Issues with other browsers on iOS, including social browsers

## [0.3.10] - 2021-09-17

### Added

- loaded() function which returns true once the library is fully loaded and available for use

### Changed

- Bucket 172.* IP address range into one license check.

## [0.3.9] - 2021-04-22

### Added

- `projection_matrix_from_camera_model_ext` that exposes near and far clipping planes.

## [0.3.8] - 2021-02-18

### Added

- pipeline_gl_context_lost to indicate that the GL context is lost
- log_level and log_level_set to customize volume of log output

### Changed

- License checks now only happen on first pipeline construction

### Fixed

- pipeline_gl_context_set correctly handles multiple invocations

## [0.3.7] - 2021-02-03

### Fixed

- Issues on Chrome for iOS
- NPM audit dependency updates

## [0.3.6] - 2021-01-18

### Fixed

- Issue where wasm would not load on some webpack versions

## [0.3.5] - 2020-11-26

### Added

- This changelog :-)
- Console log the version when the library is initialized

### Fixed

- Prevent flickering when there are no new camera frames
- Fixed building with recent versions of `worker-loader`

### Changed

- Dependencies update
- Remove unnecessary console logging

## [0.3.4] - 2020-11-18

### Fixed

- Ensure internal GL usage correctly sets the expected active texture

## [0.3.3] - 2020-11-04

### Added

- Browser compatibility API and UI

### Changed

- Modifications to browser compatibility API

## [0.3.2] - 2020-11-04

### Added

- Browser compatibility API and UI

### Fixed

- Support for Firefox

## [0.3.1] - 2020-11-03

### Fixed

- Various enums are now available as objects
- Removed unnecessary TypeScript files included in deployment

## [0.3.0] - 2020-11-02

### Added

- Support for face landmarks
- Greatly improved face tracking model

### Fixed

- Fixes to iPad support

### Changed

- Dependencies update

## [0.2.12] - 2020-10-19

### Fixed

- Fixes to iPad support

### Changed

- Dependencies update

## [0.2.11] - 2020-09-15

### Fixed

- Fix issues with iOS 14

### Changed

- Dependencies update

## [0.2.9] - 2020-07-08

### Fixed

- Tweaks to computer vision algorithms

## [0.2.6] - 2020-06-09

### Added

- Support for full head meshes

## [0.2.4] - 2020-06-02

### Added

- Support for NGROK

## [0.2.3] - 2020-05-26

Initial release

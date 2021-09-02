# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Supports for sub-object in schema `props` is now limited to 1 level deep.
  __*(Incompatible with older releases)*__

### Removed
- `{ type: PropType; optional: boolean; }` syntax for `attr` section of
  `Schema`. __*(Incompatible with older releases)*__

## [0.1.0-rc.1] - 2021-08-22

### Added
- Implementation of AWS DynamoDB client attachment to class `TyODM`.

## [0.1.0-rc.0] - 2021-08-08

### Added
- Foundation components such as `TyODM`, `Obj`, etc...
- `README` with basic usage guideline.

### Remarks
- Currently not functional. Just publishing partial components & APIs layout of
the package.

[Unreleased]: https://github.com/Devtography/tyodm/0.1.0-rc.1...HEAD
[0.1.0-rc.1]: https://github.com/Devtography/tyodm/releases/tag/0.1.0-rc.1
[0.1.0-rc.0]: https://github.com/Devtography/tyodm/releases/tag/0.1.0-rc.0
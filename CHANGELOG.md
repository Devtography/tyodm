# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0-rc.4] - 2021-09-30

### Added
- `NaNError` to indicate the value in concern is not a number.

### Fixed
- Issue of precision lost after 17 digits on value of `decimal` types variables
  by mapping the data to JavaScript type `string` instead of `number`.
  __*(Incompatible with older releases)*__
- Issue of `decimal<>` type data not being handled when mapping to Amazon
  DynamoDB data type.

## [0.1.0-rc.3] - 2021-09-29

### Added
- Short sample of `TyODM` usage with Amazon DynamoDB in [README#Getting started].

### Changed
- Moved usage of custom constructor from the code snippet of [README#Getting started]
  to [README#Custom identifier & constructor].

### Fixed
- Issue of incorrect mapping of array type `TyODM` objects to Amazon DynamoDB
  data type by mapping those to DynamoDB `List` instead of `Sets`. 

## [0.1.0-rc.2] - 2021-09-21

### Added
- Public functions `insertObj`, `insertOne`, `updateOne`, `deleteOne` in base
  TyODM object class `Obj` for database write operations.
- Errors `MaxWriteActionExceededError`, `DBClientNotAttachedError`,
  `SchemaNotMatchError`, `InvalidSchemaError`, `NotImplementedError`,
  `InvalidPropertyError`.
- Basic CRUD operations support for Amazon DynamoDB.

### Changed
- Supports for sub-object in schema `props` is now limited to 1 level deep.
  __*(Incompatible with older releases)*__
- Implemented public function `objectByKey<T extends Obj>` in `TyODM`.
- Functions `objects<T extends Obj>` and `partialObject<T extends Obj>` in
  `TyODM` to throw `NotImplementedError` on invoked.
- Most functions invoke on `TyODM` instance initialised with a `MongoDBConfig`
  now throw `NotImplementedError`.
- Requirements of custom TyODM object identifier & constructor support.
  See [README#Identifier] for details.
- Updated package dependencies.
- Updated `README`.

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

[README#Getting started]: https://github.com/Devtography/tyodm/blob/master/README.md#getter-started
[README#Custom identifier & constructor]: https://github.com/Devtography/tyodm/blob/master/README.md#custom-identifier--constructor
[README#Identifier]: https://github.com/Devtography/tyodm/blob/0.1.0-rc.2/README.md#identifier

[Unreleased]: https://github.com/Devtography/tyodm/0.1.0-rc.4...HEAD
[0.1.0-rc.4]: https://github.com/Devtography/tyodm/releases/tag/0.1.0-rc.4
[0.1.0-rc.3]: https://github.com/Devtography/tyodm/releases/tag/0.1.0-rc.3
[0.1.0-rc.2]: https://github.com/Devtography/tyodm/releases/tag/0.1.0-rc.2
[0.1.0-rc.1]: https://github.com/Devtography/tyodm/releases/tag/0.1.0-rc.1
[0.1.0-rc.0]: https://github.com/Devtography/tyodm/releases/tag/0.1.0-rc.0

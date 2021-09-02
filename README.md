# TyODM

Fully typed opinionated ODM inspired by Realm & Mongoose. Designed to be 
compatible with various NoSQL database engines.

## Getting started

```sh
npm install @devtography/tyodm
```

```typescript
import * as odm from '@devtography/tyodm';

class SampleModel extends odm.Obj {
  static SCHEMA: Schema = {
    name: 'SampleModel',
    props: {
      metadata: {
        type: 'single',
        attr: {
          name: 'string',
          desc: 'string?',
          active: 'bool',
          extra: { someNumber: 'double' },
        },
      },
      itemCollection: {
        type: 'collection',
        identifier: 'itemId',
        attr: { itemId: 'string', name: 'string' },
      },
    },
  };

  metadata?: {
    name: string,
    desc?: string,
    active: boolean,
    extra?: { someNumber: number }, // Nested object must be optional
  };
  itemCollection?: Map<string, { itemId: string, name: string }>;

  constructor() {
    // Only default constructor & constructor with optional parameters ae
    // allowed. Constructor with non optional parameters will result in
    // runtime exception.
    super()

    ...
  }

  objectSchema(): Schema {
    return SampleModel.SCHEMA; // Expect to return the same schema from class.
  }
}

const odm = new odm.TyODM({
  region: 'us-east-2',
  endpoint: 'http://localhost:8000',
  table: 'sample',
  schema: new Map<string, odm.Schema>([
    'SampleModel': SampleModel.SCHEMA,
  ]),
});
```

## Remarks

While you can have multiple tables/collections in your database, the way `TyODM`
handles the data pretty much follows the single table design. The following
example shows how the data schema looks like in your database correspond to the
data models.

```typescript
class Alpha extends odm.Obj {
  static SCHEMA: odm.Schema = { 
    name: 'Alpha',
    props: {
      singularRecord: {
        type: 'single',
        attr: { fieldA: 'string' },
      },
      subCat1: {
        type: 'collection',
        identifier: 'id',
        attr: { id: 'string', subFieldA: 'int' }
      },
      subCat2: {
        type: 'collection',
        identifier: 'id',
        attr: { id: 'string', subFieldA: 'double', subFieldB: 'int' },
      },
    }
   };

  singularRecord?: { fieldA: string };
  subCat1?: Map<string, { id: string, subFieldA: number }>;
  subCat2?: Map<string, { id; string, subFieldA: number, subFieldB: string }>;

  ...
}
```

| Collection                       | Sub collection |            |               |               |
|----------------------------------|----------------|------------|---------------|---------------|
|                                  |                | __fieldA__ |               |               |
| Alpha#01FCBEBM470CA8BN7B2H95SQ7X | singularRecord | `'abc'`    |               |               |
|                                  |                | __id__     | __subFieldA__ |               |
|                                  | subCat1#01A    | `'01A'`    | `10`          |               |
|                                  | subCat1#01B    | `'01B'`    | `11`          |               |
|                                  |                | __id__     | __subFieldA__ | __subFieldB__ |
|                                  | subCat2#02A    | `'02A'`    | `7.62`        | `1`           |
|                                  | subCat2#02B    | `'02B'`    | `0.45`        | `2`           |

### __Identifier__

For the class/collection level unique identifier, by default there's an `ULID`
generated for each instance on initialisation. Alternatively, a custom
identifier can also be set as following:

```typescript
class Beta extends odm.Obj {
  static SCHEMA: odm.Schema = {
    name: 'Beta',
    identifier: 'customId',
    props: { ... }
  };

  customId: string = '';

  ...
}
```

__Be caution__, by setting your own class/collection level identifier,
you must make sure its' value for each instance under the same class is unique,
otherwise you might corrupt your data on the table.

In terms of sub-collection level identifier, there's no default provided like
the class/collection level one. The sub-collection level will have to be
specified in the schema as following:

```typescript
class Charlie extends odm.Obj {
  static SCHEMA: odm.Schema = {
    name: 'Charlie',
    props: {
      sub: {
        type: 'collection',
        identifier: 'relatedAlpha',
        attr: { relatedAlpha: 'string', isCharlie: 'bool' },
      },
    },
  };

  sub: Map<string, { relatedAlpha: string, isCharlie: boolean }>
  
  ...
}

// console.log
//   Charlie {
//     sub: { relatedAlpha: '01FCBEBM470CA8BN7B2H95SQ7X', isCharlie: true )
//   }
```

*The value can only be `string` for both class/collection and sub-collection
level identifiers. Exception may be thrown if otherwise.*

## Support the project
Contributions via pull requests are welcome and encouraged. If there's anything
you consider essential that should be included in this boilerplate, please don't
hesitate to implement yourself and make a pull request :)

Same as the other open sources projects in [@Devtography], I maintain & further
develop this boilerplate with my free time. If you found my work useful and
wanna support me keep on doing all these, please consider
[donate/sponsor](https://github.com/sponsors/iamWing) me.

## Author
[Wing Chau](https://github.com/iamWing) [@Devtography]

## License
TyODM is open source software [licensed as MIT](LICENSE).

[@Devtography]: https://github.com/Devtography

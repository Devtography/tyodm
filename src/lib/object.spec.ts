import { Obj } from './object';
import { Schema } from './schema';

class MockObj extends Obj {
  static SCHEMA: Schema = {
    name: 'MockObj',
    identifier: 'ulid',
    props: {
      meta: {
        type: 'single',
        attr: {
          name: 'string',
        },
      },
    },
  };

  ulid = 'ulid';

  objectSchema(): Schema {
    return MockObj.SCHEMA;
  }
}

it('`objectId` should returns the value of identifier specified in schema',
  () => {
    const obj = new MockObj();

    expect(obj.objectId).toEqual(obj.ulid);
  });

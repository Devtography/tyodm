import { ulid } from 'ulid';
import { Obj } from '../lib/object';
import { Schema } from '../lib/schema';

class MockObj extends Obj {
  static SCHEMA: Schema = {
    name: 'MockObj',
    identifier: 'ulid',
    props: {
      meta: { type: 'single', attr: { objName: 'string', objRank: 'int?' } },
      row1: { type: 'single', attr: { subObj: { prop1: 'decimal[]' } } },
      collection: {
        type: 'collection',
        identifier: 'collectionId',
        attr: { collectionId: 'string', sampleSet: 'int[]' },
      },
    },
  };

  ulid: string;
  meta?: { objName: string, objRank?: number };
  row1?: { subObj: { prop1: number[] } };
  collection?: Map<string, { collectionId: string, sampleSet: number[] }>;

  constructor(objId?: string) {
    super(objId);

    this.ulid = objId || ulid();
  }

  objectSchema(): Schema { return MockObj.SCHEMA; }
}

export { MockObj };
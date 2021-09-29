/* eslint-disable object-property-newline */
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
        attr: { collectionId: 'string', sampleIntArr: 'int[]' },
      },
      sample: {
        type: 'single',
        attr: {
          sampleBool: 'bool', sampleBoolArr: 'bool[]', sampleBoolSet: 'bool<>',
          sampleInt: 'int', sampleIntArr: 'int[]', sampleIntSet: 'int<>',
          sampleDouble: 'double', sampleDoubleArr: 'double[]',
          sampleDoubleSet: 'double<>',
          sampleDecimal: 'decimal', sampleDecimalArr: 'decimal[]',
          sampleDecimalSet: 'decimal<>',
          sampleStr: 'string', sampleStrArr: 'string[]',
          sampleStrSet: 'string<>',
          sampleOptional: 'string?',
        },
      },
    },
  };

  ulid: string;
  meta?: { objName: string, objRank?: number };
  row1?: { subObj: { prop1: string[] } };
  collection?: Map<string, { collectionId: string, sampleIntArr: number[] }>;
  sample?: {
    sampleBool: boolean, sampleBoolArr: boolean[], sampleBoolSet: Set<boolean>,
    sampleInt: number, sampleIntArr: number[], sampleIntSet: Set<number>,
    sampleDouble: number, sampleDoubleArr: number[],
    sampleDoubleSet: Set<number>,
    sampleDecimal: string, sampleDecimalArr: string[],
    sampleDecimalSet: Set<string>,
    sampleStr: string, sampleStrArr: string[], sampleStrSet: Set<string>,
    sampleOptional?: string,
  };

  constructor(objId?: string) {
    super(objId);

    this.ulid = objId || ulid();
  }

  objectSchema(): Schema { return MockObj.SCHEMA; }
}

export { MockObj };

import * as mapper from './dynamodb';

describe('function `toDBDataType`', () => {
  it('should return DynamoDB `Boolean` for `bool`', () => {
    expect(mapper.toDBDataType('bool')).toBe('BOOL');
    expect(mapper.toDBDataType('bool?')).toBe('BOOL');
  });

  it('should return DynamoDB `Array` for `bool` array & set', () => {
    expect(mapper.toDBDataType('bool[]')).toBe('L');
    expect(mapper.toDBDataType('bool<>')).toBe('L');
  });

  it('should return DynamoDB `Number` for `int` & `double`', () => {
    expect(mapper.toDBDataType('int')).toBe('N');
    expect(mapper.toDBDataType('int?')).toBe('N');
    expect(mapper.toDBDataType('double')).toBe('N');
    expect(mapper.toDBDataType('double?')).toBe('N');
  });

  it('should return DynamoDB `Number Set` for `int` & `double` array & set',
    () => {
      expect(mapper.toDBDataType('int[]')).toBe('NS');
      expect(mapper.toDBDataType('int<>')).toBe('NS');
      expect(mapper.toDBDataType('double[]')).toBe('NS');
      expect(mapper.toDBDataType('double<>')).toBe('NS');
    });

  it('should return DynamoDB `String` for `string` & `decimal`', () => {
    expect(mapper.toDBDataType('string')).toBe('S');
    expect(mapper.toDBDataType('string?')).toBe('S');
    expect(mapper.toDBDataType('decimal')).toBe('S');
    expect(mapper.toDBDataType('decimal?')).toBe('S');
  });

  it('should return DynamoDB `String Set` for `string` & `decimal` array & set',
    () => {
      expect(mapper.toDBDataType('string[]')).toBe('SS');
      expect(mapper.toDBDataType('string<>')).toBe('SS');
      expect(mapper.toDBDataType('decimal[]')).toBe('SS');
      expect(mapper.toDBDataType('decimal<>')).toBe('SS');
    });
});

describe('function `mapper.assignValToObjProp`', () => {
  let obj: Record<string, unknown>;

  beforeEach(() => { obj = {}; });

  it('should assign a boolean to target property', () => {
    expect(() => {
      mapper.assignValToObjProp({ BOOL: true }, 'bool', obj, 'prop');
    }).not.toThrow();

    expect(obj.prop).toEqual(true);
  });

  it('should assign a `bool[]` to target property', () => {
    expect(() => {
      mapper.assignValToObjProp(
        { L: [{ BOOL: true }, { BOOL: false }, { BOOL: false }] },
        'bool[]', obj, 'prop',
      );
    }).not.toThrow();

    expect(obj.prop).toEqual([true, false, false]);
  });

  it('should assign a `Set<bool>` to target property', () => {
    expect(() => {
      mapper.assignValToObjProp({ L: [{ BOOL: true }, { BOOL: false }] },
        'bool<>', obj, 'prop');
    }).not.toThrow();

    expect(obj.prop).toEqual(new Set([true, false]));
  });

  it('should assign an integer to target property', () => {
    expect(() => {
      mapper.assignValToObjProp({ N: '10' }, 'int', obj, 'prop');
    }).not.toThrow();

    expect(obj.prop).toEqual(10);
  });

  it('should assign a `double` to target property', () => {
    expect(() => {
      mapper.assignValToObjProp({ N: '3.141516789' }, 'double', obj, 'prop');
    }).not.toThrow();

    expect(obj.prop).toEqual(3.141516789);
  });

  it('should assign a `int[]` to target property', () => {
    expect(() => {
      mapper.assignValToObjProp({ NS: ['1', '1', '3'] }, 'int[]', obj, 'prop');
    }).not.toThrow();

    expect(obj.prop).toEqual([1, 1, 3]);
  });

  it('should assign a `double[]` to target property', () => {
    expect(() => {
      mapper.assignValToObjProp({ NS: ['1.01', '2.02', '3.33'] },
        'double[]', obj, 'prop');
    }).not.toThrow();

    expect(obj.prop).toEqual([1.01, 2.02, 3.33]);
  });

  it('should assign a `Set<int>` to target property', () => {
    expect(() => {
      mapper.assignValToObjProp({ NS: ['1', '2', '3'] }, 'int<>', obj, 'prop');
    }).not.toThrow();

    expect(obj.prop).toEqual(new Set([1, 2, 3]));
  });

  it('should assign a `Set<double>` to target property', () => {
    expect(() => {
      mapper.assignValToObjProp({ NS: ['1.11', '2.22', '3.33'] },
        'double<>', obj, 'prop');
    }).not.toThrow();

    expect(obj.prop).toEqual(new Set([1.11, 2.22, 3.33]));
  });

  it('should assign a `decimal` to target property', () => {
    expect(() => {
      mapper.assignValToObjProp({ S: '1023958.204836967123' }, 'decimal',
        obj, 'prop');
    }).not.toThrow();

    expect(obj.prop).toEqual(1023958.204836967123);
  });

  it('should assign a `decimal[]` to target property', () => {
    expect(() => {
      mapper.assignValToObjProp(
        { SS: ['1.1234567890', '2.23456789', '3.3456789'] },
        'decimal[]', obj, 'prop',
      );
    }).not.toThrow();

    expect(obj.prop).toEqual([1.123456789, 2.23456789, 3.3456789]);
  });

  it('should assign a `Set<decimal>` to target property', () => {
    expect(() => {
      mapper.assignValToObjProp(
        { SS: ['1.123456789', '2.23456789', '3.3456789'] },
        'decimal<>', obj, 'prop',
      );
    }).not.toThrow();
  });

  it('should assign a `string` to target property', () => {
    expect(() => {
      mapper.assignValToObjProp({ S: 'string' }, 'string', obj, 'prop');
    }).not.toThrow();

    expect(obj.prop).toEqual('string');
  });

  it('should assign a `string[]` to target property', () => {
    expect(() => {
      mapper.assignValToObjProp({ SS: ['a', 'b', 'b'] },
        'string[]', obj, 'prop');
    }).not.toThrow();

    expect(obj.prop).toEqual(['a', 'b', 'b']);
  });

  it('should assign a `Set<string>` to target property', () => {
    expect(() => {
      mapper.assignValToObjProp({ SS: ['a', 'b', 'c'] },
        'string<>', obj, 'prop');
    }).not.toThrow();

    expect(obj.prop).toEqual(new Set(['a', 'b', 'c']));
  });

  it('should ignore the optional signature', () => {
    expect(() => {
      mapper.assignValToObjProp({ S: 'abc' }, 'string?', obj, 'prop');
    }).not.toThrow();

    expect(obj.prop).toEqual('abc');
  });
});

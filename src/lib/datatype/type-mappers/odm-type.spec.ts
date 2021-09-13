import { assignValToObjProp } from './odm-type';

let obj: Record<string, unknown>;

beforeEach(() => {
  obj = {};
});

it('should assign a boolean to target property', () => {
  expect(() => {
    assignValToObjProp(true, 'bool', obj, 'prop');
  }).not.toThrow();

  expect(obj.prop).toEqual(true);
});

it('should assign a `bool[]` to target property', () => {
  expect(() => {
    assignValToObjProp([{ BOOL: true }, { BOOL: false }, { BOOL: false }],
      'bool[]', obj, 'prop');
  }).not.toThrow();

  expect(obj.prop).toEqual([true, false, false]);
});

it('should assign a `Set<bool>` to target property', () => {
  expect(() => {
    assignValToObjProp([{ BOOL: true }, { BOOL: false }],
      'bool<>', obj, 'prop');
  }).not.toThrow();

  expect(obj.prop).toEqual(new Set([true, false]));
});

it('should assign an integer to target property', () => {
  expect(() => { assignValToObjProp('10', 'int', obj, 'prop'); }).not.toThrow();

  expect(obj.prop).toEqual(10);
});

it('should assign a `double` to target property', () => {
  expect(() => {
    assignValToObjProp('3.141516789', 'double', obj, 'prop');
  }).not.toThrow();

  expect(obj.prop).toEqual(3.141516789);
});

it('should assign a `decimal` to target property', () => {
  expect(() => {
    assignValToObjProp('1023958.204836967123', 'decimal', obj, 'prop');
  }).not.toThrow();

  expect(obj.prop).toEqual(1023958.204836967123);
});

it('should assign a `int[]` to target property', () => {
  expect(() => {
    assignValToObjProp(['1', '1', '3'], 'int[]', obj, 'prop');
  }).not.toThrow();

  expect(obj.prop).toEqual([1, 1, 3]);
});

it('should assign a `double[]` to target property', () => {
  expect(() => {
    assignValToObjProp(['1.01', '2.02', '3.33'], 'double[]', obj, 'prop');
  }).not.toThrow();

  expect(obj.prop).toEqual([1.01, 2.02, 3.33]);
});

it('should assign a `decimal[]` to target property', () => {
  expect(() => {
    assignValToObjProp(['1.1234567890', '2.23456789', '3.3456789'],
      'decimal[]', obj, 'prop');
  }).not.toThrow();

  expect(obj.prop).toEqual([1.123456789, 2.23456789, 3.3456789]);
});

it('should assign a `Set<int>` to target property', () => {
  expect(() => {
    assignValToObjProp(['1', '2', '3'], 'int<>', obj, 'prop');
  }).not.toThrow();

  expect(obj.prop).toEqual(new Set([1, 2, 3]));
});

it('should assign a `Set<double>` to target property', () => {
  expect(() => {
    assignValToObjProp(['1.11', '2.22', '3.33'], 'double<>', obj, 'prop');
  }).not.toThrow();

  expect(obj.prop).toEqual(new Set([1.11, 2.22, 3.33]));
});

it('should assign a `Set<decimal>` to target property', () => {
  expect(() => {
    assignValToObjProp(['1.123456789', '2.23456789', '3.3456789'],
      'decimal<>', obj, 'prop');
  }).not.toThrow();
});

it('should assign a `string` to target property', () => {
  expect(() => {
    assignValToObjProp('string', 'string', obj, 'prop');
  }).not.toThrow();

  expect(obj.prop).toEqual('string');
});

it('should assign a `string[]` to target property', () => {
  expect(() => {
    assignValToObjProp(['a', 'b', 'b'], 'string[]', obj, 'prop');
  }).not.toThrow();

  expect(obj.prop).toEqual(['a', 'b', 'b']);
});

it('should assign a `Set<string>` to target property', () => {
  expect(() => {
    assignValToObjProp(['a', 'b', 'c'], 'string<>', obj, 'prop');
  }).not.toThrow();

  expect(obj.prop).toEqual(new Set(['a', 'b', 'c']));
});

it('should ignore the optional signature', () => {
  expect(() => {
    assignValToObjProp('abc', 'string?', obj, 'prop');
  }).not.toThrow();

  expect(obj.prop).toEqual('abc');
});

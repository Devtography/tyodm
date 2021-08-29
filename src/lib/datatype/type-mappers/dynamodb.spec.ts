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

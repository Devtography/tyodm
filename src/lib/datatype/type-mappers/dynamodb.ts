/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { PropType } from '../typings';

/**
 * Get the corresponding DynamoDB data type for the given {@link PropType}.
 * @param type - {@link PropType} to be converted to DynamoDB data type.
 * @returns The key of DynamoDB data type.
 */
function toDBDataType(type: PropType): keyof AttributeValue {
  let propType: string = type.toLowerCase();

  if (propType.slice(-1) === '?') {
    propType = propType.slice(0, -1);
  }

  switch (propType) {
    case ('bool'):
      return 'BOOL';
    case ('bool[]'):
    case ('bool<>'):
    case ('int[]'):
    case ('double[]'):
    case ('decimal[]'):
    case ('string[]'):
      return 'L';
    case ('int'):
    case ('double'):
      return 'N';
    case ('int<>'):
    case ('double<>'):
      return 'NS';
    case ('string'):
    case ('decimal'):
      return 'S';
    case ('string<>'):
    case ('decimal<>'):
      return 'SS';
    default:
      return '$unknown';
  }
}

/**
 * Cast the value based on its' `PropType` and assigns it to the object
 * property.
 * @param val - Value to cast and assign.
 * @param type - {@link PropType} of `val`.
 * @param obj - Object to contain the value.
 * @param key - Key of the target object property for value assignment.
 * @internal
 */
function assignValToObjProp(
  val: AttributeValue, type: PropType,
  obj: Record<string, unknown>, key: string,
): void {
  let propType = type.toLowerCase() as PropType;
  if (propType.slice(-1) === '?') {
    propType = propType.slice(0, -1) as PropType;
  }

  const listTypes = ['bool<>', 'bool[]', 'int[]', 'double[]',
    'decimal[]', 'string[]'];

  if (propType === 'bool') {
    obj[key] = val.BOOL;
  } else if (propType === 'int') {
    obj[key] = parseInt(val.N!, 10);
  } else if (propType === 'double') {
    obj[key] = parseFloat(val.N!);
  } else if (propType === 'int<>' || propType === 'double<>') {
    obj[key] = new Set(val.NS!.map(Number));
  } else if (propType === 'decimal') {
    obj[key] = val.S;
  } else if (propType === 'decimal<>') {
    obj[key] = new Set(val.SS);
  } else if (propType === 'string') {
    obj[key] = val.S;
  } else if (propType === 'string<>') {
    obj[key] = new Set(val.SS);
  } else if (listTypes.includes(propType)) {
    const list = val.L!;
    const arr: Array<boolean | number | string> = [];

    list.forEach((elm) => {
      if (propType === 'bool<>' || propType === 'bool[]') {
        arr.push(elm.BOOL!);
      } else if (propType === 'int[]') {
        arr.push(parseInt(elm.N!, 10));
      } else if (propType === 'double[]') {
        arr.push(parseFloat(elm.N!));
      } else if (propType === 'decimal[]' || propType === 'string[]') {
        arr.push(elm.S!);
      }
    });

    if (propType === 'bool<>') {
      obj[key] = new Set(arr);
    } else {
      obj[key] = arr;
    }
  }
}

export { toDBDataType, assignValToObjProp };

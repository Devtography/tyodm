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
      return 'L';
    case ('int'):
    case ('double'):
      return 'N';
    case ('int[]'):
    case ('int<>'):
    case ('double[]'):
    case ('double<>'):
      return 'NS';
    case ('string'):
    case ('decimal'):
      return 'S';
    case ('string[]'):
    case ('string<>'):
    case ('decimal[]'):
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
  let propType: string = type.toLowerCase();

  if (propType.slice(-1) === '?') { propType = propType.slice(0, -1); }

  switch (propType) {
    case ('bool'):
      obj[key] = val.BOOL!;
      break;
    case ('bool[]'):
    case ('bool<>'): {
      const list = val.L!;
      const arr: boolean[] = [];
      list.forEach((elm) => {
        arr.push(elm.BOOL!);
      });
      if (propType === 'bool[]') {
        obj[key] = arr;
      } else {
        obj[key] = new Set(arr);
      }
      break;
    }
    case ('int'):
      obj[key] = parseInt(val.N!, 10);
      break;
    case ('double'):
      obj[key] = parseFloat(val.N!);
      break;
    case ('int[]'):
    case ('double[]'):
      obj[key] = val.NS!.map(Number);
      break;
    case ('int<>'):
    case ('double<>'):
      obj[key] = new Set(val.NS!.map(Number));
      break;
    case ('decimal'):
      obj[key] = parseFloat(val.S!);
      break;
    case ('decimal[]'):
      obj[key] = val.SS!.map(Number);
      break;
    case ('decimal<>'):
      obj[key] = new Set(val.SS!.map(Number));
      break;
    case ('string'):
      obj[key] = val.S!;
      break;
    case ('string[]'):
      obj[key] = val.SS!;
      break;
    case ('string<>'):
      obj[key] = new Set(val.SS);
      break;
    default:
      break;
  }
}

export { toDBDataType, assignValToObjProp };

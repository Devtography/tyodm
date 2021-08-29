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

export { toDBDataType };

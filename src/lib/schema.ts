import { PropType } from './datatype/typings';

/**
 * @param key - Data type of the attribute.
 */
interface Attr {
  [key: string]: PropType | Record<string, PropType>;
}

/**
 * @param type - Indicates if this property is meant to be a single record of
 * item or representing a collection of item records.
 * @param identifier - Object key of which stores the unique value as item
 * identifier in a collection. This field MUST be specified if `type` is set as
 * `collection`.
 * @param attr - Data type of the attribute. See {@link Attr}.
 */
interface Prop {
  type: 'single' | 'collection',
  identifier?: string,
  attr: Attr,
}

/**
 * Layout of the schema object for {@link TyObj}.
 * @param name - Name of the data model, usually the class name of the
 * class the schema is representing. Value of this property will be used as
 * prefix for the partition key in DynamoDB and `objectId` in MongoDB.
 * @param identifier - Name of the property which stores the unique
 * value to be the postfix of the partition key / `objectId` for identifying
 * the model object in a DynamoDB table / MongoDB collection.
 * @param props - Layouts of the class properties. The key of each {@link Prop}
 * object will be used as sort key in DynamoDB.
 * See {@link Prop} for details.
 */
interface Schema {
  name: string;
  identifier?: string;
  props: Record<string, Prop>;
}

export { Attr, Prop, Schema };

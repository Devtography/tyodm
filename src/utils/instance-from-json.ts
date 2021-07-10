/**
 * Cast the JSON object to the targeted class.
 *
 * @param {T} Type - Target type to cast the JSON object to.
 * @param {Record<string, unknown>} jsonObj - The corresponding JSON object.
 * @returns {T} instance of *T* casted from JSON.
 */
function instanceFromJSON<T>(
  Type: { new(): T; },
  jsonObj: Record<string, unknown>,
): T {
  const obj = new Type();

  Object.keys(jsonObj).forEach((prop) => {
    const key = prop as keyof T;
    obj[key] = jsonObj[prop] as T[keyof T];
  });

  return obj;
}

export { instanceFromJSON };

import * as _ from 'lodash';

export function array_intersect(arr1: any, arr2: any) {
  return arr1.filter((element: any) => arr2.includes(element));
}

export function unique(array: any) {
  if (!Array.isArray(array)) {
    return [];
  }

  return array.filter((value, index, self) => {
    return self.indexOf(value) === index;
  });
}

export function snakeCaseKeysRecursive(obj) {
  return _.mapValues(obj, (value) => {
    if (_.isPlainObject(value)) {
      return snakeCaseKeysRecursive(value);
    } else if (_.isArray(value)) {
      return value.map((item) => {
        if (_.isPlainObject(item)) {
          return snakeCaseKeysRecursive(item);
        }
        return item;
      });
    }
    return value;
  });
}

export function convertToSnakeCase(obj) {
  return _.isObject(obj)
    ? _.transform(obj, (result, value, key) => {
        const newKey = _.isArray(obj) ? key : _.snakeCase(key);
        result[newKey] = convertToSnakeCase(value);
      })
    : obj;
}

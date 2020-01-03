import { parseString } from 'xml2js';

export function XMLToJS(text) {
  return new Promise((resolve, reject) => {
    parseString(text, { explicitArray: false }, (err, res) => {
      if (err) {
        const msg = err instanceof Error ? err.message : err;
        reject(new Error(`Failed to parse XML: ${msg}`));
        return;
      }
      resolve(res);
    });
  });
}

/**
 * Converts everything to an array.
 * Single object becomes single-element array, null/undefined becomes empty array.
 * @param {*} obj
 */
export function xmlArray(obj) {
  let res;
  if (obj instanceof Array) {
    res = obj;
  } else if (obj === null || obj === undefined) {
    res = [];
  } else {
    res = [obj];
  }
  return res;
}

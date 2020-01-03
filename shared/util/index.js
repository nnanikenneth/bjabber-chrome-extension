export function isValidPhoneNumber(nr) {
  const match = (`${nr}`).match(/^\s*(\+?[0-9\(\) .,-]+?)\s*$/);
  if (!match) {
    return false;
  }
  return true;
}

export function wrapForChrome(fn) {
  return (...args) => {
    try {
      fn(...args);
    } catch (e) {
      window.onerror(e);
    }
  };
}

/**
 * Determines if the element is located on top half of the screen.
 * @param {Element} element
 */
export function isOnBottomHalfOfScreen(element) {
  if (element) {
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    if (rect.y > (viewportHeight / 2)) {
      return true;
    }
  }
  return false;
}

/**
 *
 * @param {array} staffExtensions
 */
export function returnDictIndexedByExtension(staffExtensions) {
  // eslint-disable-next-line no-param-reassign
  return staffExtensions.filter(x => x.number && x.number !== 'N/A').reduce((obj, val) => { obj[val.number] = val; return obj; }, {});
}

/**
 * @param {String} ext
 * @param {Dictionary} staffDataByExtensions
 */
export function getNameIfStaffExtension(ext, staffDataByExtensions) {
  if (!staffDataByExtensions) {
    return ext;
  }
  if (ext && ext.length === 8 && ext[0] === '7') {
    const fromStaff = staffDataByExtensions[ext];
    return fromStaff && fromStaff.label ? fromStaff.label : ext;
  }
  return ext;
}

export function param(params) {
  const p = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    p.set(key, String(value));
  }
  return p.toString();
}

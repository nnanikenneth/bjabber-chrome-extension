export function exponentialBackoff(current = null, min, max) {
  let backoff = current;
  if (!backoff) {
    backoff = min;
  } else {
    backoff *= 2;
    backoff = Math.min(backoff, max);
  }
  return backoff;
}

/**
 * Returns true if the action should be skipped for throttling down by factor times
 * @param {number} factor
 */
export function shouldSkipThrottledDown(factor) {
  return Math.floor(Math.random() * factor) !== 0;
}


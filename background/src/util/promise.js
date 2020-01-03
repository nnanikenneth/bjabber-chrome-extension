/**
 * Returns promise which is resolved after specified delay.
 * @param {number} timeout 
 */
export function delay(timeout) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
}

/**
 * Retries function with promises.
 * @param {() => Promise<any>} fn 
 * @param {RetryOptions} retryOptions 
 * @returns {Promise<any>} Promise which is resolved if a (re)try succeeds.
 */
export function retry(fn, retryOptions) {
  if (!retryOptions) {
    return fn();
  }
  let { retries, minInterval, maxInterval, predicate } = retryOptions;
  minInterval = minInterval && minInterval > 0 ? minInterval : 0;
  maxInterval = maxInterval && maxInterval > minInterval ? maxInterval : minInterval;
  predicate = predicate || (() => true);
  const attempt = () => fn().catch((ex) => {
    retries -= 1;
    if (retries < 1 || !predicate(ex)) {
      throw ex;
    }
    const timeout = Math.floor((Math.random() * (maxInterval - minInterval)) + minInterval);
    return delay(timeout).then(attempt);
  });
  return attempt();
}

/**
 * @module util/promise
 */

/**
 * A function which intercepts errors on all retries.
 * If it returns true, next retry happens, otherwise it does not.
 * Note: if max amount of retries is reached, this function will not be invoked.
 * Also, if this function throws an error, retries will be stopped.
 * @typedef {(error) => boolean} RetryPredicate
 */

/**
 * Retry options
 * @typedef {Object} RetryOptions
 * @property {number} retries - Max amount of retries (including first try).
 * @property {number} minInterval - Min time to wait before retry (ms).
 * @property {number} maxInterval - Max time to wait before retry (ms).
 * @property {RetryPredicate} predicate - Function to stop early
 */

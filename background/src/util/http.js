import { retry as retryPromise } from './promise';
import { XMLToJS } from './xml';

const DEFAULT_TIMEOUT = 60 * 1000;

export class XHRError extends Error {
  constructor(method, url, type) {
    super(`Request ${method} to ${url} failed: ${type}`);
    this.type = type;
    this.url = url;
    this.method = method;
  }
}

export class XHRBodyError extends Error {
  constructor(cause, body, contentType) {
    super(`Malformed response of type ${contentType}: ${cause}`);
    this.body = body;
    this.type = 'malformed-response';
  }
}

const sXHR = Symbol('_xhr');
const sOriginalUrl = Symbol('_originalUrl');
const sParsedHeaders = Symbol('_parsedHeaders');

/**
 * HTTP response.
 * Replicates most of fetch Response methods.
 */
export class XHRResponse {
  constructor(xhr, url) {
    this[sXHR] = xhr;
    this[sOriginalUrl] = url;
    this[sParsedHeaders] = null;
  }

  /**
   * Indicates whether the request is succeeded with 2xx status.
   */
  get ok() {
    return this[sXHR].status >= 200 && this[sXHR].status < 300;
  }

  /**
   * Shows if the request was redirected.
   */
  get redirected() {
    return this[sXHR].responseURL && (this[sXHR].responseURL !== this[sOriginalUrl]);
  }

  /**
   * HTTP status code.
   */
  get status() {
    return this[sXHR].status;
  }

  /**
   * HTTP status text.
   */
  get statusText() {
    return this[sXHR].statusText;
  }

  /**
   * Final URL of the request after all redirects.
   */
  get url() {
    return this[sXHR].responseURL;
  }

  /**
   * Response headers.
   * @returns {[{name: string, value: sttring}]}
   */
  get headers() {
    if (!this[sParsedHeaders]) {
      const headerString = this[sXHR].getAllResponseHeaders();
      const all = headerString.split('\n').map(s => s.trim()).filter(s => s.length > 0);
      this[sParsedHeaders] = all.map((h) => {
        const name = h.split(':', 1)[0].trim();
        const value = h.substr(name.length + 1).trim();
        return { name, value };
      });
    }
    return this[sParsedHeaders];
  }

  /**
   * Get header value.
   * @param {string} name - header name (case-insensitive).
   * @returns {(string|null)}
   */
  header(name) {
    const headers = this.headers;
    const header = headers.filter(h => h.name.toLowerCase() === name.toLowerCase())[0];
    if (header) {
      return header.value;
    }
    return null;
  }

  /**
   * Get response body as text.
   * @returns {Promise<string>}
   */
  text() {
    return Promise.resolve(this[sXHR].response);
  }

  /**
   * Get response body as JSON.
   * @returns {Promise<Object.<string, any>>}
   */
  json() {
    try {
      return Promise.resolve(JSON.parse(this[sXHR].response));
    } catch (e) {
      return Promise.reject(new XHRBodyError(e, this[sXHR].response, 'JSON'));
    }
  }

  /**
   * Get response body as XML.
   * @returns {Promise<Object.<string, any>>}
   */
  xml() {
    return XMLToJS(this[sXHR].response).catch((err) => {
      throw new XHRBodyError(err, this[sXHR].response, 'XML');
    });
  }
}

function xhrRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = new XMLHttpRequest();
    const method = options.method || 'GET';
    try {
      req.open(method, url);
      if (options.headers) {
        Object.keys(options.headers).forEach(
          name => req.setRequestHeader(name, options.headers[name]),
        );
      }
      req.timeout = options.timeout || DEFAULT_TIMEOUT;

      req.onreadystatechange = () => {
        if (req.readyState === 4) {
          if (req.status !== 0) {
            resolve(new XHRResponse(req));
          }
        }
      };
      const errorHandler = type => () => reject(new XHRError(method, url, type));
      req.onerror = errorHandler('error');
      req.ontimeout = errorHandler('timeout');
      req.send(options.body || null);
    } catch (e) {
      reject(e);
    }
  });
}

function xhrWithRetry(url, options) {
  const { retry, timeout, method, headers, body } = options;
  return retryPromise(() => xhrRequest(url, { timeout, method, headers, body }), retry);
}

/** 
 * Utility class for HTTP requests.
 * It mostly simulates fetch behavior, but uses XMLHttpRequest under the hood.
 * 
 * This class provides timeouts, which actually drop the request unlike Promise.race with fetch
 * Also supports retry logic.
 */
class Http {
  /**
   * Performs a GET request. {@link Http.fetch}.
   * @param {string} url 
   * @param {Object.<string, any>} options 
   */
  static get(url, options = {}) {
    return Http.fetch(url, {
      ...options,
      method: 'GET',
    });
  }

  /**
   * Performs a POST request. {@link Http.fetch}.
   * @param {string} url 
   * @param {Object.<string, any>} options 
   */
  static post(url, options = {}) {
    return Http.fetch(url, {
      ...options,
      method: 'POST',
    });
  }

  /**
   * Performs a PUT request. {@link Http.fetch}.
   * @param {string} url 
   * @param {Object.<string, any>} options 
   */
  static put(url, options = {}) {
    return Http.fetch(url, {
      ...options,
      method: 'PUT',
    });
  }

  /**
   * Performs a HTTP request.
   * @param {string} url - request url.
   * @param {Object} options - request options.
   * @param {string} options.method - request method.
   * @param {*} options.body - request body. It may be anything {@link XMLHttpRequest#send} accepts.
   * @param {?number} options.timeout - timeout in milliseconds.
   * @param {Object} options.headers - key-value object with headers.
   * @param {Object} options.retry - retry options. See promise.js for more details.
   * @returns {Promise<XHRResponse>}
   */
  static fetch(url, options = {}) {
    return xhrWithRetry(url, options);
  }
}

export default Http;

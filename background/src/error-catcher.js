/* eslint func-names:0, no-multi-assign:0, no-underscore-dangle:0, prefer-rest-params:0 */
/* eslint no-param-reassign:0, no-plusplus:0, no-prototype-builtins:0, max-len:0, no-console:0 */
import Context from './util/context';
import logger from './logger';

const win = window;
const doc = win.document;

function testCanParse() {
  const fn = function () {};
  return fn.toString && /bkg/.test(() => { 'bkg'; });
}

const errors = [];
let errorCount = 0;
const canParse = testCanParse();

let NOW;
let UNDEF;

let SERVER_ASKED_TO_BLOCK = readCookie('error_catcher') === 'kill';

const SHOULD_BLOCK = function (error) {
  return SERVER_ASKED_TO_BLOCK || error.index > 2;
};

const ERROR_TRANSPORT = {

  URL: 'http://voice.api.booking.com/js_errors',
  METHOD: 'POST',
  MAX_STACK_LINES: 12,
  MAX_STACK_LENGTH: 900,
  MAX_FUNCTION_BODY_LENGTH: 150,
  STACK_TRUNCATED_TEXT: '(... truncated!)',

  SEND_ONLY_IF() {
    return !!doc.getElementById('req_info');
  },

};

const ERROR_DATA_COLLECTION = {

  /*
   * If the property redefined via defineError is a function we're always passing as arguments: message, url, line, column and error.
   * Same arguments that get passed to the onerror handler.
   */

  invalidate_cache() {
    return Date.now();
  },

  error(message, url, line, column, error, caller) {
    const stack = this.getErrorStackTrace(error, caller, message) || '';
    const errorGroup = this.getErrorGroup(stack, caller);

    return errorGroup + (getErrorMessage(message, error) || 'Script error') + stack;
  },

  url(message, url, line, column, error) {
    return this.getErrorSourceFromStack(error && error.stack) || this.getErrorSource(message, url) || win.document.location.href.split('?')[0];
  },

  lno(message, url, line, column, error) {
    return Number(line) ? line : this.getFileOffsetFromError(error).line || this.UNDEF;
  },

  cno(message, url, line, column, error) {
    return Number(column) ? column : this.getFileOffsetFromError(error).column || this.UNDEF;
  },

  pid() {
    return getKey('booking_extra.pageview_id') ||
                   getKey('booking.PAGEVIEW_ID') ||
                   getKey('BOOKING_PAGEVIEW_ID') ||
                   getKey('booking.env.pageview_id') ||
                   getKey('$u.js_data.PAGEVIEW_ID') ||
                   'DEADBEEF'; // because yolo
  },

  stid() {
    return getKey('booking_extra.b_stid');
  },

  ch() {
    return getKey('booking_extra.b_ch');
  },

  ref_action() {
    return getKey('booking_extra.b_action');
  },

  ref_hash() {
    return location.hash;
  },

  stype() {
    return getKey('booking_extra.b_site_type_id');
  },

  aid() {
    return getKey('booking_extra.b_aid');
  },

  lang() {
    return getKey('booking_extra.b_lang_for_url');
  },

  scripts() {
    let page;
    let pageData;
    let str = '{';
    const scripts = getKey('booking.env.scripts_tracking') || {};

    for (page in scripts) {
      if (scripts.hasOwnProperty(page)) {
        pageData = scripts[page];
        str += `"${page}":{"loaded":${!!pageData.loaded},"run":${!!pageData.run}},`;
      }
    }

    str = `${str.slice(0, -1)}}`;

    if (str.length === 1) {
      return '';
    }

    return str;
  },

  since() {
    const timer = win.PageLoadTimer;

    return timer ? NOW - timer.start : UNDEF;
  },

  ready() {
    const timer = win.PageLoadTimer;

    if (!timer) {
      return UNDEF;
    }

    return timer.document_ready - timer.start ? timer.document_ready - timer.start : 0;
  },

  loaded() {
    const timer = win.PageLoadTimer;

    if (!timer) {
      return UNDEF;
    }

    return timer.window_load - timer.start ? timer.window_load - timer.start : 0;
  },

  info() {
    const info = doc.getElementById('req_info');

    return info ? info.innerHTML : UNDEF;
  },

  errc() {
    return this.error.index + 1;
  },

  errp() {
    if (!this.error) {
      return 0;
    }

    const currentIndex = this.error.index;
    const previousIndex = currentIndex - 1;

    if (currentIndex === 0 || previousIndex < 0) {
      return 0;
    }

    const previous = this.errors[previousIndex];

    return previous ? previous.index + 1 : 0;
  },

  stack_trace(message, url, line, column, error) {
    return getErrorStackTrace(error);
  },

  file_name(message, url, line, column, error) {
    const manifest = chrome.runtime.getManifest();
    const file = this.getErrorSourceFromStack(error && error.stack).substr(34);
    return `${manifest.name}_v_${manifest.version}${file}`;
  },

};

let E_;

const onBookingError = win.onBookingError = win.onerror = function () {
  if (E_.skip === true) {
    E_.skip = false;
    return;
  }

  if (win.onBookingError.skip === true) {
    win.onBookingError.skip = false;
    return;
  }

  const args = [].slice.apply(arguments);
  const ctxt = this;

  const call = function () {
    onError.apply(ctxt, args);
  };

  args.push(getFunctionCaller(arguments));

  if (ERROR_TRANSPORT.SEND_ONLY_IF()) {
    call();
  } else {
    setTimeout(call, 100);
  }
};

E_ = win.E_ = function (error, fnc) {
  onBookingError(error.message, '', 0, 0, error, fnc);

  E_.skip = true;
  throw error;
};

E_.a = function (args) {
  return [].slice.apply(args);
};

/*
 * Enabling plugins
 */

win.onerror.plugins = true;

win.onerror.defineError = function (ERROR_DATA_COLLECTION_PLUGIN) {
  // We don't want to let random keys to be reported. We must control this.
  // That's why the extend function only allows key overwriting not addition.
  extend(ERROR_DATA_COLLECTION, ERROR_DATA_COLLECTION_PLUGIN);
};

win.onerror.defineTransport = function (ERROR_TRANSPORT_PLUGIN) {
  extend(ERROR_TRANSPORT, ERROR_TRANSPORT_PLUGIN);
};

win.onerror.errorCollection = function () {
  return errors.slice();
};

win.onerror.report = function (message, group, path) {
  const fnc = function () {};

  fnc.__bookingGroupName__ = group;

  win.onerror(message, path || '', 0, 0, {}, fnc);
};


/*
 * Error phases
 */

function onError() {
  const error = { index: errorCount++ };
  const args = [].slice.apply(arguments);

  if (SHOULD_BLOCK(error)) {
    return false;
  }

  errors.push(error);

  collectData(error, args);
  collectBpeData(error);

  send(error);

  return false;
}

function collectData(error, args) {
  const context = {

    UNDEF,
    ERROR_TRANSPORT,

    errors,
    error,

    getErrorStackTrace,
    getFunctionCaller,
    getErrorSource,
    getErrorGroup,
    parseFunctionBody,
    parseFunctionName,
    getFileOffsetFromError,
    getErrorSourceFromStack,
    thirdPartyBreakDownLabel,
    languageBreakDownLabel,
    getErrorMessage,

  };

  let key;
  let value;

  NOW = Date.now();

  for (key in ERROR_DATA_COLLECTION) {
    if (ERROR_DATA_COLLECTION.hasOwnProperty(key)) {
      value = ERROR_DATA_COLLECTION[key];

      if (typeof value === 'function') {
        value = value.apply(context, args);
      }

      if (typeof value !== 'undefined' && value !== '') {
        error[key] = value;
      }
    }
  }
}

function collectBpeData(error) {
  try {
    const extensionMon = Context.injectTo({
      timestamp: Math.floor(Date.now() / 1000),
      event_type: 'js_error',
    });
    error.extension_mon = JSON.stringify(extensionMon);
  } catch (e) {
    logger.error('Cannot fill monitoring event', e);
  }
}

function send(error) {
  beacon({

    url: ERROR_TRANSPORT.URL,
    method: ERROR_TRANSPORT.METHOD,
    error: serialize(error),

  }, (responseText, responseStatus) => {
    if (+responseStatus === 503 || responseText === 'shut up') {
      SERVER_ASKED_TO_BLOCK = true;
      createCookie('error_catcher', 'kill', 30);
    }
  });
}


/*
 * Init
 */

initWrapping();

function initWrapping() {
  let jQueryWrap = function (jQuery) {
    // Making sure we wrap jQuery only once
    win.onerror.jQueryWrap = jQueryWrap = () => {};

    try {
      const HANDLER_INDEX = '__booking__handler__index__';

      const handlers = {};
      let count = 0;

      const onAvailable = typeof jQuery.fn.on !== 'undefined';

      const method = {
        on: onAvailable ? 'on' : 'bind',
        off: onAvailable ? 'off' : 'unbind',
        ajax: 'ajax',
      };

      replaceMethod(jQuery.fn, method.on, (args, index) => {
        const arg = args[index];

        if (typeof arg !== 'function') {
          return;
        }

        const wrapped = wrapFunction(arg);

        handlers[count] = args[index] = wrapped;

        arg[HANDLER_INDEX] = count;

        count += 1;
      });

      replaceMethod(jQuery.fn, method.off, (args, index) => {
        const arg = args[index];

        if (typeof arg !== 'function') {
          return;
        }

        const cnt = arg[HANDLER_INDEX];

        args[index] = handlers[cnt] || arg;

        delete handlers[cnt];
      });

      replaceMethod(jQuery, method.ajax,

        (args, index) => {
          const options = args[index];

          if (({}).toString.apply(options) === '[object Object]') {
            forEachIn('success error complete beforeSend', (callback) => {
              options[callback] = wrapFunction(options[callback]);
            });
          }
        },

        (promise) => {
          forEachIn('done fail always then', replaceMethod, promise);
        },

      );
    } catch (e) {} // eslint-disable-line
  };

  try {
    const currentSetTimeout = win.setTimeout;
    const currentSetInterval = win.setInterval;
    const start = Date.now();

    if (currentSetTimeout) {
      win.setTimeout = function () {
        const args = Array.prototype.slice.call(arguments);
        args[0] = wrapFunction(args[0]);
        if (currentSetTimeout.apply) {
          return currentSetTimeout.apply(this, args);
        } // because of IE8 and below
        return currentSetTimeout(args[0], args[1]);
      };
    }

    if (currentSetInterval) {
      win.setInterval = function () {
        const args = Array.prototype.slice.call(arguments);
        args[0] = wrapFunction(args[0]);
        if (currentSetInterval.apply) {
          return currentSetInterval.apply(this, args);
        } // because of IE8 and below
        return currentSetInterval(args[0], args[1]);
      };
    }

    if (!win.console) {
      win.console = { info: () => {}, log: () => {}, dir: () => {} };
    }

    (function frontendReady() {
      if (

        win.B &&
                     win.sNSStartup &&
                     win.B[win.sNSStartup] &&
                     win.B[win.sNSStartup].execute

      ) {
        win.B[win.sNSStartup].execute = function (handler, config) {
          return wrapFunction(handler).call(config);
        };
      } else if (win.document.readyState !== 'complete' && ((Date.now() - start) < (15 * 1000))) {
        setTimeout(frontendReady, 0);
      }
    }());

    (function jQueryReady() {
      if ('jQuery' in win) {
        jQueryWrap(win.jQuery);
      } else if (win.document.readyState !== 'complete' && ((Date.now() - start) < (15 * 1000))) {
        setTimeout(jQueryReady, 0);
      }
    }());
  } catch (e) {

    /* This shouldn't happen but there's
     * no problem if the wrappers are not applied
     * we'll simply have less info about the error
     */

  }

  // Publishing the wrapper to make it possible when AMD is used
  win.onerror.jQueryWrap = jQueryWrap;
}

/*
 * Wrapping helpers
 */

function wrapFunction(fnc) {
  const wrapper = typeof fnc === 'function' ? function () {
    try {
      return fnc.apply(this, [].slice.apply(arguments));
    } catch (e) {
      win.onerror(e.message, e.sourceURL, e.line, e.column, e, fnc);
      logger.info(getErrorStackTrace(e, fnc) || `Uncaught Error: ${e.message}`);
      if (typeof console.trace === 'function') {
        console.trace();
      }
      return undefined;
    }
  } : fnc;

  return wrapper;
}

function forEachIn(items, callback, context) {
  let i;
  let len;
  let params;
  const list = items.split(' ');

  for (i = 0, len = list.length; i < len; i += 1) {
    params = context ? [context, list[i]] : [list[i]];

    callback(...params);
  }
}

function replaceMethod(obj, name, handlerCallback, resultCallback) {
  if (!name || typeof obj[name] !== 'function') {
    return;
  }

  const original = obj[name];

  obj[name] = function () {
    const args = [].slice.apply(arguments);
    let index = args.length;
    let arg;

    while (index--) {
      arg = args[index];

      if (arg) {
        if (typeof handlerCallback === 'function') {
          handlerCallback(args, index);
        } else if (typeof arg === 'function') {
          args[index] = wrapFunction(arg);
        }
      }
    }

    const result = original.apply(this, args);

    if (typeof resultCallback === 'function') {
      resultCallback(result);
    }

    return result;
  };
}


/*
 * Helpers
 */

function thirdPartyBreakDownLabel(key) {
  return `\n<j<s<${key}>s>j>`;
}

function languageBreakDownLabel(language) {
  return `\n<l<a<n<g<${language}>g>n>a>l>`;
}

function sanitizeStackLength(stackText) {
  if (!stackText) {
    return '';
  }

  const stack = stackText.split('\n');
  const lines = stack.splice(0, ERROR_TRANSPORT.MAX_STACK_LINES);

  return (`\n${lines.join('\n')}`).slice(0, ERROR_TRANSPORT.MAX_STACK_LENGTH) + (stack.length ? ERROR_TRANSPORT.STACK_TRUNCATED_TEXT : '');
}

function getErrorStackTrace(error, functionCaller, message) {
  let stack;
  let lines;
  let file;
  let name;
  let fileOffset;

  if (!error) {
    return '';
  }

  message = getErrorMessage(message, error);

  if (functionCaller && message) {
    lines = [];

    while (functionCaller) {
      name = functionCaller.name || parseFunctionName(functionCaller) || parseFunctionBody(functionCaller) || 'anonymous';
      file = getErrorSourceFromStack(error.stack) || getErrorSource(message, extractUrlSearch(win.document.location.href));
      fileOffset = getFileOffsetFromError(error);

      lines.push(`${name}@(${file}:${fileOffset.line}:${fileOffset.column})`);

      try {
        functionCaller = functionCaller.caller;
      } catch (e) { // Strict Mode Enabled
        functionCaller = false;
      }
    }

    if (lines.length) {
      lines = ['<Generated Stack>'].concat(lines).concat(['</Generated Stack>\n']);

      stack = lines.join('\n') + (error.stack || '');

      return sanitizeStackLength(stack);
    }
  }

  return sanitizeStackLength(error.stack);
}

function getErrorGroup(stack, caller) {
  let callerName;
  let callerSource;

  if (typeof caller === 'function') {
    callerName = caller.name || parseFunctionName(caller);
    callerSource = parseFunctionBody(caller);
  }

  const location = win.document.location || {};
  const host = location.hostname || '';
  const path = location.pathname || '';
  const file = (stack.match(/\/\/[^/]+(\/[^: ]+):(\d+):(\d+)/) || ['', ''])[1].split('?')[0] || (host + path);
  const functionName = callerName || (stack.match(/(?:at)?\s+([0-9a-zA-Z_]+)[\s@]+(?:\(?https?:)?\/\/[^/]+\/[^: ]+:\d+:\d+/) || [])[1];
  const functionSource = callerSource || (stack.match(/(function\([^)]*\)\{[^@]+\})@(?:\(?https?:)?\/\/[^/]+\/[^: ]+:\d+:\d+/i) || [])[1];
  let functionIdentifier = (!functionSource && !/^(at|code|function)$/i.test(functionName) && functionName) || functionSource || 'anonymous';

  file.replace(/(\.v[a-zA-Z0-9]+v\.)js$/, '.js');

  if (typeof caller === 'function' && caller.__bookingGroupName__) {
    functionIdentifier = caller.__bookingGroupName__;
  }

  return `FULL_STACK_${file}->${functionIdentifier}():`;
}

function getKey(path) {
  const keys = path.split(/[. ]/);
  const objName = keys[0];
  let i;
  let len;
  let value = win[objName];

  for (i = 1, len = keys.length; i < len; i += 1) {
    if (

      defined(value) &&
                /^\[object (Object|Function|Array|global|HTMLDocument)\]$/.test(({}).toString.apply(value))

    ) {
      value = value[keys[i]];
    } else {
      return defined(value) ? value : UNDEF;
    }
  }

  return defined(value) ? value : UNDEF;
}

function defined(variable) {
  return typeof variable !== 'undefined';
}

function extend(source, extension) {
  let attr;

  for (attr in extension) {
    if (
      source.hasOwnProperty(attr) &&
                extension.hasOwnProperty(attr)
    ) {
      source[attr] = extension[attr];
    }
  }
}

function serialize(obj) {
  const serialized = [];
  let key;

  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      serialized.push(`${key}=${win.encodeURIComponent(obj[key])}`);
    }
  }

  return serialized.join('&');
}

function beacon(config, onResponse) {
  let url = config.url;
  const request = new win.XMLHttpRequest();

  if (config.method !== 'POST') {
    url += `?${config.error}`;
  }

  request.open(config.method, url, true);
  request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

  request.onreadystatechange = function () {
    if (request.readyState === 4) {
      onResponse(request.responseText, request.status);
    }
  };

  request.send(config.error);
}

function extractUrlSearch(url) {
  return (url || '').split('?')[0];
}

function getErrorMessage(message, error) {
  return message || (error ? error.message : '');
}

function getErrorSource(message, url) {
  return message && message.srcElement && message.srcElement.src && typeof message.srcElement.src === 'string' ? message.srcElement.src : url;
}

function getErrorSourceFromStack(stack) {
  return ((stack || '').match(/((?:https?:)?\/\/[^/]+\/[^: ]+):(\d+):(\d+)/) || ['', ''])[1].split('?')[0];
}

function getFileOffsetFromError(error) {
  if (!error) {
    return { line: 0, column: 0 };
  }

  const offset = (error.stack || '').match(/:(\d+)(?::(\d+))?/) || [0, 0, 0];
  const line = Math.abs(error.number ? +error.number : 0) || offset[1] || 0;
  const column = offset[2] || 0;

  return {
    line: +line,
    column: +column,
  };
}

function getFunctionCaller(args) {
  let caller;
  let undef;

  try {
    caller = args && args.callee && args.callee.caller ? args.callee.caller : undef;
  } catch (e) { /* Strict Mode Enabled */ }

  return caller;
}

function parseFunctionName(fnc) {
  if (!canParse || typeof fnc !== 'function') {
    return '';
  }

  const source = fnc.toString();
  return (source.match(/function\s+([a-zA-Z0-9_]+)\s*\(/) || [])[1] || '';
}

function parseFunctionBody(fnc) {
  if (!canParse) {
    return '';
  }

  const source = `${fnc.toString()
    .replace(/[\n\r\t\s@]+/g, '')
    .slice(0, -1)
    .slice(0, ERROR_TRANSPORT.MAX_FUNCTION_BODY_LENGTH)} ... }`;

  return source;
}

/* PPK's cookie scripts: http://www.quirksmode.org/js/cookies.html */
function createCookie(name, value, days) {
  let expires = '';

  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));

    expires = `; expires=${date.toGMTString()}`;
  }

  doc.cookie = `${name}=${value}${expires}; path=/`;
}

function readCookie(name) {
  const cookies = doc.cookie.split(';');
  let cookie;
  let i;
  let len;

  name += '=';

  for (i = 0, len = cookies.length; i < len; i += 1) {
    cookie = cookies[i];

    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1, cookie.length);
    }

    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length, cookie.length);
    }
  }

  return null;
}

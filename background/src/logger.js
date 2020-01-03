import coreLogger from './coreLogger';
import Voiceapi from './services/voiceapi';

/* eslint no-console:0 */

const LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

let sendingLevel = 'warn';

function consoleLog(level, ...args) {
  const log = level === 'debug' ? console.log : console[level];
  const time = new Date();
  log(`[${time}] [${level}]`, ...args);
}

function postLog(level, ...args) {
  if (LEVELS[level] < LEVELS[sendingLevel]) {
    return Promise.resolve();
  }
  return Voiceapi.postLog(level, ...args);
}

function addToHistory(level, ...args) {
  const entry = {
    level,
    data: args,
    epoch: Date.now() / 1000,
  };
  coreLogger.push(entry);
}

function doLog(level, ...args) {
  consoleLog(level, ...args);
  addToHistory(level, ...args);
  return postLog(level, ...args).catch((e) => {
    consoleLog('error', 'Could not deliver log to voiceapi', e);
  });
}

class Logger {
  static debug(...args) {
    doLog('debug', ...args);
  }

  static info(...args) {
    doLog('info', ...args);
  }

  static warn(...args) {
    doLog('warn', ...args);
  }

  static error(...args) {
    doLog('error', ...args);
  }

  static setSendingLevel(level) {
    if (LEVELS[level] === undefined || level === sendingLevel) {
      return;
    }
    sendingLevel = level;
  }
}

export default Logger;

import copy from 'copy-to-clipboard';
import stringify from 'json-stringify-safe';

class BookingLogger {
  constructor() {
    this.logger = [];
    this.LIMIT = 1000;

    this.actionLogger = [];
    this.ACTION_LIMIT = 250;
  }

  pushAction(entry) {
    push(entry, this.actionLogger, this.ACTION_LIMIT);
  }

  push(entry) {
    push(entry, this.logger, this.LIMIT);
  }

  clear() {
    this.actionLogger = [];
  }

  toClipBoard() {
    return copy(stringify(merge(this.actionLogger, this.logger), null, 4));
  }
}

function push(entry, array, limit) {
  array.push(entry);
  if (array.length > limit) {
    array.shift();
  }
}

function merge(actions, log) {
  let a = 0;
  let l = 0;
  const res = [];
  while (a < actions.length && l < log.length) {
    const action = actions[a];
    const logEntry = log[l];
    if (+action.startTime / 1000 <= logEntry.epoch) {
      res.push(action);
      a += 1;
    } else {
      res.push(logEntry);
      l += 1;
    }
  }
  while (a < actions.length) {
    res.push(actions[a]);
    a += 1;
  }
  while (l < log.length) {
    res.push(log[l]);
    l += 1;
  }
  return res;
}

export default new BookingLogger();


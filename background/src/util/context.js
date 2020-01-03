/* eslint camelcase:0 */
export function chromeIntrospection(chrome = window.chrome) {
  const runtime = chrome.runtime;
  const extension_id = runtime.id;
  let version = runtime.getManifest().version;
  const temp = version.split('.');
  // consider only the last part if semantic versioning is used
  if (temp.length > 1) {
    version = temp[temp.length - 1];
  }
  return {
    extension_id,
    version,
  };
}

class Context {
  constructor() {
    this.data = {};
    this.waitList = {};
  }

  addData(data) {
    this.data = {
      ...this.data,
      ...data,
    };
    Object.keys(data).forEach((key) => {
      const waiting = this.waitList[key];
      if (waiting) {
        delete this.waitList[key];
        waiting.forEach(val => val.update());
      }
    });
  }

  injectTo(obj) {
    if (!obj || typeof obj !== 'object') {
      throw new Error('Context can be added only to an object');
    }
    return Object.assign(obj, this.data);
  }

  whenReady(key, timeout = 0) {
    const promise = new Promise((resolve, reject) => {
      if (this.data[key] !== undefined) {
        resolve();
        return;
      }
      const wait = {
        update: () => {
          if (wait.cancel) {
            clearTimeout(wait.cancel);
          }
          resolve();
        },
      };
      if (timeout) {
        const cancel = setTimeout(() => {
          const waitList = this.waitList[key];
          if (waitList) {
            const i = waitList.indexOf(wait);
            if (i > -1) {
              waitList.splice(i, 1);
            }
          }
          reject();
        }, timeout);
        wait.cancel = cancel;
      }
      if (!this.waitList[key]) {
        this.waitList[key] = [wait];
      } else {
        this.waitList[key].push(wait);
      }
    });
    return promise;
  }

  __clear() {
    this.data = {};
    Object.keys(this.waitList).forEach(k => this.waitList[k].forEach(v => v.update()));
  }
}

export default new Context();

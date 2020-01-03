// services are state-less
// they act as utility facades that abstract the details for complex operations
// normally, our interface to any sort of server API will be as a service
import Context from '../util/context';
import Http from '../util/http';
import logger from '../logger';
import { returnDictIndexedByExtension, getNameIfStaffExtension } from '../../../shared/util';

///also edit this part here:::: it should not contail is_bphone

const VOICE_API = 'http://voice.api.booking.com';
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};
const MS_PER_DAY = 1000 * 60 * 60 * 24;
const STAFF_DATA_INDEXED_BY_EXTENSION = {};
class VoiceApi {
  static agentSettings(userId, userEmail, token) {
    const url = `${VOICE_API}/finesse/agent_settings`;
    const req = {
      user_id: userId,
      email: userEmail,
      token,
      verify: 0,
      is_bphone: 1,
    };
    return post(url, req, {
      retry: { retries: 3 },
      timeout: 15000,
    }).then(toJson);
  }

  static isContextValidUrl(context) {
    return [
      /^http:\/\/[a-z0-9-]+\.voice\.booking\.com/,
      /^https:\/\/office\.booking\.com\/staff\//,
      /^https:\/\/outlook\.booking\.com/,
      /^https:\/\/workforce\.booking\.com/,
      /^https?:\/\/workingatbooking\.com/,
      /^https?:\/\/workday\.booking\.com/,
    ].some(re => context.match(re)) === false; // none of the rules matched, so it's fine
  }

  static storeCallContext(callerId, staffId, context) {
    const url = createUrl('store_call_context');

    if (!callerId || !this.isContextValidUrl(context)) {
      return null;
    }

    return post(url, {
      caller_id: callerId,
      caller_staff_id: staffId,
      url: context,
    });
  }

  static retrieveCallContext(callerId, staffId) {
    const url = createUrl('retrieve_call_context');
    return post(url, {
      caller_id: callerId,
      recipient_staff_id: staffId,
      can_be_multiple: 1,
    });
  }

  static markContextAsRead(contextId) {
    const url = createUrl('mark_call_context_as_seen');
    return post(url, {
      context_id: contextId,
    });
  }

  static sendMonitoring(event) {
    const url = createUrl('monitoring');
    Context.injectTo(event);
    // eslint-disable-next-line no-param-reassign
    event.timestamp = Math.floor(Date.now() / 1000);
    return post(url, event, { retry: {
      retries: 3,
      minInterval: 500,
      maxInterval: 5000,
    } });
  }

  static getSettings(request) {
    const url = createUrl('get_settings');
    return post(url, request).then(toJson);
  }

  static lookupPartnerIdByNumber(callInfo) {
    const url = `${VOICE_API}/number_lookup_partner_id`;
    return post(url, callInfo).then(toJson);
  }

  static postLog(level, ...args) {
    const epoch = Date.now() / 1000;
    const { message, details } = convertLogEntry(args);
    const req = Context.injectTo({ epoch, message, details });
    const url = createUrl(`log_${level}`);
    return post(url, req, { retry: {
      retries: 2,
      minInterval: 100,
      maxInterval: 1000,
    } });
  }

  /**
   * @param {[{epoch: number, level: string, data: Array<any>}]} entries
   */
  static postBulkLog(entries) {
    if (entries.length === 0) {
      return Promise.resolve();
    }
    const data = entries.map(entry => ({
      ...convertLogEntry(entry.data),
      level: entry.level,
      epoch: entry.epoch,
    }));
    const req = Context.injectTo({ data });
    const url = createUrl('bulk_log');
    return post(url, req, {
      timeout: 5000,
    });
  }

  static getStaffExtensions() {
    return new Promise((resolve, reject) => {
      const now = new Date();
      chrome.storage.local.get('staff_extensions', (item) => {
        const obj = item.staff_extensions;
        if (!obj || !obj.data || obj.data.length === 0
          || now.getTime() - obj.timestamp > MS_PER_DAY) {
          const url = createUrl('get_staff_extensions');
          post(url, {}, {
            retry: {
              retries: 3,
              minInterval: 500,
              maxInterval: 5000,
            },
          }).then(toJson)
            .then((data) => {
              chrome.storage.local.set({ staff_extensions: { timestamp: now.getTime(), data } });
              const extensionDict = returnDictIndexedByExtension(data);
              Object.assign(STAFF_DATA_INDEXED_BY_EXTENSION, extensionDict);
              chrome.storage.local.set({ staff_data_indexed_by_extension: extensionDict });
              resolve(data);
            }).catch((error) => {
              if (obj && obj.data) {
                const extensionDict = returnDictIndexedByExtension(obj.data);
                Object.assign(STAFF_DATA_INDEXED_BY_EXTENSION, extensionDict);
                resolve(obj.data);
                logger.error('Error fetching staff extensions');
                return;
              }
              reject(error);
            });
        } else {
          const extensionDict = returnDictIndexedByExtension(obj.data);
          Object.assign(STAFF_DATA_INDEXED_BY_EXTENSION, extensionDict);
          resolve(obj.data);
        }
      });
    });
  }
  /**
   *
   * @param {string} extension
   */
  static getStaffDetailsByExtension(extension) {
    return new Promise((resolve, reject) => {
      if (Object.keys(STAFF_DATA_INDEXED_BY_EXTENSION).length === 0) {
        chrome.storage.local.get('staff_data_indexed_by_extension', (item) => {
          const obj = item.staff_data_indexed_by_extension;
          if (obj) {
            Object.assign(STAFF_DATA_INDEXED_BY_EXTENSION, obj);
            resolve(obj[extension]);
          } else {
            chrome.storage.local.get('staff_extensions', (record) => {
              const data = record.staff_extensions;
              if (data && data.data && data.data.length > 0) {
                Object.assign(STAFF_DATA_INDEXED_BY_EXTENSION,
                  returnDictIndexedByExtension(data.data));
                chrome.storage.local.set({
                  staff_extensions_indexed_by_extension: STAFF_DATA_INDEXED_BY_EXTENSION });
                resolve(STAFF_DATA_INDEXED_BY_EXTENSION[extension]);
              } else {
                reject();
              }
            });
          }
        });
      } else {
        resolve(STAFF_DATA_INDEXED_BY_EXTENSION[extension]);
      }
    });
  }

  static getStaffNameByExtensionSynchronously(extension) {
    return getNameIfStaffExtension(extension, STAFF_DATA_INDEXED_BY_EXTENSION);
  }

  static getFeatures(staffId) {
    const url = createUrl(`features?staff_id=${staffId}`);
    return Http.get(url, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 5000,
      retry: {
        retries: 3,
        maxInterval: 1000,
      },
    }).then(toJson);
  }

  static logAgentState(staffId, state, reasonCode, callId = null) {
    const url = createUrl('log_bpe_agent_state');
    const data = {
      staff_id: staffId,
      state,
      reason_code: reasonCode,
      callid: callId,
    };
    return post(url, data, {
      retry: { retries: 2 },
    });
  }
}

/**
 * @param {string} action
 */
function createUrl(action) {
  return `${VOICE_API}/browser_extension/${action}`;
}

function post(url, body, optionsOverride = {}) {
  return Http.fetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: DEFAULT_HEADERS,
    timeout: 20000,
    ...optionsOverride,
  });
}

function toJson(response) {
  if (response.ok) {
    return response.json();
  }
  throw new Error(`Failed to reach VOICEAPI - Invalid status (${response.status}) ${response.statusText}`);
}

/**
 * @param {any[]} data
 * @returns {{message: string, details: any}}
 */
function convertLogEntry(data) {
  const message = data.filter(item => typeof item !== 'object' && typeof item !== 'function').join(' ');
  let details = data.filter(val => typeof val === 'object' && !(val instanceof Array));
  if (details.length === 1) {
    details = details[0];
  } else if (details.length === 0) {
    details = null;
  }
  return { message, details };
}

export default VoiceApi;

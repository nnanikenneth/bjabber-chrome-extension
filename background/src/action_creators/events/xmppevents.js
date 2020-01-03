import { EVENTS_ACTIONS } from '../../../../shared/action_types/events';
import { CALL_MANAGER_ACTIONS } from '../../../../shared/action_types/callManager';
import { CORE_ACTIONS } from '../../../../shared/action_types/core';
import { CALL_STATUS, CM_STATUS } from '../../../../shared/status_types/callManager';
import Voiceapi from '../../services/voiceapi';
import logger from '../../logger';
import { XMLToJS } from '../../util/xml';
import jabberwerx from './utils/jabberwerx';
import { formatCallData } from '../../util/finesse';
import { EVENTS_STATUS } from '../../../../shared/status_types/events';

/* eslint no-underscore-dangle:0 */

/* Unsafe */
// FIXME: This is holding some state for the xmpp client, would be nice to not needed this
// Because it breaks the stateless/functional Redux approach

let connectionChecker = null;
let fuckedUp = null;

window.jabberwerxHasFuckedUp = (source) => {
  fuckedUp = setTimeout(() => {
    logger.error('Jabberwerx died.');
    Voiceapi.sendMonitoring({
      event_type: 'critical_error',
      message: 'jabberwerx_died',
      triggeredFrom: source,
    });
  }, 15000);
};

function clearFuckUpTimeout() {
  clearTimeout(fuckedUp);
}

export function eventsDisconnect(reason, jwClient) {
  return (dispatch) => {
    try {
      if (jwClient) {
        jwClient.disconnect();
      }

      jabberwerx.reset();
      dispatch({
        type: EVENTS_ACTIONS.DISCONNECTED,
        reasonDisconnect: reason,
      });
    } catch (e) {
      dispatch({
        type: EVENTS_ACTIONS.DISCONNECTED,
        lastError: e,
        reasonDisconnect: 'Error while disconnecting',
      });
    }

    return Promise.resolve();
  };
}

export function subscribe(jwClient, host) {
  return (dispatch, getState) => {
    const state = getState();
    const agent = state.callManager.agentInfo;
    const currentHost = state.callManager.connectionDetails.host;
    if (currentHost !== host) {
      // Probably failover happened
      dispatch({
        type: EVENTS_ACTIONS.CONNECTION_FAILED,
      });
      return Promise.resolve();
    }
    const jid = `${agent.agentid}@${host}`;
    const resourceHost = resource(host);
    const fullJid = `${jid}/${resourceHost}`;

    const sources = [
      `<pubsub xmlns='http://jabber.org/protocol/pubsub'><subscribe node='/finesse/api/User/${agent.agentid}' jid='${fullJid}' /></pubsub>`,
      `<pubsub xmlns='http://jabber.org/protocol/pubsub'><subscribe node='/finesse/api/User/${agent.agentid}/Dialogs' jid='${fullJid}' /></pubsub>`,
      `<pubsub xmlns='http://jabber.org/protocol/pubsub'><subscribe node='/finesse/api/SystemInfo' jid='${fullJid}' /></pubsub>`,
    ];

    try {
      const subscribedSources = sources.map((source) => {
        jwClient.sendIq('set', `pubsub.${host}`, source, () => {}, 10);
        return source;
      });

      dispatch({
        type: EVENTS_ACTIONS.CONNECTED,
        sources: subscribedSources,
        host,
      });
      dispatch({
        type: CORE_ACTIONS.START_FINISHED,
      });
    } catch (err) {
      dispatch({
        type: EVENTS_ACTIONS.FATAL_ERROR,
        lastError: `Can't subscribe to jabber channels ${err}`,
      });
      dispatch({
        type: CORE_ACTIONS.FAILED,
      });
    }
    return Promise.resolve();
  };
}


export function unsubscribe(jwClient) {
  return (dispatch, getState) => {
    const state = getState();
    const agent = state.callManager.agentInfo;
    const host = state.events.connectedHost;
    const jid = `${agent.agentid}@${host}`;
    const resourceHost = resource(host);
    const fullJid = `${jid}/${resourceHost}`;

    try {
      jwClient.sendIq('set', `pubsub.${host}`, `<pubsub xmlns='http://jabber.org/protocol/pubsub'><unsubscribe node='/finesse/api/User/${agent.agentid}' jid='${fullJid}' /></pubsub>`, () => {
      }, 10);
      jwClient.sendIq('set', `pubsub.${host}`, `<pubsub xmlns='http://jabber.org/protocol/pubsub'><unsubscribe node='/finesse/api/User/${agent.agentid}/Dialogs' jid='${fullJid}' /></pubsub>`, () => {
      }, 10);

      dispatch({
        type: EVENTS_ACTIONS.UNSUBSCRIBED,
      });
    } catch (e) {
      dispatch({
        type: EVENTS_ACTIONS.ERROR,
        lastError: `Error unsubscribing the channels: ${JSON.stringify(e)}`,
      });
      dispatch({
        type: CORE_ACTIONS.FAILED,
      });
    }
    return Promise.resolve();
  };
}

function jwStatusString(statusCode = '') {
  let statusStr;
  switch (statusCode) {
    case jabberwerx.Client.status_connecting:
      statusStr = 'connecting';
      break;
    case jabberwerx.Client.status_connected:
      statusStr = 'connected';
      break;
    case jabberwerx.Client.status_disconnected:
      statusStr = 'disconnected';
      break;
    case jabberwerx.Client.status_reconnecting:
      statusStr = 'reconnecting';
      break;
    case jabberwerx.Client.status_disconnecting:
      statusStr = 'disconnecting';
      break;
    default:
      statusStr = `unknown (${statusCode})`;
  }
  return statusStr;
}

export function onClientStatusChanged(evt, jwClient, host, timeout = 10000) {
  return (dispatch) => {
    clearFuckUpTimeout();

    const newStatus = evt.data.next || '';
    const oldStatus = evt.data.previous;
    switch (newStatus) {
      case jabberwerx.Client.status_connecting:
        connectionChecker = setTimeout(() => {
          logger.error('JW connection failed');
        }, timeout);
        break;
      case jabberwerx.Client.status_connected:
        clearTimeout(connectionChecker);
        dispatch({
          type: EVENTS_ACTIONS.SUBSCRIBING,
        });
        jwClient.sendPresence(undefined, 'available');
        dispatch(subscribe(jwClient, host));
        break;
      case jabberwerx.Client.status_disconnected:
        break;
      case jabberwerx.Client.status_reconnecting:
        dispatch({
          type: EVENTS_ACTIONS.RECONNECTING,
        });
        break;
      case jabberwerx.Client.status_disconnecting:
        break;
      default:
    }
    logger.info(`Jabberwerx client status change from ${jwStatusString(oldStatus)} to ${jwStatusString(newStatus)}`);

    return Promise.resolve();
  };
}

export function onClientDisconnected(err, jwClientId) {
  return (dispatch, getState) => {
    const { callManager, events } = getState();
    let lastError = err;
    const reconnect =
      [CM_STATUS.CONNECTED, CM_STATUS.CONNECTING].includes(callManager.cmStatus) &&
      events.status !== EVENTS_STATUS.DISCONNECTING;
    if (err && err.source && err.source._guid === jwClientId && err.data && err.data.firstChild && err.data.firstChild.nodeName === 'conflict') {
      lastError = 'Client disconected because of conflict';
    } else if (err instanceof jabberwerx.EventObject) {
      if (err.data && err.data.innerHTML) {
        const message = err.data.innerHTML;
        lastError = `Jabberwerx event: ${message}`;
      } else if (err.name) {
        lastError = err.name;
      } else {
        lastError = 'unknown';
      }
    }
    dispatch({
      type: EVENTS_ACTIONS.DISCONNECTED,
      reasonDisconnect: 'Client disconnected',
      lastError,
      reconnect,
    });
    return Promise.resolve();
  };
}

function handleErrorEvent(event, dispatch) {
  if (event.Update.data.apiErrors) {
    const apiError = event.Update.data.apiErrors.apiError;
    const lastError = `Api Errors: ${apiError.errorMessage}: ${apiError.errorType} (${apiError.errorData})`;
    if (apiError.errorData === '70') {
      logger.warn('Will disconnect due to fatal error', apiError);
      dispatch({
        type: EVENTS_ACTIONS.FATAL_ERROR,
        lastError,
      });
      dispatch({
        type: CORE_ACTIONS.LOGOUT,
      });
      return dispatch({
        type: CALL_MANAGER_ACTIONS.CM_LOGOUT,
      });
    }
    return dispatch({
      type: EVENTS_ACTIONS.ERROR,
      lastError,
    });
  }
  return false;
}

export function onMessageReceived(e, agent) {
  return (dispatch, getState) => XMLToJS(e.data._DOM.textContent)
    .then((event) => {
      if (e.data._DOM.attributes.getNamedItem('to').nodeValue.indexOf('agent_desktop') === -1) {
        return null; // pretend this never happened
      }
      const error = handleErrorEvent(event, dispatch);
      if (error) {
        return error;
      }

      const sourceType = getSourceType(event.Update.source, agent.agentid);
      const eventState = getEventState(sourceType, event, agent.extension);
      const eventMethod = event.Update.event;
      dispatch({
        type: EVENTS_ACTIONS.EVENT_RECEIVED,
        eventData: event,
        eventMethod,
        eventState,
        sourceType,
      });

      const state = getState();

      if (['DIALOG', 'DIALOGS'].includes(sourceType)) {
        const callStatus = state.callManager.callStatus;
        const dialog = (sourceType === 'DIALOGS') ? event.Update.data.dialogs.Dialog : event.Update.data.dialog;
        const callData = formatCallData(dialog, event.Update.event, agent);
        const activeCallId = state.callManager.activeCallId;
        if (activeCallId !== callData.media_id) {
          dispatch({
            type: CALL_MANAGER_ACTIONS.CALL_ACTIVITY,
            callData,
          });
        }

        // The call ended, update the data according
        if (eventMethod === 'DELETE') {
          dispatch({
            type: CALL_MANAGER_ACTIONS.ENDED_CALL,
            callData,
          });
        } else if (eventState === 'INITIATING' && callStatus !== CALL_STATUS.INITIATING) {
          dispatch({
            type: CALL_MANAGER_ACTIONS.INITIATING_CALL,
            callData,
          });
        } else if (eventState === 'INITIATED' && callStatus !== CALL_STATUS.OUTGOING_CALL) {
          callData.startTime = new Date();
          dispatch({
            type: CALL_MANAGER_ACTIONS.OUTGOING_CALL,
            callData,
          });
        } else if (eventState === 'ALERTING' && callStatus !== CALL_STATUS.INCOMING_CALL) {
          callData.startTime = new Date();
          dispatch({
            type: CALL_MANAGER_ACTIONS.INCOMING_CALL,
            callData,
          });
        } else if (eventState === 'ACTIVE') {
          dispatch({
            type: CALL_MANAGER_ACTIONS.ACTIVE_CALL,
            callData,
          });
        }
      } else if (sourceType === 'USER') {
        const data = {
          state: event.Update.data.user.state,
          stateChangeTime: event.Update.data.user.stateChangeTime,
        };

        if (event.Update.data.user.reasonCodeId) {
          data.reasonCode = event.Update.data.user.reasonCodeId;
        }
        if (event.Update.data.user.reasonCode) {
          data.reasonLabel = event.Update.data.user.reasonCode.label;
          data.logicCode = parseInt(event.Update.data.user.reasonCode.code, 10);
        }
        const callStatus = state.callManager.callStatus;
        let newCallStatus = null;
        if (callStatus !== CALL_STATUS.FREE && (data.state === 'WORK_READY' || data.state === 'WORK')) {
          newCallStatus = CALL_STATUS.FREE;
        }
        if (data.state === 'LOGOUT') {
          dispatch({
            type: CORE_ACTIONS.LOGOUT,
          });

          dispatch({
            type: CALL_MANAGER_ACTIONS.CM_LOGOUT,
          });
        } else if (newCallStatus === CALL_STATUS.FREE) {
          dispatch({
            type: CALL_MANAGER_ACTIONS.ENDED_CALL,
          });
        }

        const agentState = {
          state: data.state,
          stateChangeTime: data.stateChangeTime,
          reasonCode: data.reasonCode,
          logicCode: data.logicCode,
          reasonLabel: data.reasonLabel,
        };

        dispatch({
          type: CALL_MANAGER_ACTIONS.REASON_STATE_CHANGED,
          agentState,
          reasonId: data.reasonCode || -1,
        });
      }

      clearFuckUpTimeout();
      return null;
    }).catch((err) => {
      const lastError = `Malformed message ${err}`;
      return dispatch({
        type: EVENTS_ACTIONS.ERROR,
        lastError,
      });
    });
}

export function eventsConnect(oldClient, errorsLimit = 5) {
  return (dispatch, getState) => {
    const state = getState();
    let errors = state.events.errorsCount ? state.events.errorsCount : 0;

    const agent = state.callManager.agentInfo;
    const connectionDetails = state.events.connectionDetails;
    const host = state.callManager.connectionDetails.host;
    const jid = `${agent.agentid}@${host}`;

    if (oldClient) {
      oldClient.disconnect();
    }

    const jwClient = new jabberwerx.Client(resource(host));
    /* we're keeping jw client id to filter events from outdated clients if that happens */
    const jwClientId = jwClient._guid;

    const jwArgs = {
      httpBindingURL: bindingURL(connectionDetails.scheme, connectionDetails.port, host),
      errorCallback: wrapCallback((e) => {
        clearFuckUpTimeout();
        if (e.firstChild.nodeName && e.firstChild.nodeName === 'not-authorized') {
          errors += 1;
          dispatch({
            type: EVENTS_ACTIONS.ERROR,
            lastError: 'Not Authorized',
          });
        } else if (e.firstChild.nodeName && e.firstChild.nodeName === 'bad-request') {
          /* it's probably a subscription error */
          errors += 1;
          dispatch({
            type: EVENTS_ACTIONS.ERROR,
            lastError: 'Bad Request',
          });
        }

        if (errors >= errorsLimit) {
          dispatch({
            type: EVENTS_ACTIONS.FATAL_ERROR,
            lastError: `JWwrapper critical amount of errors reached: ${errors}/${errorsLimit}`,
          });
          dispatch({
            type: CORE_ACTIONS.FAILED,
          });
        } else {
          clearTimeout(connectionChecker);
          let scheme = connectionDetails.scheme;
          let port = connectionDetails.port;

          if (scheme === 'http') {
            scheme = 'https';
            port = 7443;
          } else {
            scheme = 'http';
            port = 7071;
          }

          dispatch({
            type: EVENTS_ACTIONS.CONNECTION_FAILED,
            connectionDetails: {
              scheme,
              port,
            },
          });
        }
      }, dispatch),
      successCallback: wrapCallback(() => {
        clearFuckUpTimeout();
        clearTimeout(connectionChecker);
      }, dispatch),
      unsecureAllowed: true,
      baseReconnectCountdown: 0,
    };

    /* somehow JW does not use settings from arguments, so we need to define them here */
    jabberwerx._config.baseReconnectCountdown = 0;
    jabberwerx._config.unsecureAllowed = true;

    /* istanbul ignore next */
    jwClient.event('messageReceived').bindWhen(
      'event[xmlns="http://jabber.org/protocol/pubsub#event"] items item notification',
      wrapCallback(e => onMessageReceived(e, agent)(dispatch, getState), dispatch),
    );

    const bindEvent = (name, callback) => {
      jwClient.event(name).bind(wrapCallback(callback, dispatch));
    };
    bindEvent('clientStatusChanged', evt => dispatch(onClientStatusChanged(evt, jwClient, host)));
    bindEvent('clientDisconnected', err => dispatch(onClientDisconnected(err, jwClientId)));

    return new Promise((resolve, reject) => {
      try {
        jwClient.connect(jid, agent.password, jwArgs);
        resolve(jwClient);
      } catch (e) {
        const error = `JWWrapper: Cannot connect to events: ${e}`;
        dispatch({
          type: EVENTS_ACTIONS.FATAL_ERROR,
          lastError: error,
        });
        dispatch({
          type: CORE_ACTIONS.FAILED,
        });
        reject(error);
      }
    });
  };
}

/**
 * Catch errors in jabberwerx callbacks.
 * They will only be logged by the library by default.
 * @param {Function} fn
 * @param {Function} dispatch
 */
function wrapCallback(fn, dispatch) {
  return (...args) => {
    try {
      return fn(...args);
    } catch (e) {
      const lastError = e.message || e;
      return dispatch({
        type: EVENTS_ACTIONS.ERROR,
        lastError,
      });
    }
  };
}

function crcNoTable(data) {
  let crc = 0xFFFF;
  for (let i = 0, l = data.length; i < l; i += 1) {
    crc ^= data[i]; // eslint-disable-line no-bitwise

    for (let j = 0; j < 8; j += 1) {
      if (crc & 1) { // eslint-disable-line no-bitwise
        crc = (crc >> 1) ^ 0xA001; // eslint-disable-line no-bitwise
      } else {
        crc >>= 1; // eslint-disable-line no-bitwise
      }
    }
  }
  return crc;
}

function resource(host) {
  if (host) {
    return `agent_desktop_${crcNoTable(host).toString(36)}`;
  }
  return '';
}

function bindingURL(scheme, port, host) {
  return `${scheme}://${host}:${port}/http-bind/`;
}

export function getSourceType(source, agentId) {
  if (source === `/finesse/api/User/${agentId}/Dialogs`) {
    return 'DIALOGS';
  } else if (source.match(/\/finesse\/api\/Dialog\//g)) {
    return 'DIALOG';
  } else if (source === `/finesse/api/User/${agentId}`) {
    return 'USER';
  }
  return '';
}

export function getParticipantMe(participants, extension) {
  if (Array.isArray(participants)) {
    let me = participants.filter(part =>
      part.mediaAddress === extension,
    )[0];
    if (!me) {
      logger.warn('Cannot find user in participants list', participants);
      const agents = participants.filter(part => part.mediaAddressType === 'AGENT_DEVICE');
      if (agents.length === 1) {
        me = agents[0];
      } else {
        throw new Error('Cannot find myself in participants list');
      }
    }
    return me;
  }
  return participants;
}

export function getParticipantsNotMe(participants, extension) {
  if (Array.isArray(participants)) {
    return participants.filter(part =>
      part.mediaAddress !== extension,
    );
  }

  return [];
}

export function getEventState(sourceType, event, extension) {
  switch (sourceType) {
    case 'DIALOGS':
      return getParticipantMe(
        event.Update.data.dialogs.Dialog.participants.Participant,
        extension)
        .state;
    case 'DIALOG':
      return event.Update.data.dialog.state;
    case 'USER':
      return event.Update.data.user.state;
    default:
      /* istanbul ignore next */
      return null;
  }
}

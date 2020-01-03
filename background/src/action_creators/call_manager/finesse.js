import VoiceApi from '../../services/voiceapi';
import { CALL_MANAGER_ACTIONS } from '../../../../shared/action_types/callManager';
import { CORE_ACTIONS } from '../../../../shared/action_types/core';
import { STORAGE_ACTIONS } from '../../../../shared/action_types/storage';
import PhoneLinesActions from '../../../../shared/action_types/phoneLines';
import SystemAction from '../../../../shared/action_types/system';
import FinesseServices from '../../services/finesse';
import { getReasonByLabel } from '../../../../shared/selectors/callManager';
import { AGENT_STATE } from '../../../../shared/status_types/callManager';
import { formatCallData, formatPhoneNumber } from '../../util/finesse';

import teleConversation from "../../containers/telephonyConversation/index"; 

import logger from '../../logger';
import { formatErrorMessage } from '../../util/errors';
import { xmlArray } from '../../util/xml';

const MS_30_MINUTES = 1000 * 60 * 30;
const MS_8_HOURS = 1000 * 60 * 60 * 8;


function isHttpsRedirect(response, connectionDetails) {
  return response.redirected &&
         response.url.match(/^https:/) &&
         connectionDetails.scheme === 'http';
}


export function getQueues() {
  return (dispatch, getState) => {
    const state = getState();
    const connectionDetails = state.callManager.connectionDetails;
    const agentInfo = state.callManager.agentInfo;

    FinesseServices
      .getQueues(connectionDetails, agentInfo)
      .then(response => response.xml())
      .then((responseObject) => {
        const queueData = responseObject
          .Queues
          .Queue
          .filter(queue => queue.statistics.callsInQueue > -1);
        dispatch({
          type: CALL_MANAGER_ACTIONS.QUEUE_UPDATED,
          queueData,
        });
      });
  };
}

function requestSystemInfo(onSuccess, onError) {
  return (dispatch, getState) => {
    const state = getState();
    const connectionDetails = state.callManager.connectionDetails;
    const agentInfo = state.callManager.agentInfo;
    return FinesseServices
      .getSystemInfo(connectionDetails, agentInfo)
      .then((response) => {
        if (response.ok) {
          return response.xml();
        }
        throw new Error(`Response code is ${response.status} (${response.statusText})`);
      })
      .then((responseJs) => {
        const status = responseJs.SystemInfo.status;
        if (status === 'IN_SERVICE') {
          onSuccess(dispatch, responseJs);
          return;
        }
        throw new Error(`Finesse ${connectionDetails.host} has status ${status}`);
      })
      .catch(error => onError(dispatch, error, state));
  };
}

export function getSystemInfoAction() {
  return requestSystemInfo((dispatch, response) => {
    dispatch({
      type: CALL_MANAGER_ACTIONS.TIME_SYNC,
      timeOffset: Date.now() - (+new Date(response.SystemInfo.currentTimestamp)),
    });
  }, (dispatch, error) => {
    dispatch({
      type: CALL_MANAGER_ACTIONS.CM_FAILED,
      lastError: formatErrorMessage('Failed to get System Info', error),
    });
  });
}

export function runFailoverCheck() {
  return requestSystemInfo((dispatch) => {
    dispatch({
      type: CALL_MANAGER_ACTIONS.CM_CONNECT,
    });
  }, (dispatch, error, state) => {
    const connectionDetails = state.callManager.connectionDetails;
    logger.error(`Finesse availability check failed for ${connectionDetails.host}: ${error.message}`);
    dispatch({
      type: CALL_MANAGER_ACTIONS.CM_FAILOVER,
      failoverInitiatedAt: Date.now(),
    });
  });
}

export function getAgentDialogs() {
  return (dispatch, getState) => {
    const state = getState();
    const connectionDetails = state.callManager.connectionDetails;
    const agentInfo = state.callManager.agentInfo;
    return FinesseServices
      .getAgentDialogs(connectionDetails, agentInfo)
      .then(response => response.xml())
      .then((responseJs) => {
        let activeCalls = {};

        if (responseJs.Dialogs && Array.isArray(responseJs.Dialogs.Dialog)) {
          activeCalls = responseJs
            .Dialogs
            .Dialog
            .reduce((o, dialog) => {
              const callData = formatCallData(dialog, null, agentInfo);
              const key = callData.id;
              return {
                ...o,
                [key]: callData,
              };
            }, {});
        } else if (responseJs.Dialogs.Dialog) {
          const callData = formatCallData(responseJs.Dialogs.Dialog, null, agentInfo);
          activeCalls[callData.id] = callData;
        }

        dispatch({
          type: CALL_MANAGER_ACTIONS.AGENT_DIALOGS_LOADED,
          activeCalls,
        });
      }).catch((error) => {
        if (error.type === 'malformed-response') {
          const lastError = error.message;
          dispatch({
            type: CALL_MANAGER_ACTIONS.CM_ERROR,
            lastError,
          });
        } else {
          dispatch({
            type: CALL_MANAGER_ACTIONS.CM_FAILED,
            lastError: formatErrorMessage('Failed to get Agent Dialogs', error),
          });
        }
      });
  };
}

export function storeCallContext() {
  return (dispatch, getState) => {
    const state = getState();

    const callerId = state.callManager.agentInfo.extension;
    const staffId = state.callManager.agentInfo.staff_id;
    const context = state.callManager.actionPayload.context;
    const tab = state.callManager.actionPayload.currentTab;

    return VoiceApi
      .storeCallContext(callerId, staffId, context)
      .then((response) => {
        if (response.ok) {
          dispatch({
            type: CALL_MANAGER_ACTIONS.CONTEXT_SHARED,
            currentTab: tab,
          });
        } else {
          throw new Error(`Failed to store state with invalid status: ${response.status})`);
        }
      })
      .catch((error) => {
        const errorMessage = formatErrorMessage('Failing to store state', error);

        dispatch({
          type: CALL_MANAGER_ACTIONS.CM_VOICEAPI_FAILED,
          lastError: errorMessage,
        });
      });
  };
}

export function retrieveCallContext() {
  return (dispatch, getState) => {
    const state = getState();
    const staffId = state.callManager.agentInfo.staff_id;

    const calls = Object
      .keys(state.callManager.activeCalls)
      .filter((key) => {
        const call = state.callManager.activeCalls[key];
        return (call.state === 'ACTIVE');
      });

    if (calls.length > 0) {
      const callData = state.callManager.activeCalls[calls[0]];
      const callerId = callData.from;

      return VoiceApi
        .retrieveCallContext(callerId, staffId)
        .then((response) => {
          if (response.ok) {
            return response.json();
          }
          throw new Error(`Invalid status: ${response.status})`);
        }).then((responseJson) => {
          if (Array.isArray(responseJson)) {
            responseJson.map((context) => {
              dispatch({
                type: CALL_MANAGER_ACTIONS.CONTEXT_RECEIVED,
                context: {
                  id: context._context_id, // eslint-disable-line no-underscore-dangle
                  url: context.urls[0],
                },
              });
              return context;
            });
          }
        }).catch((error) => {
          const errorMessage = formatErrorMessage('Failing to retrieve call context', error);
          dispatch({
            type: CALL_MANAGER_ACTIONS.CM_VOICEAPI_FAILED,
            lastError: errorMessage,
          });
        });
    }
    return null;
  };
}

export function markCallContextAsRead() {
  return (dispatch, getState) => {
    const state = getState();
    const contexts = state.callManager.contexts;
    const contextId = state.callManager.contextId;

    window.open(contexts[contextId].url, '_blank'); // eslint-disable-line no-undef

    return VoiceApi
      .markContextAsRead(contextId)
      .then((response) => {
        if (response.ok) {
          dispatch({
            type: CALL_MANAGER_ACTIONS.CONTEXT_READ,
          });
        } else {
          throw new Error(`Invalid status: ${response.status} )`);
        }
      })
      .catch((error) => {
        const errorMessage = formatErrorMessage('Failing to mark context as read', error);

        dispatch({
          type: CALL_MANAGER_ACTIONS.CM_VOICEAPI_FAILED,
          lastError: errorMessage,
        });
      });
  };
}

export function getAgentSettings() {
  return (dispatch, getState) => {
    const state = getState();
    const userInfo = state.authentication.userInfo;
    return VoiceApi
      .agentSettings(userInfo.id, userInfo.email, userInfo.token)
      .then((data) => {
        const agent = {
          login: data.loginname,
          agentid: data.agentid,
          password: data.password,
          extension: data.extension,
          hosts: data.hosts || [],
          external_line_prefix: data.external_line_prefix,
          international_prefix: data.international_prefix,
          originating_country: data.originating_country || 'nl',
          name: data.name,
          photo: data.photo,
          staff_id: data.staff_id,
          office: data.detected_office || 'unknown',
          settings_override: data.override || '',
          peripherals: data.peripherals || [],
          voice: data.voice || '',
          calling_code: data.calling_code || undefined,
        };

        let host = null;
        if (agent.hosts.length > 0) {
          host = agent.hosts[0];
        }

        if (data.phone_lines && data.phone_lines.length > 0) {
          dispatch({
            type: PhoneLinesActions.STAFF_EXTENSIONS_LOADED,
            data: data.phone_lines,
          });
        }
        if (host) {
          dispatch({
            type: CALL_MANAGER_ACTIONS.CM_CONNECT,
            agentInfo: agent,
            connectionDetails: {
              host,
              scheme: 'http',
            },
          });
          dispatch({
            type: CALL_MANAGER_ACTIONS.REQUESTING_STAFF_EXTENSIONS,
          });
        } else if (agent.name) {
          dispatch({
            type: CALL_MANAGER_ACTIONS.CM_ERROR,
            lastError: `No Finesse host found for agent: ${agent.name}`,
          });
          dispatch({
            type: CORE_ACTIONS.FAILED,
          });
        } else {
          dispatch({
            type: CALL_MANAGER_ACTIONS.CM_ERROR,
            lastError: `Couldn't find agent for user email: ${userInfo.email}`,
          });
          dispatch({
            type: CORE_ACTIONS.FAILED,
          });
        }
        if (agent.staff_id) {
          dispatch({
            type: STORAGE_ACTIONS.SAVE,
            data: { staff_id: agent.staff_id },
          });
        }
      })
      .catch((error) => {
        const errorMessage = formatErrorMessage('Error getting agent details', error);

        dispatch({
          type: CALL_MANAGER_ACTIONS.CM_ERROR,
          lastError: errorMessage,
        });
        dispatch({
          type: CORE_ACTIONS.FAILED,
        });
      });
  };
}

// keep this
export function connectToFinesse() {
  return (dispatch, getState) => {
    const state = getState();
    
    const agentInfo = state.callManager.agentInfo;
    const connectionDetails = state.callManager.connectionDetails;

    return FinesseServices.getAgentState(connectionDetails, agentInfo)
      .then((response) => {
        if (response.ok) {
          return response.xml();
        }
        return response.text().then((errorText) => {
          throw new Error(`Finesse error ${response.status} (${response.statusText}): ${errorText}`);
        });
      })
      .then((newlyConnected) => {
        dispatch({
          type: CALL_MANAGER_ACTIONS.CM_CONNECTED,
        });
      })
      .catch((error) => {
        const errorMessage = formatErrorMessage('Finesse login failed', error);
        dispatch({
          type: CALL_MANAGER_ACTIONS.CM_FAILED,
          lastError: errorMessage,
        });
      });
  };
}

export function convertXmlToWrapupList(xml) {
  let wrapupList = [];
  if (xml.WrapUpReasons && xml.WrapUpReasons.WrapUpReason) {
    const reasons = xmlArray(xml.WrapUpReasons.WrapUpReason);
    wrapupList = reasons.map(reason => (
      {
        code: reason.uri.match(new RegExp('WrapUpReason/([0-9]+)'))[1],
        label: reason.label,
      }
    ));
  }
  return wrapupList;
}

function chooseSavedAgentState(failover, idle) {
  const canUse = data => data.state && Date.now() - data.timestamp < data.usableFor;
  if (canUse(failover) && canUse(idle)) {
    return (failover.timestamp < idle.timestamp) ? failover : idle;
  } else if (canUse(failover)) {
    return failover;
  } else if (canUse(idle)) {
    return idle;
  }

  return null;
}

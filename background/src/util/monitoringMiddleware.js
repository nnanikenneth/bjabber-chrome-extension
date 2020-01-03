import Voiceapi from '../services/voiceapi';
import { CORE_STATUS } from '../../../shared/status_types/core';
import { CORE_ACTIONS } from '../../../shared/action_types/core';
import { EVENTS_STATUS } from '../../../shared/status_types/events';
import { EVENTS_ACTIONS } from '../../../shared/action_types/events';
import { CALL_MANAGER_ACTIONS } from '../../../shared/action_types/callManager';
import { AUTHENTICATION_ACTIONS } from '../../../shared/action_types/authentication';
import SETTINGS_ACTIONS from '../../../shared/action_types/settings';
import jabberwerx from '../action_creators/events/utils/jabberwerx';

function stringifyError(error) {
  if (!error) {
    return error;
  }
  let res = error;
  switch (typeof error) {
    case 'object':
      if (error instanceof Error) {
        res = error.message;
      } else if (error instanceof Array) {
        res = error.filter(val => typeof val !== 'object' && typeof val !== 'function').join(' ');
      } else if (jabberwerx && error instanceof jabberwerx.EventObject) {
        if (error.data && error.data.innerHTML) {
          res = error.data.innerHTML;
        } else if (error.data && error.data._DOM) { // eslint-disable-line no-underscore-dangle
          res = error.data._DOM.innerHTML; // eslint-disable-line no-underscore-dangle
        } else {
          res = '<unknown jabberwerx error>';
        }
      } else {
        try {
          res = JSON.stringify(error);
        } catch (e) {
          res = '<json.stringify failed>';
        }
      }
      break;
    case 'undefined':
      res = 'none';
      break;
    case 'function':
      res = `<function ${error.name}>`;
      break;
    default:
      res = error.toString();
  }

  return res;
}

function collectConnectionDetails(state) {
  const { events, callManager } = state;
  const eventsDetails = (events && events.connectionDetails);
  const cmDetails = callManager && callManager.connectionDetails;
  const details = {};
  if (eventsDetails) {
    details.jw = eventsDetails;
  }
  if (cmDetails) {
    details.finesse = cmDetails;
  }
  return details;
}

const InterceptForMonitoring = ({ getState }) => next => (action) => {
  if (typeof action === 'object' && action.type) {
    let event = null;
    const state = getState();
    const type = action.type;
    switch (action.type) {
      // All kinds of errors
      case EVENTS_ACTIONS.ERROR:
      case EVENTS_ACTIONS.FATAL_ERROR:
      case EVENTS_ACTIONS.CONNECTION_FAILED:
      case CALL_MANAGER_ACTIONS.CM_ERROR:
      case CALL_MANAGER_ACTIONS.CM_FAILED:
      case CALL_MANAGER_ACTIONS.CALL_ERROR:
      case CALL_MANAGER_ACTIONS.CM_VOICEAPI_FAILED:
      case SETTINGS_ACTIONS.ERROR:
      case AUTHENTICATION_ACTIONS.LOGIN_FAILED: {
        const { lastError } = action;
        event = {
          event_type: 'critical_error',
          message: type,
          causedBy: stringifyError(lastError),
          details: collectConnectionDetails(state),
        };
        break;
      }
      // Tracking logout
      case CORE_ACTIONS.LOGOUT: {
        if (state.core && state.core.appStatus !== CORE_STATUS.LOGGED_OUT) {
          event = {
            event_type: 'logout',
          };
        }
        break;
      }
      // Jabberwerx is disconnected and user has not initiated it
      case EVENTS_ACTIONS.DISCONNECTED: {
        const eventsStatus = state.events && state.events.status;
        if (![EVENTS_STATUS.DISCONNECTING, EVENTS_STATUS.NOT_CONNECTED].includes(eventsStatus)) {
          const { lastError } = action;
          event = {
            event_type: 'critical_error',
            message: type,
            causedBy: stringifyError(lastError),
            details: collectConnectionDetails(state),
          };
        }
        break;
      }
      case CALL_MANAGER_ACTIONS.CM_FAILOVER: {
        const prevConnectionDetails = state.callManager.connectionDetails;
        const result = next(action);
        const nextConnectionDetails = getState().callManager.connectionDetails;
        event = {
          event_type: 'failover_happened',
          failover: {
            from: prevConnectionDetails.host,
            to: nextConnectionDetails.host,
          },
        };
        Voiceapi.sendMonitoring(event);
        return result;
      }
      default:
      // do nothing
    }
    if (event) {
      Voiceapi.sendMonitoring(event);
    }
  } else {
    Voiceapi.sendMonitoring({
      event_type: 'unrecognized_action',
    });
  }
  return next(action);
};

export default InterceptForMonitoring;

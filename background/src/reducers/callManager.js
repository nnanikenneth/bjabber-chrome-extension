import { exponentialBackoff } from '../util/backoff';
// Actions
import { CALL_MANAGER_ACTIONS } from '../../../shared/action_types/callManager';
import { CM_STATUS, CALL_STATUS, ACTION_STATUS, AGENT_STATE } from '../../../shared/status_types/callManager';

// milliseconds
const MIN_RETRY_TIME = 500;
const MAX_RETRY_TIME = 5000;
const ERROR_COUNT_THRESHOLD = 2;

const initialState = {
  callStatus: CALL_STATUS.FREE,
  cmStatus: CM_STATUS.NOT_CONNECTED,
  endpoint: {},
  errorsCount: 0,
  agentInfo: null,
  activeCallId: null,
  pendingState: null,
  activeCalls: {},
  callsLog: [],
  host: null,
  typedNumber: '',
  retryTime: MIN_RETRY_TIME,
  timeOffset: 0,
  contexts: {},
  senderContexts: {},
  finesseUnavailable: false,
  connectionDetails: {
    scheme: 'http',
    host: null,
  },

  newlyConnected: null,
  heartbeatTimeouts: 0,
};

const LIMIT_CALLS = 10;

function backoff(state) {
  return exponentialBackoff(state.retryTime, MIN_RETRY_TIME, MAX_RETRY_TIME);
}

// Reducer
export default (state = initialState, action) => {
  switch (action.type) {
    case CALL_MANAGER_ACTIONS.CM_GET_AGENT_SETTINGS:
      return {
        ...state,
        actionStatus: ACTION_STATUS.REQUESTING_AGENT_SETTINGS,
      };
    case CALL_MANAGER_ACTIONS.CM_CONNECT:
      return {
        ...state,
        cmStatus: CM_STATUS.CONNECTING,
        agentInfo: action.agentInfo || state.agentInfo,
        connectionDetails: action.connectionDetails || state.connectionDetails,
      };
    case CALL_MANAGER_ACTIONS.CM_CONNECTED:
      return {
        ...state,
        cmStatus: CM_STATUS.CONNECTED,
        lastError: null,
        retryTime: MIN_RETRY_TIME,
        errorsCount: 0,
        finesseUnavailable: false,
      };
    case CALL_MANAGER_ACTIONS.CM_ERROR:
      return {
        ...state,
        cmStatus: CM_STATUS.ERROR,
        lastError: action.lastError,
      };
    case CALL_MANAGER_ACTIONS.CM_FAILED:
      return {
        ...state,
        cmStatus: CM_STATUS.FAILED,
        retryTime: backoff(state),
        lastError: action.lastError,
        errorsCount: state.errorsCount ? state.errorsCount + 1 : 1,
        finesseUnavailable: state.errorsCount + 1 > ERROR_COUNT_THRESHOLD,
      };
    case CALL_MANAGER_ACTIONS.CM_VOICEAPI_FAILED:
      return {
        ...state,
        lastError: action.lastError,
      };
    case CALL_MANAGER_ACTIONS.INCOMING_CALL: {
      const callId = action.callData.id;
      const activeCalls = {
        ...state.activeCalls,
        [callId]: action.callData,
      };

      return {
        ...state,
        activeCalls,
        callStatus: CALL_STATUS.INCOMING_CALL,
        actionStatus: null,
      };
    }
    case CALL_MANAGER_ACTIONS.UI_TYPED_NUMBER:
      return {
        ...state,
        typedNumber: action.typedNumber,
        typedSource: action.typedSource,
      };
    case CALL_MANAGER_ACTIONS.UI_TYPED_EXTENSION:
      return {
        ...state,
        typedExtension: action.typedExtension,
        typedSource: action.typedSource,
      };
    case CALL_MANAGER_ACTIONS.INITIATING_CALL:
    {
      const callId = action.callData.id;
      const activeCalls = {
        ...state.activeCalls,
        [callId]: action.callData,
      };

      return {
        ...state,
        callStatus: CALL_STATUS.INITIATING,
        activeCalls,
        actionStatus: null,
      };
    }
    case CALL_MANAGER_ACTIONS.UI_QUEUE_REQUEST:
      return {
        ...state,
        actionStatus: ACTION_STATUS.REQUESTING_QUEUE,
      };
    case CALL_MANAGER_ACTIONS.QUEUE_UPDATED:
      return {
        ...state,
        queues: action.queueData,
        actionStatus: null,
      };
    case CALL_MANAGER_ACTIONS.QUEUE_REQUEST_FAILED:
      return {
        ...state,
        queues: [],
        actionStatus: null,
      };
    case CALL_MANAGER_ACTIONS.OUTGOING_CALL: {
      const callId = action.callData.id;
      const activeCalls = {
        ...state.activeCalls,
        [callId]: action.callData,
      };

      return {
        ...state,
        activeCalls,
        callStatus: CALL_STATUS.OUTGOING_CALL,
        actionStatus: null,
      };
    }
    case CALL_MANAGER_ACTIONS.REQUESTING_ANSWER_CALL:
      return {
        ...state,
        actionStatus: ACTION_STATUS.REQUESTING_ANSWER_CALL,
        actionPayload: {
          callId: action.callId,
        },
      };

  
    case CALL_MANAGER_ACTIONS.REQUESTING_WRAPUP_CHANGE:
      return {
        ...state,
        actionStatus: ACTION_STATUS.REQUESTING_WRAPUP_CHANGE,
      };
    
    case CALL_MANAGER_ACTIONS.REQUESTING_AGENT_DIALOGS:
      return {
        ...state,
        actionStatus: ACTION_STATUS.REQUESTING_AGENT_DIALOGS,
      };
    case CALL_MANAGER_ACTIONS.REQUESTING_STAFF_EXTENSIONS:
      return {
        ...state,
        actionStatus: ACTION_STATUS.REQUESTING_STAFF_EXTENSIONS,
      };

   
    case CALL_MANAGER_ACTIONS.REQUESTING_MAKE_CALL:
      return {
        ...state,
        actionStatus: ACTION_STATUS.REQUESTING_CALL,
        senderContexts: {},
      };
    case CALL_MANAGER_ACTIONS.REQUESTING_END_CALL:
      return {
        ...state,
        actionStatus: ACTION_STATUS.REQUESTING_END_CALL,
        actionPayload: {
          callId: action.callId,
        },
      };
    case CALL_MANAGER_ACTIONS.ENDED_CALL: {
      let newCallsLog = state.callsLog;
      if (action.callData &&
          Object.prototype.hasOwnProperty.call(state.activeCalls, action.callData.id)) {
        newCallsLog = [...state.callsLog, action.callData];
      } else if (action.callData == null) {
        Object.keys(state.activeCalls).map(callId => newCallsLog.push(state.activeCalls[callId]));
      }
      newCallsLog = newCallsLog.slice((LIMIT_CALLS * -1));

      let activeCalls = {
        ...state.activeCalls,
      };

      if (action.callData) {
        delete activeCalls[action.callData.id];
      } else {
        activeCalls = {};
      }

      return {
        ...state,
        activeCalls,
        callStatus: CALL_STATUS.FREE,
        callsLog: newCallsLog,
        actionStatus: null,
        contexts: {},
        senderContexts: {},
      };
    }
    case CALL_MANAGER_ACTIONS.REQUESTING_TRANSFER_CALL:
      return {
        ...state,
        actionStatus: ACTION_STATUS.REQUESTING_TRANSFER_CALL,
        actionPayload: {
          number: action.number,
          callId: action.callId,
        },
        consultPayload: {
        },
      };
    case CALL_MANAGER_ACTIONS.REQUESTING_CONSULT_CALL:
      return {
        ...state,
        actionStatus: ACTION_STATUS.REQUESTING_CONSULT_CALL,
        actionPayload: {
          number: action.number,
          callId: action.callId,
        },
        senderContexts: {},
        consultPayload: {
          number: action.number,
          callId: action.callId,
        },
      };
    case CALL_MANAGER_ACTIONS.REQUESTING_HOLD_CALL:
      return {
        ...state,
        actionStatus: ACTION_STATUS.REQUESTING_HOLD_CALL,
        actionPayload: {
          callId: action.callId,
        },
      };
    case CALL_MANAGER_ACTIONS.REQUESTING_RETRIEVE_CALL:
      return {
        ...state,
        actionStatus: ACTION_STATUS.REQUESTING_RETRIEVE_CALL,
        actionPayload: {
          callId: action.callId,
        },
      };
    case CALL_MANAGER_ACTIONS.ACTIVE_CALL: {
      const callId = action.callData.id;
      const activeCalls = {
        ...state.activeCalls,
        [callId]: action.callData,
      };

      return {
        ...state,
        activeCalls,
      };
    }
   
    case CALL_MANAGER_ACTIONS.CALL_ERROR: {
      const pendingState = action.discardPendingState ? null : state.pendingState;

      return {
        ...state,
        lastError: action.lastError,
        actionStatus: null,
        pendingState,
      };
    }
    case CALL_MANAGER_ACTIONS.CM_LOGOUT:
      return {
        ...state,
        lastError: null,
        cmStatus: CM_STATUS.NOT_CONNECTED,
      };

    case CALL_MANAGER_ACTIONS.CM_CLEAR_ERROR:
      return {
        ...state,
        lastError: null,
        actionStatus: null,
      };
    case CALL_MANAGER_ACTIONS.AGENT_DIALOGS_LOADED:
      return {
        ...state,
        activeCalls: action.activeCalls,
      };

    case CALL_MANAGER_ACTIONS.UI_SHARE_CONTEXT:
      return {
        ...state,
        actionStatus: ACTION_STATUS.UI_SHARE_CONTEXT,
        actionPayload: { context: action.context, currentTab: action.currentTab },
      };

    case CALL_MANAGER_ACTIONS.SHARE_CONTEXT:
      return {
        ...state,
        actionStatus: ACTION_STATUS.SHARING_CONTEXT,
        actionPayload: {
          context: action.context,
        },
      };

    case CALL_MANAGER_ACTIONS.REQUESTING_CONTEXT:
      return {
        ...state,
        actionStatus: ACTION_STATUS.REQUESTING_CONTEXT,
      };
    case CALL_MANAGER_ACTIONS.CONTEXT_RECEIVED:

      return {
        ...state,
        actionStatus: null,
        contexts: { ...state.contexts, [action.context.id]: action.context },
      };
    case CALL_MANAGER_ACTIONS.CONTEXT_SHARED:
      return {
        ...state,
        senderContexts: {
          ...state.senderContexts,
          [action.currentTab]: { contextSent: true },
        },
        actionStatus: null,
        actionPayload: null,
      };
    case CALL_MANAGER_ACTIONS.CONTEXT_CHANGED:
      return {
        ...state,
        senderContexts: {
          ...state.senderContexts,
          [action.currentTab]: { contextSent: false },
        },
      };
    case CALL_MANAGER_ACTIONS.CONTEXT_CLICKED:
      return {
        ...state,
        actionStatus: ACTION_STATUS.CONTEXT_CLICKED,
        contextId: action.contextId,
      };
    case CALL_MANAGER_ACTIONS.CONTEXT_CLEAR_TAB_DATA:
      return {
        ...state,
        senderContexts: {
          ...state.senderContexts,
          [action.currentTab]: { contextSent: false },
        },
      };
    case CALL_MANAGER_ACTIONS.REQUESTING_SYSTEM_INFO:
      return {
        ...state,
        actionStatus: ACTION_STATUS.REQUESTING_SYSTEM_INFO,
      };
    case CALL_MANAGER_ACTIONS.TIME_SYNC:
      return {
        ...state,
        timeOffset: action.timeOffset,
        actionStatus: null,
      };
    case CALL_MANAGER_ACTIONS.SWITCH_PROTOCOL:
      return {
        ...state,
        connectionDetails: {
          ...state.connectionDetails,
          scheme: action.scheme,
        },
      };
   
    case CALL_MANAGER_ACTIONS.CALL_ACTIVITY: {
      const { callData } = action;
      return {
        ...state,
        activeCallId: callData ? callData.media_id : null,
      };
    }
    default:
      return state;
  }
};

function failover(connectionDetails, hosts) {
  const currentHost = connectionDetails.host;
  const currentScheme = connectionDetails.scheme;
  let newScheme = 'http';

  let newHostIdx = hosts.indexOf(currentHost);
  if (currentScheme === 'http' && newHostIdx !== -1) {
    newScheme = 'https';
  } else {
    newHostIdx = (newHostIdx + 1) % hosts.length;
  }
  return {
    host: hosts[newHostIdx],
    scheme: newScheme,
  };
}

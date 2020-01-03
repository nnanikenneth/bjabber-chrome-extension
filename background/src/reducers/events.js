import { EVENTS_ACTIONS } from '../../../shared/action_types/events';
import { EVENTS_STATUS } from '../../../shared/status_types/events';
import { exponentialBackoff } from '../util/backoff';

// milliseconds
const MIN_RETRY_TIME = 50;
const MAX_RETRY_TIME = 2000;

const initialState = {
  status: EVENTS_STATUS.NOT_CONNECTED,
  errorsCount: 0,
  sources: [],
  retryTime: MIN_RETRY_TIME,
  connectionDetails: {
    scheme: 'https',
    host: null,
    port: 7443,
  },
  connectedHost: null, // Used only to check if we need to reconnect
};

function backoff(state) {
  return exponentialBackoff(state.retryTime, MIN_RETRY_TIME, MAX_RETRY_TIME);
}

// Reducer
export default (state = initialState, action) => {
  switch (action.type) {
    case EVENTS_ACTIONS.CONNECT:
      return {
        ...state,
        status: EVENTS_STATUS.CONNECTING,
      };
    case EVENTS_ACTIONS.SUBSCRIBING:
      return {
        ...state,
        status: EVENTS_STATUS.SUBSCRIBING,
        sources: [],
        errorsCount: 0,
        retryTime: MIN_RETRY_TIME,
      };
    case EVENTS_ACTIONS.CONNECTION_FAILED:
      return {
        ...state,
        status: EVENTS_STATUS.FAILED,
        retryTime: backoff(state),
        connectionDetails:
          (action.connectionDetails) ? action.connectionDetails : state.connectionDetails,
        sources: [],
      };
    case EVENTS_ACTIONS.RECONNECTING:
      return {
        ...state,
        status: EVENTS_STATUS.CONNECTING,
      };
    case EVENTS_ACTIONS.DISCONNECT:
      return {
        ...state,
        status: EVENTS_STATUS.DISCONNECTING,
        reason: action.reason,
      };
    case EVENTS_ACTIONS.DISCONNECTED: {
      const status = action.reconnect ? EVENTS_STATUS.CONNECTING : EVENTS_STATUS.NOT_CONNECTED;
      return {
        ...state,
        status,
        connectedHost: null,
        lastError: action.lastError,
      };
    }
    case EVENTS_ACTIONS.ERROR:
      return {
        ...state,
        lastError: action.lastError,
        errorsCount: (state.errorsCount) ? state.errorsCount + 1 : 1,
      };
    case EVENTS_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        lastError: null,
      };
    case EVENTS_ACTIONS.FATAL_ERROR:
      return {
        ...state,
        status: EVENTS_STATUS.FATAL_ERROR,
        lastError: action.lastError,
      };
    case EVENTS_ACTIONS.CONNECTED:
      return {
        ...state,
        status: EVENTS_STATUS.CONNECTED,
        sources: action.sources,
        connectedHost: action.host,
        lastError: null,
      };
    case EVENTS_ACTIONS.EVENT_RECEIVED:
      return {
        ...state,
        eventData: action.eventData,
        eventState: action.eventState,
        eventMethod: action.eventMethod,
        sourceType: action.sourceType,
      };

    default:
      /* istanbul ignore next */
      return state;
  }
};

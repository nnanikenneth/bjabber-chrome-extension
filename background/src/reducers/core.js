import { CORE_ACTIONS } from '../../../shared/action_types/core';
import { CORE_STATUS, CORE_SCREENS, SEND_LOG_STATUS } from '../../../shared/status_types/core';

const initialState = {
  appStatus: CORE_STATUS.STARTING,
  currentScreen: CORE_SCREENS.HOME,
  sendingLog: SEND_LOG_STATUS.INACTIVE,
  debugActive: false,
  startTime: Date.now(),
};

// Reducer
export default (state = initialState, action) => {
  switch (action.type) {
    case CORE_ACTIONS.START:
      return {
        ...state,
        appStatus: CORE_STATUS.STARTING,
        startTime: Date.now(),
      };
    case CORE_ACTIONS.RESTART:
      return {
        ...state,
        appStatus: CORE_STATUS.RESTARTING,
      };
    case CORE_ACTIONS.CLEAR_CACHE_RESTART:
      return {
        ...state,
        appStatus: CORE_STATUS.CLEARING_CACHE,
      };
    case CORE_ACTIONS.FAILED:
      return {
        ...state,
        appStatus: CORE_STATUS.FAILED,
        startTime: undefined,
      };
    case CORE_ACTIONS.START_FINISHED:
      return {
        ...state,
        appStatus: CORE_STATUS.WORKING,
        startTime: undefined,
      };
    case CORE_ACTIONS.LOGOUT:
      return {
        ...state,
        appStatus: CORE_STATUS.LOGGED_OUT,
        startTime: undefined,
      };
    case CORE_ACTIONS.CHANGE_SCREEN:
      return {
        ...state,
        currentScreen: action.screen,
      };
    case CORE_ACTIONS.SEND_LOG:
      return {
        ...state,
        sendingLog: SEND_LOG_STATUS.SENDING,
      };
    case CORE_ACTIONS.LOG_SENT:
      return {
        ...state,
        sendingLog: SEND_LOG_STATUS.SENT,
      };
    case CORE_ACTIONS.CLOSE_SEND_LOG_MESSAGE:
      return {
        ...state,
        sendingLog: SEND_LOG_STATUS.INACTIVE,
      };
    case CORE_ACTIONS.TOGGLE_DEBUG:
      return {
        ...state,
        debugActive: !state.debugActive,
      };
    default:
      /* istanbul ignore next */
      return state;
  }
};

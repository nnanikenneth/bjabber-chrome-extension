import { AUTHENTICATION_ACTIONS } from '../../../shared/action_types/authentication';
import { AUTH_STATUS } from '../../../shared/status_types/authentication';

const initialState = {
  userInfo: null,
  authStatus: AUTH_STATUS.NO_AUTH,
};

// Reducer
export default (state = initialState, action) => {
  switch (action.type) {
    case AUTHENTICATION_ACTIONS.START_AUTH:
      return {
        ...state,
        authStatus: AUTH_STATUS.START,
      };
    case AUTHENTICATION_ACTIONS.LOGGED_IN:
      return {
        ...state,
        authStatus: AUTH_STATUS.AUTHTOKEN_ACQUIRED,
        userInfo: action.userInfo,
        lastError: null,
      };
    case AUTHENTICATION_ACTIONS.LOGIN_FAILED:
      return {
        ...state,
        userInfo: null,
        authStatus: AUTH_STATUS.AUTHTOKEN_ACQUIRE_FAILED,
        lastError: action.lastError,
      };
    case AUTHENTICATION_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        lastError: null,
      };
    default:
      /* istanbul ignore next */
      return state;
  }
};

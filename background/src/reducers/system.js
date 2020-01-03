import SystemAction from '../../../shared/action_types/system';
import { CHROME_STATUS } from '../../../shared/status_types/system';

const initialState = {
  chromeStatus: CHROME_STATUS.ACTIVE,
  shouldReconnect: null,
  offline: false,
};

export default (state = initialState, action) => {
  switch (action.type) {
    case SystemAction.CHROME_IDLE_CHANGE:
      return {
        ...state,
        chromeStatus: action.newStatus,
      };

    case SystemAction.CLEAR_SAVED_STATE:
      return {
        ...state,
        shouldReconnect: null,
        savedState: null,
        saveTimestamp: null,
      };
    case SystemAction.SYSTEM_OFFLINE:
      return {
        ...state,
        offline: true,
      };
    case SystemAction.SYSTEM_ONLINE:
      return {
        ...state,
        offline: false,
      };
    default:
      return state;
  }
};

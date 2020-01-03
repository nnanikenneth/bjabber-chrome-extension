import { STORAGE_ACTIONS } from '../../../shared/action_types/storage';
import { STORAGE_STATUS } from '../../../shared/status_types/storage';

const initialState = {
  status: STORAGE_STATUS.START,
  data: {},
  savingData: {},
};

// Reducer
export default (state = initialState, action) => {
  switch (action.type) {
    case STORAGE_ACTIONS.START:
      return {
        ...state,
        status: STORAGE_STATUS.START,
      };
    case STORAGE_ACTIONS.LOAD:
      return {
        ...state,
        status: STORAGE_STATUS.LOADING,
      };
    case STORAGE_ACTIONS.LOADED:
    case STORAGE_ACTIONS.SAVED:
      return {
        ...state,
        status: STORAGE_STATUS.READY,
        data: action.data || {},
        savingData: {},
      };
    case STORAGE_ACTIONS.SAVE:
      return {
        ...state,
        status: STORAGE_STATUS.SAVING,
        savingData: action.data || {},
      };
    default:
      /* istanbul ignore next */
      return state;
  }
};



// WEBPACK FOOTER //
// ./background/src/reducers/storage.js
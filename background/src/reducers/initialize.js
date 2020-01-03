import { CWIC_ACTIONS } from '../../../shared/action_types/cwic'
import { CWIC_STATUS } from '../../../shared/status_types/cwic'
const initialState = {
  username: null,
  password: null,
  credentialsLoaded: false,
  cwicLoaded: false,
  retriesCount: 0,
  selectedDevice: "Softphone",
  telephonyDeviceList: null,
  signedIn: false,
  status: null,
};

export default (state = initialState, action) => {
  switch (action.type) {
    case CWIC_ACTIONS.START_INIT:
      return {
        ...state,
        username: action.username,
        password: action.password,
        credentialsLoaded: action.credentialsLoaded,
      };
    case CWIC_ACTIONS.SWITCH_DEVICE:
      return {
        ...state,
        selectedDevice: action.selectedDevice,
      };
    case CWIC_ACTIONS.STORE_TELEPHONE_DEVICELIST:
      return {
        ...state,
        telephonyDeviceList: action.telephonyDeviceList,
      };
    case CWIC_ACTIONS.INITIALIZED:
      return {
        ...state,
        cwicLoaded: true,
        retriesCount: action.retriesCount,
      };
    case CWIC_ACTIONS.SIGNED_IN:
      return {
        ...state,
        signedIn: true,
        status: CWIC_STATUS.SIGNED_IN,
      };
    case CWIC_ACTIONS.SIGNED_OUT:
      return {
        ...state,
        status: CWIC_STATUS.SIGNED_OUT,
        signedIn: false,
        credentialsLoaded: false,
      };
    case CWIC_ACTIONS.SIGNING_IN:
      return {
        ...state,
        status: CWIC_STATUS.SIGNING_IN
      };
    case CWIC_ACTIONS.SIGNING_OUT:
      return {
        ...state,
        status: CWIC_STATUS.SIGNING_OUT,
        credentialsLoaded: false,
      };
    case CWIC_ACTIONS.INCORRECT_CREDENTIALS:
      return {
        ...state,
        status: CWIC_STATUS.INCORRECT_CREDENTIALS,
        credentialsLoaded: false,
      }
    default:
      return state;
  }
};

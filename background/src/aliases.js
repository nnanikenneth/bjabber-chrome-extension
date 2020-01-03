import { CALL_MANAGER_ACTIONS } from '../../shared/action_types/callManager';
import { CORE_ACTIONS } from '../../shared/action_types/core';
import { clearCacheRestart } from './action_creators/core/index';

import {makeCall, answerCall, endCall, transferCall, holdCall, retrieveCall, rejectCall, openVideoWindow, connectDevice, logoutUser} from './containers/telephonyConversation/index';

/* eslint import/prefer-default-export:0 */
export const aliases = {
  [CALL_MANAGER_ACTIONS.UI_MAKE_CALL]: action => makeCall(action),
  [CALL_MANAGER_ACTIONS.UI_ANSWER_CALL]: action => answerCall(action),
  [CALL_MANAGER_ACTIONS.UI_TRANSFER_CALL]: action => transferCall(action),
  [CALL_MANAGER_ACTIONS.UI_HOLD_CALL]: action => holdCall(action),
  [CALL_MANAGER_ACTIONS.UI_CWIC_LOGOUT]: action => logoutUser(action),    
  [CALL_MANAGER_ACTIONS.UI_RETRIEVE_CALL]: action => retrieveCall(action),
  [CALL_MANAGER_ACTIONS.UI_HANG_UP_CALL]: action => endCall(action),
  [CALL_MANAGER_ACTIONS.UI_CONNECT_DEVICE]: action => connectDevice(action), 
  [CALL_MANAGER_ACTIONS.UI_REJECT_CALL]: action => rejectCall(action),  
  [CALL_MANAGER_ACTIONS.UI_OPEN_VIDEO_WINDOW]: action => openVideoWindow(action),   
  [CORE_ACTIONS.UI_CLEAR_CACHE_RESTART]: action => clearCacheRestart(action),      
};


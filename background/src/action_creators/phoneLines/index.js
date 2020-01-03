import VoiceApi from '../../services/voiceapi';
import PhoneLinesActions from '../../../../shared/action_types/phoneLines';
import { formatErrorMessage } from '../../util/errors';
import { CALL_MANAGER_ACTIONS } from '../../../../shared/action_types/callManager';

export function loadStaffExtensions() {
  return (dispatch) => {
    dispatch({
      type: PhoneLinesActions.STAFF_EXTENSIONS_LOADING,
    });
    return VoiceApi.getStaffExtensions()
      .then((data) => {
        dispatch({
          type: PhoneLinesActions.STAFF_EXTENSIONS_LOADED,
          data,
        });
      })
      .catch(error => dispatch({
        type: CALL_MANAGER_ACTIONS.CM_ERROR,
        lastError: formatErrorMessage('Failed to load staff extensions', error),
      }));
  };
}

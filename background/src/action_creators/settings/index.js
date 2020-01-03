import SettingsAction from '../../../../shared/action_types/settings';
import SettingsStatus from '../../../../shared/status_types/settings';
import VoiceApi from '../../services/voiceapi';
import Context from '../../util/context';

export function startSettings() {
  return {
    type: SettingsAction.STARTED,
  };
}

export function requestSettings() {
  return (dispatch, getState) => {
    const { settings } = getState();
    if (!settings || settings.status !== SettingsStatus.READY) {
      return dispatch({
        type: SettingsAction.ERROR,
        lastError: `Should request settings only in ready state, was: ${settings.status}`,
      });
    }
    return dispatch({
      type: SettingsAction.GET,
    });
  };
}

export function getSettings() {
  return (dispatch, getState) => {
    const request = getSettingsRequest(getState());
    return VoiceApi.getSettings(request)
      .then(settings => dispatch({
        type: SettingsAction.LOADED,
        settings,
      }))
      .catch(error => dispatch({
        type: SettingsAction.ERROR,
        lastError: getMessage(error),
      }));
  };
}

function getSettingsRequest({ callManager }) {
  const request = Context.injectTo({});

  if (callManager) {
    if (callManager.agentInfo) {
      request.staff_id = callManager.agentInfo.staff_id;
      request.phone_extension = callManager.agentInfo.extension;
    }
    if (callManager.agentState.state) {
      request.agent_state = callManager.agentState.state;
      request.agent_reason_code = callManager.agentState.logicCode;
    }
  }

  return request;
}

function getMessage(error) {
  if (error && typeof error.toString === 'function') {
    return error.toString();
  }
  return 'unknown error';
}

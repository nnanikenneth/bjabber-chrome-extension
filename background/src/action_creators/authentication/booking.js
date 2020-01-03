import { AUTHENTICATION_ACTIONS } from '../../../../shared/action_types/authentication';
import { CORE_ACTIONS } from '../../../../shared/action_types/core';
import { CALL_MANAGER_ACTIONS } from '../../../../shared/action_types/callManager';


function getAuthToken(chrome) {
  return (dispatch, getState) => {
    const state = getState();

    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken(
        { interactive: true },
        (token) => {
          if (chrome.runtime.lastError) {
            // If we can't authenticate using Google, try getting email from settings
            if (state.storage && state.storage.data && state.storage.data.email) {
              dispatch({
                type: AUTHENTICATION_ACTIONS.LOGGED_IN,
                userInfo: {
                  email: state.storage.data.email,
                  id: 1,
                  token: 'TOKEN',
                },
              });

              dispatch({
                type: CALL_MANAGER_ACTIONS.CM_GET_AGENT_SETTINGS,
              });
              resolve();
            } else {
              dispatch({
                type: AUTHENTICATION_ACTIONS.LOGIN_FAILED,
                lastError: chrome.runtime.lastError.message,
              });
              dispatch({
                type: CORE_ACTIONS.FAILED,
              });

              reject();
            }
          } else if (token == null) {
            dispatch({
              type: AUTHENTICATION_ACTIONS.LOGIN_FAILED,
              lastError: 'no token, but also no lastError',
            });
            dispatch({
              type: CORE_ACTIONS.FAILED,
            });

            reject();
          } else {
            chrome.identity.getProfileUserInfo((userInfo) => {
              userInfo.token = token; // eslint-disable-line no-param-reassign
              dispatch({
                type: AUTHENTICATION_ACTIONS.LOGGED_IN,
                userInfo,
              });
              dispatch({
                type: CALL_MANAGER_ACTIONS.CM_GET_AGENT_SETTINGS,
              });
            });
          }

          resolve();
        },
      );
    });
  };
}

export function login(chromeMocker) { // eslint-disable-line import/prefer-default-export
  if (typeof chrome === 'undefined' && chromeMocker) {
    return getAuthToken(chromeMocker);
  }

  /* istanbul ignore next */
  return getAuthToken(chrome); // eslint-disable-line no-undef
}


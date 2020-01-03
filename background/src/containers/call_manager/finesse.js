import React from 'react';
import { connect } from 'react-redux';

import { AGENT_STATE, CM_STATUS, ACTION_STATUS } from '../../../../shared/status_types/callManager';
import { CORE_STATUS, SEND_LOG_STATUS } from '../../../../shared/status_types/core';
import { CALL_MANAGER_ACTIONS } from '../../../../shared/action_types/callManager';
import { EVENTS_ACTIONS } from '../../../../shared/action_types/events';
import { CORE_ACTIONS } from '../../../../shared/action_types/core';
import AbstractCallManager from './abstract';
import Context from '../../util/context';
import logger from '../../logger';
import voiceApi from '../../services/voiceapi';

import {
  connectToFinesse,
  getAgentSettings,
  getAgentDialogs,
  getSystemInfoAction,
  storeCallContext,
  retrieveCallContext,
  markCallContextAsRead,
  logout,
  runFailoverCheck,
} from '../../action_creators/call_manager/finesse';
import { startSettings } from '../../action_creators/settings';
import coreLogger from '../../coreLogger';
import { CHROME_STATUS } from '../../../../shared/status_types/system';
import { EVENTS_STATUS } from '../../../../shared/status_types/events';
import { shouldSkipThrottledDown } from '../../util/backoff';
import { loadStaffExtensions } from '../../action_creators/phoneLines/index';

class FinesseCallManager extends AbstractCallManager {
  constructor(props) {
    super(props);
    this.fnsRequestingContext = {};
    this.notifications = {};
    this.notificationClicked = this.notificationClicked.bind(this);
  }

  componentDidMount() {
    chrome.notifications.onClicked.addListener(this.notificationClicked);
  }

  componentWillUnmount() {
    chrome.notifications.onClicked.removeListener(this.notificationClicked);
  }

  changedProperties(prevProps) {
    return Object.keys(this.props)
      .filter(key => !Object.prototype.hasOwnProperty.call(prevProps, key) ||
        prevProps[key] !== this.props[key])
      .reduce((obj, key) => Object.assign(obj, { [key]: this.props[key] }), {});
  }

  static callDataAsList(type, callData, toDisplay, fromDisplay) {
    return [
      {
        title: (type === 'outgoing') ? 'To' : 'From',
        message: (type === 'outgoing') ? toDisplay : fromDisplay,
      },
      {
        title: 'Brand',
        message: callData.brand,
      },
      {
        title: 'Country',
        message: callData.country,
      },
      {
        title: 'Department',
        message: callData.country,
      },
    ];
  }

  componentDidUpdate(prevProps) {
    const changedProperties = this.changedProperties(prevProps);
    const changed = name => Object.prototype.hasOwnProperty.call(changedProperties, name);

    if (changed('cmStatus')) {
      switch (changedProperties.cmStatus) {
        case CM_STATUS.CONNECTING:
          if (this.props.userInfo !== null) {
            this.props.dispatch(connectToFinesse());
          }
          break;
        case CM_STATUS.FAILED:
          setTimeout(() => {
            if (this.props.systemActive) {
              this.props.dispatch(runFailoverCheck());
            }
          }, this.props.retryTime);
          break;
        case CM_STATUS.CONNECTED:
          // Dispatch events to connect
          if (this.props.agentInfo !== null) {
            if (this.props.agentInfo.originating_country) {
              Context.addData({ country: this.props.agentInfo.originating_country });
            }

            this.props.dispatch(startSettings());

            // Request System Info
            this.props.dispatch({
              type: CALL_MANAGER_ACTIONS.REQUESTING_SYSTEM_INFO,
            });

            // Request dialogs
            this.props.dispatch({
              type: CALL_MANAGER_ACTIONS.REQUESTING_AGENT_DIALOGS,
            });

  
            const { connectionDetails, eventsStatus, eventsHost } = this.props;
            const eventsAlreadyConnected = eventsStatus === EVENTS_STATUS.CONNECTED &&
                                           eventsHost === connectionDetails.host;
            if (!eventsAlreadyConnected) {
              this.props.dispatch({
                type: EVENTS_ACTIONS.CONNECT,
                connectionDetails: {
                  scheme: 'http',
                },
              });
            }
          }
          break;
        default:
          break;
      }
    }


    if (changed('sendingLog')) {
      if (changedProperties.sendingLog === SEND_LOG_STATUS.SENDING) {
        if (coreLogger.toClipBoard()) {
          this.props.dispatch({
            type: CORE_ACTIONS.LOG_SENT,
          });
        }
      }
    }

    if (changed('actionStatus')) {
      switch (changedProperties.actionStatus) {
        case ACTION_STATUS.REQUESTING_AGENT_DIALOGS:
          this.props.dispatch(getAgentDialogs());
          break;
        case ACTION_STATUS.REQUESTING_AGENT_SETTINGS:
          this.props.dispatch(getAgentSettings());
          break;
        case ACTION_STATUS.REQUESTING_SYSTEM_INFO:
          this.props.dispatch(getSystemInfoAction());
          break;
        case ACTION_STATUS.REQUESTING_QUEUE:
          // ignore for now, as the feature is disabled
          break;
        case ACTION_STATUS.UI_SHARE_CONTEXT:
          this.props.dispatch(storeCallContext());
          break;
        case ACTION_STATUS.REQUESTING_CONTEXT:
          this.props.dispatch(retrieveCallContext());
          break;
        case ACTION_STATUS.CONTEXT_CLICKED:
          this.props.dispatch(markCallContextAsRead());
          break;
        case ACTION_STATUS.REQUESTING_STAFF_EXTENSIONS:
          this.props.dispatch(loadStaffExtensions());
          break;
        default:
          break;
      }
    }

    if (changed('activeCalls')) {
      Object.keys(this.props.activeCalls).map((callId) => {
        const callData = this.props.activeCalls[callId];
        const toDisplay = voiceApi.getStaffNameByExtensionSynchronously(callData.to);
        const fromDisplay = voiceApi.getStaffNameByExtensionSynchronously(callData.display_from);


        switch (callData.state) {
          // eslint-disable-line no-case-declarations
          case 'INITIATED':
            // Send Notification
            chrome.notifications.create(undefined, {
              type: 'list',
              title: 'Outgoing Call',
              message: `To: ${toDisplay}`,
              items: this.constructor.callDataAsList('outgoing', callData, toDisplay, fromDisplay),
              iconUrl: 'icons/b-phone-call-dark.png',
            }, (id) => {
              this.notifications[id] = { callId, incoming: false };
            });
            break;
          case 'ALERTING':
            // Send Notification
            if (callData.display_from !== 'Me') {
              const incomingOptions = {
                type: 'list',
                title: 'Incoming Call',
                message: `From: ${fromDisplay}`,
                items: this.constructor.callDataAsList('incoming', callData, toDisplay, fromDisplay),
                iconUrl: 'icons/b-phone-call-dark.png',
                isClickable: true,
              };
              /*
                Trigger the hook only if incoming call is for a phone line.
                If an agent's colleague/friend calls his/her extension directly
                we do not want to execute the hook
              */
              if (callData.to !== 'Me') {
                this.props.dispatch({
                  type: CALL_MANAGER_ACTIONS.UI_EXECUTE_INCOMING_CALL_HOOK,
                  callData,
                });
              }
              chrome.notifications.create(undefined, incomingOptions, (id) => {
                this.notifications[id] = { callId, incoming: true };
              });
            }
            break;
          default:
            break;
        }
        return true;
      });

      Object.keys(this.notifications).forEach((id) => {
        const notification = this.notifications[id];
        if (!this.props.activeCalls[notification.callId]) {
          chrome.notifications.clear(id);
          delete this.notifications[id];
        }
      });
    }
  }

  notificationClicked(notificationId) {
    const notification = this.notifications[notificationId];
    if (notification && notification.incoming) {
      this.props.dispatch({
        type: CALL_MANAGER_ACTIONS.UI_ANSWER_CALL,
        callId: notification.callId,
      });
    }
    chrome.notifications.clear(notificationId);
  }

  render() {
    return (<div />);
  }
}

const mapStateToProps = state =>
  ({
    userInfo: state.authentication.userInfo,
    actionStatus: state.callManager.actionStatus,
    activeCalls: state.callManager.activeCalls,
    cmStatus: state.callManager.cmStatus,
    agentInfo: state.callManager.agentInfo,
    connectionDetails: state.callManager.connectionDetails ?
      state.callManager.connectionDetails : {},
    retryTime: state.callManager.retryTime,
    sendingLog: state.core.sendingLog,
    context: state.callManager.context,
    eventsStatus: state.events.status,
    finesseUnavailable: state.callManager.finesseUnavailable,
    systemActive: state.system.chromeStatus === CHROME_STATUS.ACTIVE,
    systemOffline: state.system.offline,
    eventsHost: state.events.connectedHost,
    heartbeatTimeouts: state.callManager.heartbeatTimeouts,
  });

export default connect(mapStateToProps)(FinesseCallManager);
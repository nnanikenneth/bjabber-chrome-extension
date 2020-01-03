import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import SystemActions from '../../../../shared/action_types/system';
import { CHROME_STATUS } from '../../../../shared/status_types/system';
import logger from '../../logger';
import { CORE_ACTIONS } from '../../../../shared/action_types/core';
import { CORE_STATUS } from '../../../../shared/status_types/core';
import { AUTHENTICATION_ACTIONS } from '../../../../shared/action_types/authentication';
import { logout } from '../../action_creators/call_manager/finesse';

const IDLE_DETECTION_INTERVAL = 60;
const CM_ERROR_COUNT_OFFLINE_THRESHOLD = 5;

class System extends Component {
  constructor(props) {
    super(props);
    this.idleStateChangeListener = newState => this.onIdleStatusChanged(newState);
    this.networkStateListener = this.networkStateListener.bind(this);
  }

  componentDidMount() {
    const idle = chrome.idle;
    idle.setDetectionInterval(IDLE_DETECTION_INTERVAL);
    idle.onStateChanged.addListener(this.idleStateChangeListener);
    idle.queryState(IDLE_DETECTION_INTERVAL, (state) => {
      if (state !== this.props.chromeStatus) {
        this.onIdleStatusChanged(state);
      }
    });
    window.addEventListener('online', this.networkStateListener);
    window.addEventListener('offline', this.networkStateListener);
  }

  componentDidUpdate(prevProps) {
    const changed = name => this.props[name] !== prevProps[name];
    if (changed('callManagerErrorsCount')) {
      if (this.props.callManagerErrorsCount > CM_ERROR_COUNT_OFFLINE_THRESHOLD) {
        this.dispatchOfflineActions();
        return;
      }
    }
    if (changed('chromeStatus')) {
      this.updateExtensionActivity(this.props.chromeStatus, prevProps.chromeStatus);
    }
  }

  componentWillUnmount() {
    chrome.idle.onStateChanged.removeListener(this.idleStateChangeListener);
    window.removeEventListener('online', this.networkStateListener);
    window.removeEventListener('offline', this.networkStateListener);
  }

  onIdleStatusChanged(newStatus) {
    this.props.dispatch({
      type: SystemActions.CHROME_IDLE_CHANGE,
      newStatus,
    });
  }

  networkStateListener() {
    if (navigator.onLine) {
      this.props.dispatch({ type: SystemActions.SYSTEM_ONLINE });
      this.maybeReconnect();
    } else {
      this.dispatchOfflineActions();
    }
  }

  dispatchOfflineActions() {
    this.props.dispatch({ type: SystemActions.SYSTEM_OFFLINE });
    this.props.dispatch(logout());
  }

  updateExtensionActivity(newStatus, prevStatus) {
    logger.debug('Chrome status changed from', prevStatus, 'to', newStatus);
    const { shouldReconnect, appStatus } = this.props;
    switch (newStatus) {
      case CHROME_STATUS.ACTIVE: {
        if (appStatus !== CORE_STATUS.WORKING && shouldReconnect) {
          logger.info('Reconnecting after idleness');
          this.maybeReconnect();
        }
        break;
      }
      case CHROME_STATUS.IDLE:
      case CHROME_STATUS.LOCKED: {
        this.props.dispatch({
          type: SystemActions.SAVE_RECONNECTION_STATUS,
          shouldReconnect: appStatus === CORE_STATUS.WORKING,
          savedState: this.props.agentState,
          saveTimestamp: Date.now(),
        });
        break;
      }
      default:
        logger.warn('Unknown idle state', newStatus);
    }
  }

  isReadyToReconnect() {
    return this.props.chromeStatus === CHROME_STATUS.ACTIVE && navigator.onLine;
  }

  maybeReconnect() {
    if (this.isReadyToReconnect()) {
      this.props.dispatch({
        type: AUTHENTICATION_ACTIONS.START_AUTH,
      });
      this.props.dispatch({
        type: CORE_ACTIONS.START,
      });
    }
  }

  render() {
    return (
      <div />
    );
  }
}

System.propTypes = {
  dispatch: PropTypes.func.isRequired,
  chromeStatus: PropTypes.string.isRequired,
  shouldReconnect: PropTypes.bool,
  appStatus: PropTypes.string,
  agentState: PropTypes.shape({
    state: PropTypes.string,
    reasonLabel: PropTypes.string,
  }),
  callManagerErrorsCount: PropTypes.number,
};

function mapStateToProps(state) {
  const system = state.system || {};
  const core = state.core || {};
  const callManager = state.callManager || {};
  return {
    chromeStatus: system.chromeStatus,
    shouldReconnect: system.shouldReconnect,
    appStatus: core.appStatus,
    agentState: callManager.agentState,
    offline: system.offline,
    callManagerErrorsCount: callManager.errorsCount,
  };
}

export default connect(mapStateToProps)(System);

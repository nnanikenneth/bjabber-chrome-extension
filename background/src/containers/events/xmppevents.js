import React from 'react';
import { connect } from 'react-redux';
import AbstractEventManager from './abstract';
import logger from '../../logger';
import { EVENTS_STATUS } from '../../../../shared/status_types/events';
import { CM_STATUS } from '../../../../shared/status_types/callManager';
import { EVENTS_ACTIONS } from '../../../../shared/action_types/events';

import { eventsConnect, eventsDisconnect } from '../../action_creators/events/xmppevents';

class XMPPEvents extends AbstractEventManager {
  constructor(props) {
    super(props);
    this.jwClient = null;
  }

  render() {
    return <div />;
  }

  componentDidUpdate(prevProps) {
    if (this.props.eventsStatus !== prevProps.eventsStatus) {
      switch (this.props.eventsStatus) {
        case EVENTS_STATUS.CONNECTING:
          this.props.dispatch(eventsConnect(this.jwClient))
            .then((jwClient) => {
              this.jwClient = jwClient;
            })
            .catch((error) => {
              this.jwClient = null;
              logger.error('Jabber connect error', error);
            });
          break;
        case EVENTS_STATUS.FAILED:
          if (this.props.cmStatus === CM_STATUS.CONNECTED) {
            setTimeout(() => {
              this.props.dispatch({
                type: EVENTS_ACTIONS.CONNECT,
              });
            }, this.props.retryTime);
          }
          break;
        case EVENTS_STATUS.DISCONNECTING:
          this.props.dispatch(eventsDisconnect(undefined, this.jwClient));
          break;
        case EVENTS_STATUS.NOT_CONNECTED:
          this.jwClient = null;
          break;
        default:
          break;
      }
    }
  }
}

const mapStateToProps = state => (
  {
    eventsStatus: state.events.status,
    callStatus: state.callManager.callStatus,
    cmStatus: state.callManager.cmStatus,
    agentInfo: state.callManager.agentInfo,
    retryTime: state.events.retryTime,
  }
);

export default connect(mapStateToProps)(XMPPEvents);
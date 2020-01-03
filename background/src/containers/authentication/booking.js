import React from 'react';
import { connect } from 'react-redux';
import { AUTH_STATUS } from '../../../../shared/status_types/authentication';
import { AUTHENTICATION_ACTIONS } from '../../../../shared/action_types/authentication';
import { STORAGE_STATUS } from '../../../../shared/status_types/storage';
import { login } from '../../action_creators/authentication/booking';
import AbstractAuthentication from './abstract';

class BookingAuthentication extends AbstractAuthentication {
  componentDidMount() {
 
  }

  componentDidUpdate() {
    if (this.props.authStatus === AUTH_STATUS.START &&
        this.props.storageStatus === STORAGE_STATUS.READY) {
      this.props.dispatch(login());
    }
  }

  render() {
    return <div />;
  }
}

const mapStateToProps = state => (
  {
    authStatus: state.authentication.authStatus,
    userInfo: state.authentication.userInfo,
    storageStatus: state.storage ? state.storage.status : '',
  }
);

export default connect(mapStateToProps)(BookingAuthentication);

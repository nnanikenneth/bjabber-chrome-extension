import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { CORE_STATUS } from '../../../../shared/status_types/core';
import { CALL_MANAGER_ACTIONS } from '../../../../shared/action_types/callManager';
import { isValidPhoneNumber } from '../../../../shared/util';
import { CORE_ACTIONS } from '../../../../shared/action_types/core';

class BookingCore extends Component {
  constructor(props) {
    super(props);
  }

  componentDidUpdate() {
    if (this.props.appStatus === CORE_STATUS.RESTARTING) {
      chrome.runtime.reload();
    } else if (this.props.appStatus === CORE_STATUS.CLEARING_CACHE) {
      const weekAgo = 1000 * 60 * 60 * 24 * 7;
      chrome.browsingData.remove({
        since: weekAgo,
        originTypes: {
          unprotectedWeb: true,
          protectedWeb: true,
          extension: true,
        },
      }, {
        appcache: true,
        cache: true,
        cookies: false,
        downloads: false,
        fileSystems: true,
        formData: false,
        history: false,
        indexedDB: false,
        localStorage: false,
        serverBoundCertificates: false,
        pluginData: false,
        passwords: false,
        webSQL: false,
      }, () => {
        this.props.dispatch({
          type: CORE_ACTIONS.RESTART,
        });
      });
    }
  }

  render() {
    return (<div />);
  }
}

BookingCore.propTypes = {
  appStatus: PropTypes.string.isRequired,
  dispatch: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
  appStatus: state.core.appStatus,
});

export default connect(mapStateToProps)(BookingCore);

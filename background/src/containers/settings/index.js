import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { getSettings, requestSettings, startSettings } from '../../action_creators/settings';
import SettingsStatus from '../../../../shared/status_types/settings';
import logger from '../../logger';
import { CHROME_STATUS } from '../../../../shared/status_types/system';
import { CORE_STATUS } from '../../../../shared/status_types/core';
import { shouldSkipThrottledDown } from '../../util/backoff';

class Settings extends Component {
  constructor(props) {
    super(props);
    this.getSettingsTimer = null;
  }

  componentDidUpdate(prevProps) {
    const changed = key => this.props[key] !== prevProps[key];
    if (changed('status')) {
      if (this.props.status === SettingsStatus.REQUESTING) {
        this.props.getSettings();
      } else if (this.props.status === SettingsStatus.READY &&
        prevProps.status === SettingsStatus.REQUESTING) {
        this.processSettings();
      } else if (this.props.status === SettingsStatus.ERROR) {
        logger.error('Settings error', this.props.lastError);
        this.props.startSettings();
      } else if (this.props.status === SettingsStatus.READY &&
        prevProps.status === SettingsStatus.INIT) {
        if (!this.getSettingsTimer) {
          this.getSettingsTimer = setInterval(() => {
            if (this.shouldRequestSettings()) {
              this.props.requestSettings();
            }
          }, 60 * 1000);
        }
        this.props.requestSettings();
      }
    }
  }

  componentWillUnmount() {
    clearInterval(this.getSettingsTimer);
    this.getSettingsTimer = null;
  }

  processSettings() {
    const settings = this.props.voiceapiSettings;
    const currentVersion = parseInt(chrome.runtime.getManifest().version, 10);
    if (settings.version > currentVersion && window.chrome) {
      chrome.runtime.requestUpdateCheck((status, details) => {
        logger.info(`Chrome update status: ${status}`, details);
      });
    }
    const logLevel = settings.log_level;
    logger.setSendingLevel(logLevel);
    // TODO: experiments, log level, whatever
  }

  shouldRequestSettings() {
    if (this.props.offline || this.props.coreInactive) {
      return false;
    }
    return true;
  }

  render() {
    return (
      <div />
    );
  }
}

Settings.propTypes = {
  status: PropTypes.string.isRequired,
  voiceapiSettings: PropTypes.shape({
    version: PropTypes.number,
    variant: PropTypes.string,
    log_level: PropTypes.string,
    experiments: PropTypes.array,
  }),
  lastError: PropTypes.string,

  offline: PropTypes.bool.isRequired,
  chromeInactive: PropTypes.bool.isRequired,
  coreInactive: PropTypes.bool.isRequired,

  getSettings: PropTypes.func.isRequired,
  requestSettings: PropTypes.func.isRequired,
  startSettings: PropTypes.func.isRequired,
};

function mapStateToProps(state) {
  const { settings, system, core } = state;
  return {
    status: settings ? settings.status : '',
    voiceapiSettings: settings ? settings.voiceapiSettings : {},
    lastError: settings ? settings.lastError : '',

    offline: system ? system.offline : false,
    chromeInactive: system ? system.chromeStatus !== CHROME_STATUS.ACTIVE : false,
    coreInactive: core ? core.appStatus === CORE_STATUS.LOGGED_OUT : false,
  };
}

const mapDispatchToProps = {
  getSettings,
  requestSettings,
  startSettings,
};

export default connect(mapStateToProps, mapDispatchToProps)(Settings);

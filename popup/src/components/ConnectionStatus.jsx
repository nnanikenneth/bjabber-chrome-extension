import React from 'react';
import PropTypes from 'prop-types';
import { Card, Label, List, Icon, Message, Menu } from 'semantic-ui-react';

import { EVENTS_STATUS } from '../../../shared/status_types/events';
import { AUTH_STATUS } from '../../../shared/status_types/authentication';
import { CM_STATUS } from '../../../shared/status_types/callManager';

const SHOW_RELOAD_AFTER = 1000 * 30;

function getIcon(name, color = null, isLoader = null) {
  const properties = { name };
  if (color) {
    properties.color = color;
  }
  if (isLoader) {
    properties.loading = isLoader;
  }

  return React.createElement(
    Icon,
    properties,
  );
}

function getConnectedIcon() {
  return getIcon('check circle', 'green');
}

function getLoadingIcon() {
  return getIcon('spinner', null, true);
}

function getFailedIcon() {
  return getIcon('remove circle', 'red');
}

function getAuthenticationIcon(authenticationStatus) {
  let authenticationIcon = null;
  let failed = false;
  if (authenticationStatus === AUTH_STATUS.AUTHTOKEN_ACQUIRED) {
    authenticationIcon = getConnectedIcon();
  } else if (authenticationStatus === AUTH_STATUS.AUTHTOKEN_ACQUIRE_FAILED) {
    authenticationIcon = getFailedIcon();
    failed = true;
  } else {
    authenticationIcon = getLoadingIcon();
  }
  return [authenticationIcon, failed];
}


function getCallManagerIcon(cmStatus, previousFailed) {
  let cmIcon = null;
  let failed = false;
  if (cmStatus === CM_STATUS.CONNECTED && !previousFailed) {
    cmIcon = getConnectedIcon();
  } else if (cmStatus === CM_STATUS.FAILED || cmStatus === CM_STATUS.ERROR || previousFailed) {
    cmIcon = getFailedIcon();
    failed = true;
  } else {
    cmIcon = getLoadingIcon();
  }

  return [cmIcon, failed];
}


function getEventsIcon(eventsStatus, previousFailed) {
  let eventsIcon = null;
  let failed = false;
  if (eventsStatus === EVENTS_STATUS.CONNECTED && !previousFailed) {
    eventsIcon = getConnectedIcon();
  } else if (eventsStatus === EVENTS_STATUS.FAILED ||
    eventsStatus === EVENTS_STATUS.FATAL_ERROR ||
    previousFailed) {
    eventsIcon = getFailedIcon();
    failed = true;
  } else {
    eventsIcon = getLoadingIcon();
  }

  return [eventsIcon, failed];
}

function ConnectionStatus(props) {
  const [authenticationIcon, authenticationFailed] =
    getAuthenticationIcon(props.authenticationStatus);
  const [cmIcon, cmFailed] = getCallManagerIcon(props.cmStatus, authenticationFailed);
  const [eventsIcon, eventsFailed] = getEventsIcon(props.eventsStatus, cmFailed);

  const errorsFound = [];

  if (authenticationFailed) {
    errorsFound.push(`Authentication: ${(props.authenticationLastError || 'Uncaught error in Authentication')}`);
  } else if (cmFailed) {
    errorsFound.push(`Call Manager: ${(props.cmLastError || 'Uncaught error in Call Manager')}`);
  } else if (eventsFailed) {
    errorsFound.push(`Events: ${(props.eventsLastError || 'Uncaught error in Events')}`);
  }

  let counter = 0;
  const errorsComponents = errorsFound.map((error) => {
    counter += 1;
    return <Message.Item key={counter}>{error}</Message.Item>;
  });

  return (
    <div>
      <Card fluid>
        <Card.Content>
          <Card.Header>Connection Status</Card.Header>
          <List divided>
            <List.Item>
              <Label size="tiny">
                { authenticationIcon }
                <Label.Detail>Google Auth(a)</Label.Detail>
              </Label>
            </List.Item>
            <List.Item>
              <Label size="tiny">
                { cmIcon }
                <Label.Detail>Server Auth(f)</Label.Detail>
              </Label>
            </List.Item>
            <List.Item>
              <Label size="tiny">
                { eventsIcon }
                <Label.Detail>Addon(e)</Label.Detail>
              </Label>
            </List.Item>
          </List>
        </Card.Content>
        {errorsFound.length > 0 && <Card.Content extra>
          <Message>
            <Message.Header>Error Details</Message.Header>
            <Message.List>
              {errorsComponents}
            </Message.List>
          </Message>
          <Menu compact icon="labeled">
            <Menu.Item onClick={props.onRestartButtonClickedHandler}>
              <Icon name="refresh" />
                            Restart
            </Menu.Item>
          </Menu>
        </Card.Content>}
        {
          errorsFound.length === 0 && props.loginDuration > SHOW_RELOAD_AFTER &&
          <Card.Content extra>
            <Message>
              <Message.Header>Login is taking too long</Message.Header>
            </Message>
            <Menu compact icon="labeled">
              <Menu.Item onClick={props.onRestartButtonClickedHandler}>
                <Icon name="refresh" />
                Restart
              </Menu.Item>
            </Menu>
          </Card.Content>
        }
      </Card>
    </div>
  );
}

ConnectionStatus.propTypes = {
  authenticationStatus: PropTypes.string.isRequired,
  cmStatus: PropTypes.string.isRequired,
  eventsStatus: PropTypes.string.isRequired,
  authenticationLastError: PropTypes.string,
  cmLastError: PropTypes.string,
  eventsLastError: PropTypes.string,
  loginDuration: PropTypes.number,
  onRestartButtonClickedHandler: PropTypes.func.isRequired,
};

ConnectionStatus.defaultProps = {
  authenticationLastError: null,
  cmLastError: null,
  eventsLastError: null,
  loginDuration: 0,
};

export default ConnectionStatus;

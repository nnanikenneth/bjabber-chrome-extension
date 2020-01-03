import React from 'react';
import { Message, Popup, Segment, Button } from 'semantic-ui-react';

import PropTypes from 'prop-types';


function StatusBar(props) {
  let errorMessage = null;

  if (props.authenticationLastError) {
    errorMessage = props.authenticationLastError;
  } else if (props.cmLastError) {
    errorMessage = props.cmLastError;
  } else if (props.eventsLastError) {
    errorMessage = props.eventsLastError;
  }

  if (errorMessage) {
    return (<div>
      <Segment raised>
        <Message onDismiss={props.onDismissMessage}>
          <Message.Content>
            <Popup
              trigger={<Button icon="warning" color="yellow" />}
              content={errorMessage}
            />
          </Message.Content>
        </Message>
      </Segment>
    </div>);
  }

  return (<div />);
}


StatusBar.propTypes = {
  authenticationLastError: PropTypes.string,
  cmLastError: PropTypes.string,
  eventsLastError: PropTypes.string,

  onDismissMessage: PropTypes.func.isRequired,
};

StatusBar.defaultProps = {
  authenticationLastError: null,
  cmLastError: null,
  eventsLastError: null,
};

export default StatusBar;

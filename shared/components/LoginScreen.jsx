import React from 'react';
import {Form, Button, Label, Icon } from 'semantic-ui-react';

import PropTypes from 'prop-types';

///login screen here...append login stuff herer

function LoginScreen(props) {
  let offline = null;
  if (props.offline) {
    offline = (<div><br /><Label name="offline" size="small">
      <Icon name="remove" color="red" />
      <Label.Detail>
        Network issues detected. Please check if you are connected to network
      </Label.Detail>
    </Label></div>);
  }

  return (
    <div>
      <Form>
        <Form.Field>
          <label>Username</label>
          <input placeholder='Username' type="text" autoComplete="off"  name="username" onChange={props.onUserNameChangeClickHandler}/>
        </Form.Field>
        <Form.Field>
          <label>Password</label>
          <input placeholder='Password' type="password"  autoComplete="off" name="password" onChange={props.onPasswordChangeClickHandler}/>
        </Form.Field>
        <Button
          positive
          loading={props.isLoading}
          onClick={props.onLoginButtonClickHandler}
        >
          Click to login
        </Button>
        {offline}
      </Form>

    </div>
  );
}

LoginScreen.propTypes = {
  onLoginButtonClickHandler: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  offline: PropTypes.bool,
};

LoginScreen.defaultProps = {
  isLoading: false,
  offline: false,
};

export default LoginScreen;

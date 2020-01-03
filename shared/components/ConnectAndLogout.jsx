import React from 'react';
import PropTypes from 'prop-types';
import { Button, Segment, Dropdown } from 'semantic-ui-react';

function ConnectAndLogout(props) {
    const content = (
      <div>    
         <Button style={{ marginTop: '2px'}} onClick={props.onLogoutClientClickHandler} primary>Logout</Button>
      </div>
    );

    return  (
      <Segment basic>
        {content}
      </Segment>
    )

}

export default ConnectAndLogout;

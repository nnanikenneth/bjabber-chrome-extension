import React from 'react';
import { Popup, Icon, List, Header, Segment } from 'semantic-ui-react';

import PropTypes from 'prop-types';
import { getNameIfStaffExtension } from '../util';

function ContentCallData(props) {
  const { callData } = props;
  if (callData == null) {
    return <div />;
  }
  const mountNode = document.getElementById('b-phone-anchor').shadowRoot.firstElementChild;
  let from = getNameIfStaffExtension(callData.display_from, props.staffDataByExtensions);
  let to = getNameIfStaffExtension(callData.to, props.staffDataByExtensions);
  return (<div>
    <Popup
      debug
      trigger={<Icon name="info" />}
      hoverable
      size="mini"
      position="bottom left"
      mountNode={mountNode}
    >
      <Segment compact>
        <List horizontal={false}>
          <List.Item textAlign="center">
            <Header as="h4">Brand</Header>
            <p>{callData.brand}</p>
          </List.Item>
          <List.Item textAlign="center">
            <Header as="h4">Country</Header>
            <p>{callData.country}</p>
          </List.Item>
          <List.Item textAlign="center">
            <Header as="h4">Department</Header>
            <p>{callData.department}</p>
          </List.Item>
          <List.Item textAlign="center">
            <Header as="h4">From</Header>
            <p>{from}</p>
          </List.Item>
          <List.Item textAlign="center">
            <Header as="h4">To</Header>
            <p>{to}</p>
          </List.Item>
        </List>
      </Segment>
    </Popup>
  </div>);
}

// brand
// country
// department
// display_from
// to

ContentCallData.propTypes = {
  callData: PropTypes.shape({
    brand: PropTypes.string.isRequired,
    country: PropTypes.string.isRequired,
    department: PropTypes.string.isRequired,
    display_from: PropTypes.string.isRequired,
    to: PropTypes.string.isRequired,
  }),
  staffDataByExtensions: PropTypes.object,
};

ContentCallData.defaultProps = {
  callData: null,
};

export default ContentCallData;

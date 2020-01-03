import React from 'react';
import { Card, Icon } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import { getNameIfStaffExtension } from '../util';

// Write to add some information about the caller from voice api...add the callers image here
// Add the callers image which would need the login name and make the image also small

function CallDataDisplay(props) {
  if (props.callData == null) {
    return <div />;
  }
  let from = getNameIfStaffExtension(props.callData.display_from, props.staffDataByExtensions);
  let to = getNameIfStaffExtension(props.callData.to, props.staffDataByExtensions);
  return (
    <div>
      <Card>
        <Card.Content>
          <Card.Header>Call Information</Card.Header>
          <Card.Meta> From: {from} To: {to}</Card.Meta>
          <Card.Description>Brand: {props.callData.brand}</Card.Description>
          <Card.Description>Department: {props.callData.department}</Card.Description>
        </Card.Content>
        <Card.Content extra>
          <Icon name="world" />
          {props.callData.country}
        </Card.Content>
      </Card>
    </div>
  );
}

// brand
// country
// department
// display_from
// to

CallDataDisplay.propTypes = {
  callData: PropTypes.shape({
    display_from: PropTypes.string.isRequired,
    to: PropTypes.string.isRequired,
    brand: PropTypes.string.isRequired,
    department: PropTypes.string.isRequired,
    country: PropTypes.string.isRequired,
  }),
  staffDataByExtensions: PropTypes.object,
};

CallDataDisplay.defaultProps = {
  callData: null,
};

export default CallDataDisplay;

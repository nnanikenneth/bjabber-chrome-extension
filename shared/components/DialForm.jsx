import React from 'react';
import PropTypes from 'prop-types';
import { Icon, Form, Button} from 'semantic-ui-react';
import { CALL_STATUS } from '../status_types/callManager';
import DialInputField from './DialInputField';

function DialForm(props) {
  // Which button to show?
  const typedIn = (props.typedNumber && props.typedNumber.length > 0);

  const mainButtonColor = (typedIn) ? 'blue' : 'grey';
  let buttonDisabled = !typedIn;
  const mainButtonIcon = <Icon name="call" />;
  const videoButtonIcon = <Icon name="video camera" />
  let inputDisabled = false;

  if (props.callStatus === CALL_STATUS.INCOMING_CALL) {
    // Do not show this one as there is other dial form while in call
    return null;
  } else if (props.callStatus === CALL_STATUS.OUTGOING_CALL ||
    props.callStatus === CALL_STATUS.INITIATING) {
    // If there's an outgoing call or you are talking you should be able to cancel
    inputDisabled = true;
    buttonDisabled = true;
  }

  return (
    <div>
      <Form name="dial-form" onSubmit={props.onMakeCallClickHandler}>
        <Form.Group inline style={{ margin: 0 }}>
          <Form.Field style={{ padding: 0 }}>

            <DialInputField
              inputDisabled={inputDisabled}
              key={0}
              inputName="number"
              groupedCalls={props.groupedCalls}
              phoneLines={props.phoneLines}
              source={props.source}
              typedNumber={props.typedNumber}
              typedSource={props.typedSource}
              onNumberChangedHandler={props.onNumberChangedHandler}
              onResultSelectHandler={props.onResultSelectHandler}
            />
          </Form.Field>

          <Form.Button style={{ float: 'right', marginLeft: '10px',}}
            name="main-button"
            type="submit"
            disabled={buttonDisabled}
            icon={mainButtonIcon}
            color={mainButtonColor}
          />
          <Button type="main-button" disabled={buttonDisabled} onClick={props.onVideoWindowClickHandler} color={mainButtonColor} icon={videoButtonIcon} ></Button>
        </Form.Group>

      </Form>

    </div>
  );
}

DialForm.propTypes = {
  phoneLines: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    number: PropTypes.string.isRequired,
  })).isRequired,
  callStatus: PropTypes.string.isRequired,
  typedNumber: PropTypes.string.isRequired,
  typedSource: PropTypes.string.isRequired,
  groupedCalls: PropTypes.arrayOf(PropTypes.shape({
    number: PropTypes.string.isRequired,
  })).isRequired,
  source: PropTypes.string.isRequired,

  onMakeCallClickHandler: PropTypes.func.isRequired,
  onNumberChangedHandler: PropTypes.func.isRequired,
  onResultSelectHandler: PropTypes.func.isRequired,
};

export default DialForm;

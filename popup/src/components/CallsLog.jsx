import React from 'react';
import { Card, Button, List, Segment } from 'semantic-ui-react';

import PropTypes from 'prop-types';
import { getNameIfStaffExtension } from '../../../shared/util';


function CallsLog(props) {
  if (props.groupedCalls == null || props.groupedCalls.length === 0) {
    return <div />;
  }

  let counter = 0;
  let maxHeight = '200px';
  let paddingTop = '10px';
   return (
     <div>
      <Segment>
        <Card>
          <Card.Content>
            <Card.Header>
                            Calling History
            </Card.Header>
            <div style={{ paddingTop, maxHeight, overflowY:'scroll'}}>
              <List divided relaxed>
                {props.groupedCalls.map((item) => {
                  const iconName = (item.callType === 'OUT') ? 'right arrow' : 'left arrow';

                  const event = {
                    target: {
                      number: {
                        value: item.number,
                      },
                    },
                  };

                  let fullDisplay = item.display;
                  fullDisplay = getNameIfStaffExtension(item.number, props.staffDataByExtensions);
                  if (item.counter > 1) {
                    fullDisplay += ` (${item.counter})`;
                  }

                  counter += 1;

                  return (<List.Item key={counter}>
                    <List.Content>
                      <Button
                        size="tiny"
                        content={fullDisplay}
                        icon={iconName}
                        labelPosition="right"
                        onClick={() => props.onMakeCallClickHandler(event)}
                      />
                    </List.Content>
                  </List.Item>);
                })}
              </List>
            </div>
          </Card.Content>
        </Card>
      </Segment>
    </div>
  );
}


CallsLog.propTypes = {
  groupedCalls: PropTypes.arrayOf(PropTypes.shape({
    callType: PropTypes.string.isRequired,
  })).isRequired,
  onMakeCallClickHandler: PropTypes.func.isRequired,
  staffDataByExtensions: PropTypes.object.isRequired,
};

export default CallsLog;

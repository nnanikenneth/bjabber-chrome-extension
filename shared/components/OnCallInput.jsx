import React from 'react';
import PropTypes from 'prop-types';
import { Form, Icon, Button, Grid, Label, Segment, } from 'semantic-ui-react';
import CallDataDisplay from './CallDataDisplay';
import DialInputField from './DialInputField';
import ContentCallData from './ContentCallData';
import { startSettings } from '../../background/src/action_creators/settings/index';

function padTime(val) {
    let valString = val + "";
    if (valString.length < 2) {
        return "0" + valString;
    } else {
        return valString;
    }
}

function getElapsedTime(startTime) {
  let seconds = padTime(startTime % 60).toString();
  let minutes = padTime( Math.trunc(startTime/60) ).toString();
  return [minutes, seconds];
}

// const ON_CALL_HANGABLE_STATES = ['INITIATED', 'ACTIVE'];
//adjust the calling button colors and fonts and some other details
class OnCallInput extends React.PureComponent {
  // Which button to show?
  // const typedIn = (props.typedExtension && props.typedExtension.length > 0);

  // const possibleActions = Array.isArray(props.callData.actions) ?
  constructor(props) {
    super(props);
    this.state = {
      stateTime: ['00', '00'],
      tick: null,
    };
  }
  
  componentWillUpdate(){
    
    if(this.props.canAnswer == true){
        let startTime = 0;
        this.state.tick = setInterval(() => {
          this.setState({
            stateTime: getElapsedTime(startTime),
          });
          startTime = startTime + 1;
        }, 1000);
    } else {
      clearInterval(this.tick);
      this.state.tick = null;
      this.state.stateTime = ['00', '00'];
    }

  }

  render(){
    // const [minutes, seconds] = this.state.stateTime[0];
    return (
      // <div >               
      // <Segment raised>
        <Form name="on-call-form" onSubmit={this.props.onConsultCallClickHandler}>
<Grid centered columns={1}>
  <Grid.Row centered columns={1}>
    <Grid.Column>
  
        {
          <div>
          <Button.Group className="segment centered" compact>
            {
              (this.props.canEnd) &&
              <Button 
                name="hangup"
                type="button"
                icon={<Icon name="call" rotated="clockwise" />}
                color="red"
                id={this.props.conversationid}                
                onClick={this.props.onHangupCallClickHandler.bind(this)}
              />
            }
            {
              (this.props.canReject) &&
              <Button 
                name="reject"
                type="button"
                icon={<Icon name="call" rotated="clockwise" />}
                color="red"
                id={this.props.conversationid}                
                onClick={this.props.onRejectCallClickHandler.bind(this)}
              />
            }
            {
              (this.props.canAnswer) &&
              <Button
                name="answer"
                type="button"
                icon="call"
                color="green"
                id={this.props.conversationid}
                onClick={this.props.onPickCallClickHandler.bind(this)}
              />
            }
            {
              (this.props.canResume) &&
              <Button
                name="retrieve"
                type="button"
                icon="play"
                color="blue"
                id={this.props.conversationid}                
                onClick={this.props.onRetrieveCallClickHandler.bind(this)}
              />
            }
            {
              (this.props.canHold) &&
              <Button
                name="hold"
                type="button"
                icon="pause"
                color="blue"
                id={this.props.conversationid}                
                onClick={this.props.onHoldCallClickHandler.bind(this)}
              />
            }
            {
                (this.props.canTransfer) &&
                <DialInputField
                  inputDisabled={false}
                  key={0}
                  inputName="extension"
                  // groupedCalls={props.groupedCalls}
                  phoneLines={this.props.phoneLines}
                  source={this.props.source}
                  typedNumber={this.props.typedExtension || ''}
                  typedSource={this.props.typedSource}
                  onNumberChangedHandler={this.props.onExtensionChangedHandler}
                  id={this.props.conversationid} //not really needed                  
                  onResultSelectHandler={this.props.onResultSelectHandler}
                />
            }
            {
              // Allow transfer only for consult
              (this.props.canTransfer) &&
              <Button
                name="transfer"
                type="button"
                icon="mail forward"
                color="blue"
                id={this.props.conversationid}                
                onClick={this.props.onTransferCallClickHandler}
                // disabled={!typedIn}
              />
            }       
            {/* {
              (this.props.canAnswer == true) &&       */}
              {/* <div style={{color:'green', fontSize:"14px", fontWeight:"900"}}> {`${ this.state.stateTime[0]}:${ this.state.stateTime[1]}`} </div> */}
            {/* } */}
            </Button.Group>
          </div>
        }

      {/* {
        props.source === 'CONTENT' &&
        <Label basic size="tiny" attached="top right">
          <ContentCallData
            callData={props.callData}
            staffDataByExtensions = {props.staffDataByExtensions}
          />
        </Label>
      }
      {
        props.source === 'POPUP' &&
        <CallDataDisplay
          callData={props.callData}
          staffDataByExtensions = {props.staffDataByExtensions}
        />
      } */}
      {/* <Form.Field> */}
        {/* <Form.Input name="callId" type="hidden" value={props.callData.id} /> */}
      {/* </Form.Field> */}

    </Grid.Column>
  </Grid.Row>
</Grid>
</Form>
// </Segment>
//                 </div>
        );
    }
} //end class
export default OnCallInput;



///With stuff inside
 // <Form name="on-call-form" onSubmit={this.props.onConsultCallClickHandler}>
        //   <Grid centered columns={1}>
        //     <Grid.Row centered columns={1}>
        //       <Grid.Column>
            
        //           {
        //             <div>
        //             <Button.Group className="segment centered" compact>
        //               {
        //                 <Button 
        //                   name="hangup"
        //                   type="button"
        //                   icon={<Icon name="call" rotated="clockwise" />}
        //                   color="red"
        //                   onClick={this.props.onHangupCallClickHandler}
        //                   disabled={this.props.canEnd}                                                                                                                                                              
        //                 />
        //               }
        //               {
        //                 <Button 
        //                   name="reject"
        //                   type="button"
        //                   icon={<Icon name="call" rotated="clockwise" />}
        //                   color="red"
        //                   onClick={this.props.onRejectCallClickHandler}
        //                   disabled={this.props.canReject}                                                                                                                                    
        //                 />
        //               }
        //               {
        //                 <Button
        //                   name="answer"
        //                   type="button"
        //                   icon="call"
        //                   color="green"
        //                   onClick={this.props.onPickCallClickHandler}
        //                   disabled={this.props.canAnswer}                                                                                                          
        //                 />
        //               }
        //               {
        //                 <Button
        //                   name="retrieve"
        //                   type="button"
        //                   icon="play"
        //                   color="blue"
        //                   onClick={this.props.onRetrieveCallClickHandler}
        //                   disabled={this.props.canResume}                                                                                
        //                 />
        //               }
        //               {
        //                 <Button
        //                   name="hold"
        //                   type="button"
        //                   icon="pause"
        //                   color="blue"
        //                   onClick={this.props.onHoldCallClickHandler}
        //                   disabled={this.props.canHold}                                                      
        //                 />
        //               }
        //               {
        //                   <DialInputField
        //                     inputDisabled={false}
        //                     key={0}
        //                     inputName="extension"
        //                     // groupedCalls={props.groupedCalls}
        //                     phoneLines={this.props.phoneLines}
        //                     source={this.props.source}
        //                     typedNumber={this.props.typedExtension || ''}
        //                     typedSource={this.props.typedSource}
        //                     onNumberChangedHandler={this.props.onExtensionChangedHandler}
        //                     onResultSelectHandler={this.props.onResultSelectHandler}
        //                     disabled={this.props.canTransfer}                            
        //                   />
        //               }
        //               {
        //                 // Allow transfer only for consult
        //                 <Button
        //                   name="transfer"
        //                   type="button"
        //                   icon="mail forward"
        //                   color="blue"
        //                   onClick={this.props.onTransferCallClickHandler}
        //                   disabled={this.props.canTransfer}
        //                 />
        //               }       
        //               {/* {
        //                 (this.props.canAnswer == true) &&       */}
        //                 <div style={{color:'green', fontSize:"14px", fontWeight:"900"}}> {`${ this.state.stateTime[0]}:${ this.state.stateTime[1]}`} </div>
        //               {/* } */}
        //               </Button.Group>
        //             </div>
        //           }

        //         {/* {
        //           props.source === 'CONTENT' &&
        //           <Label basic size="tiny" attached="top right">
        //             <ContentCallData
        //               callData={props.callData}
        //               staffDataByExtensions = {props.staffDataByExtensions}
        //             />
        //           </Label>
        //         }
        //         {
        //           props.source === 'POPUP' &&
        //           <CallDataDisplay
        //             callData={props.callData}
        //             staffDataByExtensions = {props.staffDataByExtensions}
        //           />
        //         } */}
        //         {/* <Form.Field> */}
        //           {/* <Form.Input name="callId" type="hidden" value={props.callData.id} /> */}
        //         {/* </Form.Field> */}

        //       </Grid.Column>
        //     </Grid.Row>
        //   </Grid>
        // </Form>



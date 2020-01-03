import React, { Component } from 'react';
import { Segment, Button, Message, Icon, Label } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import CallsLog from './CallsLog';
import ConnectionStatus from './ConnectionStatus';
import { CORE_STATUS, CORE_SCREENS, SEND_LOG_STATUS } from '../../../shared/status_types/core';
import { CM_STATUS } from '../../../shared/status_types/callManager';
import { CWIC_STATUS } from '../../../shared/status_types/cwic';
import { AUTH_STATUS } from '../../../shared/status_types/authentication';
import { EVENTS_STATUS } from '../../../shared/status_types/events';
import DialForm from '../../../shared/components/DialForm';
import OnCallInput from '../../../shared/components/OnCallInput';
import StatusBar from './StatusBar';
import ConnectAndLogout from '../../../shared/components/ConnectAndLogout';
import LoginScreen from '../../../shared/components/LoginScreen';

const SOURCE = 'POPUP';

/* eslint no-plusplus:0, react/forbid-prop-types:0, class-methods-use-this:0 */
class Popup extends Component {
  renderOffline() {
    return (
      <Segment>
        <Label name="finesseUnavailable" size="small">
          <Icon loading name="spinner" />
          <Label.Detail>Connection to add on lost. Trying to reconnect..</Label.Detail>
        </Label>
      </Segment>
    );
  }

  renderConnectionStatus() {
    const loginDuration = this.props.startTime ? Date.now() - this.props.startTime : 0;
    return (
      <div>
        <ConnectionStatus
          authenticationStatus={this.props.authenticationStatus}
          cmStatus={this.props.cmStatus}
          eventsStatus={this.props.eventsStatus}
          authenticationLastError={this.props.authenticationLastError}
          cmLastError={this.props.cmLastError}
          eventsLastError={this.props.eventsLastError}
          onRestartButtonClickedHandler={this.props.onRestartButtonClickedHandler}
          loginDuration={loginDuration}
        />
      </div>
    );
  }

  renderLogin() {
    return (
      <Segment textAlign="center">
        <LoginScreen
          onLoginButtonClickHandler={this.props.onLoginButtonClickHandler}
          offline={this.props.offline}
          onUserNameChangeClickHandler={this.props.onUserNameChangeClickHandler}
          onPasswordChangeClickHandler={this.props.onPasswordChangeClickHandler}
        />
      </Segment>
    );
  }

  renderHome() {
    const footerComponents = [
      ConnectAndLogout,
      CallsLog,
      StatusBar,
    ];
    let keyCounter = 0;
    return (
      <div>
        <Segment.Group raised>
          <Segment raised>
            <DialForm
              callStatus={this.props.callStatus}
              typedNumber={this.props.typedNumber}
              typedSource={this.props.typedSource}
              onMakeCallClickHandler={this.props.onMakeCallClickHandler}
              onVideoWindowClickHandler={this.props.onVideoWindowClickHandler}              
              // we dont need pick up here
              onPickCallClickHandler={this.props.onPickCallClickHandler}
              // we dont need hang up call
              onHangupCallClickHandler={this.props.onHangupCallClickHandler}
              onNumberChangedHandler={this.props.onNumberChangedHandler}
              onResultSelectHandler={this.props.onResultSelectHandler}
              phoneLines={(this.props.phoneLines) || []}
              groupedCalls={this.props.groupedCalls}
              source={SOURCE}
            />
          </Segment>
      {
          Object.keys(this.props.conversationList).map((key, index) => {
            const conversation = this.props.conversationList[key];
            return (
              (conversation.capabilities.canAnswer || conversation.capabilities.canEnd || conversation.capabilities.canHold || conversation.capabilities.canReject || conversation.capabilities.canResume || conversation.capabilities.canTransfer) &&               
              <div key={key}>               
               <Segment raised>
                  <OnCallInput
                    callStatus={this.props.callStatus}
                    typedExtension={this.props.typedExtension}
                    // typedSource={this.props.typedSource}
                    onMakeCallClickHandler={this.props.onMakeCallClickHandler}
                    onVideoWindowClickHandler={this.props.onVideoWindowClickHandler}              
                    onPickCallClickHandler={this.props.onPickCallClickHandler}
                    onHangupCallClickHandler={this.props.onHangupCallClickHandler}
                    onExtensionChangedHandler={this.props.onExtensionChangedHandler}
                    onConsultCallClickHandler={this.props.onConsultCallClickHandler}
                    onTransferCallClickHandler={this.props.onTransferCallClickHandler}
                    onHoldCallClickHandler={this.props.onHoldCallClickHandler}
                    onRetrieveCallClickHandler={this.props.onRetrieveCallClickHandler}
                    onRejectCallClickHandler={this.props.onRejectCallClickHandler}
                    onResultSelectHandler={this.props.onExtResultSelectHandler}
                    phoneLines={(this.props.phoneLines) || []}
                    // groupedCalls={this.props.groupedCalls}
                    staffDataByExtensions={this.props.staffDataByExtensions}
                    onWrapUpReasonChangeClickHandler={this.props.onWrapUpReasonChangeClickHandler}
                    source={SOURCE}
                    
                    ///this fixes the update bug
                    conversationid = {key}
                    canAnswer = {conversation.capabilities.canAnswer}
                    canEnd =  {conversation.capabilities.canEnd}
                    canHold = {conversation.capabilities.canHold}
                    canReject = {conversation.capabilities.canReject}
                    canResume = {conversation.capabilities.canResume}
                    canTransfer = {conversation.capabilities.canTransfer}
                    canUnmuteAudio = {conversation.capabilities.canUnmuteAudio}
                  />
                </Segment>
                </div>
            );
      })}
    

        </Segment.Group>
        <Segment.Group>
          {footerComponents.map(componentClass => (
            <div key={keyCounter++}>
              {
                React.createElement(
                  componentClass,
                  {
                    ...this.props,
                    source: 'POPUP',
                  },
                )
              }
            </div>))}
        </Segment.Group>
      </div>);
  }

  getScreen() {
    ///what if the user got the wrong password...? so he needs to try logging in and a state change 
    ///should happen when he is successful that condition should be added to renderLogin or if it is then we can proceed further
    ///add the condition then we can go retry again to login the user and set him up
    ///after we can add automation to pick it up
    let screen = null;
    const { appStatus, currentScreen, offline, finesseUnavailable, authStatus, authenticationStatus, cmStatus, eventsStatus, cwicStatus} = this.props;
    if (!offline && finesseUnavailable) {
      screen = this.renderOffline();
    } else if ( authenticationStatus !== AUTH_STATUS.AUTHTOKEN_ACQUIRED  && authenticationStatus !== "NO_AUTH") {
      screen = this.renderConnectionStatus();
    }else if (cwicStatus !== CWIC_STATUS.SIGNED_IN) {
      screen = this.renderLogin();
    }  else if (currentScreen === CORE_SCREENS.HOME) {
      screen = this.renderHome();
    }
    return screen;
  }

  render() {
    const screen = this.getScreen();
    return (
      <div>
        <Segment.Group raised>
          <Segment>
            <Button.Group fluid>
              <Button
                icon="user"
                content={this.props.displayName}
                onClick={this.props.onHomeScreenButtonClickedHandler}
              />
              <Button
                icon="refresh"
                onClick={this.props.onFixMeButtonClickedHandler}
              />
            </Button.Group>
          </Segment>
        </Segment.Group>
        {screen}
      </div>
    );
  }
}

export default Popup;


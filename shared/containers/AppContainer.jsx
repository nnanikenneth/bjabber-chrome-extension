import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { CORE_ACTIONS } from '../action_types/core'
import { AUTHENTICATION_ACTIONS } from '../action_types/authentication';
import { CALL_MANAGER_ACTIONS } from '../action_types/callManager';
import { EVENTS_ACTIONS } from '../action_types/events';
import { CWIC_ACTIONS } from '../action_types/cwic';
import { SEND_LOG_STATUS, CORE_SCREENS } from '../status_types/core';
import { STORAGE_ACTIONS } from '../action_types/storage';
import { groupDisplayCalls } from '../selectors/callManager';
import { hideToolbar } from '../selectors/storage';
import { returnDictIndexedByExtension } from '../util';

let user = "";
let pass = "";

function getCallId() {
  
}

class AppContainer extends Component {
  constructor(props) {
    super(props);
    this.state = { staffDataByExtensions: {} };
  }

  componentDidMount() {
    this.props.dispatch({
      type: STORAGE_ACTIONS.START,
    });
  }

  componentWillReceiveProps(nextProps) {
    if ((this.props.phoneLines.length !== nextProps.phoneLines.length
      || Object.keys(this.state.staffDataByExtensions).length === 0)
      && nextProps.phoneLines.length !== 0) {
      this.setState({ staffDataByExtensions: returnDictIndexedByExtension(nextProps.phoneLines) });
    }
  }

  shouldComponentUpdate() {
    // Only render it if it's on focus
    return !document.webkitHidden;
  }

  /** **********************************
     * Settings
     */
  /** **************************************
     * Top screen buttons (Home, Settings)
     */

  onRestartButtonClickedHandler(ev) {
      this.props.dispatch({
          type: CORE_ACTIONS.RESTART,
        });
        ev.preventDefault();
      }
    
      onFixMeButtonClickedHandler(ev) {
        this.props.dispatch({
          type: CORE_ACTIONS.UI_CLEAR_CACHE_RESTART,
      });
      ev.preventDefault();
  }

  onContextInputChanged(tabId, ev) {
    this.props.dispatch({
      type: CALL_MANAGER_ACTIONS.CONTEXT_CHANGED,
      currentTab: tabId,
    });
    ev.preventDefault();
  }

  onContextUnload(tabId, ev) {
    this.props.dispatch({
      type: CALL_MANAGER_ACTIONS.CONTEXT_CLEAR_TAB_DATA,
      currentTab: tabId,
    });
    ev.preventDefault();
  }

  onContextClickHandler(ev, contextId) {
    this.props.dispatch({
      type: CALL_MANAGER_ACTIONS.CONTEXT_CLICKED,
      contextId,
    });
    ev.preventDefault();
  }

  onNumberChangedHandler(source, ev, data) {
    const number = data.searchQuery;
    this.props.dispatch({
      type: CALL_MANAGER_ACTIONS.UI_TYPED_NUMBER,
      typedNumber: number,
      typedSource: source,
    });
    // ev.preventDefault();
  }

  onResultSelectHandler(source, ev, data) {
    const number = data.value;
    if (number !== undefined && number !== 'N/A' && number !== '') {
        this.props.dispatch({
          type: CALL_MANAGER_ACTIONS.UI_TYPED_NUMBER,
          typedNumber: number,
          typedSource: source,
        });
    }
    // ev.preventDefault();
  }

  onExtResultSelectHandler(source, ev, data) {
    const number = data.value;
    if (number !== undefined && number !== 'N/A' && number !== '') {
      this.props.dispatch({
        type: CALL_MANAGER_ACTIONS.UI_TYPED_EXTENSION,
        typedExtension: number,
        typedSource: source,
      });
    }
    // ev.preventDefault();
  }

  onExtensionChangedHandler(source, ev, data) {
    const extension = data.searchQuery;
    this.props.dispatch({
      type: CALL_MANAGER_ACTIONS.UI_TYPED_EXTENSION,
      typedExtension: extension,
      typedSource: source,
    });
    // ev.preventDefault();
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////
  onMakeCallClickHandler(ev) {
    const number = ev.target.number.value; 
    this.props.dispatch({
      type: CALL_MANAGER_ACTIONS.UI_MAKE_CALL,
      number,
    });
  }

  onLoginButtonClickHandler() {
    this.props.dispatch({
      type: AUTHENTICATION_ACTIONS.START_AUTH,
    });

    //also dispatch the login details
    this.props.dispatch({
        type: CWIC_ACTIONS.START_INIT, 
        username: user,
        password: pass,
        credentialsLoaded: true,
    });
  }

  onUserNameChangeClickHandler(ev) {
    const username = ev.target.value;
    user = username;
  }
  
  onLogoutClientClickHandler(){
    this.props.dispatch({
      type: CALL_MANAGER_ACTIONS.UI_CWIC_LOGOUT,
    });
    console.log("logging out onLogoutClickHandler out here");
    // do some other stuff here such as dispatching an event here
  }

  onConnectDeviceClickHandler(){
    //get selected device
    //got to do it this way because our default should be softphone should the user connect to the softphone
    console.log("In onConnectDeviceClickHandler");
    if( this.props.selectedDevice === "Deskphone" ){
      // telePhoneDevice
      console.log("Deskphone...here", this.props.telephonyDeviceList);      
      this.props.dispatch({
        type: CALL_MANAGER_ACTIONS.UI_CONNECT_DEVICE,
        telephonyDeviceList: this.props.telephonyDeviceList.deskPhone,
      });
    } else {
        console.log("Softphone...here",  this.props.telephonyDeviceList);
        this.props.dispatch({
          type: CALL_MANAGER_ACTIONS.UI_CONNECT_DEVICE,
          telephonyDeviceList: this.props.telephonyDeviceList.softPhone,
        });
    }
  }

  onSelectDeviceOptions(ev, data){
    let currentDevice = data.value;
    this.props.dispatch({
      type: "SWITCH_DEVICE", 
      selectedDevice: currentDevice,
    });
  }

  onPasswordChangeClickHandler(ev) {
    const password = ev.target.value;
    pass = password;
  }

  onVideoWindowClickHandler() {
    this.props.dispatch({
      type: CALL_MANAGER_ACTIONS.UI_OPEN_VIDEO_WINDOW,
    });
    //add video window id here
  }

  onDismissMessage() {
    // Clear Authentication error
    this.props.dispatch({
      type: AUTHENTICATION_ACTIONS.CLEAR_ERROR,
    });
    // Clear Call Manager error
    this.props.dispatch({
      type: CALL_MANAGER_ACTIONS.CM_CLEAR_ERROR,
    });
    // Clear Events error
    this.props.dispatch({
      type: EVENTS_ACTIONS.CLEAR_ERROR,
    });
  }
  
  ///////////////////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////
  onHangupCallClickHandler(ev) {
    // const callId = getCallId();
    this.props.dispatch({
      type: CALL_MANAGER_ACTIONS.UI_HANG_UP_CALL,
    });
    ev.preventDefault();
  }

  onRejectCallClickHandler(ev) {
    // const callId = getCallId();
    this.props.dispatch({
      type: CALL_MANAGER_ACTIONS.UI_REJECT_CALL,
    });
    ev.preventDefault();
  }
  
  onPickCallClickHandler(ev) {
    let callingId = ev.target.id; // ev.target.attributes.conversationid.value; 
    console.log("onPickCallClickHandler: ", callingId);//callingId

    this.props.dispatch({
      type: CALL_MANAGER_ACTIONS.UI_ANSWER_CALL,
      callingId: callingId,
    });
    ev.preventDefault();
  }
  
  onHoldCallClickHandler(ev) {
    let callingId = ev.target.id;
    console.log("onHoldCallClickHandler: ", callingId);//callingId
    
    this.props.dispatch({
      type: CALL_MANAGER_ACTIONS.UI_HOLD_CALL,
      callingId: callingId,      
    });
    ev.preventDefault();
  }

  onRetrieveCallClickHandler(ev) {
    let callingId = ev.target.id;
    console.log("onRetrieveCallClickHandler: ", callingId);//callingId

    this.props.dispatch({
      type: CALL_MANAGER_ACTIONS.UI_RETRIEVE_CALL,
      callingId: callingId,            
    });
    ev.preventDefault();
  }

  onTransferCallClickHandler(ev) {
    let callingId = ev.target.id;
    console.log("onTransferCallClickHandler: ", callingId);//callingId

    const number = this.props.typedExtension;
    // const callId = getCallId();
    this.props.dispatch({
      type: CALL_MANAGER_ACTIONS.UI_TRANSFER_CALL,
      callingId: callingId,                  
      number,
    });
    ev.preventDefault();
  }
  ///////////////////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////

  render() {
    let displayName = null;
    if (this.props.agentInfo) {
      displayName = this.props.agentInfo.name;
    } else if (this.props.userInfo) {
      displayName = this.props.userInfo.email;
    }
    const staffDataByExtensions = this.state.staffDataByExtensions;
    const childrenWithProps = React.Children.map(this.props.children,
      child => React.cloneElement(child, {
        ...this.props,
        displayName,
        staffDataByExtensions,
        onMakeCallClickHandler: (ev, data) => this.onMakeCallClickHandler(ev, data),
        onHangupCallClickHandler: (ev) => this.onHangupCallClickHandler(ev),
        onRejectCallClickHandler: (ev) => this.onRejectCallClickHandler(ev), 
        onPickCallClickHandler: (ev, data) => this.onPickCallClickHandler(ev, data),
        onNumberChangedHandler: (source, ev, data) => this.onNumberChangedHandler(source, ev, data),
        onExtensionChangedHandler:
          (source, ev, data) => this.onExtensionChangedHandler(source, ev, data),
        onTransferCallClickHandler: (ev, data) => this.onTransferCallClickHandler(ev, data),
        onHoldCallClickHandler: (ev, data) => this.onHoldCallClickHandler(ev, data),
        onRetrieveCallClickHandler: (ev, data) => this.onRetrieveCallClickHandler(ev, data),
        
        onRestartButtonClickedHandler: ev => this.onRestartButtonClickedHandler(ev),
        onFixMeButtonClickedHandler: ev => this.onFixMeButtonClickedHandler(ev),
        onResultSelectHandler: (source, ev, data) => this.onResultSelectHandler(source, ev, data),
        onExtResultSelectHandler:
          (source, ev, data) => this.onExtResultSelectHandler(source, ev, data),
        onShareButtonClickHandler: (tabId, ev) => this.onShareButtonClickHandler(tabId, ev),
        onContextInputChanged: (tabId, ev) => this.onContextInputChanged(tabId, ev),
        onContextUnload: (tabId, ev) => this.onContextUnload(tabId, ev),
        onContextClickHandler: (ev, contextId) => this.onContextClickHandler(ev, contextId),
    

        onLoginButtonClickHandler: () => this.onLoginButtonClickHandler(),
        onLogoutClientClickHandler: () => this.onLogoutClientClickHandler(),
        onConnectDeviceClickHandler: () => this.onConnectDeviceClickHandler(),
        onVideoWindowClickHandler: () => this.onVideoWindowClickHandler(),            
        onPasswordChangeClickHandler: (ev) => this.onPasswordChangeClickHandler(ev),
        onUserNameChangeClickHandler: (ev) => this.onUserNameChangeClickHandler(ev),
        onSelectDeviceOptions: (ev, d) => this.onSelectDeviceOptions(ev, d),
        
        onDismissMessage: () => this.onDismissMessage(),
      }),
    );

    return (
      <div>
        {childrenWithProps}
      </div>
    );
  }
}

const mapStateToProps = state => ({
  authStatus: state.authStatus,
  userInfo: (state.authentication) ? state.authentication.userInfo : null,
  authenticationStatus: (state.authentication) ? state.authentication.authStatus : null,
  cmStatus: (state.callManager) ? state.callManager.cmStatus : null,
  callStatus: (state.callManager) ? state.callManager.callStatus : null,
  callsLog: (state.callManager && state.callManager.callsLog) ? state.callManager.callsLog : [],
  groupedCalls: groupDisplayCalls(state),
  eventsStatus: (state.events) ? state.events.status : null,
  typedNumber: (state.callManager) ? state.callManager.typedNumber : '',
  typedExtension: (state.callManager) ? state.callManager.typedExtension : '',
  typedSource: (state.callManager) ? state.callManager.typedSource : '',
  actionStatus: (state.callManager) ? state.callManager.actionStatus : '',

  authenticationLastError: (state.authentication) ? state.authentication.lastError : null,
  cmLastError: (state.callManager) ? state.callManager.lastError : null,
  eventsLastError: (state.events) ? state.events.lastError : null,

  agentInfo: (state.callManager) ? state.callManager.agentInfo : null,
  agentState: (state.callManager) ? state.callManager.agentState : null,
  pendingState: (state.callManager) ? state.callManager.pendingState : null,
  timeOffset: (state.callManager) ? state.callManager.timeOffset : 0,
  activeCalls: (state.callManager) ? state.callManager.activeCalls : {},
  finesseUnavailable: (state.callManager) ? state.callManager.finesseUnavailable : false,
  offline: state.system ? state.system.offline : false,

  phoneLines: (state.phoneLines) ? state.phoneLines.data : [],

  senderContexts: (state.callManager) ? state.callManager.senderContexts : {},
  contexts: (state.callManager) ? state.callManager.contexts : {},

  appStatus: (state.core) ? state.core.appStatus : null,
  debugActive: (state.core) ? state.core.debugActive : false,
  username: state.initialize.username,
  password: state.initialize.password, 
  telephonyDeviceList: state.initialize.telephonyDeviceList,
  credentialsLoaded: state.initialize.credentialsLoaded,
  selectedDevice: state.initialize.selectedDevice,
  cwicStatus: state.initialize.status,
  signedIn: state.initialize.signedIn,  
  // Settings
  settings: state.storage && state.storage.data ? state.storage.data : {},
  hideToolbar: hideToolbar(state),


  conversationList: state.telephonyConversation.conversationList,

});

export default connect(mapStateToProps)(AppContainer);


// conversation : state.telephonyConversation.conversation,  
// canAnswer: state.telephonyConversation.capabilities.canAnswer,
// canEnd : state.telephonyConversation.capabilities.canEnd,
// canHold : state.telephonyConversation.capabilities.canHold,
// canReject : state.telephonyConversation.capabilities.canReject,
// canResume : state.telephonyConversation.capabilities.canResume,
// canTransfer : state.telephonyConversation.capabilities.canTransfer,
// canUnmuteAudio : state.telephonyConversation.capabilities.canUnmuteAudio,
// conversationStatus: state.telephonyConversation.conversationStatus,
// this.props.conversation.

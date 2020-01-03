import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { CWIC_ACTIONS } from '../../../../shared/action_types/cwic'

let count = 0;

let cwicLoaded = false;
let retriesCount = 0; //basic retries limit = 10;
let retriesLimit = 20;
let intervalHandler = {};
let interval = 3000;

const cucm  = "lhr4-lb1pb-01.voicedqs.booking.com";
const cti   = "lhr4-lb1pb-01.voicedqs.booking.com";
const tftp  = "lhr4-lb1pb-01.voicedqs.booking.com";

///note that all state variables here cannot be updated after initalisation process
//CWIC_CONNECTION_STATUS : CONNECTED AND NOT
//CWIC_TIMEOUT_STATUS 

/*********
 * Set the event handlers
*********/ 

/*********
 * initialisation methods here
*********/ 


class Initialize extends Component {
  constructor(props) {
    super(props);
    this.initialize = this.initialize.bind(this);
    this.onInitialized = this.onInitialized.bind(this);
    this.onAuthenticationStateChanged = this.onAuthenticationStateChanged.bind(this);
    this.onAuthenticationError = this.onAuthenticationError.bind(this);
    this.onInitializationError = this.onInitializationError.bind(this);
    this.onUserAuthorized = this.onUserAuthorized.bind(this);
    this.onAuthorizationRejected = this.onAuthorizationRejected.bind(this);
    this.onAddonConnectionLost = this.onAddonConnectionLost.bind(this);
    this.onSignedIn = this.onSignedIn.bind(this);
    this.onSignedOut = this.onSignedOut.bind(this);
    this.onCredentialsRequired = this.onCredentialsRequired.bind(this);    
  }

  //Refactor to see if credentialsLoaded is needed at all
  componentDidMount() {

  }

  initialize() {
      if(cwicLoaded || retriesCount > retriesLimit){
          return;
      }
      console.log("Retries Here");
      retriesCount = retriesCount + 1;
      if(retriesCount == retriesLimit){
            //dispatch an action to reset u1 to new page
            console.log("resetting to home page");
            // add condition such that
            // if cwicloaded == false
                // CWIC_STATE == CWIC_NOT_INITIALISED
            // else
                // CWIC_STATE == CWIC_INITIALISED
       }
       console.log("Kenneth retries count and retries limit ", retriesCount, retriesLimit, cwicLoaded);

       cwic.SystemController.setLoggingLevel(0);
       cwic.SystemController.addEventHandler('onInitialized', this.onInitialized);
        ///Added state change below
       cwic.LoginController.addEventHandler('onAuthenticationStateChanged', this.onAuthenticationStateChanged);
       cwic.LoginController.addEventHandler('onAuthenticationError', this.onAuthenticationError);
        ///removed state change
        // cwic.LoginController.addEventHandler('onAuthenticationFailed', this.onAuthenticationError);
       cwic.SystemController.addEventHandler('onInitializationError', this.onInitializationError);
       cwic.SystemController.addEventHandler('onUserAuthorized', this.onUserAuthorized);
       cwic.SystemController.addEventHandler('onUserAuthorizationRejected', this.onAuthorizationRejected);
       cwic.SystemController.addEventHandler('onAddonConnectionLost', this.onAddonConnectionLost);
       cwic.LoginController.addEventHandler('onSignedIn', this.onSignedIn);
       cwic.LoginController.addEventHandler('onSignedOut', this.onSignedOut);
       cwic.LoginController.addEventHandler('onSigningOut', this.onSigningOut);
       cwic.LoginController.addEventHandler('onSingingIn', this.onSigningIn);
       cwic.LoginController.addEventHandler('onDataResetting', this.onDataResetting);
       cwic.LoginController.addEventHandler("onCredentialsRequired", this.onCredentialsRequired);
       cwic.CertificateController.addEventHandler("onInvalidCertificate", this.onInvalidCertificate);
       console.log("credentials loaded is true");
       cwic.SystemController.initialize();
  }

  // Refactor to see if credentialsLoaded is needed at all
  // also refactor to see if we need to remove event handlers
  // optimize this stuff ie the number of tries
  componentDidUpdate(prevProps) {
      if (!prevProps.credentialsLoaded && this.props.credentialsLoaded) {
        intervalHandler = setInterval(this.initialize, interval);
    }
  }

  onInitialized() {
    clearInterval(intervalHandler);
    //reset retries and mark loaded to true
    cwicLoaded = true;
    this.props.dispatch({
        type: CWIC_ACTIONS.INITIALIZED,
        cwicLoaded: cwicLoaded,
        retriesCount: retriesCount,
    });

    let cucmServers = [];
    let ctiServers  = [];
    let tftpServers = [];

    cucmServers.push(cucm);
    ctiServers.push(cti);
    tftpServers.push(tftp);
  
    cwic.LoginController.setCTIServers(ctiServers);
    cwic.LoginController.setTFTPServers(tftpServers);
    cwic.LoginController.setCUCMServers(cucmServers);
    cwic.LoginController.signIn();
  }
  
  onCredentialsRequired() {
    cwic.LoginController.setCredentials("knnani", "Mypassword@@9876" );
  }

  onSignedIn() {
    this.props.dispatch({
        type: CWIC_ACTIONS.SIGNED_IN,
    });
    let telephonyDevices = cwic.TelephonyController.telephonyDevices;
    let telephonyDeviceList = {};
    for(let index in telephonyDevices) {
        if(telephonyDevices[index].controlMode == "Softphone" ) { // "Softphone"
            telephonyDeviceList["softPhone"] = telephonyDevices[index];
        } else { // "deskPhone" note that the naming is also different
            telephonyDeviceList["deskPhone"] = telephonyDevices[index];
        }
    }

    this.props.dispatch({
        type: CWIC_ACTIONS.LOAD_TELEPHONE_DEVICELIST,
        telephonyDeviceList: telephonyDeviceList,
    });

    console.log(telephonyDeviceList.deskPhone, " somestuff");
    
    // //Initialize the softphone by default maybe make it softphone for now...and refactor later
    telephonyDeviceList.softPhone.connect(true);

    // setTimeout( function() { 
    //   let camera     = cwic.MultimediaController.cameraList[0];
    //   let microphone = cwic.MultimediaController.microphoneList[0];
    //   let speaker    = cwic.MultimediaController.speakerList[0];
    //   let ringer     = cwic.MultimediaController.ringerList[0];
    //   // cwic.MultimediaController.selectCamera(camera);
    //   console.log(cwic.MultimediaController, camera, microphone, speaker, ringer, " cwic.MultimediaController");
    // //   cwic.TelephonyController.startAudioConversation("72072478");
    // }, 3000);

    // console.log(" kennethnnani ", cwic.TelephonyController.telephonyDevices, " Kennethnnani");
}


onSignedOut() {
    // Handle Event here...
    console.log('====================onSignedOut=====================');
    this.props.dispatch({
        type: CWIC_ACTIONS.SIGNED_OUT,
    });
}

onSigningOut() {
    // Handle Event here...
    console.log('====================onSigningOut=====================');
}

onSingingIn() {
    // Handle Event here...
    console.log('====================onSigningOut=====================');
}

onDataResetting() {
    console.log('====================onDataResetting=====================');
    // Handle Event here...
}

    onInvalidCertificate(invalidCertificate) {
        console.log("==============invalid certificate=============");
        cwic.CertificateController.acceptInvalidCertificate(invalidCertificate);
    }

  onInitializationError(errorInfo) {
    console.log("onInitializationErroronInitializationErroronInitializationError: Kenneth", errorInfo);
    // let extensionURL = errorInfo.errorData.extensionURL;
    // let errorReason  = errorInfo.errorData.reason;
    // let errorMessage = "Could not initialize CWIC library: " + errorReason;
    // switch(errorInfo.errorType) {
    //   case "ChromeExtension":
    //     errorMessage += "";
    // }
    //do something with the error information
  }

  onUserAuthorized() {  
    console.log("onSignedInonSignedInonSignedInonSignedInonSignedIn", " Flag");
    // console.log(" kennethnnani ", cwic.TelephonyController.telephonyDevices, " Kennethnnani");
    // dispatch some event here
    // dispatch({
        // type: "CWIC_AUTHENTICATED",
        // cwicAuthenticated: true,
    // });
    console.log("onUserAuthorizedonUserAuthorizedonUserAuthorizedonUserAuthorized Kenneth");
  }

  onAuthenticationStateChanged(authenticationState) {
      //this right here is cool
      console.log("onAuthenticationStateChanged Kenneth", authenticationState, ": Basic");
      switch(authenticationState) {
          case "NotAuthenticated":
              // Handle authentication state here...
              break;
          case "InProgress":
                //dispatch someevent to set a variable called cwic authentication retries to 1 if the count is greater than 1
              //sign out
              console.log("onAuthenticationStateChanged",  "InProgress");
              // Handle authentication state here...
              break;
          case "Authenticated":
              console.log("onAuthenticationStateChanged",  "Authenticated");        
              // Handle authentication state here...
              break;
      }
  }
  
  onAuthenticationError(authenticationError) {
      console.log("onAuthenticationError Kenneth", authenticationError, ": Basic");
      switch(authenticationError) {
          case "InvalidConfig":
              console.log("onAuthenticationError",  "InvalidConfig");
              // Handle authentication error here...
              break;
          case "InvalidCredentials":
              console.log("onAuthenticationError", "InvalidCredentials");
              break;
          case "InvalidToken":
              console.log("onAuthenticationError", "InvalidToken");
              // Handle authentication error here...
              break;
          case "ServerCertificateRejected":
              console.log("onAuthenticationError", "ServerCertificateRejected");
              // Handle authentication error here...
              break;
          case "ClientCertificateError":
              console.log("onAuthenticationError", "ClientCertificateError");
              // Handle authentication error here...
              break;
          case "NoCredentialsConfigured":
              console.log("onAuthenticationError", "NoCredentialsConfigured");
              // Handle authentication error here...
              break;
          case "CouldNotConnect":
              console.log("onAuthenticationError", "CouldNotConnect");
              // Handle authentication error here...
              break;
          case "Failed":
              console.log("onAuthenticationError", "Failed");
              // Handle authentication error here...
              break;
          case "SSLConnectError":
              console.log("onAuthenticationError", "SSLConnectError");
              // Handle authentication error here...
              break;
          case "Unknown":
              console.log("onAuthenticationError", "Unknown");
              // Handle authentication error here...
              break;
      }
  }
  
  onAuthorizationRejected() {
    console.log("Kenneth onAuthorizationRejected");
  }

  onAddonConnectionLost() {
    console.log("onAddonConnectionLost Kenneth");
  }

  render() {
    return (<div />);
  }
}

const mapStateToProps = state => ({
  username: state.initialize.username,
  password: state.initialize.password,
  credentialsLoaded: state.initialize.credentialsLoaded,
});

export default connect(mapStateToProps)(Initialize);

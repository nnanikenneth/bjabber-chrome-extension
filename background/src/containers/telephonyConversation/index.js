import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';


/*********
 * initialisation methods here
*********/ 

let conversation = {telephonyConversation: null};
let conversationControlList = {}; // 

export function answerCall(action) {
    return (dispatch, getState) => {

        let callingId = action.callingId;
        // if(conversation.telephonyConversation.capabilities.canUpdateVideo && conversation.telephonyConversation.capabilities.canStopVideo) {
        //     conversation.telephonyConversation.stopVideo();
        // }
        console.log("answerCall conversationControlListconversationControlListconversationControlList", conversationControlList, "conversationControlListconversationControlListconversationControlList", callingId);
        conversationControlList[callingId].answerAudio();
        console.log("Answering call here");
    };
}

export function endCall(action) {
    return (dispatch, getState) => {
        let callingId = action.callingId;      
        console.log("endCall conversationControlListconversationControlListconversationControlList", conversationControlList, "conversationControlListconversationControlListconversationControlList", callingId);        
        conversationControlList[callingId].end();        
        console.log("Ending call here");
    };
}

export function rejectCall(action) {
    return (dispatch, getState) => {
        let callingId = action.callingId;  
        console.log("rejectCall conversationControlListconversationControlListconversationControlList", conversationControlList, "conversationControlListconversationControlListconversationControlList", callingId);        
        conversationControlList[callingId].reject();        
        console.log("reject call ");
    };
}

export function transferCall(action) {
    return (dispatch, getState) => {
        let currentState = getState();
        let number = state.callManager.typedNumber;
        let callingId = action.callingId;        
        // let number = "72072415";  // fix this later
        console.log("transferCall conversationControlListconversationControlListconversationControlList", conversationControlList, "conversationControlListconversationControlListconversationControlList", callingId);        
        conversationControlList[callingId].transferConversation(number);
        console.log("holdCall call");                        
    };
}

export function holdCall(action) {
    return (dispatch, getState) => {
        let callingId = action.callingId;    
        console.log("holdCall conversationControlListconversationControlListconversationControlList", conversationControlList, "conversationControlListconversationControlListconversationControlList", callingId);        
        conversationControlList[callingId].hold();
        console.log("holdCall call");                
    };
}

export function retrieveCall(action) {
    return (dispatch, getState) => {
        let callingId = action.callingId;   
        console.log("retrieveCall conversationControlListconversationControlListconversationControlList", conversationControlList, "conversationControlListconversationControlListconversationControlList", callingId);        
        conversationControlList[callingId].resume();
        console.log("Retrieving call");        
    };
}



export function makeCall(action) {
    return (dispatch, getState) => {
       var opt = {
            type: "basic",
            title: "Outgoing Call",
            message: "Calling " + action.number,
            iconUrl: "icons/jabber.png"
       };
      let notification=chrome.notifications.create(opt);
      console.log(action.number);
      cwic.TelephonyController.startAudioConversation(action.number);
    };
}

export function logout(action) {
    return (dispatch, getState) => {
        dispatch({
            type: CORE_ACTIONS.LOGOUT,
        });
        dispatch({
            type: CALL_MANAGER_ACTIONS.CM_LOGOUT,
        });
    };
}

export function logoutUser(action) {
    return (dispatch, getState) => {
        console.log("Called User Logout here");
        cwic.LoginController.signOut();
    };
}
  
export function connectDevice(action) {
    return (dispatch, getState) => {
        console.log("Called User Logout here some stuff",  action);
        const state = getState();
        if(state.initialize.selectedDevice === "Deskphone"){ //or "Softphone"
            return state.initialize.telephonyDeviceList.deskPhone.connect(true);
            console.log("Selected a DESKPHONE");
        } else {
            return state.initialize.telephonyDeviceList.softPhone.connect(true);
            console.log("Selected a SOFTPHONE");      
        }
    }
}

export function openVideoWindow() {
    return dispatch => {
        let attributes = {
            url: chrome.extension.getURL("videopopup.html"),
            type: "popup",
            state: "normal",
            height: 600,
            width:1000,
            top: 100,
            left: 100,
            // name: "My extension"
        }
        chrome.windows.create(attributes, function(window){
            chrome.windows.update(window.id, {
                state: "normal",
            });
        });
    }
}

class TelephonyConversation extends Component {
    constructor(props) {
        super(props);
        this.onConversationOutgoing = this.onConversationOutgoing.bind(this);
        this.onConversationIncoming = this.onConversationIncoming.bind(this);
        this.onConversationEnded = this.onConversationEnded.bind(this);
        this.onConversationUpdated = this.onConversationUpdated.bind(this);
        this.onConversationStarted = this.onConversationStarted.bind(this);
        
        this.createConversation = this.createConversation.bind(this);
        this.updateConversation = this.updateConversation.bind(this);
        this.deleteConversation = this.deleteConversation.bind(this);
    }

    componentDidUpdate(prevProps) {
        if( this.props.cwicLoaded ) {
            cwic.TelephonyController.addEventHandler('onConversationOutgoing', this.onConversationOutgoing);
            cwic.TelephonyController.addEventHandler('onConversationIncoming', this.onConversationIncoming);
            cwic.TelephonyController.addEventHandler('onConversationEnded',    this.onConversationEnded);
            cwic.TelephonyController.addEventHandler('onConversationUpdated',  this.onConversationUpdated);
            cwic.TelephonyController.addEventHandler('onConversationStarted',  this.onConversationStarted);
        }
    }

    onConversationOutgoing(telephonyConversation) {
        console.log("herer I am telephonyConversation.capabilities.canAnswer onConversationOutgoing", telephonyConversation.capabilities.canAnswer);
        conversation.telephonyConversation = telephonyConversation;
        this.createConversation(this.props.conversationList, telephonyConversation);        
        console.log( "in my class" );
    }

    onConversationIncoming(telephonyConversation) {

        var opt = {
            type: "basic",
            title: "Incoming Call",
            message: "Receving Incoming call",
            iconUrl: "icons/jabber.png"
        };
        
        let notification = chrome.notifications.create(opt);

        console.log("herer I am telephonyConversation.capabilities.canAnswer onConversationIncoming can answer and list ", telephonyConversation.capabilities.canAnswer, this.props.conversationList);
        // if(telephonyConversation.capabilities.canAnswer == true){
        //     console.log("Answering audio");
        //     telephonyConversation.answerAudio();      
        //     console.log("Answering audio answered"); 
        // }   
        this.createConversation(this.props.conversationList, telephonyConversation);  
        // add notification here
        // let options = {
        //     type: "basic",
        //     title: "My First Popup with chrome",
        //     message: "cool",
        // };
        // chrome.notifications.create(options, function(){console.log("notification here");});
        console.log(" in my class");        
    }

    onConversationEnded(telephonyConversation) {
        console.log("herer I am telephonyConversation.capabilities.canAnswer onConversationEnded", telephonyConversation.capabilities.canAnswer);   
        console.log( " in my class" );                     
    }

    onConversationUpdated(telephonyConversation) {    
        console.log("herer I am telephonyConversation.capabilities.canAnswer onConversationUpdated", telephonyConversation.capabilities.canAnswer);
        // if(telephonyConversation.capabilities.canAnswer == true){
        //     console.log("Answering audio");
        //     telephonyConversation.answerAudio();      
        //     console.log("Answering audio answered"); 
        // } 
        if(telephonyConversation.callState === "OnHook"){
            this.deleteConversation(this.props.conversationList, telephonyConversation);                                  
        }else{
            this.updateConversation(this.props.conversationList, telephonyConversation);                          
        }
        
        // only update the function one
            // if conversation id s not present then update should not be called
        //
        console.log( "in my class" );
    }

    onConversationStarted(telephonyConversation) {    
        console.log("herer I am telephonyConversation.capabilities.canAnswer onConversationStarted", telephonyConversation.capabilities.canAnswer);   
        this.updateConversation(this.props.conversationList, telephonyConversation);        
        console.log(" in my class");
    }

    createConversation(conversationList, conversation) {
        console.log(conversationList, conversation);
        
        let conversationId = conversation.ID;
        // set in global variable to handles functions calls
        conversationControlList[conversationId] = conversation;
        // create new conversation
        console.log("before creating ", conversationList, conversation);
        conversationList[conversationId] = conversation;
        console.log("after creating ", conversationList, conversation);
        
        this.props.dispatch({
            type: "CREATE_CONVERSATION",
            conversationList : conversationList,
        }); 
    }

    updateConversation(conversationList, conversation) {
        console.log(conversationList, conversation);
        
        let conversationId = conversation.ID;        
        // set in global variable to handles functions calls
        // update the new telephony conversation
        // if(conversationId in conversationList){

        // }

        // if(conversationId in conversationControlList){
        conversationControlList[conversationId] = conversation;                        
        // }
        //test if conversation id is there or not
        if(conversationId in conversationList){
            this.props.dispatch({
                type: "UPDATE_CONVERSATION",
                id : conversation.ID,
                capabilities: conversation.capabilities,
            });
        }
        // // update contact list when the telephonyConversation callstate changes to some specific state
    }

    deleteConversation (conversationList, conversation) {
        console.log(conversationList, conversation);
        
        let conversationId = conversation.ID;    
        // set in global variable to handles functions calls
        console.log("Before deleting ", conversationList, conversationId);
        delete conversationList[conversationId];
        console.log("After deleting ", conversationList, conversationId);
        // delete in global variable to handles functions calls
        delete conversationControlList[conversationId]; 

        this.props.dispatch({
            type: "DELETE_CONVERSATION",
            conversationList: conversationList,
            
        });
    }
    
    render() {
        return (<div />);
    }
} 

const mapStateToProps = state => ({
    cwicLoaded: state.initialize.cwicLoaded,
    conversationList: state.telephonyConversation.conversationList,
});

export default connect(mapStateToProps)(TelephonyConversation);
// How to handle conversations when network dies ?
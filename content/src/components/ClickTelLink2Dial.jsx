import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { CALL_MANAGER_ACTIONS } from '../../../shared/action_types/callManager';
import { isValidPhoneNumber } from '../../../shared/util';
import { initClick2Dial } from '../../../background/src/vendor/clickToDialParser';

export default class ClickTelLink2Dial extends Component {
  constructor(props) {
    super(props);
    this.click2dial = this.click2dial.bind(this);   
  }

  componentDidUpdate(){
    if(this.props.signedIn){
      initClick2Dial(this.click2dial);      
    }
  }

  componentWillUnmount() {
    window.document.removeEventListener('click', this.click2dial);
  }

  click2dial(event) {
    event.stopPropagation(); 
    event.preventDefault();
   
    console.log("Clicked the click to dial here::", event.target.value);
    this.props.dispatch({
      type: CALL_MANAGER_ACTIONS.UI_MAKE_CALL,
      number: event.target.value,
    });
    return true;
  }

  render() {
    return (<div />);
  }
}













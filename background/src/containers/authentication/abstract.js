import React, { Component } from 'react';

export default class AbstractAuthentication extends Component {
  constructor(props) {
    super(props);
    if (this.constructor === AbstractAuthentication) {
      throw new TypeError('Cannot construct Abstract instances directly');
    }
  }
}

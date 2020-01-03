import React, { Component } from 'react';

export default class AbstractCallManager extends Component {
  constructor(props) {
    super(props);
    if (this.constructor === AbstractCallManager) {
      throw new TypeError('Cannot construct Abstract instances directly');
    }
  }
}

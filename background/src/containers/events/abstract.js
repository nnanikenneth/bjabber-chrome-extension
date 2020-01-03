import { Component } from 'react';

export default class AbstractEventManager extends Component {
  constructor(props) {
    super(props);
    if (this.constructor === AbstractEventManager) {
      throw new TypeError('Cannot construct Abstract instances directly');
    }
  }
}

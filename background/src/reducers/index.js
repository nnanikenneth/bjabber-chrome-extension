import { combineReducers } from 'redux';

import authentication from './authentication';
import callManager from './callManager';
import events from './events';
import core from './core';
import phoneLines from './phoneLines';
import storage from './storage';
import system from './system';
import initialize from './initialize';
import telephonyConversation from './telephonyConversation';

export default combineReducers({
  authentication,
  callManager,
  events,
  core,
  phoneLines,
  storage,
  system,
  initialize,
  telephonyConversation,
});

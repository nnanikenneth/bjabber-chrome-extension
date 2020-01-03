import { applyMiddleware, createStore } from 'redux';
import React from 'react';
import { render } from 'react-dom';
import { alias, wrapStore } from 'react-chrome-redux';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import Main from './components/Main';
import rootReducer from './reducers';
import { BookingLogger, StopUndefinedActions, InterceptForMonitoring } from './middlewares';
import { EVENTS_ACTIONS } from '../../shared/action_types/events';
import { CWIC_ACTIONS } from '../../shared/action_types/cwic';
import { CALL_MANAGER_ACTIONS } from '../../shared/action_types/callManager';
import { aliases } from './aliases';
import Context, { chromeIntrospection } from './util/context';
import Voiceapi from './services/voiceapi';
import { wrapForChrome } from '../../shared/util';

import './error-catcher';

const middlewares = [
  alias(aliases),
  thunk,
  StopUndefinedActions,
  InterceptForMonitoring,
];

chrome.management.getSelf((extensionInfo) => {
  addMiddlewares(extensionInfo.installType);

  const store = createStore(
    rootReducer, {},
    applyMiddleware(...middlewares),
    window.devToolsExtension && window.devToolsExtension()
  );

  renderComponents(store);

  wrapStore(store, {
    portName: 'bpe',
  });

  injectContentScript();
});

initContext();

const stateTransformer = (state) => {
  if (state.initialize.password === '') {
    return state;
  }
  const pwdMaskedState = {
    ...state,
    initialize: {
      ...state.initialize,
      password: '',
    },
  };
  return pwdMaskedState;
}

const actionTransformer = (action) => {
  if (action.type !== CWIC_ACTIONS.START_INIT) {
    return action;
  }
  const pwdMaskedAction = {
    ...action,
    password: '',
  };
  return pwdMaskedAction;
}

function addMiddlewares(installType) {
  if (installType === 'development') {
    const reduxLogger = require('redux-logger'); // eslint-disable-line
    const logger = reduxLogger.createLogger({
      collapsed: (getState, action) => (action.type === EVENTS_ACTIONS.EVENT_RECEIVED ||
        action.type === CALL_MANAGER_ACTIONS.REQUESTING_AGENT_REASON_STATE ||
        action.type === CALL_MANAGER_ACTIONS.AGENT_REASON_STATE_LOADED),
      duration: true,
      stateTransformer,
      actionTransformer,
    });

    middlewares.push(logger);
    middlewares.push(BookingLogger);
  } else {
    middlewares.push(BookingLogger);
  }
}

function renderComponents(store) {
  render(
    <Provider store={store}>
      <Main />
    </Provider>
    , document.getElementById('app'));
}

function initContext() {
  Context.addData(chromeIntrospection());
  Context.whenReady('staff_id').then(() => Voiceapi.sendMonitoring({ event_type: 'extension_start' }));
}

function injectContentScript() {
  const manifest = chrome.runtime.getManifest();
  const injectPatterns = manifest.content_scripts[0].matches.map((pattern) => {
    const re = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*');
    return new RegExp(re);
  });
  const contentScripts = manifest.content_scripts[0].js;

  /**
   * @param {{tabs: Array}} win
   */
  function injectContentIntoWindow(win) {
    win.tabs.forEach((tab) => {
      injectContentIntoTab(tab);
    });
  }

  /**
   * @param {{url: string, id: number}} tab
   */
  function injectContentIntoTab(tab) {
    const url = tab.url;
    const id = tab.id;
    if (id && urlMatches(url, injectPatterns)) {
      contentScripts.forEach((script) => {
        chrome.tabs.executeScript(id, {
          file: script,
        });
      });
    }
  }

  chrome.windows.getAll({ populate: true }, wrapForChrome((windows) => {
    windows.forEach((win) => {
      injectContentIntoWindow(win);
    });
  }));
}

/**
 * @param {string} url
 * @param {[RegExp]} patterns
 */
function urlMatches(url, patterns) {
  return patterns.some(pattern => url.match(pattern));
}

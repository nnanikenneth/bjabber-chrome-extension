import React from 'react';
import { render } from 'react-dom';
import { Store } from 'react-chrome-redux';
import { Provider } from 'react-redux';

import AppContainer from '../../shared/containers/AppContainer';
import Popup from './components/Popup';
import { CORE_SCREENS } from '../../shared/status_types/core';

console.time('Popup loading');
const proxyStore = new Store({ portName: 'bpe' });

proxyStore.ready().then(() => {
  render(
    <Provider store={proxyStore}>
      <AppContainer>
        <Popup currentScreen={CORE_SCREENS.HOME} />
      </AppContainer>
    </Provider>
    , document.getElementById('app'));
  console.timeEnd('Popup loading');
});

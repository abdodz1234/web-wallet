/// <reference types="chrome"/>

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import 'babel-polyfill';

import { initRemoteConnection } from '@app/core/api';
import store from '@app/store/rootStore';
import App from './app';

window.global = window;

export default store;

initRemoteConnection();

const ReduxProvider = Provider as unknown as React.ComponentType<any>;

ReactDOM.render(
  <MemoryRouter>
    <ReduxProvider store={store}>
      <App />
    </ReduxProvider>
  </MemoryRouter>,
  document.getElementById('root'),
);

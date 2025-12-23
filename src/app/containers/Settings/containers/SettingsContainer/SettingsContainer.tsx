import React from 'react';
import { useRoutes } from 'react-router-dom';

import { ROUTES_PATH } from '@app/shared/constants';
import Settings from '../Settings/Settings';
import SettingsReport from '../SettingsReport/SettingsReport';
import SettingsConnected from '../SettingsConnected/SettingsConnected';

const routes = [
  {
    path: '/',
    element: <Settings />,
  },
  {
    path: ROUTES_PATH.SETTINGS.SETTINGS_REPORT,
    element: <SettingsReport />,
  },
  {
    path: ROUTES_PATH.SETTINGS.SETTINGS_CONNECTED,
    element: <SettingsConnected />,
  },
];

const SettingsContainer = () => {
  const content = useRoutes(routes);

  return <>{content}</>;
};

export default SettingsContainer;

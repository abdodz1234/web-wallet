import React from 'react';
import { useRoutes } from 'react-router-dom';
import { ROUTES_PATH } from '@app/shared/constants';
import { Transactions } from '../Transactions';
import { TransactionDetail } from '../TransactionDetail';

const routes = [
  {
    path: ROUTES_PATH.TRANSACTIONS.BASE,
    element: <Transactions />,
  },
  {
    path: ROUTES_PATH.TRANSACTIONS.DETAIL,
    element: <TransactionDetail />,
  },
];

const TransactionContainer = () => {
  const content = useRoutes(routes);

  return <>{content}</>;
};

export default TransactionContainer;

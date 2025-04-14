import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { MyContext } from './MyContext';

const PrivateRoute = ({ children }) => {
  const { authState } = useContext(MyContext);

  return authState.isLoggedIn ? children : <Navigate to="/login" />;
};

export default PrivateRoute;

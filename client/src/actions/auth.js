import axios from 'axios';
import {
  USER_LOADED,
  AUTH_ERROR,
  LOGOUT,
  CLEAR_PROFILE
} from './types';
import setAuthToken from '../utils/setAuthToken';

import {b2cSignIn, b2cSignOut} from '../utils/AuthB2CService';

// Load User
export const loadUser = () => async dispatch => {
  if (localStorage.token) {
    setAuthToken(localStorage.token);
  }

  try {
    const res = await axios.get('/api/auth');

    dispatch({
      type: USER_LOADED,
      payload: res.data
    });
  } catch (err) {
    dispatch({
      type: AUTH_ERROR
    });
  }
};

// SingIn/SignUp User by B2C
export const signIn = () => async dispatch => {
  b2cSignIn();
};

// Logout / Clear Profile
export const logout = () => dispatch => {
  b2cSignOut();

  dispatch({ type: CLEAR_PROFILE });
  dispatch({ type: LOGOUT });
};

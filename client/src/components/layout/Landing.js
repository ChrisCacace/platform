import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { signIn } from '../../actions/auth';

const Landing = ({ isAuthenticated, signIn }) => {
  if (isAuthenticated) {
    return <Redirect to='/posts' />;
  }

  const handleSingInClick = async e => {
    e.preventDefault();
    signIn();
  };

  return (
    <section className='landing'>
      <div className='dark-overlay'>
        <div className='landing-inner'>
          <h1 className='x-large'>Hedons</h1>
          <div className='buttons'>
            <Link to='#' onClick={handleSingInClick} className='btn btn-primary'>
              Login or Sign Up with Azure B2C
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

Landing.propTypes = {
  isAuthenticated: PropTypes.bool,
  signIn: PropTypes.func
};

const mapStateToProps = state => ({
  isAuthenticated: state.auth.isAuthenticated,
});

export default connect(
  mapStateToProps,
  { signIn }
)(Landing);

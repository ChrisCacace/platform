import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { signIn } from '../../actions/auth';

const Landing = ({ isAuthenticated, signIn }) => {
  if (isAuthenticated) {
    return <Redirect to='/dashboard' />;
  }

  const handleSingInClick = async e => {
    e.preventDefault();
    signIn();
  };

  return (
    <section className='landing'>
      <div className='dark-overlay'>
        <div className='landing-inner'>
          <h1 className='x-large'>Developer Connector</h1>
          <p className='lead'>
            Create a developer profile/portfolio, share posts and get help from
            other developers
          </p>
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

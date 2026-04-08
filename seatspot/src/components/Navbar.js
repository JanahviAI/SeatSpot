import React from 'react';
import { Link } from 'react-router-dom';

function Navbar({ user, onLogout }) {
  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link to="/" className="logo">
          <img src="/logo.png" alt="SeatSpot Logo" className="logo-image" />
          <span className="logo-text">SeatSpot</span>
        </Link>
      </div>
      <div className="nav-right">
        <Link to="/" className="nav-link">Events</Link>
        <Link to="/mybookings" className="nav-link">My Bookings</Link>
        {user && user.name && (
          <span className="user-info">{user.name}</span>
        )}
        <button className="nav-link logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
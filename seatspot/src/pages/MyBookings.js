import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingAPI } from '../services/api';

function MyBookings({ user }) {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBookings = useCallback(async () => {
    try {
      setError('');
      setLoading(true);
      
      console.log('Fetching bookings for user ID:', user.id);
      const response = await bookingAPI.getUserBookings(user.id);
      
      console.log('API Response:', response);
      
      if (response.success) {
        console.log('Bookings found:', response.bookings.length);
        setBookings(response.bookings || []);
      } else {
        console.log('API Error:', response.error);
        setError(response.error || 'Failed to fetch bookings');
      }
    } catch (error) {
      console.error('Network Error:', error);
      setError(`Connection error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user && user.id) {
      console.log('User logged in. ID:', user.id);
      fetchBookings();
    } else {
      setError('No user logged in');
      setLoading(false);
    }
  }, [user?.id, fetchBookings]);

  if (loading) {
    return (
      <div className="container">
        <h1>My Bookings</h1>
        <p>Loading bookings...</p>
        <p style={{color: '#7a8291', marginTop: '1rem', fontSize: '0.9rem'}}>
          User ID: {user?.id} | Email: {user?.email}
        </p>
        <button 
          className="btn-secondary" 
          onClick={() => fetchBookings()}
          style={{marginTop: '1rem'}}
        >
          Retry
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container my-bookings-page">
        <h1>My Bookings</h1>
        <div className="error-message">{error}</div>
        <p style={{color: '#7a8291', marginTop: '1rem', fontSize: '0.9rem'}}>
          User ID: {user?.id}
        </p>
        <button 
          className="btn-primary" 
          onClick={() => fetchBookings()}
          style={{marginTop: '1rem'}}
        >
          Retry
        </button>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="container my-bookings-page">
        <h1>My Bookings</h1>
        <div className="empty-state">
          <p>You haven't booked any events yet.</p>
          <p style={{color: '#7a8291', marginTop: '1rem', fontSize: '0.9rem'}}>
            User ID: {user?.id}
          </p>
          <button 
            className="btn-primary" 
            onClick={() => navigate('/')}
            style={{marginTop: '1rem'}}
          >
            Browse Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container my-bookings-page">
      <h1>My Bookings ({bookings.length})</h1>
      <div className="bookings-list">
        {bookings.map(booking => (
          <div key={booking.id} className="booking-card">
            <div className="booking-header">
              <h3>{booking.event_name || `Event #${booking.event_id}`}</h3>
              <span className="booking-date">
                Booked: {new Date(booking.booking_date).toLocaleDateString()}
              </span>
            </div>
            <div className="booking-details">
              <p><strong>Booking ID:</strong> {booking.id}</p>
              <p><strong>Event ID:</strong> {booking.event_id}</p>
              <p><strong>Seats:</strong> {Array.isArray(booking.seats) ? booking.seats.join(', ') : booking.seats}</p>
              <p><strong>Price:</strong> ₹{booking.total_price}</p>
              <p><strong>Status:</strong> <span style={{color: '#667eea'}}>{booking.payment_status}</span></p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MyBookings;
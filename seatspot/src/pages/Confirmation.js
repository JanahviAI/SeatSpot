import React from 'react';
import { useNavigate } from 'react-router-dom';

function Confirmation() {
  const navigate = useNavigate();
  let selectedSeats = [];
  try {
    selectedSeats = JSON.parse(localStorage.getItem('selectedSeats') || '[]');
  } catch (error) {
    console.error('Invalid selectedSeats found in localStorage:', error);
  }
  const selectedEventId = parseInt(localStorage.getItem('selectedEventId') || '0');
  const eventPrice = parseFloat(
    localStorage.getItem('eventPrice') || localStorage.getItem('selectedEventPrice') || '0'
  );

  const handleProceedToPayment = () => {
    if (selectedSeats.length === 0) {
      navigate('/');
      return;
    }
    navigate('/payment');
  };

  const handleCancel = () => {
    navigate(-1);
  };

  if (selectedSeats.length === 0 || selectedEventId <= 0 || eventPrice <= 0) {
    console.log('Missing booking data in Confirmation:', {
      selectedSeats,
      selectedEventId,
      eventPrice
    });
    return <div className="container"><p>No booking data found</p></div>;
  }

  const totalPrice = selectedSeats.length * eventPrice;

  return (
    <div className="confirmation-page">
      <div className="container">
        <div className="confirmation-card">
          <h1>Booking Confirmation</h1>
          
          <div className="confirmation-details">
            <div className="detail-section">
              <h3>Event Details</h3>
              <p><strong>Event ID:</strong> {selectedEventId}</p>
            </div>

            <div className="detail-section">
              <h3>Your Booking</h3>
              <p><strong>Seats:</strong> {selectedSeats.join(', ')}</p>
              <p><strong>Number of Seats:</strong> {selectedSeats.length}</p>
              <p><strong>Price per Seat:</strong> ₹{eventPrice}</p>
              <p className="total"><strong>Total Amount:</strong> ₹{totalPrice.toFixed(2)}</p>
            </div>
          </div>

          <div className="confirmation-actions">
            <button className="btn-primary" onClick={handleProceedToPayment}>
              Proceed to Payment
            </button>
            <button className="btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Confirmation;

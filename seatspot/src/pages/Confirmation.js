import React from 'react';
import { useNavigate } from 'react-router-dom';

function Confirmation() {
  const navigate = useNavigate();
  const selectedSeats = JSON.parse(localStorage.getItem('selectedSeats') || '[]');
  const selectedEventId = parseInt(localStorage.getItem('selectedEventId') || '0');
  const eventPrice = parseFloat(localStorage.getItem('selectedEventPrice') || '0');

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

  if (selectedSeats.length === 0 || eventPrice <= 0) {
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
              <p className="total"><strong>Total Amount:</strong> ₹{totalPrice}</p>
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
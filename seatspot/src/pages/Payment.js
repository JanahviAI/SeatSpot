import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { paymentAPI, bookingAPI } from '../services/api';

function Payment({ user }) {
  const navigate = useNavigate();
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if user not logged in
  if (!user || !user.id) {
    return (
      <div className="container">
        <h1>Payment</h1>
        <div className="error-message">Please login to make a payment</div>
        <button className="btn-primary" onClick={() => navigate('/')}>
          Back to Home
        </button>
      </div>
    );
  }

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
  const totalPrice = selectedSeats.length * eventPrice;

  if (selectedSeats.length === 0 || selectedEventId <= 0 || eventPrice <= 0) {
    if (process.env.NODE_ENV === 'development') {
      console.log('Missing booking data in Payment:', {
        selectedSeats,
        selectedEventId,
        eventPrice
      });
    }
    return (
      <div className="container">
        <h1>Payment</h1>
        <div className="error-message">No booking data found. Please select an event first.</div>
        <button className="btn-primary" onClick={() => navigate('/')}>
          Back to Events
        </button>
      </div>
    );
  }

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!cardNumber || cardNumber.length < 16) {
        throw new Error('Card number must be 16 digits');
      }
      if (!cardName) {
        throw new Error('Please enter cardholder name');
      }
      if (!expiry) {
        throw new Error('Please enter expiry date');
      }
      if (!cvv || cvv.length < 3) {
        throw new Error('CVV must be 3 digits');
      }

      const paymentResponse = await paymentAPI.process(cardNumber, cardName, expiry, cvv);
      
      if (!paymentResponse.success) {
        throw new Error(paymentResponse.error || 'Payment failed');
      }

      console.log('Creating booking with user ID:', user.id);
      const bookingResponse = await bookingAPI.create(
        user.id,
        selectedEventId,
        selectedSeats,
        totalPrice
      );

      console.log('Booking response:', bookingResponse);

      if (bookingResponse.success) {
        localStorage.removeItem('selectedSeats');
        localStorage.removeItem('selectedEventId');
        localStorage.removeItem('eventPrice');
        localStorage.removeItem('selectedEventPrice');

        alert('Payment Successful! Your booking is confirmed.');
        navigate('/mybookings');
      } else {
        throw new Error(bookingResponse.error || 'Failed to save booking');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-page">
      <div className="container">
        <div className="payment-card">
          <h1>Payment Details</h1>

          <div className="payment-summary">
            <h3>Order Summary</h3>
            <p><strong>Event ID:</strong> {selectedEventId}</p>
            <p><strong>Seats:</strong> {selectedSeats.join(', ')}</p>
            <p><strong>Price per Seat:</strong> ₹{eventPrice}</p>
            <p><strong>Total Amount:</strong> <span className="price">₹{totalPrice.toFixed(2)}</span></p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handlePayment}>
            <div className="form-group">
              <label>Cardholder Name</label>
              <input
                type="text"
                placeholder="Name"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Card Number</label>
              <input
                type="text"
                placeholder="XXXX XXXX XXXX XXXX"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                maxLength="16"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Expiry Date</label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>CVV</label>
                <input
                  type="text"
                  placeholder="XXX"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  maxLength="3"
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Processing...' : `Pay ₹${totalPrice.toFixed(2)}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Payment;

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

  const selectedSeats = JSON.parse(localStorage.getItem('selectedSeats') || '[]');
  const selectedEventId = parseInt(localStorage.getItem('selectedEventId') || '0');
  const totalPrice = selectedSeats.length * 50;

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!cardNumber || cardNumber.length < 16) {
        throw new Error('Card number must be 16 digits');
      }
      if (!cardName) {
        throw new Error('Please enter card holder name');
      }
      if (!expiry) {
        throw new Error('Please enter expiry date');
      }
      if (!cvv || cvv.length < 3) {
        throw new Error('CVV must be 3 digits');
      }

      // Process payment
      const paymentResponse = await paymentAPI.process(cardNumber, cardName, expiry, cvv);
      
      if (!paymentResponse.success) {
        throw new Error(paymentResponse.error || 'Payment failed');
      }

      // Create booking
      console.log('Creating booking with user ID:', user.id);
      const bookingResponse = await bookingAPI.create(
        user.id,
        selectedEventId,
        selectedSeats,
        totalPrice
      );

      console.log('Booking response:', bookingResponse);

      if (bookingResponse.success) {
        // Clear localStorage
        localStorage.removeItem('selectedSeats');
        localStorage.removeItem('selectedEventId');

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
            <p><strong>Total Amount:</strong> <span className="price">${totalPrice}</span></p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handlePayment}>
            <div className="form-group">
              <label>Card Holder Name</label>
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
              {loading ? 'Processing...' : `Pay $${totalPrice}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Payment;
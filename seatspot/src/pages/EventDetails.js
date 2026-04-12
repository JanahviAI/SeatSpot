import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventAPI } from '../services/api';

function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookedSeats, setBookedSeats] = useState([]);

  const fetchEvent = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await eventAPI.getById(parseInt(id));
      
      if (response.success) {
        setEvent(response.event);
      } else {
        setError('Event not found');
      }
    } catch (err) {
      console.error('Error fetching event:', err);
      setError('Failed to load event details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchBookedSeats = useCallback(async () => {
    try {
      const response = await eventAPI.getBookedSeats(parseInt(id));
      
      if (response.success) {
        setBookedSeats(response.booked_seats || []);
        console.log('Booked seats:', response.booked_seats);
      }
    } catch (err) {
      console.error('Error fetching booked seats:', err);
    }
  }, [id]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  useEffect(() => {
    fetchBookedSeats();
    
    const interval = setInterval(fetchBookedSeats, 5000);
    
    return () => clearInterval(interval);
  }, [fetchBookedSeats]);

  const handleSeatClick = (seat) => {
    if (bookedSeats.includes(seat)) {
      alert('This seat is already booked!');
      return;
    }

    setSelectedSeats(prev => {
      if (prev.includes(seat)) {
        return prev.filter(s => s !== seat);
      } else {
        return [...prev, seat];
      }
    });
  };

  const handleBooking = () => {
    if (selectedSeats.length === 0) {
      alert('Please select at least one seat');
      return;
    }

    localStorage.setItem('selectedSeats', JSON.stringify(selectedSeats));
    localStorage.setItem('selectedEventId', String(event.id));
    localStorage.setItem('eventPrice', String(event.price));
    if (process.env.NODE_ENV === 'development') {
      console.log('Saved booking data to localStorage:', {
        selectedSeats,
        selectedEventId: event.id,
        eventPrice: event.price
      });
    }

    navigate('/confirmation');
  };

  if (loading) {
    return (
      <div className="container">
        <p>Loading event details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-message">{error}</div>
        <button className="btn-primary" onClick={() => navigate('/')}>
          Back to Events
        </button>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container">
        <p>Event not found</p>
        <button className="btn-primary" onClick={() => navigate('/')}>
          Back to Events
        </button>
      </div>
    );
  }

  const seatRows = ['A', 'B', 'C', 'D', 'E', 'F'];
  const seatsPerRow = 8;

  return (
    <div className="event-details-page">
      <div className="container">
        <button 
          className="btn-secondary" 
          onClick={() => navigate('/')}
          style={{ marginBottom: '2rem' }}
        >
          Back to Events
        </button>

        <div className="event-header">
          <img 
            src={event.image} 
            alt={event.name}
            className="event-icon"
            onError={(e) => {
              e.target.style.backgroundColor = '#e0e0e0';
              e.target.style.display = 'none';
            }}
          />
          <div className="event-info">
            <h1>{event.name}</h1>
            <p>
              <strong>Date:</strong> {event.date} at {event.time}
            </p>
            <p>
              <strong>Location:</strong> {event.location}
            </p>
            <p>
              <strong>Category:</strong> {event.category}
            </p>
            <p>
              <strong>Price per seat:</strong> ₹{event.price}
            </p>
          </div>
        </div>

        <div className="seat-selector">
          <h3>Select Your Seats</h3>

          <div className="screen">SCREEN</div>

          <div className="seat-legend">
            <div className="legend-item">
              <div className="seat-available"></div>
              <span>Available</span>
            </div>
            <div className="legend-item">
              <div className="seat-selected"></div>
              <span>Selected</span>
            </div>
            <div className="legend-item">
              <div style={{width: '20px', height: '20px', backgroundColor: '#ff6b6b', borderRadius: '0.3rem'}}></div>
              <span>Booked</span>
            </div>
          </div>

          <div className="seats-grid">
            {seatRows.map(row => (
              <div key={row} className="seat-row">
                <div className="row-label">{row}</div>
                {[...Array(seatsPerRow)].map((_, index) => {
                  const seatNumber = `${row}${index + 1}`;
                  const isSelected = selectedSeats.includes(seatNumber);
                  const isBooked = bookedSeats.includes(seatNumber);

                  return (
                    <button
                      key={seatNumber}
                      className={`seat ${isSelected ? 'selected' : ''} ${isBooked ? 'booked' : ''}`}
                      onClick={() => handleSeatClick(seatNumber)}
                      disabled={isBooked}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="selected-seats">
            <strong>Selected Seats:</strong> {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None'}
            <br />
            <strong>Total Price:</strong> ₹{(selectedSeats.length * event.price).toFixed(2)}
          </div>

          <button
            className="btn-primary"
            onClick={handleBooking}
            disabled={selectedSeats.length === 0}
          >
            Proceed to Confirmation
          </button>
        </div>
      </div>
    </div>
  );
}

export default EventDetails;

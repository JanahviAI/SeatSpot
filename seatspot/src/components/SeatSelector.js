import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function SeatSelector({ eventId }) {
  const [selectedSeats, setSelectedSeats] = useState([]);
  const navigate = useNavigate();

  const rows = ['A', 'B', 'C', 'D', 'E'];
  const seatsPerRow = 8;

  const handleSeatClick = (seatId) => {
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seatId));
    } else {
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  const handleConfirm = () => {
    if (selectedSeats.length > 0) {
      localStorage.setItem('selectedSeats', JSON.stringify(selectedSeats));
      localStorage.setItem('selectedEventId', eventId);
      navigate('/confirmation');
    } else {
      alert('Please select at least one seat');
    }
  };

  return (
    <div className="seat-selector">
      <h3>Select Your Seats</h3>
      
      <div className="screen">🎬 SCREEN 🎬</div>

      <div className="seats-grid">
        {rows.map(row => (
          <div key={row} className="seat-row">
            <span className="row-label">{row}</span>
            {Array.from({ length: seatsPerRow }, (_, i) => {
              const seatId = `${row}${i + 1}`;
              const isSelected = selectedSeats.includes(seatId);
              return (
                <button
                  key={seatId}
                  className={`seat ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSeatClick(seatId)}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="seat-legend">
        <div className="legend-item">
          <span className="seat-available"></span> Available
        </div>
        <div className="legend-item">
          <span className="seat-selected"></span> Selected
        </div>
      </div>

      <div className="selected-seats">
        <p>Selected: {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None'}</p>
      </div>

      <button className="btn-primary" onClick={handleConfirm}>
        Proceed to Confirmation
      </button>
    </div>
  );
}

export default SeatSelector;
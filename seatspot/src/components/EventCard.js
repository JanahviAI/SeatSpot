import React from 'react';
import { useNavigate } from 'react-router-dom';

function EventCard({ event }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/event/${event.id}`);
  };

  return (
    <div className="event-card" onClick={handleClick}>
      <div className="event-image">
        <img src={event.image} alt={`${event.name} event image`} className="event-img" />
      </div>
      <div className="event-category">{event.category}</div>
      <h3>{event.name}</h3>
      <div className="event-details">
        <p>{event.date} • {event.time}</p>
        <p>{event.location}</p>
      </div>
      <div className="event-price">₹{event.price.toFixed(0)}</div>
    </div>
  );
}

export default EventCard;
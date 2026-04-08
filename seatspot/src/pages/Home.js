import React, { useState, useEffect } from 'react';
import EventCard from '../components/EventCard';
import { eventAPI } from '../services/api';

function Home() {
  const [events, setEvents] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await eventAPI.getAll();
      if (response.success) {
        setEvents(response.events);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', 'Music', 'Tech', 'Comedy', 'Art', 'Sports'];
  const filteredEvents = selectedCategory === 'All' 
    ? events 
    : events.filter(event => event.category === selectedCategory);

  if (loading) {
    return <div className="container"><p>Loading events...</p></div>;
  }

  return (
    <div className="home-page">
      <div className="hero">
        <h1>Discover <span className="highlight">Amazing Events</span></h1>
        <p>Find and book tickets for the hottest concerts, conferences, and experiences near you.</p>
        <input 
          type="text" 
          placeholder="Search events or cities..." 
          className="search-box"
        />
      </div>

      <div className="categories">
        {categories.map(category => (
          <button
            key={category}
            className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="events-grid">
        {filteredEvents.map(event => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}

export default Home;
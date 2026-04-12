const API_URL = 'http://localhost:5000/api';

// ===== USER SERVICES =====

export const userAPI = {
  register: async (name, email, password) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    return response.json();
  },

  login: async (email, password) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return response.json();
  }
};

// ===== EVENT SERVICES =====

// Add this to eventAPI object (after getById)

export const eventAPI = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/events`);
    return response.json();
  },

  getById: async (id) => {
    const response = await fetch(`${API_URL}/events/${id}`);
    return response.json();
  },

  getBookedSeats: async (eventId) => {
    const response = await fetch(`${API_URL}/events/${eventId}/booked-seats`);
    return response.json();
  }
};

// ===== BOOKING SERVICES =====

export const bookingAPI = {
  create: async (userId, eventId, seats, totalPrice) => {
    const response = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        event_id: eventId,
        seats: seats,
        total_price: totalPrice
      })
    });
    return response.json();
  },

  getUserBookings: async (userId) => {
    const url = `${API_URL}/bookings/user/${userId}`;
    console.log('Fetching from:', url);
    const response = await fetch(url);
    const data = await response.json();
    console.log('Bookings response:', data);
    return data;
  },

  getById: async (id) => {
    const response = await fetch(`${API_URL}/bookings/${id}`);
    return response.json();
  }
};

// ===== PAYMENT SERVICES =====

export const paymentAPI = {
  process: async (cardNumber, cardName, expiry, cvv) => {
    const response = await fetch(`${API_URL}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardNumber,
        cardName,
        expiry,
        cvv
      })
    });
    return response.json();
  }
};
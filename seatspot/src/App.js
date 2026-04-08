import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Home from './pages/Home';
import EventDetails from './pages/EventDetails';
import Confirmation from './pages/Confirmation';
import Payment from './pages/Payment';
import MyBookings from './pages/MyBookings';
import './App.css';

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="*" element={<Login setUser={setUser} />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <Navbar user={user} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/event/:id" element={<EventDetails />} />
        <Route path="/confirmation" element={<Confirmation />} />
        <Route path="/payment" element={<Payment user={user} />} />
        <Route path="/mybookings" element={<MyBookings user={user} />} />
      </Routes>
    </Router>
  );
}

export default App;
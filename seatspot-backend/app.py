from flask import Flask, request, jsonify
from flask_cors import CORS
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import json

# Then use:
# DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///seatspot.db')

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Database setup
engine = create_engine('sqlite:///seatspot.db')
Base = declarative_base()
Session = sessionmaker(bind=engine)

# ===== DATABASE MODELS =====

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    bookings = relationship('Booking', back_populates='user')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'created_at': self.created_at.isoformat()
        }


class Event(Base):
    __tablename__ = 'events'
    
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    date = Column(String, nullable=False)
    time = Column(String, nullable=False)
    location = Column(String, nullable=False)
    category = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    image = Column(String, nullable=False)
    bookings = relationship('Booking', back_populates='event')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'date': self.date,
            'time': self.time,
            'location': self.location,
            'category': self.category,
            'price': self.price,
            'image': self.image
        }


class Booking(Base):
    __tablename__ = 'bookings'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    event_id = Column(Integer, ForeignKey('events.id'), nullable=False)
    seats = Column(String, nullable=False)  # Store as JSON string
    total_price = Column(Float, nullable=False)
    payment_status = Column(String, default='Paid')
    booking_date = Column(DateTime, default=datetime.now)
    user = relationship('User', back_populates='bookings')
    event = relationship('Event', back_populates='bookings')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'event_id': self.event_id,
            'seats': json.loads(self.seats),
            'total_price': self.total_price,
            'payment_status': self.payment_status,
            'booking_date': self.booking_date.isoformat(),
            'user_name': self.user.name,
            'event_name': self.event.name
        }


# Create all tables
Base.metadata.create_all(engine)

# ===== ROUTES =====

# 1. USER ROUTES

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.json
        session = Session()
        
        # Check if user already exists
        existing_user = session.query(User).filter_by(email=data['email']).first()
        if existing_user:
            return jsonify({'error': 'Email already registered'}), 400
        
        # Create new user
        new_user = User(
            name=data['name'],
            email=data['email'],
            password=data['password']  # In production, hash this!
        )
        session.add(new_user)
        session.commit()
        
        response = new_user.to_dict()
        session.close()
        
        return jsonify({'success': True, 'user': response}), 201
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.json
        session = Session()
        
        # Find user
        user = session.query(User).filter_by(
            email=data['email'],
            password=data['password']
        ).first()
        
        if not user:
            return jsonify({'error': 'Invalid email or password'}), 401
        
        response = user.to_dict()
        session.close()
        
        return jsonify({'success': True, 'user': response}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# 2. EVENT ROUTES

@app.route('/api/events', methods=['GET'])
def get_events():
    """Get all events"""
    try:
        session = Session()
        events = session.query(Event).all()
        response = [event.to_dict() for event in events]
        session.close()
        
        return jsonify({'success': True, 'events': response}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/events/<int:event_id>', methods=['GET'])
def get_event(event_id):
    """Get single event"""
    try:
        session = Session()
        event = session.query(Event).filter_by(id=event_id).first()
        
        if not event:
            return jsonify({'error': 'Event not found'}), 404
        
        response = event.to_dict()
        session.close()
        
        return jsonify({'success': True, 'event': response}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# 3. BOOKING ROUTES

@app.route('/api/bookings', methods=['POST'])
def create_booking():
    """Create a new booking"""
    try:
        data = request.json
        session = Session()
        
        # Create booking
        new_booking = Booking(
            user_id=data['user_id'],
            event_id=data['event_id'],
            seats=json.dumps(data['seats']),
            total_price=data['total_price'],
            payment_status='Paid'
        )
        session.add(new_booking)
        session.commit()
        
        response = new_booking.to_dict()
        session.close()
        
        return jsonify({'success': True, 'booking': response}), 201
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/bookings/user/<int:user_id>', methods=['GET'])
def get_user_bookings(user_id):
    """Get all bookings for a user"""
    try:
        session = Session()
        bookings = session.query(Booking).filter_by(user_id=user_id).all()
        response = [booking.to_dict() for booking in bookings]
        session.close()
        
        return jsonify({'success': True, 'bookings': response}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/bookings/<int:booking_id>', methods=['GET'])
def get_booking(booking_id):
    """Get single booking"""
    try:
        session = Session()
        booking = session.query(Booking).filter_by(id=booking_id).first()
        
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        response = booking.to_dict()
        session.close()
        
        return jsonify({'success': True, 'booking': response}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# 4. PAYMENT ROUTE

@app.route('/api/payment', methods=['POST'])
def process_payment():
    """Process payment (demo)"""
    try:
        data = request.json
        
        # Simple validation
        if not data['cardNumber'] or len(data['cardNumber']) < 16:
            return jsonify({'error': 'Invalid card number'}), 400
        
        if not data['cvv'] or len(data['cvv']) < 3:
            return jsonify({'error': 'Invalid CVV'}), 400
        
        # In production, integrate with actual payment gateway
        # For now, just return success
        
        return jsonify({
            'success': True,
            'message': 'Payment processed successfully',
            'transaction_id': f'TXN{datetime.now().timestamp()}'
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# 5. HEALTH CHECK

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'Backend is running!'}), 200


# ===== INITIALIZE DATABASE WITH SAMPLE DATA =====

def init_sample_data():
    """Add sample events to database"""
    session = Session()
    
    # Check if events already exist
    if session.query(Event).count() > 0:
        session.close()
        return
    
    events = [
        # MUSIC CONCERTS - BOLLYWOOD & INDIAN ARTISTS
        Event(
            name='A.R. Rahman - The Wonderment Tour',
            date='Apr 11',
            time='7:00 PM',
            location='Kolkata, West Bengal',
            category='Music',
            price=1500.0,
            image='https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80'
        ),
        Event(
            name='Karan Aujla - P-POP Culture Tour',
            date='Apr 12',
            time='8:00 PM',
            location='Mumbai, Maharashtra',
            category='Music',
            price=2000.0,
            image='https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80'
        ),
        Event(
            name='Yo Yo Honey Singh - My Story Tour (Finale)',
            date='May 16',
            time='7:30 PM',
            location='Bengaluru, Karnataka',
            category='Music',
            price=1800.0,
            image='https://images.unsplash.com/photo-1501386761578-eaa54b915e8c?w=800&q=80'
        ),
        
        # INTERNATIONAL CONCERTS IN INDIA
        Event(
            name='Calvin Harris India Tour',
            date='Apr 17',
            time='7:00 PM',
            location='Bengaluru, Karnataka',
            category='Music',
            price=3500.0,
            image='https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80'
        ),
        Event(
            name='Max Richter Live in India',
            date='Apr 18',
            time='7:00 PM',
            location='Mumbai, Maharashtra',
            category='Music',
            price=2500.0,
            image='https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&q=80'
        ),
        Event(
            name='Scorpions - Rock Concert',
            date='Apr 26',
            time='7:30 PM',
            location='Bengaluru, Karnataka',
            category='Music',
            price=3000.0,
            image='https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=800&q=80'
        ),
        Event(
            name='Scorpions - Mumbai Show',
            date='Apr 30',
            time='8:00 PM',
            location='Mumbai, Maharashtra',
            category='Music',
            price=3200.0,
            image='https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&q=80'
        ),
        Event(
            name='Ye (Kanye West) - Live in Delhi',
            date='May 23',
            time='7:00 PM',
            location='Delhi, NCR',
            category='Music',
            price=5000.0,
            image='https://images.unsplash.com/photo-1540039155733-5bb30b4f36ff?w=800&q=80'
        ),
        
        # MUSIC FESTIVALS
        Event(
            name='Mumbai Art Fiesta 2026',
            date='Mar 30-Apr 4',
            time='10:00 AM',
            location='Mumbai, Maharashtra',
            category='Music',
            price=800.0,
            image='https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&q=80'
        ),
        Event(
            name='Bengaluru Art Weekend',
            date='Mar 28-Apr 5',
            time='11:00 AM',
            location='Bengaluru, Karnataka',
            category='Music',
            price=600.0,
            image='https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=80'
        ),
        
        # TECH & BUSINESS CONFERENCES
        Event(
            name='AI Impact Summit 2026',
            date='May 15-17',
            time='9:00 AM',
            location='New Delhi, NCR',
            category='Tech',
            price=3500.0,
            image='https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80'
        ),
        Event(
            name='TechCrunch India Disrupt 2026',
            date='May 20-22',
            time='9:30 AM',
            location='Bengaluru, Karnataka',
            category='Tech',
            price=4000.0,
            image='https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800&q=80'
        ),
        Event(
            name='Nasscom Global Tech Summit',
            date='Jun 2-4',
            time='8:30 AM',
            location='Mumbai, Maharashtra',
            category='Tech',
            price=3000.0,
            image='https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80'
        ),
        Event(
            name='Web Summit India 2026',
            date='Jun 10-12',
            time='9:00 AM',
            location='Pune, Maharashtra',
            category='Tech',
            price=2500.0,
            image='https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&q=80'
        ),
        
        # COMEDY
        Event(
            name='Indian Comedy Festival 2026',
            date='Apr 19-21',
            time='7:00 PM',
            location='Delhi, NCR',
            category='Comedy',
            price=1200.0,
            image='https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800&q=80'
        ),
        Event(
            name='Stand-Up Comedy Night - Mumbai',
            date='May 10',
            time='8:00 PM',
            location='Mumbai, Maharashtra',
            category='Comedy',
            price=800.0,
            image='https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=800&q=80'
        ),
        
        # SPORTS & CULTURAL EVENTS
        Event(
            name='Indian Premier League (IPL) 2026',
            date='Apr 5-Jun 5',
            time='7:30 PM',
            location='Multiple Cities, India',
            category='Sports',
            price=2500.0,
            image='https://images.unsplash.com/photo-1540747913346-19212a4b423e?w=800&q=80'
        ),
        Event(
            name='Delhi Marathon 2026',
            date='May 17',
            time='6:00 AM',
            location='Delhi, NCR',
            category='Sports',
            price=500.0,
            image='https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80'
        ),
        Event(
            name='Saffronart Spring Auctions 2026',
            date='Apr 1',
            time='6:00 PM',
            location='Mumbai, Maharashtra',
            category='Art',
            price=2000.0,
            image='https://images.unsplash.com/photo-1578926288207-a90a5366759d?w=800&q=80'
        ),
        Event(
            name='World Theatre Day Celebration',
            date='Mar 27-Apr 2',
            time='6:00 PM',
            location='Bengaluru, Karnataka',
            category='Art',
            price=500.0,
            image='https://images.unsplash.com/photo-1507924538820-ede94a04019d?w=800&q=80'
        ),
    ]
    
    for event in events:
        session.add(event)
    
    session.commit()
    session.close()
    print("20 Indian Events Added!")

if __name__ == '__main__':
    init_sample_data()
    app.run(debug=True, port=5000)
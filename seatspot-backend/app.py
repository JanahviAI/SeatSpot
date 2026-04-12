from flask import Flask, request, jsonify
from flask_cors import CORS
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import json
import traceback

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Database setup
engine = create_engine('sqlite:///seatspot.db', echo=True)
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
    bookings = relationship('Booking', back_populates='user', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'created_at': self.created_at.isoformat() if self.created_at else None
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
    bookings = relationship('Booking', back_populates='event', cascade='all, delete-orphan')

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
    seats = Column(String, nullable=False)
    total_price = Column(Float, nullable=False)
    payment_status = Column(String, default='Paid')
    booking_date = Column(DateTime, default=datetime.now)
    user = relationship('User', back_populates='bookings')
    event = relationship('Event', back_populates='bookings')

    def to_dict(self):
        try:
            seats_list = json.loads(self.seats) if isinstance(self.seats, str) else self.seats
        except:
            seats_list = []
        
        return {
            'id': self.id,
            'user_id': self.user_id,
            'event_id': self.event_id,
            'seats': seats_list,
            'total_price': float(self.total_price),
            'payment_status': self.payment_status or 'Paid',
            'booking_date': self.booking_date.isoformat() if self.booking_date else None,
            'user_name': self.user.name if self.user else 'Unknown User',
            'event_name': self.event.name if self.event else 'Unknown Event'
        }


# Create all tables
Base.metadata.create_all(engine)

# ===== ROUTES =====

# 1. USER ROUTES

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user"""
    session = None
    try:
        data = request.json
        session = Session()
        
        print(f"Register attempt: {data.get('email')}")
        
        # Check if user already exists
        existing_user = session.query(User).filter_by(email=data['email']).first()
        if existing_user:
            return jsonify({'success': False, 'error': 'Email already registered'}), 400
        
        # Create new user
        new_user = User(
            name=data['name'],
            email=data['email'],
            password=data['password']
        )
        session.add(new_user)
        session.commit()
        
        response = new_user.to_dict()
        
        return jsonify({'success': True, 'user': response}), 201
    
    except Exception as e:
        if session:
            session.rollback()
        print(f"Register error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500
    
    finally:
        if session:
            session.close()


@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login user"""
    session = None
    try:
        data = request.json
        session = Session()
        
        print(f"Login attempt: {data.get('email')}")
        
        # Find user
        user = session.query(User).filter_by(
            email=data['email'],
            password=data['password']
        ).first()
        
        if not user:
            return jsonify({'success': False, 'error': 'Invalid email or password'}), 401
        
        response = user.to_dict()
        
        return jsonify({'success': True, 'user': response}), 200
    
    except Exception as e:
        if session:
            session.rollback()
        print(f"Login error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500
    
    finally:
        if session:
            session.close()


# 2. EVENT ROUTES

@app.route('/api/events', methods=['GET'])
def get_events():
    """Get all events"""
    session = None
    try:
        session = Session()
        events = session.query(Event).all()
        response = [event.to_dict() for event in events]
        
        return jsonify({'success': True, 'events': response}), 200
    
    except Exception as e:
        if session:
            session.rollback()
        print(f"Get events error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500
    
    finally:
        if session:
            session.close()


@app.route('/api/events/<int:event_id>', methods=['GET'])
def get_event(event_id):
    """Get single event"""
    session = None
    try:
        session = Session()
        event = session.query(Event).filter_by(id=event_id).first()
        
        if not event:
            return jsonify({'success': False, 'error': 'Event not found'}), 404
        
        response = event.to_dict()
        
        return jsonify({'success': True, 'event': response}), 200
    
    except Exception as e:
        if session:
            session.rollback()
        print(f"Get event error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500
    
    finally:
        if session:
            session.close()

@app.route('/api/events/<int:event_id>/booked-seats', methods=['GET'])
def get_booked_seats(event_id):
    """Get all booked seats for an event"""
    session = None
    try:
        session = Session()
        
        # Find all bookings for this event
        bookings = session.query(Booking).filter_by(event_id=event_id).all()
        
        # Collect all booked seats
        booked_seats = []
        for booking in bookings:
            try:
                seats = json.loads(booking.seats)
                booked_seats.extend(seats)
            except:
                pass
        
        session.close()
        
        return jsonify({
            'success': True,
            'event_id': event_id,
            'booked_seats': booked_seats
        }), 200
    
    except Exception as e:
        if session:
            session.rollback()
        print(f"Get booked seats error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500
    
    finally:
        if session:
            session.close()
# 3. BOOKING ROUTES

@app.route('/api/bookings', methods=['POST'])
def create_booking():
    """Create a new booking"""
    session = None
    try:
        data = request.json
        
        print(f"\n=== CREATE BOOKING REQUEST ===")
        print(f"Data received: {data}")
        
        session = Session()
        
        # Validate required fields
        required_fields = ['user_id', 'event_id', 'seats', 'total_price']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'error': f'Missing field: {field}'}), 400
        
        user_id = data['user_id']
        event_id = data['event_id']
        seats = data['seats']
        total_price = data['total_price']
        
        print(f"User ID: {user_id}, Event ID: {event_id}")
        
        # Check if user exists
        user = session.query(User).filter_by(id=user_id).first()
        if not user:
            print(f"User {user_id} not found")
            return jsonify({'success': False, 'error': f'User {user_id} not found'}), 404
        
        print(f"User found: {user.name}")
        
        # Check if event exists
        event = session.query(Event).filter_by(id=event_id).first()
        if not event:
            print(f"Event {event_id} not found")
            return jsonify({'success': False, 'error': f'Event {event_id} not found'}), 404
        
        print(f"Event found: {event.name}")
        
        # Create booking
        booking = Booking(
            user_id=user_id,
            event_id=event_id,
            seats=json.dumps(seats) if isinstance(seats, list) else seats,
            total_price=float(total_price),
            payment_status='Paid'
        )
        
        session.add(booking)
        session.flush()  # Get the ID without committing
        
        print(f"Booking created with ID: {booking.id}")
        
        session.commit()
        
        # Refresh to ensure relationships are loaded
        session.refresh(booking)
        
        response = booking.to_dict()
        
        print(f"Booking response: {response}")
        print(f"=== BOOKING CREATED SUCCESSFULLY ===\n")
        
        return jsonify({'success': True, 'booking': response}), 201
    
    except Exception as e:
        if session:
            session.rollback()
        print(f"\n!!! CREATE BOOKING ERROR !!!")
        print(f"Error: {str(e)}")
        print(traceback.format_exc())
        print(f"!!! ERROR END !!!\n")
        return jsonify({'success': False, 'error': str(e)}), 500
    
    finally:
        if session:
            session.close()


@app.route('/api/bookings/user/<int:user_id>', methods=['GET'])
def get_user_bookings(user_id):
    """Get all bookings for a user"""
    session = None
    try:
        session = Session()
        
        print(f"\n=== GET USER BOOKINGS ===")
        print(f"Fetching bookings for user: {user_id}")
        
        # Check if user exists
        user = session.query(User).filter_by(id=user_id).first()
        if not user:
            print(f"User {user_id} not found")
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        bookings = session.query(Booking).filter_by(user_id=user_id).all()
        
        print(f"Found {len(bookings)} bookings")
        
        response = [booking.to_dict() for booking in bookings]
        
        print(f"=== BOOKINGS RETRIEVED SUCCESSFULLY ===\n")
        
        return jsonify({'success': True, 'bookings': response}), 200
    
    except Exception as e:
        if session:
            session.rollback()
        print(f"Get bookings error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500
    
    finally:
        if session:
            session.close()


@app.route('/api/bookings/<int:booking_id>', methods=['GET'])
def get_booking(booking_id):
    """Get single booking"""
    session = None
    try:
        session = Session()
        booking = session.query(Booking).filter_by(id=booking_id).first()
        
        if not booking:
            return jsonify({'success': False, 'error': 'Booking not found'}), 404
        
        response = booking.to_dict()
        
        return jsonify({'success': True, 'booking': response}), 200
    
    except Exception as e:
        if session:
            session.rollback()
        print(f"Get booking error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500
    
    finally:
        if session:
            session.close()


# 4. PAYMENT ROUTE

@app.route('/api/payment', methods=['POST'])
def process_payment():
    """Process payment (demo)"""
    try:
        data = request.json
        
        # Simple validation
        if not data.get('cardNumber') or len(str(data['cardNumber'])) < 16:
            return jsonify({'success': False, 'error': 'Invalid card number'}), 400
        
        if not data.get('cvv') or len(str(data['cvv'])) < 3:
            return jsonify({'success': False, 'error': 'Invalid CVV'}), 400
        
        # In production, integrate with actual payment gateway
        return jsonify({
            'success': True,
            'message': 'Payment processed successfully',
            'transaction_id': f'TXN{int(datetime.now().timestamp())}'
        }), 200
    
    except Exception as e:
        print(f"Payment error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'success': False, 'error': str(e)}), 500


# 5. HEALTH CHECK

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'Backend is running!'}), 200


# ===== INITIALIZE DATABASE WITH SAMPLE DATA =====

def init_sample_data():
    """Add sample events to database"""
    session = Session()
    
    try:
        # Check if events already exist
        if session.query(Event).count() > 0:
            print("Events already exist in database")
            session.close()
            return
        
        events = [
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
                image='/yoyo.jpg'
            ),
            Event(
                name='Calvin Harris India Tour',
                date='Apr 17',
                time='7:00 PM',
                location='Bengaluru, Karnataka',
                category='Music',
                price=3500.0,
                image='/calvinharris.jpg'
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
                image='/ye.jpg'
            ),
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
                name='Indian Comedy Festival 2026',
                date='Apr 19-21',
                time='7:00 PM',
                location='Delhi, NCR',
                category='Comedy',
                price=1200.0,
                image='https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800&q=80'
            ),
            Event(
                name='Indian Premier League (IPL) 2026',
                date='Apr 5-Jun 5',
                time='7:30 PM',
                location='Multiple Cities, India',
                category='Sports',
                price=2500.0,
                image='/ipl.jpg'
            ),
        ]
        
        for event in events:
            session.add(event)
        
        session.commit()
        print(f"Added {len(events)} events to database!")
        
    except Exception as e:
        session.rollback()
        print(f"Error initializing sample data: {str(e)}")
        print(traceback.format_exc())
    
    finally:
        session.close()


if __name__ == '__main__':
    init_sample_data()
    app.run(debug=True, port=5000)
"""
Database models for BTC Lottery
"""
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Column, Integer, String, DateTime, JSON, Float

db = SQLAlchemy()

class Ticket(db.Model):
    """Ticket model"""
    __tablename__ = 'tickets'
    
    id = Column(Integer, primary_key=True)
    number = Column(Integer, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    active = Column(Integer, default=1)
    
    def to_dict(self):
        return {
            'number': self.number,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'active': self.active == 1
        }

class LotteryDraw(db.Model):
    """Lottery draw history"""
    __tablename__ = 'lottery_draws'
    
    id = Column(Integer, primary_key=True)
    draw_id = Column(String(64), unique=True, nullable=False)
    winner_ticket = Column(Integer, nullable=False)
    seed_hex = Column(String(128), nullable=False)
    block_hashes = Column(JSON, nullable=False)
    block_heights = Column(JSON, nullable=False)
    scores = Column(JSON, nullable=False)
    tickets_used = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'draw_id': self.draw_id,
            'winner': self.winner_ticket,
            'seed': self.seed_hex,
            'block_hashes': self.block_hashes,
            'block_heights': self.block_heights,
            'scores': self.scores,
            'tickets': self.tickets_used,
            'timestamp': self.created_at.isoformat() if self.created_at else None
        }

class VerificationRequest(db.Model):
    """Verification requests log"""
    __tablename__ = 'verifications'
    
    id = Column(Integer, primary_key=True)
    draw_id = Column(String(64))
    verified_at = Column(DateTime, default=datetime.utcnow)
    verified_by = Column(String(128))
    result_valid = Column(Integer, default=0)
    
    def to_dict(self):
        return {
            'draw_id': self.draw_id,
            'verified_at': self.verified_at.isoformat() if self.verified_at else None,
            'verified_by': self.verified_by,
            'valid': self.result_valid == 1
        }

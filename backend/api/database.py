"""
Database models and session management for PostgreSQL
"""
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, Text, JSON, ForeignKey, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, Session
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from datetime import datetime
import os
from typing import Optional, List, Dict, Any
import uuid

Base = declarative_base()

# Database connection
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://budget_user:budget_password_change_in_production@localhost:5432/budget_db')
engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_size=10, max_overflow=20)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# Models
class User(Base):
    """User table - stores user emails and basic info"""
    __tablename__ = 'users'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    years = relationship('UserYear', back_populates='user', cascade='all, delete-orphan')
    global_data = relationship('UserGlobalData', back_populates='user', uselist=False, cascade='all, delete-orphan')


class UserYear(Base):
    """Stores which years a user has"""
    __tablename__ = 'user_years'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    year = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship('User', back_populates='years')
    year_data = relationship('YearData', back_populates='user_year', uselist=False, cascade='all, delete-orphan')
    
    __table_args__ = (
        Index('idx_user_year', 'user_id', 'year', unique=True),
    )


class YearData(Base):
    """Stores year-specific data (categories, expenses, etc.)"""
    __tablename__ = 'year_data'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_year_id = Column(UUID(as_uuid=True), ForeignKey('user_years.id', ondelete='CASCADE'), nullable=False, unique=True, index=True)
    categories = Column(JSON, nullable=False, default=list)
    expenses = Column(JSON, nullable=False, default=list)
    subs = Column(JSON, nullable=False, default=list)
    annual_fixed_expenses = Column(JSON, nullable=False, default=list)
    monthly_salary = Column(Float, default=0.0)
    variable_monthly_incomes = Column(JSON, nullable=True)
    additional_monthly_incomes = Column(JSON, nullable=False, default=list)
    monthly_income_sources = Column(JSON, nullable=False, default=list)
    current_savings = Column(Float, default=0.0)
    savings_transactions = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user_year = relationship('UserYear', back_populates='year_data')


class UserGlobalData(Base):
    """Stores global user data (bank accounts, investments, etc.)"""
    __tablename__ = 'user_global_data'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True, index=True)
    bank_accounts = Column(JSON, nullable=False, default=list)
    investments = Column(JSON, nullable=False, default=list)
    savings_goals = Column(JSON, nullable=False, default=list)
    savings_projects = Column(JSON, nullable=False, default=list)
    temporary_incomes = Column(JSON, nullable=False, default=list)
    shared_expense_persons = Column(JSON, nullable=False, default=list)
    person_transactions = Column(JSON, nullable=False, default=list)
    salary_history = Column(JSON, nullable=False, default=list)
    monthly_salary = Column(Float, default=0.0)
    monthly_salary_start_date = Column(DateTime, nullable=True)
    initialization_complete = Column(Boolean, default=False)
    locked_years = Column(ARRAY(Integer), nullable=False, default=list)
    excluded_predicted_years = Column(ARRAY(Integer), nullable=False, default=list)
    max_predicted_years = Column(Integer, default=3)
    user_profile = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship('User', back_populates='global_data')


# Cache tables for external API data
class CacheEntry(Base):
    """Generic cache table for external API responses"""
    __tablename__ = 'cache_entries'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cache_key = Column(String(255), unique=True, nullable=False, index=True)
    cache_type = Column(String(50), nullable=False, index=True)  # 'fiscal_calendar', 'regulations', 'insee', etc.
    data = Column(JSON, nullable=False)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# Database session management
def get_db() -> Session:
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get user by email"""
    return db.query(User).filter(User.email == email).first()


def get_or_create_user(db: Session, email: str) -> User:
    """Get or create user"""
    user = get_user_by_email(db, email)
    if not user:
        user = User(email=email)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


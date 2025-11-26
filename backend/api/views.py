"""
API Views
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
import re

from .utils import load_user, save_user, get_default_year_data


def require_session_user(request):
    """Check if user email is in session"""
    if 'user_email' not in request.session:
        return None
    return request.session['user_email']


@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def login(request):
    """Login endpoint"""
    email = request.data.get('email', '').strip()
    password = request.data.get('password', '')
    
    if not email:
        return Response({'error': 'Email invalide'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate email format
    email_regex = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    if not re.match(email_regex, email):
        return Response({'error': 'Email invalide'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Note: Password verification not implemented (same as original)
    # In production, implement proper password hashing
    
    # Set session user
    request.session['user_email'] = email
    
    # Ensure user data exists
    data = load_user(email)
    
    return Response({
        'email': email,
        'years': data['years']
    })


@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def logout(request):
    """Logout endpoint"""
    request.session.flush()
    return Response({'done': True})


@api_view(['GET', 'POST', 'DELETE'])
@csrf_exempt
def years_view(request):
    """Handle years operations: GET, POST, DELETE"""
    user_email = require_session_user(request)
    if not user_email:
        return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
    
    if request.method == 'GET':
        # Get all years for authenticated user
        data = load_user(user_email)
        return Response({
            'email': user_email,
            'years': data['years']
        })
    
    elif request.method == 'POST':
        # Add a new year
        year = request.data.get('year')
        try:
            year_num = int(year)
            if year_num < 1900 or year_num > 2100:
                return Response({'error': 'Année invalide'}, status=status.HTTP_400_BAD_REQUEST)
        except (ValueError, TypeError):
            return Response({'error': 'Année invalide'}, status=status.HTTP_400_BAD_REQUEST)
        
        data = load_user(user_email)
        if year_num not in data['years']:
            data['years'].append(year_num)
            data['years'].sort()
        
        save_user(user_email, data)
        return Response({'years': data['years']})
    
    elif request.method == 'DELETE':
        # Delete a year
        year_str = request.GET.get('year')
        if not year_str:
            return Response({'error': 'Année requise'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            year_num = int(year_str)
        except ValueError:
            return Response({'error': 'Année invalide'}, status=status.HTTP_400_BAD_REQUEST)
        
        data = load_user(user_email)
        
        # Remove from years array
        data['years'] = [y for y in data['years'] if y != year_num]
        
        # Remove dataset if exists
        year_key = str(year_num)
        if year_key in data['datasets']:
            del data['datasets'][year_key]
        
        save_user(user_email, data)
        return Response({'years': data['years']})
    
    return Response({'error': 'Method not allowed'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)


@api_view(['GET'])
@csrf_exempt
def get_year_data(request):
    """Get data for a specific year"""
    user_email = require_session_user(request)
    if not user_email:
        return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
    
    year_str = request.GET.get('year')
    if not year_str:
        return Response({'error': 'Année requise'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        year_num = int(year_str)
        if year_num < 1900 or year_num > 2100:
            return Response({'error': 'Année invalide'}, status=status.HTTP_400_BAD_REQUEST)
    except ValueError:
        return Response({'error': 'Année invalide'}, status=status.HTTP_400_BAD_REQUEST)
    
    data = load_user(user_email)
    year_key = str(year_num)
    dataset = data['datasets'].get(year_key)
    
    if not dataset:
        # Return default dataset
        default_data = get_default_year_data()
        return Response(default_data)
    
    return Response(dataset)


@api_view(['PUT'])
@csrf_exempt
def put_year_data(request):
    """Update data for a specific year"""
    user_email = require_session_user(request)
    if not user_email:
        return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
    
    year_str = request.GET.get('year')
    if not year_str:
        return Response({'error': 'Année requise'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        year_num = int(year_str)
        if year_num < 1900 or year_num > 2100:
            return Response({'error': 'Année invalide'}, status=status.HTTP_400_BAD_REQUEST)
    except ValueError:
        return Response({'error': 'Année invalide'}, status=status.HTTP_400_BAD_REQUEST)
    
    payload = request.data
    if not isinstance(payload, dict):
        return Response({'error': 'Payload invalide'}, status=status.HTTP_400_BAD_REQUEST)
    
    data = load_user(user_email)
    year_key = str(year_num)
    
    data['datasets'][year_key] = {
        'categories': payload.get('categories', []),
        'expenses': payload.get('expenses', []),
        'subs': payload.get('subs', [])
    }
    
    # Ensure year is in years array
    if year_num not in data['years']:
        data['years'].append(year_num)
        data['years'].sort()
    
    save_user(user_email, data)
    return Response({'ok': True})


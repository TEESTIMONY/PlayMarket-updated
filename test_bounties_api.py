#!/usr/bin/env python3
"""
Test script for the PlayMarket bounties API endpoint
"""

import requests
import json
import base64
import time

# API Configuration
BASE_URL = "http://localhost:8000/api"
BOUNTIES_ENDPOINT = f"{BASE_URL}/"

# Test Credentials
USERNAME = "testuser"
PASSWORD = "password123"

def test_bounties_endpoint():
    """Test the bounties endpoint with authentication"""
    
    print("Testing PlayMarket Bounties API")
    print("=" * 50)
    
    # Create basic auth header
    credentials = f"{USERNAME}:{PASSWORD}"
    encoded_credentials = base64.b64encode(credentials.encode()).decode()
    headers = {
        'Authorization': f'Basic {encoded_credentials}',
        'Content-Type': 'application/json'
    }
    
    print(f"Testing with credentials: {USERNAME}/{PASSWORD}")
    print(f"API Endpoint: {BOUNTIES_ENDPOINT}")
    print()
    
    try:
        # Make the request
        print("Making request to bounties endpoint...")
        response = requests.get(BOUNTIES_ENDPOINT, headers=headers)
        
        print(f"Response Status: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print()
        
        if response.status_code == 200:
            print("SUCCESS! Authentication successful")
            print()
            
            # Parse and display the response
            data = response.json()
            print("Response Data:")
            print("-" * 30)
            print(json.dumps(data, indent=2))
            print()
            
            # Analyze the data
            if 'results' in data:
                bounties = data['results']
                print(f"Found {len(bounties)} bounties:")
                for i, bounty in enumerate(bounties, 1):
                    print(f"  {i}. {bounty['title']} - {bounty['reward']} coins")
                    print(f"     Status: {bounty['status']} | Claims: {bounty['claims_left']}/{bounty['max_claims']}")
                    print(f"     Created: {bounty['created_at']}")
                    print()
            
            if 'count' in data:
                print(f"Total bounties: {data['count']}")
                
        elif response.status_code == 401:
            print("AUTHENTICATION FAILED")
            print("The credentials provided are not valid for this endpoint")
            print("Response:", response.text)
            
        elif response.status_code == 403:
            print("FORBIDDEN")
            print("You don't have permission to access this endpoint")
            print("Response:", response.text)
            
        else:
            print(f"UNEXPECTED STATUS CODE: {response.status_code}")
            print("Response:", response.text)
            
    except requests.exceptions.ConnectionError:
        print("CONNECTION ERROR")
        print("Could not connect to the server at localhost:8000")
        print("Please make sure the Django development server is running:")
        print("  cd backend && python manage.py runserver")
        
    except requests.exceptions.Timeout:
        print("TIMEOUT ERROR")
        print("The request timed out. The server might be too slow or unavailable.")
        
    except requests.exceptions.RequestException as e:
        print(f"REQUEST ERROR: {e}")
        
    except json.JSONDecodeError:
        print("JSON DECODE ERROR")
        print("The response is not valid JSON")
        print("Raw response:", response.text)

def test_without_auth():
    """Test the endpoint without authentication"""
    print("\nTesting without authentication...")
    print("-" * 30)
    
    try:
        response = requests.get(BOUNTIES_ENDPOINT)
        print(f"Response Status: {response.status_code}")
        
        if response.status_code == 401:
            print("EXPECTED: Authentication required")
        else:
            print(f"UNEXPECTED: Got status {response.status_code} without auth")
            
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    print("Starting PlayMarket API Test")
    print()
    
    # Test with authentication
    test_bounties_endpoint()
    
    # Test without authentication
    test_without_auth()
    
    print("\nTest completed!")
    print("\nTips:")
    print("- Make sure the Django server is running on localhost:8000")
    print("- Check that the testuser exists in the database")
    print("- Verify CORS settings allow requests from your client")

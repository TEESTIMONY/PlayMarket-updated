#!/usr/bin/env python3
"""
Test script for the claimed bounties API endpoint.
This script tests the new API endpoint that fetches claimed bounties for a user.
"""

import requests
import json
import sys
import os

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

def test_claimed_bounties_api():
    """Test the claimed bounties API endpoint."""
    
    # Test URLs
    base_url = "http://127.0.0.1:8000"
    
    # Test cases
    test_cases = [
        {
            'name': 'Test with user ID 4 (testuser)',
            'url': f'{base_url}/bounties/api/user/4/claimed-bounties/',
            'expected_status': 200
        },
        {
            'name': 'Test with "me" parameter (current user)',
            'url': f'{base_url}/bounties/api/user/me/claimed-bounties/',
            'expected_status': 401  # Should require authentication
        },
        {
            'name': 'Test with non-existent user ID',
            'url': f'{base_url}/bounties/api/user/99999/claimed-bounties/',
            'expected_status': 404
        },
        {
            'name': 'Test stats endpoint with user ID 4',
            'url': f'{base_url}/bounties/api/user/4/claimed-bounties/stats/',
            'expected_status': 200
        }
    ]
    
    print("Testing Claimed Bounties API Endpoints")
    print("=" * 50)
    
    for test_case in test_cases:
        print(f"\n{test_case['name']}")
        print(f"URL: {test_case['url']}")
        
        try:
            response = requests.get(test_case['url'], timeout=10)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == test_case['expected_status']:
                print("✅ PASS - Status code matches expected")
            else:
                print(f"❌ FAIL - Expected {test_case['expected_status']}, got {response.status_code}")
            
            # Try to parse JSON response
            try:
                data = response.json()
                print(f"Response: {json.dumps(data, indent=2)}")
            except json.JSONDecodeError:
                print(f"Response (raw): {response.text}")
                
        except requests.exceptions.RequestException as e:
            print(f"❌ ERROR - Request failed: {e}")
        except Exception as e:
            print(f"❌ ERROR - Unexpected error: {e}")
    
    print("\n" + "=" * 50)
    print("Test completed. Note: Some tests may fail if the Django server is not running.")

if __name__ == "__main__":
    test_claimed_bounties_api()
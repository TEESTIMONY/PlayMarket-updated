#!/usr/bin/env python3
"""
Complete Integration Test for Auction System
Tests the full integration between frontend and backend
"""

import asyncio
import json
import websockets
import requests
import time
import sys
from datetime import datetime, timedelta

API_BASE_URL = "http://localhost:8000"
WEBSOCKET_URL = "ws://localhost:8000/ws/auction-updates/"

def print_section(title):
    print(f"\n{'='*60}")
    print(f" {title}")
    print(f"{'='*60}")

def print_test(test_name, success, message=""):
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} {test_name}")
    if message:
        print(f"     {message}")

async def test_websocket_connection():
    """Test WebSocket connection and basic functionality"""
    print_section("TESTING WEBSOCKET CONNECTION")
    
    try:
        async with websockets.connect(WEBSOCKET_URL) as websocket:
            print_test("WebSocket Connection", True, "Connected successfully")
            
            # Test sending a message
            test_message = {
                "type": "test",
                "message": "Hello from integration test"
            }
            
            await websocket.send(json.dumps(test_message))
            print_test("WebSocket Send", True, "Message sent successfully")
            
            # Wait for response
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                response_data = json.loads(response)
                print_test("WebSocket Receive", True, f"Received: {response_data}")
            except asyncio.TimeoutError:
                print_test("WebSocket Receive", False, "No response received")
            
            return True
            
    except Exception as e:
        print_test("WebSocket Connection", False, f"Error: {e}")
        return False

def test_api_endpoints():
    """Test all auction API endpoints"""
    print_section("TESTING API ENDPOINTS")
    
    # Test getting auctions
    try:
        response = requests.get(f"{API_BASE_URL}/bounties/auctions/")
        if response.status_code == 200:
            data = response.json()
            print_test("GET /bounties/auctions/", True, f"Found {data.get('count', 0)} auctions")
        else:
            print_test("GET /bounties/auctions/", False, f"Status: {response.status_code}")
    except Exception as e:
        print_test("GET /bounties/auctions/", False, f"Error: {e}")
    
    # Test creating an auction (if we have auth)
    try:
        # This would require authentication, so we'll just test the endpoint exists
        response = requests.post(f"{API_BASE_URL}/bounties/auctions/create/", 
                               json={"title": "Test", "description": "Test"})
        if response.status_code in [401, 403]:  # Expected without auth
            print_test("POST /bounties/auctions/create/", True, "Endpoint exists (auth required)")
        else:
            print_test("POST /bounties/auctions/create/", False, f"Unexpected status: {response.status_code}")
    except Exception as e:
        print_test("POST /bounties/auctions/create/", False, f"Error: {e}")

def test_frontend_files():
    """Test that frontend files exist and are properly structured"""
    print_section("TESTING FRONTEND FILES")
    
    import os
    
    frontend_files = [
        "src/services/api.ts",
        "src/hooks/useWebSocket.ts", 
        "src/pages/RealAuctionPage.tsx",
        "src/pages/AuctionPage.tsx"
    ]
    
    for file_path in frontend_files:
        full_path = f"/Users/dera/Documents/GitHub/PlayMarket-updated/{file_path}"
        if os.path.exists(full_path):
            print_test(f"File exists: {file_path}", True)
        else:
            print_test(f"File exists: {file_path}", False, "File not found")

async def test_real_time_updates():
    """Test real-time auction updates via WebSocket"""
    print_section("TESTING REAL-TIME UPDATES")
    
    try:
        async with websockets.connect(WEBSOCKET_URL) as websocket:
            # Send a test bid update message
            bid_update = {
                "type": "new_bid",
                "auction_id": 1,
                "amount": 150,
                "user": "test_user"
            }
            
            await websocket.send(json.dumps(bid_update))
            print_test("Send bid update", True, "Bid update sent")
            
            # Wait for any response
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=3.0)
                print_test("Receive bid update", True, f"Response: {response}")
            except asyncio.TimeoutError:
                print_test("Receive bid update", False, "No response received")
                
    except Exception as e:
        print_test("Real-time updates", False, f"Error: {e}")

def test_system_readiness():
    """Test overall system readiness"""
    print_section("TESTING SYSTEM READINESS")
    
    # Check if Django server is running
    try:
        response = requests.get(f"{API_BASE_URL}/", timeout=5)
        if response.status_code == 200:
            print_test("Django Server", True, "Server is running")
        else:
            print_test("Django Server", False, f"Unexpected status: {response.status_code}")
    except requests.exceptions.ConnectionError:
        print_test("Django Server", False, "Server not running")
    except Exception as e:
        print_test("Django Server", False, f"Error: {e}")
    
    # Check if Daphne server is running (WebSocket)
    try:
        async def check_websocket():
            async with websockets.connect(WEBSOCKET_URL, timeout=5):
                return True
        
        result = asyncio.run(check_websocket())
        if result:
            print_test("Daphne Server", True, "WebSocket server is running")
        else:
            print_test("Daphne Server", False, "WebSocket server not responding")
            
    except Exception as e:
        print_test("Daphne Server", False, f"Error: {e}")

async def main():
    """Run all integration tests"""
    print_section("AUCTION SYSTEM INTEGRATION TEST")
    print(f"Testing integration between frontend and backend")
    print(f"API Base URL: {API_BASE_URL}")
    print(f"WebSocket URL: {WEBSOCKET_URL}")
    
    # Run all tests
    await test_websocket_connection()
    test_api_endpoints()
    test_frontend_files()
    await test_real_time_updates()
    test_system_readiness()
    
    print_section("INTEGRATION TEST COMPLETE")
    print("If all tests passed, the auction system is ready for use!")
    print("\nTo start using the auction system:")
    print("1. Ensure Django server is running on port 8000")
    print("2. Ensure Daphne server is running for WebSocket support")
    print("3. Navigate to /auctions/:id in your React frontend")
    print("4. The RealAuctionPage component will handle the rest!")

if __name__ == "__main__":
    asyncio.run(main())
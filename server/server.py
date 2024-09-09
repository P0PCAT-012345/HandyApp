import asyncio
import websockets
import json
from datetime import datetime, timezone
from main import Session

sessionsList = {}

async def handler(websocket, path):
    global sessionsList
    client_address = websocket.remote_address
    try:
        # Start a new session for the client if it doesn't exist
        if client_address not in sessionsList:
            sessionsList[client_address] = Session()
            print(client_address)
            print("New session started")

        # Process incoming messages
        async for message in websocket:
            response = process_message(sessionsList[client_address], message)
            if response:
                await websocket.send(response)
    except websockets.exceptions.ConnectionClosed:
        print(f"Connection closed with {client_address}")
    finally:
        # Remove session when connection is closed
        if client_address in sessionsList:
            del sessionsList[client_address]
            print(f"Session for {client_address} removed")

def process_message(session, message):
    try:
        data = json.loads(message)
        
        # Check if requestTime is present and valid
        if "requestTime" in data:
            request_time = datetime.fromisoformat(data["requestTime"])  # Assuming requestTime is in ISO format
            current_time = datetime.now(timezone.utc)
            time_difference = (current_time - request_time).total_seconds()

            # Ignore message if it's older than 2 seconds
            if time_difference > 2:
                print("Ignoring message due to outdated requestTime")
                return None
        
        if "function" in data:
            func_name = data["function"]
            
            if func_name in session.functions:
                func = session.functions[func_name]
                kwargs = {}
                args = []
                if "kwargs" in data:
                    kwargs = data["kwargs"]
                if 'args' in data:
                    args = data['args']
                result = func(*args, **kwargs)
                return json.dumps({"result": result, "function": func_name})
            else:
                return json.dumps({"error": "Function not found"})
        else:
            return json.dumps({"error": "Invalid message format"})
    except json.JSONDecodeError:
        return json.dumps({"error": "Invalid JSON"})
    except ValueError:
        return json.dumps({"error": "Invalid requestTime format"})

print("Server Starting")
start_server = websockets.serve(handler, "localhost", 8765, max_size=10000000)
print("Server Started Successfully")

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
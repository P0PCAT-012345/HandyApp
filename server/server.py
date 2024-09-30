import asyncio
import websockets
import json
from datetime import datetime, timezone
from main import Session
import uuid


sessionsList = {}
namespace = uuid.NAMESPACE_DNS

async def handler(websocket, path):
    global sessionsList
    client_address = websocket.remote_address[0]
    print("Connected from: ", websocket.remote_address)
    try:
        if client_address not in sessionsList:
            id = str(uuid.uuid5(namespace, client_address))
            sessionsList[client_address] = Session(id)
            print("New session started")
        async for message in websocket:
            if "function" in message and json.loads(message)["function"] == "list_saved":
                async for chunk in process_message(sessionsList[client_address], message):
                    await websocket.send(chunk)
            else:
                response = process_message(sessionsList[client_address], message)
                if response:
                    await websocket.send(response)
    except websockets.exceptions.ConnectionClosed:
        print(f"Connection closed with {client_address}")

async def process_message(session, message):
    try:
        data = json.loads(message)
        
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
                
                if func_name == "list_saved":
                    async for chunk in func(*args, **kwargs):
                        yield json.dumps({"result": chunk, "function": func_name})
                else:
                    result = func(*args, **kwargs)
                    yield json.dumps({"result": result, "function": func_name})
            else:
                yield json.dumps({"error": "Function not found"})
        else:
            yield json.dumps({"error": "Invalid message format"})
    except json.JSONDecodeError:
        yield json.dumps({"error": "Invalid JSON"})
    

print("Server Starting")
start_server = websockets.serve(handler, "127.0.0.1", 8765, max_size=10000000)
print("Server Started Successfully")

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
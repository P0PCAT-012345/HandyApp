import asyncio
import websockets
import json
from main import recieve, reset_data, stop_recording, record

functions = {'recieve': recieve, 'stop_recording': stop_recording, 'reset_data': reset_data, 'record': record}    

async def handler(websocket, path):
    async for message in websocket:
        response = process_message(message)
        await websocket.send(response)

def process_message(message):
    try:
        data = json.loads(message)
        if "function" in data:
            func_name = data["function"]
            
            if func_name in functions:
                func = functions[func_name]
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
        return f"Received: {message}, Hello World!"

print("Server Starting")
start_server = websockets.serve(handler, "localhost", 8765, max_size=10000000)
print("Server Started Succesfully")

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()

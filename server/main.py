import numpy as np
import torch
from model import get_model
from classify import classify, toSentence
import glob
import os
import cv2
import mediapipe as mp
import numpy as np
import base64
import time
import datetime

prev_left_hand = np.zeros((21, 3))
prev_right_hand = np.zeros((21, 3))
hand_landmarks = []
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = get_model(device=device)
curr_sentence = []
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(static_image_mode=False, max_num_hands=2, min_detection_confidence=0.5)
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=False, min_detection_confidence=0.5)

database = []
for folder_name in os.listdir("server/database"):
    folder_path = os.path.join("server/database", folder_name)

    if os.path.isdir(folder_path):
        for file_name in os.listdir(folder_path):
            if file_name.endswith('.npy'):
                file_path = os.path.join(folder_path, file_name)
                data = np.load(file_path)
                if len(data.shape) == 2 and data.shape[1] == 256:
                    database.append((folder_name, data))

print("Initialized with database of length:",len(database))

def decode_image(base64_data):
    if base64_data.startswith('data:image/jpeg;base64,'):
        base64_data = base64_data.split(',')[1]

    image_data = base64.b64decode(base64_data)
    nparr = np.frombuffer(image_data, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    return image

def convert_mediapipe(image):
    global prev_left_hand, prev_right_hand  
    try:
        if image is None:
            raise ValueError("Decoded image is None. Check if the base64 input is correct.")

        image_np = np.array(image)
        frame_rgb = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
        results = hands.process(frame_rgb)
        frame_landmarks = np.zeros((42, 3))
        left_hand_detected = False
        right_hand_detected = False

        if results.multi_hand_landmarks:
            for hand_landmark, handedness in zip(results.multi_hand_landmarks, results.multi_handedness):
                if handedness.classification[0].label == 'Left':
                    left_hand_detected = True
                    for i, landmark in enumerate(hand_landmark.landmark):
                        frame_landmarks[i, :] = [landmark.x, landmark.y, landmark.z]
                    prev_left_hand = frame_landmarks[:21, :]
                elif handedness.classification[0].label == 'Right':
                    right_hand_detected = True
                    for i, landmark in enumerate(hand_landmark.landmark):
                        frame_landmarks[i + 21, :] = [landmark.x, landmark.y, landmark.z]
                    prev_right_hand = frame_landmarks[21:, :]

        if not left_hand_detected:
            frame_landmarks[:21, :] = prev_left_hand
        if not right_hand_detected:
            frame_landmarks[21:, :] = prev_right_hand

        return frame_landmarks

    except Exception as e:
        print(f"Error in convert_mediapipe: {e}")
        return np.zeros((42, 3))

def getEmbedding(landmarks):
    input = torch.tensor(np.array(landmarks), dtype=torch.float32, device=device).unsqueeze(0)
    output = model(input).squeeze(0).detach().cpu().numpy()
    return output

def recieve(frame, mode="translate"):
    global hand_landmarks, model, curr_sentence
    current_landmarks = convert_mediapipe(decode_image(frame))
    hand_landmarks.append(current_landmarks)
    if mode=='translate':
        if len(hand_landmarks) == 30 and len(database) > 0:
            np.save('server/database/mostrecent.npy', np.array(hand_landmarks))
            output = getEmbedding(hand_landmarks)
            sequence, costs = classify(output, 0.35, database)
            sentence = toSentence(sequence, curr_sentence)
            hand_landmarks = []
            if len(sentence) == 0:
                return 'No match found'
            
            return ' '.join(sentence)

    if mode=='record':
        if mouth_open(frame):
            return True

def reset_data():
    global prev_left_hand, prev_right_hand, hand_landmarks, curr_sentence
    curr_sentence.clear()
    prev_left_hand = np.zeros((21, 3))
    prev_right_hand = np.zeros((21, 3))
    hand_landmarks = []
    print("Reseted")

def record(frame):
    return 'MOUTH_OPEN_TRUE' if recieve(frame, mode='record') else None

def stop_recording(name):
    global hand_landmarks, database
    embeddings = getEmbedding(hand_landmarks)
    directory_path = f'server/database/{name}'
    
    # Create the directory if it doesn't exist
    os.makedirs(directory_path, exist_ok=True)
    
    # Generate the filename with the current timestamp
    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f'{timestamp}.npy'
    
    file_path = os.path.join(directory_path, filename)
    np.save(file_path, embeddings)
    
    # Log the action
    print(f"Embeddings saved for {name} at {file_path}")
    
    # Append the new entry to the database
    database.append((name, embeddings))

def mouth_open(frame):
    image = decode_image(frame)
    if image is None:
        raise ValueError("Decoded image is None. Check if the base64 input is correct.")
    
    image_np = np.array(image)
    image_rgb = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
    results = face_mesh.process(image_rgb)

    if results.multi_face_landmarks:
        for face_landmarks in results.multi_face_landmarks:
            top_lip_landmarks = [13, 14]
            bottom_lip_landmarks = [17, 18]
            left_mouth_corner = 61
            right_mouth_corner = 291

            top_lip_y = np.mean([face_landmarks.landmark[i].y for i in top_lip_landmarks])
            bottom_lip_y = np.mean([face_landmarks.landmark[i].y for i in bottom_lip_landmarks])

            left_corner = face_landmarks.landmark[left_mouth_corner]
            right_corner = face_landmarks.landmark[right_mouth_corner]
            mouth_width = np.abs(right_corner.x - left_corner.x)

            mouth_open_threshold = mouth_width * 0.5  
            return (bottom_lip_y - top_lip_y) > mouth_open_threshold

if __name__ == '__main__':
    image_np = np.load("server/database/testimagenp")
    frame_rgb = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
    results = hands.process(frame_rgb)
    print(results.multi_hand_landmarks)
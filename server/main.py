import numpy as np
import torch
from model import get_model
from classify import classify, toSentence
from copy import deepcopy
import glob
import os
import time
import uuid
import cv2
import mediapipe as mp
import numpy as np
import base64
import base64
from io import BytesIO
from PIL import Image



# Initialize storage for previous hand positions and all data
prev_left_hand = np.zeros((21, 3))
prev_right_hand = np.zeros((21, 3))
hand_landmarks = []
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = get_model(device=device)

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(static_image_mode=False, max_num_hands=2, min_detection_confidence=0.5)




database = []
for file_path in glob.glob('server/database/*.npy'):
    data = np.load(file_path)
    if len(data.shape) == 2 and data.shape[1] == 256:
        database.append((os.path.basename(os.path.basename(file_path))[:-4], data))

print("Initialized with database of length:",len(database))







def decode_image(base64_data):
    # Remove the data URI header (if present)
    if base64_data.startswith('data:image/jpeg;base64,'):
        base64_data = base64_data.split(',')[1]

    # Decode the base64 data
    image_data = base64.b64decode(base64_data)
    
    # Open the image
    image = Image.open(BytesIO(image_data))
    return image


def convert_mediapipe(image):
    global prev_left_hand, prev_right_hand  # Use global variables to keep track of previous hand positions

    try:
        if image is None:
            raise ValueError("Decoded image is None. Check if the base64 input is correct.")

        # Convert the PIL image to a NumPy array
        image_np = np.array(image)

        # Convert the image to RGB (OpenCV uses BGR by default)
        image_rgb = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)

        # Process the image and find hands
        results = hands.process(image_rgb)

        # Initialize an array to store hand landmarks
        hand_landmarks = np.zeros((42, 3))

        # Flags to check if hands are detected
        left_hand_detected = False
        right_hand_detected = False

        if results.multi_hand_landmarks:
            for hand_landmark, handedness in zip(results.multi_hand_landmarks, results.multi_handedness):
                # Determine if the hand is left or right
                if handedness.classification[0].label == 'Left':
                    left_hand_detected = True
                    for i, landmark in enumerate(hand_landmark.landmark):
                        hand_landmarks[i, :] = [landmark.x, landmark.y, landmark.z]
                    prev_left_hand = hand_landmarks[:21, :]  # Update previous left hand
                elif handedness.classification[0].label == 'Right':
                    right_hand_detected = True
                    for i, landmark in enumerate(hand_landmark.landmark):
                        hand_landmarks[i + 21, :] = [landmark.x, landmark.y, landmark.z]
                    prev_right_hand = hand_landmarks[21:, :]  # Update previous right hand

        # Use previous hand data if no hands are detected
        if not left_hand_detected:
            hand_landmarks[:21, :] = prev_left_hand
        if not right_hand_detected:
            hand_landmarks[21:, :] = prev_right_hand

        return hand_landmarks

    except Exception as e:
        print(f"Error in convert_mediapipe: {e}")
        return np.zeros((42, 3))

def getEmbedding(landmarks):
    input = torch.tensor(np.array(landmarks), dtype=torch.float32, device=device).unsqueeze(0)
    output = model(input).squeeze(0).detach().cpu().numpy()
    return output



def recieve(frame, mode="translate"):
    global hand_landmarks, model
    
    current_landmarks = convert_mediapipe(decode_image(frame))
    hand_landmarks.append(current_landmarks)

    if mode=='translate':
        if len(hand_landmarks) == 30 and len(database) > 0:
            output = getEmbedding(hand_landmarks)
            sequence, costs = classify(output, 0.35, database)
            sentence = toSentence(sequence)
            hand_landmarks = []
            return ' '.join(sentence)

def reset_data():
    global prev_left_hand, prev_right_hand, hand_landmarks
    prev_left_hand = np.zeros((21, 3))
    prev_right_hand = np.zeros((21, 3))
    hand_landmarks = []
    print("Reseted")


def record(data, name):
    # Decode the base64 video data
    video_data = base64.b64decode(data.split(',')[1])
    video_path = f'server/tmp/{name}.webm'

    # Save the video data to a temporary file
    with open(video_path, 'wb') as video_file:
        video_file.write(video_data)

    # Open the video file using OpenCV
    cap = cv2.VideoCapture(video_path)

    # Initialize an empty list to store all landmarks
    all_landmarks = []

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        # Convert the frame to RGB
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # Process the frame to find hands
        results = hands.process(frame_rgb)

        # Initialize an array to store hand landmarks for this frame
        frame_landmarks = np.zeros((42, 3))

        # Flags to check if hands are detected
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

        # Use previous hand data if no hands are detected
        if not left_hand_detected and prev_left_hand:
            frame_landmarks[:21, :] = prev_left_hand
        if not right_hand_detected and prev_right_hand:
            frame_landmarks[21:, :] = prev_right_hand

        # Append the frame landmarks to the list
        all_landmarks.append(frame_landmarks)

    # Release the video capture object
    cap.release()

    # Compute the embedding from the collected landmarks
    if all_landmarks:
        embeddings = getEmbedding(all_landmarks)
        np.save(f'server/database/{name}.npy', embeddings)
        print(f"Embeddings saved for {name}")

    else:
        print("No landmarks detected.")


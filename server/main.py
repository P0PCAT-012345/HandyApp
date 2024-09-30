# server/main.py

import numpy as np
import torch
from model import get_model
from classify import classify, toSentence
import glob
import os
import cv2
import mediapipe as mp
import base64
import time
import datetime
import warnings


# Suppress deprecation warnings from protobuf
warnings.filterwarnings("ignore", category=UserWarning, module='google.protobuf')

class Session:
    def __init__(self, id):
        self.id = id
        self.prev_left_hand = np.zeros((21, 3))
        self.prev_right_hand = np.zeros((21, 3))
        self.hand_landmarks = []
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = get_model(device=self.device)
        self.curr_sentence = []
        mp_hands = mp.solutions.hands
        self.hands = mp_hands.Hands(static_image_mode=False, max_num_hands=2, min_detection_confidence=0.5)
        mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = mp_face_mesh.FaceMesh(static_image_mode=False, min_detection_confidence=0.5)
        self.lastWord = None
        self.refreshCount = 0

        self.database = []
        for databaseFolder in ['sampleSet', id]:
            if not os.path.isdir(f"server/database/{databaseFolder}"):
                continue
            for folder_name in os.listdir(f"server/database/{databaseFolder}"):
                folder_path = os.path.join(f"server/database/{databaseFolder}", folder_name)

                if os.path.isdir(folder_path):
                    for file_name in os.listdir(folder_path):
                        if file_name.endswith('.npy'):
                            video_name = file_name[:-3] + 'webm'
                            file_path_npy = os.path.join(folder_path, file_name)
                            file_path_video = os.path.join(folder_path, video_name)
                            data = np.load(file_path_npy)
                            if len(data.shape) == 2 and data.shape[1] == 256:
                                self.database.append((folder_name, data, file_path_npy, file_path_video))

        print("Initialized with database of length:", len(self.database))

        self.functions = {
            'recieve': self.recieve,
            'stop_recording': self.stop_recording,
            'reset_data': self.reset_data,
            'record': self.record,
            'list_saved': self.list_saved,
            'delete_saved': self.delete_saved,
            'mouth_open': self.mouth_open,
        }


    def decode_image(self, base64_data):
        try:
            if base64_data.startswith('data:image/jpeg;base64,'):
                base64_data = base64_data.split(',')[1]

            image_data = base64.b64decode(base64_data)
            nparr = np.frombuffer(image_data, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            return image
        except Exception as e:
            print(f"Error decoding image: {e}")
            return None

    def convert_mediapipe(self, image):
        try:
            if image is None:
                raise ValueError("Decoded image is None. Check if the base64 input is correct.")

            image_np = np.array(image)
            frame_rgb = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
            results = self.hands.process(frame_rgb)
            frame_landmarks = np.zeros((42, 3))
            left_hand_detected = False
            right_hand_detected = False

            if results.multi_hand_landmarks:
                for hand_landmark, handedness in zip(results.multi_hand_landmarks, results.multi_handedness):
                    if handedness.classification[0].label == 'Left':
                        left_hand_detected = True
                        for i, landmark in enumerate(hand_landmark.landmark):
                            frame_landmarks[i, :] = [landmark.x, landmark.y, landmark.z]
                        self.prev_left_hand = frame_landmarks[:21, :]
                    elif handedness.classification[0].label == 'Right':
                        right_hand_detected = True
                        for i, landmark in enumerate(hand_landmark.landmark):
                            frame_landmarks[i + 21, :] = [landmark.x, landmark.y, landmark.z]
                        self.prev_right_hand = frame_landmarks[21:, :]

            if not left_hand_detected:
                frame_landmarks[:21, :] = self.prev_left_hand
            if not right_hand_detected:
                frame_landmarks[21:, :] = self.prev_right_hand

            return frame_landmarks

        except Exception as e:
            print(f"Error in convert_mediapipe: {e}")
            return np.zeros((42, 3))

    def getEmbedding(self, landmarks):
        try:
            input_tensor = torch.tensor(np.array(landmarks), dtype=torch.float32, device=self.device).unsqueeze(0)
            output = self.model(input_tensor).squeeze(0).detach().cpu().numpy()
            return output
        except Exception as e:
            print(f"Error getting embedding: {e}")
            return np.zeros(256)  # Assuming embedding size is 256

    def recieve(self, frame, mode="translate"):
        current_landmarks = self.convert_mediapipe(self.decode_image(frame))
        self.hand_landmarks.append(current_landmarks)
        if mode == 'translate':
            if len(self.hand_landmarks) == 30 and len(self.database) > 0:
                output = self.getEmbedding(self.hand_landmarks)
                sequence, costs = classify(output, 0.35, self.database)
                self.hand_landmarks = []
                if len(sequence) == 0:
                    self.lastWord = None
                    self.refreshCount += 1
                    if self.refreshCount == 4:
                        self.curr_sentence.clear()
                        self.refreshCount = 0

                    self.hand_landmarks = []
                    return 'No match found'

                if self.lastWord != sequence[0]:
                    self.curr_sentence.append(sequence[0])
                    self.lastWord = sequence[-1]
                    self.refreshCount = 0

                for word in sequence[1:]:
                    self.curr_sentence.append(word)

                if len(self.curr_sentence) > 15:
                    self.curr_sentence.pop(0)
                return ' '.join(self.curr_sentence)

        if mode == 'record':
            if self.mouth_open(frame):
                return True

        return False

    def reset_data(self):
        self.curr_sentence.clear()
        self.prev_left_hand = np.zeros((21, 3))
        self.prev_right_hand = np.zeros((21, 3))
        self.hand_landmarks = []
        self.lastWord = None
        self.refreshCount = 0
        print("Reseted")

    def record(self, frame):
        return 'MOUTH_OPEN_TRUE' if self.recieve(frame, mode='record') else None

    def stop_recording(self, name, video_data=None):
        embeddings = self.getEmbedding(self.hand_landmarks)
        folder_path = f'server/database/{self.id}/{name}'

        os.makedirs(folder_path, exist_ok=True)

        timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        filename_npy = f'{timestamp}.npy'
        filename_video = f'{timestamp}.webm'  # You can choose a different format if preferred
        file_path_npy = os.path.join(folder_path, filename_npy)
        file_path_video = os.path.join(folder_path, filename_video)

        # Save the .npy file
        try:
            np.save(file_path_npy, embeddings)
            print(f"Embeddings saved for {name} at {file_path_npy}")
        except Exception as e:
            print(f"Failed to save embeddings: {e}")

        # Save the video file if video_data is provided
        if video_data:
            try:
                video_bytes = base64.b64decode(video_data)
                with open(file_path_video, 'wb') as f:
                    f.write(video_bytes)
                print(f"Video saved for {name} at {file_path_video}")
            except Exception as e:
                print(f"Failed to save video: {e}")

        # Clear landmarks after saving
        self.hand_landmarks = []

        # Optionally, add the new embedding to the database
        self.database.append((name, embeddings, file_path_npy, file_path_video))

    async def list_saved(self):
        if len(self.database) != 0:
            saved = []
            for class_name, _, _, video_path in self.database:
                if os.path.exists(video_path):
                    if video_path.endswith('.webm'):
                        timestamp = os.path.basename(video_path)[:-5]
                        if os.path.exists(video_path):
                            saved.append({
                                "name": class_name,
                                "timestamp": timestamp,
                                "video_path": video_path
                            })
            print("starting chunks")
            for item in saved:
                video_path = item["video_path"]
                with open(video_path, 'rb') as file:
                    video_data = file.read()
                    base64_data = base64.b64encode(video_data).decode('utf-8')
                    chunk_size = 1024 * 1024 # 1 MB
                    chunks = [base64_data[i:i+chunk_size] for i in range(0, len(base64_data), chunk_size)]
                    for chunk in chunks:
                        print("sending chunks...")
                        yield {
                            "name": item["name"],
                            "timestamp": item["timestamp"],
                            "chunk": chunk
                        }
                    yield {
                        "name": item["name"],
                        "timestamp": item["timestamp"],
                        "chunk": None
                    }
        print("Item sent")
        yield {
            "finished": True
        }
        print("chunks sent successfully.")

    def delete_saved(self, name, timestamp):
        directory_path = f'server/database/{self.id}/{name}'
        filename_npy = f'{timestamp}.npy'
        filename_video = f'{timestamp}.webm'
        file_path_npy = os.path.join(directory_path, filename_npy)
        file_path_video = os.path.join(directory_path, filename_video)

        try:
            if os.path.exists(file_path_npy):
                os.remove(file_path_npy)
                print(f"Deleted {file_path_npy}")
            if os.path.exists(file_path_video):
                os.remove(file_path_video)
                print(f"Deleted {file_path_video}")

            # Remove the corresponding data from self.database
            self.database = [(class_name, embeddings, npy_path, video_path) for class_name, embeddings, npy_path, video_path in self.database
                            if not os.path.samefile(video_path, file_path_video)]

            return "Deleted successfully"
        except Exception as e:
            return f"Error deleting files: {e}"

    def mouth_open(self, frame):
        image = self.decode_image(frame)
        if image is None:
            raise ValueError("Decoded image is None. Check if the base64 input is correct.")
        
        image_np = np.array(image)
        image_rgb = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
        results = self.face_mesh.process(image_rgb)

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
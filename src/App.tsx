import React, { useRef, useState, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import Webcam from 'react-webcam';
import './App.css';

function App() {
  const [image, setImage] = useState<File | null>(null);
  const [detections, setDetections] = useState<any[]>([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const webcamRef = useRef<any>(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.ageGenderNet.loadFromUri('/models');
        console.log('Models loaded successfully');
      } catch (error) {
        console.error('Error loading models:', error);
      }
    };

    loadModels();
  }, []);

  const handleDetectFaces = async () => {
    const video = webcamRef.current?.video;
    if (!video) {
      setErrorMessage('No video Feed available');
      setIsModalOpen(true);
      return;
    }
    try {
      setDetections([]);
      const detections = await faceapi
        .detectAllFaces(video)
        .withFaceLandmarks()
        .withAgeAndGender();
      if (detections.length === 0) {
        setErrorMessage('No faces detected.');
        setIsModalOpen(true);
      } else {
        setDetections(detections);
      }
    } catch (error) {
      setErrorMessage('Face detection failed.');
      setIsModalOpen(true);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImage(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (image) {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(image);
      img.onload = async () => {
        try {
          setDetections([]);
          const detections = await faceapi
            .detectAllFaces(img)
            .withFaceLandmarks()
            .withAgeAndGender();
          if (detections.length === 0) {
            setErrorMessage('No faces detected in the uploaded image.');
            setIsModalOpen(true);
          } else {
            setDetections(detections);
          }
        } catch (error) {
          setErrorMessage('Face detection failed.');
          setIsModalOpen(true);
        }
      };
    }
  };

  const toggleCamera = () => {
    setIsCameraActive((prev) => !prev);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setErrorMessage('');
  };

  return (
    <div>
      <h1
        style={{
          textAlign: 'center',
        }}
      >
        Webcam Facial Recognition
      </h1>

      {/* Buttons */}
      <div className="buttons">
        <button className="btn" onClick={handleDetectFaces}>
          Detect Faces From Feed
        </button>
        <button className="btn" onClick={toggleCamera}>
          {isCameraActive ? 'Stop Webcam' : 'Start Webcam'}
        </button>
        <div style={{ display: 'flex' }}>
          <button className="btn" onClick={handleUpload}>
            Upload Image and Detect Faces
          </button>
          <input
            style={{ padding: '20px 0', marginLeft: '20px' }}
            type="file"
            onChange={handleImageChange}
          />
        </div>
      </div>

      <div className="webcam-result-cont">
        {/* Webcam Feed */}
        <div className="webcam-container">
          {isCameraActive && (
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: 'user' }}
            />
          )}
        </div>

        {/* Display Face Detection Results */}
        <div className="detections">
          {detections.length > 0 && (
            <div className="detection-info">
              {detections.map((detection, index) => (
                <div key={index} className="detection">
                  <p>
                    <strong>Gender:</strong> {detection.gender}
                  </p>
                  <p>
                    <strong>Age:</strong> {Math.round(detection.age)}
                  </p>
                  <p>
                    <strong>Face Position:</strong>{' '}
                    {`(x) ${detection.detection.box.x}, (y) ${detection.detection.box.y}`}
                  </p>
                  <p>
                    <strong>Face Size:</strong>{' '}
                    {`(width) ${Math.round(
                      detection.detection.box.width
                    )}, (height) ${Math.round(
                      detection.detection.box.height
                    )}`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>Error</h2>
            <p>{errorMessage}</p>
            <button onClick={closeModal}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

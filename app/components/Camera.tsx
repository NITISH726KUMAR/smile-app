'use client';

import React, { useRef, useCallback, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { CameraIcon } from '@heroicons/react/24/solid';
import SmileDetector from './SmileDetector';

interface CameraProps {
  onCapture: (image: string, smileScore: number) => void;
}

const Camera: React.FC<CameraProps> = ({ onCapture }) => {
  const webcamRef = useRef<Webcam>(null);
  const [smileScore, setSmileScore] = useState(0);
  const [showScoreMessage, setShowScoreMessage] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSmileScoreChange = (score: number) => {
    setSmileScore(score);
  };

  const capture = useCallback(() => {
    if (smileScore < 50) {
      setShowScoreMessage(true);
      setTimeout(() => setShowScoreMessage(false), 2000);
      return;
    }

    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      onCapture(imageSrc, smileScore);
    }
  }, [onCapture, smileScore]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const setupVideo = async () => {
      try {
        if (webcamRef.current && webcamRef.current.video) {
          webcamRef.current.video.onloadedmetadata = () => {
            setIsVideoReady(true);
          };
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
        setError("Could not access camera. Please make sure you have granted camera permissions.");
      }
    };

    if (!isVideoReady && !error) {
      setupVideo();
    }
  }, [isVideoReady, error]);

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Smile to Make Money Text */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4 z-10">
        <h2 className="text-center text-white text-2xl font-bold mb-1">Smile to Make Money</h2>
        <p className="text-center text-white/90 text-sm">Share your best smile and earn rewards!</p>
      </div>

      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        className="w-full rounded-lg"
        videoConstraints={{
          width: 720,
          height: 720,
          facingMode: "user",
          frameRate: { ideal: 30 }
        }}
      />
      
      {/* Smile Score Display */}
      <div className="absolute top-24 left-1/2 transform -translate-x-1/2 bg-white/90 px-4 py-2 rounded-full shadow-lg">
        <div className="flex items-center space-x-2">
          <span className="text-lg font-semibold">Smile Rating:</span>
          <span className={`text-lg ${
            smileScore >= 80 ? 'text-green-500' : 
            smileScore >= 50 ? 'text-blue-500' : 
            'text-yellow-500'
          }`}>
            {smileScore >= 80 ? '😄 5/5' :
             smileScore >= 70 ? '😊 4/5' :
             smileScore >= 60 ? '🙂 3/5' :
             smileScore >= 50 ? '😐 2/5' :
             '😕 1/5'}
          </span>
        </div>
      </div>

      {/* Message for low smile score */}
      {showScoreMessage && (
        <div className="absolute top-40 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg animate-bounce">
          Show us a bigger smile! Need at least 2/5 to capture
        </div>
      )}

      <button
        onClick={capture}
        className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 rounded-full p-4 shadow-lg ${
          smileScore >= 50 ? 'bg-green-500 hover:bg-green-600' : 'bg-white hover:bg-gray-100'
        }`}
      >
        <CameraIcon className={`h-8 w-8 ${smileScore >= 50 ? 'text-white' : 'text-blue-500'}`} />
      </button>

      {isVideoReady && webcamRef.current?.video && (
        <SmileDetector
          videoRef={{ current: webcamRef.current.video }}
          onSmileScoreChange={handleSmileScoreChange}
        />
      )}
    </div>
  );
};

export default Camera; 
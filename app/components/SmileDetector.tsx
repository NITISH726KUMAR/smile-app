'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';

interface SmileDetectorProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  onSmileScoreChange: (score: number) => void;
}

const SmileDetector: React.FC<SmileDetectorProps> = ({ videoRef, onSmileScoreChange }) => {
  const [isModelLoading, setIsModelLoading] = useState(true);
  const requestRef = useRef<number | undefined>(undefined);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initTensorFlow = async () => {
      try {
        setIsModelLoading(true);
        await tf.ready();
        
        // Try to initialize WebGL backend
        try {
          await tf.setBackend('webgl');
          console.log('Using WebGL backend');
        } catch (e) {
          console.warn('WebGL backend failed, falling back to CPU:', e);
          await tf.setBackend('cpu');
          console.log('Using CPU backend');
        }

        setIsModelLoading(false);
      } catch (error) {
        console.error('Error initializing TensorFlow.js:', error);
        setIsModelLoading(false);
      }
    };

    // Initialize canvas with smaller dimensions for better performance
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
      canvasRef.current.width = 360;  // Half of 720
      canvasRef.current.height = 360; // Half of 720
      contextRef.current = canvasRef.current.getContext('2d', {
        willReadFrequently: true,
        alpha: false  // Disable alpha for better performance
      });
    }

    initTensorFlow();

    return () => {
      tf.disposeVariables();
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  const calculateSmileScore = (imageData: ImageData): number => {
    return tf.tidy(() => {
      try {
        // Convert to tensor
        const tensor = tf.browser.fromPixels(imageData, 1);  // Convert to grayscale directly
        
        // Get the lower part of the face (mouth region)
        const height = tensor.shape[0];
        const mouthRegionStart = Math.floor(height * 0.6);
        const mouthRegionHeight = Math.floor(height * 0.25);
        
        const mouthRegion = tensor.slice([mouthRegionStart, 0], [mouthRegionHeight, -1]);

        // Calculate metrics
        const mean = mouthRegion.mean().dataSync()[0];
        const variance = tf.moments(mouthRegion).variance.dataSync()[0];
        
        // Combine metrics for smile score with adjusted weights
        const normalizedMean = mean / 255;  // Normalize to 0-1 range
        const normalizedVariance = Math.min(variance / 1000, 1);  // Normalize variance
        
        const smileScore = (
          normalizedMean * 0.4 +  // Brightness component
          normalizedVariance * 0.6  // Contrast/variation component
        ) * 100;
        
        return Math.min(Math.max(Math.round(smileScore), 0), 100);
      } catch (e) {
        console.error('Error in smile detection:', e);
        return 0;
      }
    });
  };

  const detectSmile = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !contextRef.current || isModelLoading) {
      requestRef.current = requestAnimationFrame(detectSmile);
      return;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = contextRef.current;

      // Only process if video is actually playing
      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        requestRef.current = requestAnimationFrame(detectSmile);
        return;
      }

      // Draw video frame to canvas with smoothing
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'medium';  // Balance between quality and performance
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data with error handling
      let imageData;
      try {
        imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const score = calculateSmileScore(imageData);
        onSmileScoreChange(score);
      } catch (e) {
        console.error('Error getting image data:', e);
      }
    } catch (error) {
      console.error('Error in detect smile:', error);
    }

    requestRef.current = requestAnimationFrame(detectSmile);
  }, [videoRef, canvasRef, contextRef, isModelLoading, onSmileScoreChange]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!isModelLoading) {
      detectSmile();
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isModelLoading, detectSmile]);

  return null;
};

export default SmileDetector; 
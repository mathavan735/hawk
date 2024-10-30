import React, { useRef, useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocossd from '@tensorflow-models/coco-ssd';
import WebcamView from './WebcamView';
import DetectionPanel from './DetectionPanel';
import { drawDetections } from '../utils/drawing';
import useAlarmSound from '../hooks/useAlarmSound';
import useNotifications from '../hooks/useNotifications';

const DETECTION_THRESHOLD = 0.85; // High confidence threshold
const ID_CARD_SIZE = { width: 85.6, height: 53.98 }; // Standard ID card size in mm

function CollegeMode() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [currentDetections, setCurrentDetections] = useState([]);
  const { playAlarm } = useAlarmSound();
  const { notifyDetection, notifyError } = useNotifications();

  useEffect(() => {
    const loadModel = async () => {
      try {
        await tf.ready(); // Ensure TF is ready
        const loadedModel = await cocossd.load({
          modelUrl: 'https://storage.googleapis.com/tfjs-models/savedmodel/ssd_mobilenet_v2/model.json'
        });
        setModel(loadedModel);
        setLoading(false);
      } catch (error) {
        console.error("Error loading model:", error);
        notifyError("Failed to load detection model");
      }
    };
    loadModel();
  }, []);

  const detectIDCard = async (predictions, imageSize) => {
    // Look for rectangular objects that match ID card dimensions
    const possibleCards = predictions.filter(pred => {
      const [x, y, width, height] = pred.bbox;
      const aspectRatio = width / height;
      const expectedAspectRatio = ID_CARD_SIZE.width / ID_CARD_SIZE.height;
      return Math.abs(aspectRatio - expectedAspectRatio) < 0.2; // Allow 20% tolerance
    });

    return possibleCards.length > 0;
  };

  const detect = async () => {
    if (!model || !webcamRef.current?.video) return;

    const video = webcamRef.current.video;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    try {
      const predictions = await model.detect(video);
      
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      drawDetections(predictions, ctx);

      // Check for persons and ID cards
      const persons = predictions.filter(pred => 
        pred.class === 'person' && pred.score > DETECTION_THRESHOLD
      );

      if (persons.length > 0) {
        const hasIDCard = await detectIDCard(predictions, { width: canvas.width, height: canvas.height });
        
        if (!hasIDCard) {
          playAlarm();
          notifyDetection("Person without ID Card", 100);
        }
      }

      const detections = predictions
        .filter(pred => pred.score > DETECTION_THRESHOLD)
        .map(pred => ({
          label: pred.class,
          confidence: Math.round(pred.score * 100)
        }));
      
      setCurrentDetections(detections);

      const newAlerts = detections.map(detection => 
        `${detection.label} detected with ${detection.confidence}% confidence`
      );
      setRecentAlerts(prev => [...newAlerts, ...prev].slice(0, 5));

      requestAnimationFrame(detect);
    } catch (error) {
      console.error("Detection error:", error);
      notifyError("Error during detection");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">College Entry Monitoring</h1>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-xl">Loading high-precision detection model...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <WebcamView 
                webcamRef={webcamRef}
                canvasRef={canvasRef}
                onLoadedData={detect}
              />
              <div className="bg-gray-800 p-4 rounded-lg">
                <h2 className="text-xl font-bold mb-2">Detection Settings</h2>
                <p className="text-sm text-gray-400">
                  Monitoring for persons without valid ID cards
                </p>
              </div>
            </div>
            <DetectionPanel 
              recentAlerts={recentAlerts}
              currentDetections={currentDetections}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default CollegeMode;
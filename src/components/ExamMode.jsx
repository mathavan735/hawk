import React, { useRef, useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocossd from '@tensorflow-models/coco-ssd';
import WebcamView from './WebcamView';
import DetectionPanel from './DetectionPanel';
import { drawDetections } from '../utils/drawing';
import useAlarmSound from '../hooks/useAlarmSound';
import useNotifications from '../hooks/useNotifications';

const DETECTION_THRESHOLD = 0.9; // Very high confidence threshold
const SUSPICIOUS_ITEMS = ['cell phone', 'book', 'laptop'];
const HEAD_MOVEMENT_THRESHOLD = 30; // degrees

function ExamMode() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [currentDetections, setCurrentDetections] = useState([]);
  const [headPosition, setHeadPosition] = useState({ x: 0, y: 0 });
  const { playAlarm } = useAlarmSound();
  const { notifyDetection, notifyError } = useNotifications();

  useEffect(() => {
    const loadModel = async () => {
      try {
        await tf.ready();
        const loadedModel = await cocossd.load({
          modelUrl:
            'https://storage.googleapis.com/tfjs-models/savedmodel/ssd_mobilenet_v2/model.json',
        });
        setModel(loadedModel);
        setLoading(false);
      } catch (error) {
        console.error('Error loading model:', error);
        notifyError('Failed to load detection model');
      }
    };
    loadModel();
  }, [notifyError]);

  const detectCheating = async (predictions) => {
    const violations = [];

    // Check for suspicious items
    const suspiciousItems = predictions.filter(
      (pred) =>
        SUSPICIOUS_ITEMS.includes(pred.class.toLowerCase()) &&
        pred.score > DETECTION_THRESHOLD
    );

    if (suspiciousItems.length > 0) {
      violations.push(
        ...suspiciousItems.map((item) => `Detected ${item.class}`)
      );
    }

    // Check for multiple persons
    const persons = predictions.filter(
      (pred) => pred.class === 'person' && pred.score > DETECTION_THRESHOLD
    );

    if (persons.length > 1) {
      violations.push('Multiple persons detected');
    }

    // Head movement detection
    if (persons.length === 1) {
      const [x, y, width, height] = persons[0].bbox;
      const currentHeadPos = { x: x + width / 2, y: y + height / 4 };

      const movement = Math.sqrt(
        Math.pow(currentHeadPos.x - headPosition.x, 2) +
          Math.pow(currentHeadPos.y - headPosition.y, 2)
      );

      if (movement > HEAD_MOVEMENT_THRESHOLD) {
        violations.push('Suspicious head movement detected');
      }

      setHeadPosition(currentHeadPos);
    }

    return violations;
  };

  const detect = async () => {
    if (!model || !webcamRef.current?.video) return;

    const video = webcamRef.current.video;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas dimensions to match the video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    try {
      const predictions = await model.detect(video);

      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      drawDetections(predictions, ctx);

      const violations = await detectCheating(predictions);

      if (violations.length > 0) {
        playAlarm();
        violations.forEach((violation) => {
          notifyDetection(violation, 100);
        });
      }

      const detections = predictions
        .filter((pred) => pred.score > DETECTION_THRESHOLD)
        .map((pred) => ({
          label: pred.class,
          confidence: Math.round(pred.score * 100),
        }));

      setCurrentDetections(detections);

      const newAlerts = violations.map((violation) => `⚠️ ${violation}`);

      if (newAlerts.length > 0) {
        setRecentAlerts((prev) => [...newAlerts, ...prev].slice(0, 5));
      }

      requestAnimationFrame(detect);
    } catch (error) {
      console.error('Detection error:', error);
      notifyError('Error during detection');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Exam Monitoring System
        </h1>

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
                <h2 className="text-xl font-bold mb-2">Monitoring Active</h2>
                <p className="text-sm text-gray-400">
                  Detecting: Mobile phones, Multiple persons, Suspicious
                  movements
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

export default ExamMode;

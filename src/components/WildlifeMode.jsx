import React, { useState } from 'react';
import CCTVMode from './CCTVMode';
import usePhotoCapture from '../hooks/usePhotoCapture';

const DANGEROUS_ANIMALS = ['bear', 'lion', 'tiger', 'wolf', 'leopard', 'snake'];

const WildlifeMode = () => {
  const { captureFrame, sendAlert } = usePhotoCapture();
  const [detectedAnimals, setDetectedAnimals] = useState([]);

  const handleDetection = async (confidence, videoRef) => {
    if (!videoRef.current) return;

    const photoData = captureFrame(videoRef.current);
    if (photoData) {
      await sendAlert(photoData, {
        type: 'wildlife_detected',
        confidence,
        timestamp: new Date().toISOString(),
        isDangerous: DANGEROUS_ANIMALS.includes(detectedAnimals)
      });
    }
  };

  return (
    <CCTVMode 
      targetObject={DANGEROUS_ANIMALS}
      mode="wildlife"
      onDetection={handleDetection}
      title="Wildlife Safety Mode"
      description="Monitoring for dangerous wildlife"
      onDetectionsUpdate={setDetectedAnimals}
    />
  );
};

export default WildlifeMode;
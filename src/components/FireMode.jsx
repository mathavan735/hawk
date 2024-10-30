import React from 'react';
import CCTVMode from './CCTVMode';
import { toast } from 'react-hot-toast';

const FireMode = () => {
  const handleDetection = (confidence) => {
    // Additional fire-specific alerts
    toast.error(
      'FIRE DETECTED! Please evacuate immediately and contact emergency services.',
      {
        duration: 10000,
        style: {
          background: '#DC2626',
          color: '#fff',
          border: '2px solid #991B1B',
        },
      }
    );
  };

  return (
    <CCTVMode 
      targetObject="fire"
      mode="fire"
      onDetection={handleDetection}
      title="Fire Safety Mode"
      description="Monitoring for fire hazards"
    />
  );
};

export default FireMode;
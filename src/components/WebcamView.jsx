import React from 'react';
import Webcam from 'react-webcam';

const WebcamView = ({ webcamRef, canvasRef, onLoadedData }) => {
  return (
    <div className="relative">
      <Webcam
        ref={webcamRef}
        muted={true}
        className="rounded-lg"
        onLoadedData={onLoadedData}
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 z-10"
        style={{
          width: '100%',
          height: '100%'
        }}
      />
    </div>
  );
};

export default WebcamView;
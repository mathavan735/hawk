import { useCallback } from 'react';
import toast from 'react-hot-toast';

const useNotifications = () => {
  const notifyDetection = useCallback((object, confidence) => {
    toast(
      (t) => (
        <div className="flex items-center space-x-3">
          <span className="text-red-500 text-xl">⚠️</span>
          <div>
            <h3 className="font-bold">{object} Detected!</h3>
            <p className="text-sm">Confidence: {confidence}%</p>
          </div>
        </div>
      ),
      {
        duration: 5000,
        style: {
          background: '#1F2937',
          color: '#fff',
          border: '1px solid #374151',
        },
      }
    );
  }, []);

  const notifyError = useCallback((message) => {
    toast.error(message, {
      style: {
        background: '#1F2937',
        color: '#fff',
        border: '1px solid #374151',
      },
    });
  }, []);

  return { notifyDetection, notifyError };
};

export default useNotifications;
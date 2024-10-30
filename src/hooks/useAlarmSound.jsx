import { useCallback } from 'react';

const useAlarmSound = () => {
  const playAlarm = useCallback(() => {
    const audio = new Audio('/alarm.mp3');
    audio.play().catch(error => {
      console.error('Error playing alarm:', error);
    });
  }, []);

  return { playAlarm };
};

export default useAlarmSound;
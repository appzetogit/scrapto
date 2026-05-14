import React, { useEffect } from 'react';
import toast from 'react-hot-toast';
import socketClient from '../utils/socketClient';
import { FaBroadcastTower } from 'react-icons/fa';

const BroadcastListener = () => {
  useEffect(() => {
    const handleBroadcast = (data) => {
      console.log('📢 Broadcast received via socket:', data);
      
      const { title, body } = data;
      
      // Play a subtle sound if you want
      // const audio = new Audio('/notification-sound.mp3');
      // audio.play().catch(e => console.log('Audio play failed', e));

      toast.custom((t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 border-l-4 border-indigo-600`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <FaBroadcastTower className="text-xl" />
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-black text-gray-900">
                  {title}
                </p>
                <p className="mt-1 text-sm text-gray-500 font-medium leading-relaxed">
                  {body}
                </p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-gray-200">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-2xl p-4 flex items-center justify-center text-sm font-bold text-indigo-600 hover:text-indigo-500 focus:outline-none"
            >
              Close
            </button>
          </div>
        </div>
      ), {
        duration: 8000,
        position: 'top-right'
      });
    };

    // Only listen if socket is connected
    socketClient.onBroadcast(handleBroadcast);

    return () => {
      socketClient.offBroadcast();
    };
  }, []);

  return null; // This component doesn't render anything visible
};

export default BroadcastListener;

import React from 'react';

const Loading = () => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50">
      {/* Video Container */}
      <div className="w-64 h-64 md:w-80 md:h-80 overflow-hidden flex items-center justify-center">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-full object-contain"
        >
          <source src="/assets/helmet_loader.webm" type="video/webm" />
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Tagline Section */}
      <div className="mt-8 text-center px-4">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 uppercase">
          Let's make India ride fresh.
        </h2>
        <p className="text-sm md:text-base text-gray-500 mt-2 font-medium">
          Every helmet. Every time.
        </p>
      </div>

      {/* Subtle Progress Bar (Optional) */}
      <div className="mt-10 w-48 h-1 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-blue-600 animate-progress"></div>
      </div>
    </div>
  );
};

export default Loading;
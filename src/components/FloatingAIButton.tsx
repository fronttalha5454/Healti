import React from 'react';

export const FloatingAIButton: React.FC = () => {
  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}>
      <button style={{ backgroundColor: '#4F46E5', color: 'white', padding: '12px 20px', borderRadius: '50px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        AI Asistan
      </button>
    </div>
  );
};

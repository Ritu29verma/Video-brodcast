import React from 'react';
import Video from './Video';

const App = () => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
      <h1>Live Video Streaming</h1>
      <Video />
    </div>
  );
};

export default App;

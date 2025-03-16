import React, { useEffect } from 'react';

const Contact: React.FC = () => {
  useEffect(() => {
    document.title = "Contact Us | G-Rux Fitness";
  }, []);

  return (
    <div>
      {/* Rest of the component content */}
    </div>
  );
};

export default Contact; 
import React from 'react';

const JiraIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M21.92,0H16.08L0,16.08V21.92L4.08,24,24,4.08ZM12,17.92,6.08,23.83,2.17,19.92l5.91-5.91h3.91Z" />
    <path d="M12,5.91,17.92,0,21.83,3.91,15.92,9.83H12Z" />
  </svg>
);

export default JiraIcon;

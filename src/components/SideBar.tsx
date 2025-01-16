import React from 'react';

interface SidebarProps {
  hobbies: string[];
  onDragStart: (event: React.DragEvent, hobby: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ hobbies, onDragStart }) => {
  return (
    <div
      style={{
        width: '250px',
        height: '100vh',
        padding: '10px',
        borderRight: '1px solid #ddd',
      }}
    >
      <h3>Hobbies</h3>
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {hobbies.map((hobby, index) => (
          <li
            key={index}
            draggable
            onDragStart={(e) => onDragStart(e, hobby)}
            style={{
              padding: '8px',
              cursor: 'pointer',
              borderBottom: '1px solid #ccc',
            }}
          >
            {hobby}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;

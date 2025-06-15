// ModalPortal.jsx - Create a portal component for modals
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

// This portal component ensures the modal renders at the root level of the DOM
// which avoids any positioning or z-index conflicts
const ModalPortal = ({ children, onClose }) => {
  // Create a div for the portal if it doesn't exist
  useEffect(() => {
    // Create the modal root element if it doesn't exist
    let modalRoot = document.getElementById('modal-root');
    if (!modalRoot) {
      modalRoot = document.createElement('div');
      modalRoot.id = 'modal-root';
      document.body.appendChild(modalRoot);
    }

    // Handle ESC key for closing the modal
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        onClose();
      }
    };

    // Add keydown event listener
    document.addEventListener('keydown', handleEsc);

    // Cleanup function
    return () => {
      document.removeEventListener('keydown', handleEsc);
      
      // If the modal root is empty, remove it
      if (modalRoot && modalRoot.childNodes.length === 0) {
        document.body.removeChild(modalRoot);
      }
    };
  }, [onClose]);

  // Create the modal container
  return ReactDOM.createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
    >
      {/* Overlay background */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-70"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)'
        }}
        onClick={onClose}
      />
      
      {/* Modal content - prevent clicks from bubbling to overlay */}
      <div 
        className="relative z-50"
        style={{
          position: 'relative',
          zIndex: 50,
          margin: '0 auto'
        }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.getElementById('modal-root')
  );
};

export default ModalPortal;
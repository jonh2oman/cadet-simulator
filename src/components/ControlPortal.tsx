import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

interface ControlPortalProps {
  children: React.ReactNode;
  onClose: () => void;
}

export default function ControlPortal({ children, onClose }: ControlPortalProps) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  const onCloseRef = React.useRef(onClose);

  // Keep the ref updated with the latest callback
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    // Open window
    const win = window.open(
      '',
      'ShipControls',
      'width=940,height=440,resizable=yes,scrollbars=no,status=no,location=no'
    );
    if (!win) {
      alert('Pop-up blocked! Please allow pop-ups to use the popped-out control deck.');
      onCloseRef.current();
      return;
    }

    win.document.title = 'Vessel Control Console';
    
    // Apply background and body styling
    win.document.body.className = 'bg-slate-950 text-slate-100 min-h-screen overflow-hidden flex items-center justify-center p-4 m-0';

    // Copy styles from parent document to child window head
    const styles = document.querySelectorAll('link[rel="stylesheet"], style');
    styles.forEach(styleNode => {
      win.document.head.appendChild(styleNode.cloneNode(true));
    });

    // Create portal target container
    const portalRoot = win.document.createElement('div');
    portalRoot.id = 'controls-portal-root';
    portalRoot.className = 'w-full flex items-center justify-center';
    win.document.body.appendChild(portalRoot);

    setContainer(portalRoot);

    // Handle child window closed by user
    const handleUnload = () => {
      onCloseRef.current();
    };
    win.addEventListener('beforeunload', handleUnload);

    return () => {
      win.removeEventListener('beforeunload', handleUnload);
      win.close();
    };
  }, []);

  if (!container) return null;

  return ReactDOM.createPortal(children, container);
}

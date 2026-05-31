import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

interface ControlPortalProps {
  children: React.ReactNode;
  onClose: () => void;
  windowName?: string;
  windowTitle?: string;
  width?: number;
  height?: number;
  scrollbars?: 'yes' | 'no';
}

export default function ControlPortal({ 
  children, 
  onClose,
  windowName = 'ShipControls',
  windowTitle = 'Vessel Control Console',
  width = 940,
  height = 440,
  scrollbars = 'no'
}: ControlPortalProps) {
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
      windowName,
      `width=${width},height=${height},resizable=yes,scrollbars=${scrollbars},status=no,location=no`
    );
    if (!win) {
      alert('Pop-up blocked! Please allow pop-ups to use the popped-out console decks.');
      onCloseRef.current();
      return;
    }

    win.document.title = windowTitle;
    
    // Apply background and body styling
    win.document.body.className = 'bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-4 m-0';

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

    // Forward keydown events to the parent window
    const handleForwardKeyDown = (e: KeyboardEvent) => {
      const forwardEvent = new KeyboardEvent('keydown', {
        key: e.key,
        code: e.code,
        keyCode: e.keyCode,
        which: e.which,
        bubbles: true,
        cancelable: true,
        shiftKey: e.shiftKey,
        ctrlKey: e.ctrlKey,
        altKey: e.altKey,
        metaKey: e.metaKey,
        repeat: e.repeat
      });
      window.dispatchEvent(forwardEvent);
    };
    win.addEventListener('keydown', handleForwardKeyDown);

    // Handle child window closed by user
    const handleUnload = () => {
      onCloseRef.current();
    };
    win.addEventListener('beforeunload', handleUnload);

    return () => {
      win.removeEventListener('keydown', handleForwardKeyDown);
      win.removeEventListener('beforeunload', handleUnload);
      win.close();
    };
  }, []);

  if (!container) return null;

  return ReactDOM.createPortal(children, container);
}

import { useState, useRef, useCallback, useEffect } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { DRAWER_WIDTH } from './Sidebar';
import useMediaQuery from '../hooks/useMediaQuery';

export default function Layout({ children, onCreateProject, onCreateIssue }) {
  const [sidebarOpen, setSidebarOpen] = useState(() => (
    typeof window === 'undefined' ? true : !window.matchMedia('(max-width: 700px)').matches
  ));
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const [hoverDisabled, setHoverDisabled] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(DRAWER_WIDTH);
  const isResizing = useRef(false);
  const isMobile = useMediaQuery('(max-width: 700px)');

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
      setFlyoutOpen(false);
    }
  }, [isMobile]);

  const startResize = useCallback((e) => {
    isResizing.current = true;
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const onMove = (e) => {
      if (!isResizing.current) return;
      const newWidth = Math.min(400, Math.max(180, startWidth + e.clientX - startX));
      setSidebarWidth(newWidth);
    };
    const onUp = () => {
      isResizing.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [sidebarWidth]);

  const handleToggle = () => {
    setSidebarOpen((p) => !p);
    setHoverDisabled(true);
    setFlyoutOpen(false);
    setTimeout(() => setHoverDisabled(false), 300);
  };

  const handleToggleHoverEnter = () => {
    if (!isMobile && !sidebarOpen && !hoverDisabled) {
      setFlyoutOpen(true);
    }
  };

  const handleToggleHoverLeave = () => {
    setFlyoutOpen(false);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', backgroundColor: 'hsl(var(--background))' }}>
      
      {/* Sidebar — fixed left, full height, above navbar */}
      {!isMobile && sidebarOpen && (
        <div style={{ width: sidebarWidth, flexShrink: 0, position: 'relative', zIndex: 100 }}>
          <Sidebar open={true} onToggle={handleToggle} width={sidebarWidth} />
          {/* Resize Handle */}
          <div
            onMouseDown={startResize}
            style={{
              position: 'absolute', top: 0, right: 0,
              width: 4, height: '100%', cursor: 'col-resize',
              zIndex: 101,
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'hsl(var(--primary) / 0.4)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          />
        </div>
      )}

      {/* Flyout sidebar overlay */}
      {!isMobile && !sidebarOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 200,
            height: '100%',
            width: DRAWER_WIDTH,
            transform: flyoutOpen ? 'translateX(0)' : `translateX(-${DRAWER_WIDTH}px)`,
            transition: 'transform 0.22s ease',
            boxShadow: flyoutOpen ? 'var(--shadow-lg)' : 'none',
          }}
          onMouseEnter={() => !hoverDisabled && setFlyoutOpen(true)}
          onMouseLeave={() => setFlyoutOpen(false)}
        >
          <Sidebar open={true} onToggle={handleToggle} />
        </div>
      )}

      {isMobile && (
        <>
          <div
            onClick={handleToggle}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 390,
              backgroundColor: 'rgba(15, 23, 42, 0.35)',
              opacity: sidebarOpen ? 1 : 0,
              pointerEvents: sidebarOpen ? 'auto' : 'none',
              transition: 'opacity 0.22s ease',
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              zIndex: 400,
              height: '100%',
              width: 'min(82vw, 280px)',
              transform: sidebarOpen ? 'translateX(0)' : 'translateX(-102%)',
              transition: 'transform 0.24s cubic-bezier(0.2, 0.8, 0.2, 1)',
              boxShadow: sidebarOpen ? 'var(--shadow-lg)' : 'none',
              willChange: 'transform',
            }}
          >
            <Sidebar open={true} onToggle={handleToggle} width={Math.min(DRAWER_WIDTH, 280)} />
          </div>
        </>
      )}

      {/* Main content area */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        <Navbar
          sidebarOpen={sidebarOpen}
          onToggle={handleToggle}
          onToggleHoverEnter={handleToggleHoverEnter}
          onToggleHoverLeave={handleToggleHoverLeave}
          onCreateProject={onCreateProject}
          onCreateIssue={onCreateIssue}
        />
        <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}>
          <div id="main-content" style={{ flex: 1, overflow: 'auto', padding: isMobile ? '14px 12px 18px' : '20px 24px 24px', display: 'flex', flexDirection: 'column', width: '100%', boxSizing: 'border-box' }} className="scrollbar-thin">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

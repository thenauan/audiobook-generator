// Extraído do App.tsx (conteúdo sem alterações)
import React, { useEffect, useRef } from 'react';

export function getBackdropProps(onClose: (e?: any) => void) {
  return {
    onPointerDown: (e: React.PointerEvent) => {
      e.stopPropagation();
      onClose(e);
    },
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      onClose(e);
    },
    onWheel: (e: React.WheelEvent) => {
      e.stopPropagation();
      onClose(e);
    },
    onTouchMove: (e: React.TouchEvent) => {
      e.stopPropagation();
      onClose(e);
    },
  };
}

export function useCloseOnOutsideScrollOrDrag(isOpen: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrDrag = (e: Event) => {
      const target = e.target as Element | null;
      if (target && typeof target.closest === 'function' && target.closest('[data-popup-content="true"]')) {
        return;
      }
      onCloseRef.current();
    };

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (target && typeof target.closest === 'function') {
        if (target.closest('[data-popup-content="true"]') || target.closest('[data-search-bar="true"]')) {
          return;
        }
      }
      onCloseRef.current();
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (e.buttons > 0) {
        const target = e.target as Element | null;
        if (target && typeof target.closest === 'function' && target.closest('[data-popup-content="true"]')) {
          return;
        }
        onCloseRef.current();
      }
    };

    const opts = { capture: true, passive: true };
    window.addEventListener('pointerdown', handlePointerDown, opts);
    window.addEventListener('wheel', handleScrollOrDrag, opts);
    window.addEventListener('touchmove', handleScrollOrDrag, opts);
    window.addEventListener('scroll', handleScrollOrDrag, opts);
    window.addEventListener('pointermove', handlePointerMove, opts);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown, { capture: true });
      window.removeEventListener('wheel', handleScrollOrDrag, { capture: true });
      window.removeEventListener('touchmove', handleScrollOrDrag, { capture: true });
      window.removeEventListener('scroll', handleScrollOrDrag, { capture: true });
      window.removeEventListener('pointermove', handlePointerMove, { capture: true });
    };
  }, [isOpen]);
}

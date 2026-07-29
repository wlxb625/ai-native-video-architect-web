import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Pin, PinOff } from 'lucide-react';
import { type PointerEvent as ReactPointerEvent, type ReactNode, useEffect, useRef, useState } from 'react';

interface HoverEdgePanelProps {
  side: 'left' | 'right';
  storageKey: string;
  label: string;
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
  children: ReactNode;
}

export function HoverEdgePanel({
  side,
  storageKey,
  label,
  defaultWidth,
  minWidth,
  maxWidth,
  children,
}: HoverEdgePanelProps) {
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(() => localStorage.getItem(`${storageKey}:pinned`) === '1');
  const [width, setWidth] = useState(() => {
    const saved = Number(localStorage.getItem(`${storageKey}:width`));
    return Number.isFinite(saved) && saved >= minWidth && saved <= maxWidth ? saved : defaultWidth;
  });
  const closeTimer = useRef<number>();
  const open = pinned || hovered;

  useEffect(() => {
    localStorage.setItem(`${storageKey}:pinned`, pinned ? '1' : '0');
  }, [pinned, storageKey]);

  useEffect(() => {
    localStorage.setItem(`${storageKey}:width`, String(width));
  }, [storageKey, width]);

  const enter = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setHovered(true);
  };

  const leave = () => {
    if (pinned) return;
    closeTimer.current = window.setTimeout(() => setHovered(false), 220);
  };

  const beginResize = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const startX = event.clientX;
    const startWidth = width;
    const onMove = (moveEvent: PointerEvent) => {
      const delta = side === 'left' ? moveEvent.clientX - startX : startX - moveEvent.clientX;
      setWidth(Math.min(maxWidth, Math.max(minWidth, startWidth + delta)));
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const ClosedIcon = side === 'left' ? PanelLeftOpen : PanelRightOpen;
  const OpenIcon = side === 'left' ? PanelLeftClose : PanelRightClose;

  return (
    <>
      <div
        className={`edge-hover-sensor edge-hover-sensor-${side}`}
        onMouseEnter={enter}
        aria-hidden="true"
      />
      <button
        type="button"
        className={`edge-panel-tab edge-panel-tab-${side} ${open ? 'is-open' : ''}`}
        onMouseEnter={enter}
        onClick={() => setPinned((value) => !value)}
        title={`${open ? '收起' : '展开'}${label}`}
      >
        {open ? <OpenIcon size={15} /> : <ClosedIcon size={15} />}
        <span>{label}</span>
      </button>
      <aside
        className={`hover-edge-panel hover-edge-panel-${side} ${open ? 'is-open' : ''}`}
        style={{ width }}
        onMouseEnter={enter}
        onMouseLeave={leave}
      >
        <div className="edge-panel-toolbar">
          <div>
            <strong>{label}</strong>
            <small>{width}px · {pinned ? '已固定' : '移开自动收起'}</small>
          </div>
          <button type="button" onClick={() => setPinned((value) => !value)} title={pinned ? '取消固定' : '固定侧栏'}>
            {pinned ? <PinOff size={14} /> : <Pin size={14} />}
          </button>
        </div>
        <div className="edge-panel-content">{children}</div>
        <button
          type="button"
          className={`edge-panel-resizer edge-panel-resizer-${side}`}
          onPointerDown={beginResize}
          aria-label={`调整${label}宽度`}
        />
      </aside>
    </>
  );
}

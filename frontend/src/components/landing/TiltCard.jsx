import { useCallback, useRef, useState } from 'react';
import { cn } from '../../utils/cn.js';

export default function TiltCard({
  children,
  className,
  intensity = 10,
  scale = 1.02,
  disabled = false,
}) {
  const ref = useRef(null);
  const [transform, setTransform] = useState('perspective(1200px) rotateX(0deg) rotateY(0deg)');

  const handleMove = useCallback(
    (event) => {
      if (disabled) return;
      const node = ref.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      const rotateY = px * intensity * 2;
      const rotateX = -py * intensity * 2;
      setTransform(
        `perspective(1200px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(
          2
        )}deg) scale(${scale})`
      );
    },
    [disabled, intensity, scale]
  );

  const handleLeave = useCallback(() => {
    setTransform('perspective(1200px) rotateX(0deg) rotateY(0deg) scale(1)');
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={cn('preserve-3d transition-transform duration-200 ease-out', className)}
      style={{ transform }}
    >
      {children}
    </div>
  );
}

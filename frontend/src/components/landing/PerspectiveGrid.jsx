import { cn } from '../../utils/cn.js';

export default function PerspectiveGrid({ className }) {
  return (
    <div
      className={cn(
        'perspective-1000 pointer-events-none absolute inset-x-0 bottom-0 h-72 overflow-hidden',
        className
      )}
      aria-hidden="true"
    >
      <div
        className="animate-grid-pan absolute inset-x-[-60%] bottom-[-55%] h-[180%]"
        style={{
          transform: 'rotateX(74deg)',
          transformOrigin: 'bottom center',
          backgroundImage:
            'linear-gradient(rgba(193,255,46,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(34,230,208,0.22) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'linear-gradient(to top, #000 10%, transparent 82%)',
          WebkitMaskImage: 'linear-gradient(to top, #000 10%, transparent 82%)',
        }}
      />
    </div>
  );
}

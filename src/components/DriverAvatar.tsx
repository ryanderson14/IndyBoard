import Image from "next/image";

interface Props {
  name: string;
  avatar?: string;
  number?: string;
  color?: string;
  size?: number;
}

/* Helmet-style avatar: cartoon (DiceBear by default) inside a colored frame
   with a sharp-cornered number plate. Auto-generates when no image is set so
   the board renders complete before race day. */
export function DriverAvatar({ name, avatar, number, color = "#888", size = 56 }: Props) {
  const src =
    avatar ??
    `https://api.dicebear.com/9.x/adventurer/png?seed=${encodeURIComponent(name)}&size=${size * 2}&backgroundType=gradientLinear`;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="relative h-full w-full overflow-hidden rounded-[3px] bg-rail"
        style={{
          boxShadow: `inset 0 0 0 2px ${color}, 0 0 12px ${color}55`,
        }}
      >
        <Image
          src={src}
          alt={name}
          width={size}
          height={size}
          className="h-full w-full object-cover"
          unoptimized
        />
        {/* Color bar at bottom */}
        <div
          className="absolute inset-x-0 bottom-0 h-1.5"
          style={{ background: color }}
          aria-hidden
        />
      </div>
      {number && (
        <span
          className="absolute -bottom-1 -right-1 rounded-[2px] px-1.5 py-px font-mono text-[10px] font-black leading-tight text-black shadow"
          style={{ background: color }}
        >
          {number}
        </span>
      )}
    </div>
  );
}

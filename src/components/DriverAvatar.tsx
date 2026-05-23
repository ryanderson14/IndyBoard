import Image from "next/image";

interface Props {
  name: string;
  avatar?: string;
  number?: string;
  color?: string;
  size?: number;
}

// A person shown "as the driver": cartoon avatar inside a helmet-style ring
// tinted with the car color, with the car number on a roundel. Uses an
// uploaded image when provided, otherwise an auto-generated cartoon from
// DiceBear so the board looks complete even before anyone uploads a photo.
export function DriverAvatar({ name, avatar, number, color = "#888", size = 56 }: Props) {
  const src =
    avatar ??
    `https://api.dicebear.com/9.x/adventurer/png?seed=${encodeURIComponent(name)}&size=${size * 2}&backgroundType=gradientLinear`;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="h-full w-full overflow-hidden rounded-full bg-white/10"
        style={{ border: `3px solid ${color}`, boxShadow: `0 0 12px ${color}55` }}
      >
        <Image
          src={src}
          alt={name}
          width={size}
          height={size}
          className="h-full w-full object-cover"
          unoptimized
        />
      </div>
      {number && (
        <span
          className="absolute -bottom-1 -right-1 rounded-full px-1.5 text-[10px] font-black leading-4 text-black shadow"
          style={{ backgroundColor: color }}
        >
          {number}
        </span>
      )}
    </div>
  );
}

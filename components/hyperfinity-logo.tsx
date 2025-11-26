interface HyperfinityLogoProps {
  className?: string;
  size?: number;
}

export function HyperfinityLogo({ className, size = 32 }: HyperfinityLogoProps) {
  return (
    <svg
      className={className}
      fill="none"
      height={size}
      viewBox="0 0 48 48"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background circle with turquoise */}
      <circle cx="24" cy="24" fill="#00D9B5" r="24" />
      {/* H shape with pink */}
      <path
        d="M14 12V36M14 24H26M26 12V36"
        stroke="#E91E8C"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="4"
      />
      {/* Infinity symbol accent with blue */}
      <path
        d="M28 24C28 24 30 20 33 20C36 20 38 22 38 24C38 26 36 28 33 28C30 28 28 24 28 24Z"
        fill="#3B82F6"
      />
      <path
        d="M38 24C38 24 36 28 33 28C30 28 28 26 28 24C28 22 30 20 33 20C36 20 38 24 38 24Z"
        fill="#3B82F6"
        opacity="0.7"
      />
    </svg>
  );
}


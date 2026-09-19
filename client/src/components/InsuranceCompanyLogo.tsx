import { useEffect, useState } from "react";

interface InsuranceCompanyLogoProps {
  companyName: string;
  src?: string;
  className?: string;
}

export default function InsuranceCompanyLogo({
  companyName,
  src,
  className = "w-full h-full object-contain",
}: InsuranceCompanyLogoProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return (
      <span
        aria-label={`شعار ${companyName}`}
        className="flex h-full w-full items-center justify-center px-2 text-center text-xs font-bold leading-snug text-[#1a5276]"
      >
        {companyName}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={`شعار ${companyName}`}
      className={className}
      onError={() => setHasError(true)}
    />
  );
}

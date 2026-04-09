"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  show: boolean;
  text?: string;
};

export default function LoadingOverlay({ show, text }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!show || !mounted) return null;

  return createPortal(
    <div className="
      fixed inset-0
      bg-black/30
      backdrop-blur-sm
      flex items-center justify-center
      z-[9999]
    ">
      <div className="flex flex-col items-center gap-3">

        <div className="
          w-12 h-12
          border-4
          border-white
          border-t-transparent
          rounded-full
          animate-spin
        " />

        {text && (
          <p className="text-white text-sm">
            {text}
          </p>
        )}

      </div>
    </div>
    ,
    document.body
  );
}
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const legacyDestinations: Record<string, string> = {
  "#teaching": "/teaching",
  "#workshops": "/teaching#workshops",
  "#projects": "/projects",
  "#mentorship": "/about#mentorship",
  "#contact": "/about#mentorship",
};

export function LegacyHomeAnchor() {
  const router = useRouter();

  useEffect(() => {
    function followLegacyAnchor() {
      const { hash, search } = window.location;
      if (!Object.hasOwn(legacyDestinations, hash)) return;
      const destination = new URL(legacyDestinations[hash], window.location.origin);
      router.replace(`${destination.pathname}${search}${destination.hash}`);
    }

    followLegacyAnchor();
    window.addEventListener("hashchange", followLegacyAnchor);
    return () => window.removeEventListener("hashchange", followLegacyAnchor);
  }, [router]);

  return null;
}

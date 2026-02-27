"use client";

import { Suspense } from "react";
import { HeaderWithAuth } from "./HeaderWithAuth";

export function HeaderWithSuspense() {
  return (
    <Suspense fallback={<div className="h-16" />}>
      <HeaderWithAuth />
    </Suspense>
  );
}

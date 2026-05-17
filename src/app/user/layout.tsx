"use client";

import React from "react";
import { UserLayoutHeroUI } from "@/components/layout/user-layout-heroui";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserLayoutHeroUI>
      {children}
    </UserLayoutHeroUI>
  );
}

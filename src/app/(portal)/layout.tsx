"use client";

import React, { useState } from "react";
import { PortalSidebar } from "@/components/layout/PortalSidebar";
import { PortalHeader } from "@/components/layout/PortalHeader";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-100">
      <PortalSidebar
        mobileOpen={mobileDrawerOpen}
        onMobileClose={() => setMobileDrawerOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <PortalHeader onMenuToggle={() => setMobileDrawerOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto pb-20 lg:pb-8">
          {children}
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}
"use client";

import Image from "next/image";
import Link from "next/link";
import type { User } from "next-auth";
import { SidebarUserNav } from "@/components/sidebar-user-nav";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from "@/components/ui/sidebar";

export function AppSidebar({ user }: { user: User | undefined }) {
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          {/* Hyperfinity Logo */}
          <div className="flex flex-col gap-4 pb-2">
            <Link
              className="flex flex-row items-center gap-2 px-2"
              href="/"
              onClick={() => {
                setOpenMobile(false);
              }}
            >
              <Image
                alt="Hyperfinity"
                className="brightness-0 invert"
                height={28}
                src="/images/hyperfinity-logo-dark.png"
                width={140}
              />
            </Link>

            {/* Navigation */}
            <div className="flex flex-col gap-1">
              <Link
                className="flex flex-row items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium bg-sidebar-accent transition-colors"
                href="/"
                onClick={() => {
                  setOpenMobile(false);
                }}
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                ABM Pack Generator
              </Link>
            </div>
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent />
      <SidebarFooter>{user && <SidebarUserNav user={user} />}</SidebarFooter>
    </Sidebar>
  );
}

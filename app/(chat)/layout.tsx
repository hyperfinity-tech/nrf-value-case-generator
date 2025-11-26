import Script from "next/script";
import Image from "next/image";
import Link from "next/link";
import { DataStreamProvider } from "@/components/data-stream-provider";
import { auth } from "../(auth)/auth";

export const experimental_ppr = true;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  await auth();

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <DataStreamProvider>
        <div className="flex flex-col min-h-screen">
          {/* Pink Header Bar */}
          <header className="bg-[rgb(248_90_164)] text-black px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Left: Title */}
              <h1 className="text-2xl font-bold tracking-tight">
                Loyalty Opportunity
              </h1>

              {/* Right: Logo */}
              <Link href="/" className="inline-block">
                <Image
                  alt="Hyperfinity"
                  height={28}
                  src="/images/hyperfinity-logo-dark.png"
                  width={140}
                />
              </Link>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1">{children}</main>
        </div>
      </DataStreamProvider>
    </>
  );
}

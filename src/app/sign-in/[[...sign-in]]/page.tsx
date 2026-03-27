import Image from "next/image";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-dark-teal">
            <Image
              src="/dardoc-logo-white.png"
              alt="DarDoc"
              width={40}
              height={40}
              priority
              className="object-contain"
            />
          </div>
          <p className="mt-3 text-lg text-dark-teal">Boom Health</p>
          <p className="mt-0.5 text-xs text-teal/50">Powered by DarDoc</p>
        </div>
        <SignIn
          forceRedirectUrl="/bookings"
          appearance={{
            elements: {
              formButtonPrimary: "bg-teal hover:bg-dark-teal",
              card: "shadow-none",
              headerTitle: "text-dark-teal",
            },
          }}
        />
      </div>
    </div>
  );
}

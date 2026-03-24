import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full items-center justify-center px-4 py-16 text-slate-600">
          読み込み中…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

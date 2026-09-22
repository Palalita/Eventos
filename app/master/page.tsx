// Login de master — separado del público (app/login), no enlazado desde
// ningún lado del sitio a propósito. Ver masterLogin() en
// app/actions/master.ts y el bloqueo explícito en login() (app/actions/auth.ts)
// que impide entrar acá desde el formulario público.
import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY_NAME } from "@/lib/company";
import MasterLoginForm from "./MasterLoginForm";

export const metadata: Metadata = {
  title: `Master · ${COMPANY_NAME}`,
  robots: { index: false, follow: false },
};

export default function MasterLoginPage() {
  return (
    <main className="auth-page landing">
      <div className="auth-card">
        <div className="auth-back-row">
          <Link href="/" className="auth-back-link">
            ← Volver
          </Link>
        </div>
        <p className="platform-eyebrow">{COMPANY_NAME}</p>
        <h1>Panel interno</h1>
        <MasterLoginForm />
      </div>
    </main>
  );
}

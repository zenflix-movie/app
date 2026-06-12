import { LoginForm } from "~/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold">
            <span className="text-red-600">Zen</span>flix
          </h1>
          <p className="text-muted-foreground mt-1">Stream your favorites</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}

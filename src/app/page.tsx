import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AuthForm } from "@/components/AuthForm";

export default async function Home() {
  const user = await getSession();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-red-500 to-orange-500 text-transparent bg-clip-text">
          Disrespect
        </h1>
        <p className="text-zinc-400 max-w-md">
          Track the workplace indignities. Fill your bucket. Share with friends
          who understand.
        </p>
      </div>

      <AuthForm />

      <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-center max-w-2xl">
        <div className="p-4">
          <span className="text-3xl block mb-2">🏴‍☠️</span>
          <span className="text-sm text-zinc-400">Credit Theft</span>
        </div>
        <div className="p-4">
          <span className="text-3xl block mb-2">🚌</span>
          <span className="text-sm text-zinc-400">Thrown Under Bus</span>
        </div>
        <div className="p-4">
          <span className="text-3xl block mb-2">👻</span>
          <span className="text-sm text-zinc-400">Ghosted</span>
        </div>
        <div className="p-4">
          <span className="text-3xl block mb-2">🤡</span>
          <span className="text-sm text-zinc-400">General Clowning</span>
        </div>
      </div>
    </div>
  );
}

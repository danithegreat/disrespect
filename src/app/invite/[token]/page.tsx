import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { AuthForm } from "@/components/AuthForm";
import Link from "next/link";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params;
  const user = await getSession();

  if (user) {
    redirect("/dashboard");
  }

  const prisma = await getPrisma();
  const invite = await prisma.invite.findUnique({
    where: { token },
    include: {
      user: {
        select: { name: true, username: true },
      },
    },
  });

  const isValid = invite && new Date() <= invite.expiresAt;

  if (!isValid) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-red-500 to-orange-500 text-transparent bg-clip-text">
            Disrespect
          </h1>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md">
            <p className="text-red-400 mb-4">
              {invite ? "This invite link has expired." : "Invalid invite link."}
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-xl transition-colors"
            >
              Sign up anyway
            </Link>
          </div>
        </div>
      </div>
    );
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

      <AuthForm inviteToken={token} inviterName={invite.user.name} />

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

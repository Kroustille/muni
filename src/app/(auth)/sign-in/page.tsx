import { SignInForm } from "./sign-in-form";

type SignInPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { error } = await searchParams;
  const linkExpired = error === "invalid_link";
  const googleSignInEnabled = Boolean(process.env.GOOGLE_CLIENT_ID);

  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <SignInForm linkExpired={linkExpired} googleSignInEnabled={googleSignInEnabled} />
    </main>
  );
}

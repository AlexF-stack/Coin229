import { AccountView } from "@/components/account/account-view";
import { safeNextPath } from "@/lib/safe-next";

export const metadata = {
  title: "Mon compte",
};

type Props = {
  searchParams: Promise<{ next?: string }>;
};

export default async function AccountPage({ searchParams }: Props) {
  // Retour à la page d'origine après connexion (ex. messagerie)
  const { next } = await searchParams;
  return <AccountView next={safeNextPath(next)} />;
}

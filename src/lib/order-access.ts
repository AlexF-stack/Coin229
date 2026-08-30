import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  normalizeBjPhone,
  phoneCookieName,
  readPhoneFromToken,
} from "@/lib/phone-session";
import {
  orderConfirmCookieName,
  readOrderConfirmToken,
} from "@/lib/order-confirm";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Accès commande : cookie confirm court, session téléphone OTP, ou OAuth propriétaire.
 * Pas d’émission de session téléphone au checkout.
 */
export async function canAccessOrder(orderId: string): Promise<boolean> {
  if (!orderId) return false;

  const jar = await cookies();
  const confirmOrderId = readOrderConfirmToken(
    jar.get(orderConfirmCookieName())?.value
  );
  if (confirmOrderId === orderId) return true;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, telephone: true, clientId: true },
  });
  if (!order) return false;

  const sessionPhone = await readPhoneFromToken(
    jar.get(phoneCookieName())?.value
  );
  if (
    sessionPhone &&
    normalizeBjPhone(order.telephone) === sessionPhone
  ) {
    return true;
  }

  if (!isSupabaseConfigured()) return false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;
    const client = await prisma.client.findFirst({
      where: { authId: user.id },
      select: { id: true },
    });
    return Boolean(client && client.id === order.clientId);
  } catch {
    return false;
  }
}

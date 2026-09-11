import { supabase } from "@/integrations/supabase/client";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(len = 6) {
  let out = "";
  for (let i = 0; i < len; i += 1) out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return out;
}

/**
 * Creates a one-time code a shop worker types into the mobile app to link
 * their phone to this shop and staff profile. Requires the owner to be
 * signed in to the cloud backup.
 */
export async function createStaffInvite(staffId: string): Promise<string> {
  const { data: auth } = await supabase.auth.getUser();
  const ownerId = auth.user?.id;
  if (!ownerId) throw new Error("Sign in to cloud backup first, then generate the code.");

  const code = randomCode();
  const { error } = await supabase.from("staff_invites").insert({
    code,
    owner_id: ownerId,
    staff_id: staffId,
  });
  if (error) throw new Error(error.message);
  return code;
}

export type InviteRow = {
  code: string;
  staff_id: string;
  created_at: string;
  expires_at: string;
  used_at: string | null;
};

/** Codes issued by this shop, newest first. */
export async function listStaffInvites(): Promise<InviteRow[]> {
  const { data, error } = await supabase
    .from("staff_invites")
    .select("code,staff_id,created_at,expires_at,used_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []) as InviteRow[];
}

/** Phones already linked to this shop. */
export async function listLinkedDevices(): Promise<
  { user_id: string; staff_id: string; created_at: string }[]
> {
  const { data: auth } = await supabase.auth.getUser();
  const ownerId = auth.user?.id;
  if (!ownerId) return [];
  const { data, error } = await supabase
    .from("shop_members")
    .select("user_id,staff_id,created_at")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Cancels a code that has not been used yet. */
export async function revokeStaffInvite(code: string): Promise<void> {
  const { error } = await supabase.from("staff_invites").delete().eq("code", code);
  if (error) throw new Error(error.message);
}

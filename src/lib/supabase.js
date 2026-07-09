import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dehjilvkbkctgwfwmmgu.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_bd3h6vaef45uI8Gximh9GQ_pOMwxouA";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
});

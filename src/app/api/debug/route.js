import { createClient } from "@supabase/supabase-js";
export async function GET() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data } = await supabase.from('orders').select('*').limit(1);
  return Response.json(Object.keys(data?.[0] || {}));
}

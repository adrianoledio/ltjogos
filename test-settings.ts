import { supabase } from "./src/lib/supabase.js";
async function run() {
  const { data, error } = await supabase.from("settings").select("data").eq("id", "global").single();
  console.log("Data:", data);
  console.log("Error:", error);
}
run();

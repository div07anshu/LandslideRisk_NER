import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
console.log("Supabase URL exists:", !!import.meta.env.VITE_SUPABASE_URL);
console.log("Supabase key exists:", !!import.meta.env.VITE_SUPABASE_KEY);


export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);
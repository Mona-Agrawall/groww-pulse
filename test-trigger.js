import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;

if (!url || !key) {
  console.error("Missing Supabase URL or Secret Key");
  process.exit(1);
}

const supabase = createClient(url, key);

async function testTrigger() {
  console.log("Creating test user...");
  const email = `test-trigger-${Date.now()}@example.com`;
  
  const { data: userData, error: createError } = await supabase.auth.admin.createUser({
    email,
    password: 'password123',
    email_confirm: true,
    user_metadata: { display_name: 'Trigger Test User' }
  });

  if (createError) {
    console.error("Failed to create test user:", createError.message);
    process.exit(1);
  }

  const userId = userData.user.id;
  console.log("Test user created with ID:", userId);

  // Wait a moment for trigger to fire
  await new Promise(resolve => setTimeout(resolve, 1500));

  console.log("Checking if public.profiles row exists...");
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError || !profileData) {
    console.log("\n❌ Trigger NOT found or failed to execute. public.profiles row is missing.");
  } else {
    console.log("\n✅ Trigger verified successfully! public.profiles row was created automatically.");
  }

  // Cleanup
  console.log("Cleaning up test user...");
  await supabase.auth.admin.deleteUser(userId);
  console.log("Test user deleted.");
}

testTrigger();

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function seed() {
  const email = 'superadmin@bluesclues.com';
  const password = 'SuperAdmin@2025!';
  const name = 'Super Admin';

  // Create Supabase Auth user with super_admin role in metadata
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    user_metadata: { role: 'super_admin', name },
    email_confirm: true,
  });
  if (authError) { console.error('Auth create failed:', authError); process.exit(1); }

  // Insert into super_admin_users table — id MUST match Supabase Auth user.id
  const { error: dbError } = await supabase.from('super_admin_users').insert({
    id: authUser.user.id,
    email,
    name,
  });
  if (dbError) { console.error('DB insert failed:', dbError); process.exit(1); }

  console.log('Seeded super admin:', email, '/ password:', password);
}

seed();

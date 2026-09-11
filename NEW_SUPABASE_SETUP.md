# New Supabase setup

Project: `ymbvwutdmhutyctubhay`

1. In Supabase Dashboard > SQL Editor, run `supabase/NEW_PROJECT_SETUP.sql` once.
2. In Authentication > Providers > Email, enable Email/Password. For the current internal cashier username flow (`name@snackshop.local`), disable email confirmation.
3. Start the web dashboard and create/sign in to the owner account.
4. Add staff in the dashboard, then go to **Add a Phone** and generate a connection code for that staff member.
5. On Android, sign in with the cashier username/password and enter the connection code on first connection.
6. Keep Realtime enabled; the SQL setup adds `sales` and `products` to the realtime publication.

Security: only the publishable key is stored in clients. Never put the database password or service-role key in Android or browser code.

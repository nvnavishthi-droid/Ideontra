# Authentication

Employee email/password signup accepts only @closefuture.io. New accounts receive
Member roles; the existing Custom Access Token Hook supplies verified JWT roles.

User direction (2026-11-05): no signup confirmation email. Disable Confirm Email
in the Supabase dashboard's Email provider and save. The app then enters the
dashboard immediately on signup. It does not request a confirmation redirect,
show email instructions, or expose confirmation callback routes. If Auth does not
return a session, the app reports the problem instead of pretending signup logged
in. Existing unconfirmed accounts are not silently altered.

Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.
NEXT_PUBLIC_SITE_URL records the deployment origin. No service-role key is used.
The dashboard requires a server-verified session. Proxy refreshes cookies;
server rendering verifies identity and JWT roles again. Sign-out clears cached
data and performs a full navigation. Errors use shared popups.

Real login, role claims, session refresh, sign-out and protected redirects passed
previous verification. Fresh self-service signup, immediate dashboard access and subsequent password
sign-in passed live verification after Confirm Email was disabled. Email delivery testing is no
longer part of acceptance. See docs/verification/live-integration.md.

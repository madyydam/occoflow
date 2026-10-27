# Occo Flow Developer Guidelines

- **Real Database Only (No Mock Data)**: All customer records, trials, subscriptions, and platform metrics load directly from Supabase. Never use fallback demo fixture arrays. If the database is empty, display clean 0-counts and empty states.
- **User-Centric Architecture**: Every signup creates 1 User Profile (`profiles`) and 1 Workspace (`businesses`). In the Admin Panel, customers are managed under `/admin/users` with two dedicated tabs:
  1. **Subscribed Users**: Users who purchased Standard or Premium plans.
  2. **Users on Trial**: Users currently on the 3-day free trial or whose trial expired without subscribing.
- **Admin Routing**: Keep `/admin/businesses` redirecting to `/admin/users` for seamless unified customer management.
- **Data Integrity**: Direct joins using Supabase schema (`profiles.business_id REFERENCES businesses(id)`, `subscriptions.business_id REFERENCES businesses(id)`).
- **Simplicity First**: Clean, light-theme UI, mobile-first, and distraction-free for business owners and platform administrators.

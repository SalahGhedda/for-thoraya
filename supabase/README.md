# Private opening times

The page is configured for project `ytiemfqyfaglsvibizvs`. The database setup must be run before openings can be saved.

1. Open [your Supabase SQL Editor](https://supabase.com/dashboard/project/ytiemfqyfaglsvibizvs/sql/new).
2. Copy the complete contents of [setup.sql](setup.sql), paste them into a new query, and click **Run**.
3. Open the live notes page once. In Supabase's Table Editor, open **note_openings**. A new row should contain the opening time.

Only an automatically generated row ID and the server's `opened_at` timestamp are saved in this table. The website has no visible tracking indicator or history. Its publishable key can call an append-only function but cannot read, update, or delete the history. Only your privileged Supabase dashboard/database access can view it.

Times are stored as `timestamptz` (UTC). To see them in Toronto time, run this in your private SQL Editor:

```sql
select opened_at,
       opened_at at time zone 'America/Toronto' as toronto_time
from public.note_openings
order by opened_at desc;
```

Each visible page load, reload, or return through browser Back adds one entry. Switching tabs does not add entries, and localhost previews are excluded. No cookies, local storage, location lookup, visitor identifiers, device details, or referrer fields are collected by this code. Hosting providers may keep their own standard request logs.

This is a best-effort count of openings, including your own visits, rather than proof of who opened it. Blocked requests or offline visits cannot be recorded. Anyone able to open the public page can also submit an opening; public analytics cannot guarantee an authentic human visit. Errors never interrupt the page. If you move the website to a custom domain, update the hostname guard in `things-i-like-about-you/openings.js`.

The permissions follow Supabase's [database function guidance](https://supabase.com/docs/guides/database/functions) and [row-level security guidance](https://supabase.com/docs/guides/database/postgres/row-level-security). Never put a service-role/secret key or database password in the website.

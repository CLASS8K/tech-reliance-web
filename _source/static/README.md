# Tech-Reliance website

A static multi-page site with no build step and no dependencies at runtime. Hosted on Vercel; leads go to Supabase.

## Pages

| Path | Purpose |
|---|---|
| `/` | Home: 72-hour breach clock, obligations, service ladder, sectors |
| `/data-protection-act` | Plain-language guide to the Data Protection Act 2024 |
| `/services` and `/services/*` | Overview plus readiness sprint, DPO as a service, managed security, Microsoft 365 security, process automation |
| `/sectors` | Six target sectors |
| `/about` | Founder and how we work |
| `/contact` | Booking form (writes to Supabase) |
| `/privacy` | Privacy notice under the Act |

## Before going live

1. In `assets/site.js`, set `SITE.email` and `SITE.whatsapp`.
2. Replace `https://www.example.com` in each page's canonical tag, `sitemap.xml` and `robots.txt` with your domain. If you keep the generator, change `SITE_URL` in `build.py` and rebuild instead.
3. Read the Act section numbers against the Act text.

## Deploy on Vercel

1. Push this folder to a GitHub repo, e.g. `CLASS8K/tech-reliance-web`.
2. Vercel: New Project, import the repo, Framework preset **Other**, no build command, output directory `.`.
3. Add your domain in Project Settings, then Domains.
4. `vercel.json` turns on clean URLs (`/about` instead of `/about.html`) and sets security headers, including a Content Security Policy that only allows the site itself, Google Fonts and the Supabase project.

## Leads (Supabase)

- Project: **Tech-Reliance Web** (`bifryasxcnzntwiiqohm`, eu-west-1).
- Table `public.leads`. Row level security allows anonymous **insert only**. Visitors cannot read, change or delete anything. Field lengths and email format are enforced in the database, and consent must be true.
- The publishable key in `site.js` is meant to be public. Never put a secret key in this repo.
- See new leads in Supabase: Table Editor, then `leads`. Update `status` as you work them (`new`, `contacted`, `qualified`, `proposal`, `won`, `lost`).
- If the request fails (network or ad blocker), the form offers a pre-filled email or WhatsApp message instead, so no lead is lost.

## WhatsApp or email alert for each new lead

1. In n8n, create a workflow with a **Webhook** trigger (POST). Protect it with a header secret.
2. In Supabase, open Database, then Webhooks, and create one on `public.leads`, event **Insert**, pointing to the n8n webhook URL. Add the header secret.
3. In n8n, add a **WhatsApp Business Cloud** node (or Gmail/SMTP) that sends: name, organisation, sector, data subjects, service, message.
4. Submit a test lead from `/contact` and confirm the alert arrives.

## Retention

Leads are personal data. The privacy notice promises deletion after 24 months unless they become a client. Review the table every quarter, or schedule this in Supabase:

```sql
delete from public.leads where created_at < now() - interval '24 months' and status not in ('won');
```

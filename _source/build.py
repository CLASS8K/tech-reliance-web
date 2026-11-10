"""Static site generator for the Tech-Reliance website.
Renders templates/ into ../tech-reliance-web/ with relative links so the output
works on Vercel (cleanUrls) and as plain files."""
import os, shutil, json
from jinja2 import Environment, FileSystemLoader

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.dirname(HERE)  # builds into the repo root
SITE_URL = "https://techreliancemw.online"

PAGES = [
    # (template, output path, title, description, nav key)
    ("home.html", "index.html", "Tech-Reliance", "Data Protection Act 2024 readiness, DPO support and managed security for Malawi's regulated organisations, at fixed prices.", "home"),
    ("act.html", "data-protection-act.html", "The Data Protection Act 2024 explained", "What Malawi's Data Protection Act 2024 requires: MACRA registration, 72-hour breach reporting, security, transfers and DPOs.", "act"),
    ("services.html", "services.html", "Services", "Exposure check, readiness sprint, DPO as a service, managed security, Microsoft 365 security and process automation.", "services"),
    ("svc_sprint.html", "services/readiness-sprint.html", "Readiness sprint", "A fixed-price, 4 to 6 week programme that makes your organisation compliant with Malawi's Data Protection Act 2024.", "services"),
    ("svc_dpo.html", "services/dpo-as-a-service.html", "DPO as a service", "An outsourced data protection officer for Malawian organisations, on a fixed monthly retainer.", "services"),
    ("svc_security.html", "services/managed-security.html", "Managed security", "Continuous threat detection, coordinated incident response, a monthly review and a virtual CISO, priced per user.", "services"),
    ("svc_m365.html", "services/m365-security.html", "Microsoft 365 security", "A fixed-price review and hardening of your Microsoft 365 and Azure setup.", "services"),
    ("svc_automation.html", "services/process-automation.html", "Process automation", "Automate paper-heavy workflows with privacy built in, priced per workflow.", "services"),
    ("sectors.html", "sectors.html", "Sectors", "How the Data Protection Act affects microfinance, insurance, healthcare, education, NGOs and logistics in Malawi.", "sectors"),
    ("about.html", "about.html", "About", "Tech-Reliance is led by Frank Ntaukira, a systems and security practitioner.", "about"),
    ("contact.html", "contact.html", "Book a free exposure check", "Book a free 30-minute Data Protection Act exposure check with Tech-Reliance.", "contact"),
    ("kit.html", "data-protection-kit.html", "Pan-African Data Protection Kit", "Editable data protection compliance templates for 12 African countries: POPIA, NDPA, Kenya DPA, Egypt PDPL and more. Instant download.", "kit"),
    ("terms.html", "terms.html", "Terms of sale", "Terms of sale, licence and refund policy for Tech-Reliance digital products.", "terms"),
    ("privacy.html", "privacy.html", "Privacy notice", "How Tech-Reliance handles personal data sent through this website.", "privacy"),
    ("404.html", "404.html", "Page not found", "This page does not exist.", "none"),
]

# Dodo Payments checkout links for the kit. Leave empty until Dodo approves the
# account; empty links show a "Request early access" button instead of "Buy".
KIT_LINKS = {
    "single": "",
    "pan": "",
    "consultant": "",
}

SERVICES = [
    {"slug": "readiness-sprint", "name": "Readiness sprint", "short": "Map your data, close the gaps and file your MACRA registration.", "terms": "Fixed price, 4 to 6 weeks"},
    {"slug": "dpo-as-a-service", "name": "DPO as a service", "short": "We act as your data protection officer, month after month.", "terms": "Monthly retainer"},
    {"slug": "managed-security", "name": "Managed security", "short": "Continuous threat detection, with a monthly review for your board.", "terms": "Per user, per month"},
    {"slug": "m365-security", "name": "Microsoft 365 security", "short": "Review and fix sign-in, email, sharing and device settings.", "terms": "Fixed price, 1 to 2 weeks"},
    {"slug": "process-automation", "name": "Process automation", "short": "Automate one paper-heavy workflow at a time, privacy built in.", "terms": "Priced per workflow"},
]

def main():
    env = Environment(loader=FileSystemLoader(os.path.join(HERE, "templates")), autoescape=True,
                      trim_blocks=True, lstrip_blocks=True)
    # Overwrite generated files in place; never delete OUT (it is the repo root).
    os.makedirs(OUT, exist_ok=True)
    for tpl, out, title, desc, nav in PAGES:
        depth = out.count("/")
        root = "../" * depth
        def link(path, root=root):
            return root + path
        canonical = SITE_URL + "/" + ("" if out == "index.html" else out.replace(".html", ""))
        html = env.get_template(tpl).render(
            title=title, description=desc, nav=nav, root=root, link=link,
            services=SERVICES, kit_links=KIT_LINKS, canonical=canonical, page_path="/" + out.replace(".html", "").replace("index", ""))
        path = os.path.join(OUT, out)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            f.write(html)
    shutil.copytree(os.path.join(HERE, "static"), OUT, dirs_exist_ok=True)
    # sitemap + robots
    urls = [SITE_URL + "/" + ("" if o == "index.html" else o.replace(".html", "")) for _, o, *_ in PAGES if o != "404.html"]
    with open(os.path.join(OUT, "sitemap.xml"), "w") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
        for u in urls:
            f.write(f"  <url><loc>{u}</loc></url>\n")
        f.write("</urlset>\n")
    with open(os.path.join(OUT, "robots.txt"), "w") as f:
        f.write(f"User-agent: *\nAllow: /\nSitemap: {SITE_URL}/sitemap.xml\n")
    print("Built", len(PAGES), "pages into", OUT)

if __name__ == "__main__":
    main()

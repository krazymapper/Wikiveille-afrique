#!/usr/bin/env python3
"""Veille Afrique — nouveaux articles Wikipédia (EN, FR) liés aux portails des pays
africains + nouveaux éléments Wikidata localisés en Afrique (humains / bots séparés).

Usage :
  python3 veille.py --mode auto --data-dir DATA   # matin avant 12:00 UTC, midi après
  python3 veille.py --mode midi --data-dir DATA   # items créés après 07:00 marqués "nouveau"
  python3 veille.py --since 2026-10-14T07:00:00Z --until 2026-10-15T07:00:00Z --data-dir DATA

Arborescence écrite dans DATA (servie telle quelle par GitHub Pages) :
  latest/meta.json        fenêtre, mode, compteurs, totaux
  latest/wikipedia.json   articles FR/EN (portail + à baliser)
  latest/wikidata.json    éléments Wikidata (humains + bots)
  latest/veille_afrique.xlsx
  archive/<jour>_<passage>.json + archive/index.json   (rétention --archive-days)
  historique.json         une ligne par passage
Le jeton WIKIMEDIA_TOKEN (variable d'environnement) est facultatif : il relève les quotas.
"""
import argparse, json, os, re, sys, time, datetime as dt
from concurrent.futures import ThreadPoolExecutor
import requests

UA = "VeilleAfriqueWikimedia/1.0 (Wikimedia Benin; outil de veille, requetes authentifiees OAuth)"
S = requests.Session(); S.headers["User-Agent"] = UA
if os.environ.get("WIKIMEDIA_TOKEN"):
    S.headers["Authorization"] = "Bearer " + os.environ["WIKIMEDIA_TOKEN"].strip()
API = {"en": "https://en.wikipedia.org/w/api.php", "fr": "https://fr.wikipedia.org/w/api.php",
       "wd": "https://www.wikidata.org/w/api.php"}

# 54 États + Sahara occidental / RASD. Les libellés EN/FR viennent de Wikidata à l'exécution.
AFRICA = ["Q962","Q1033","Q945","Q117","Q965","Q1032","Q912","Q1041","Q1008","Q1006","Q1007",
  "Q1044","Q1014","Q1005","Q1011","Q1025","Q1028","Q262","Q948","Q1016","Q79","Q1049","Q958",
  "Q115","Q986","Q977","Q1045","Q114","Q1036","Q924","Q1037","Q967","Q974","Q971","Q1000",
  "Q983","Q1009","Q657","Q929","Q1039","Q916","Q953","Q1020","Q1029","Q954","Q963","Q1030",
  "Q258","Q1013","Q1050","Q1019","Q1027","Q970","Q1042","Q6250","Q40362"]
AFRICA_SET = set(AFRICA)
REGIONAL_PORTALS = {
  "fr": ["Afrique", "Afrique de l'Ouest", "Afrique centrale", "Afrique de l'Est", "Afrique australe",
         "Afrique du Nord", "Maghreb", "Corne de l'Afrique", "Sahel", "Union africaine", "Afrique subsaharienne"],
  "en": ["Africa", "West Africa", "Central Africa", "East Africa", "Southern Africa", "North Africa",
         "Maghreb", "Horn of Africa", "African Union"],
}
PORTAL_NS = {"en": 100, "fr": 100}
PORTAL_PREFIX = {"en": "Portal:", "fr": "Portail:"}
DIRECT_P = ["P17", "P27", "P495", "P1532"]               # valeur = pays
INDIRECT_P = ["P131", "P276", "P19", "P20", "P159", "P740", "P706", "P551"]  # lieu -> son P17
MASS_TOOLS = re.compile(r"#(quickstatements|openrefine|petscan|mix'n'match|mixnmatch|wikidata-game)|QuickStatements|OpenRefine", re.I)

def iso(t): return t.strftime("%Y-%m-%dT%H:%M:%SZ")

NREQ = [0]
def call(site, params, tries=5):
    NREQ[0] += 1
    p = dict(params, format="json", formatversion=2)
    for i in range(tries):
        try:
            r = S.get(API[site], params=p, timeout=60)
            if r.status_code == 200:
                j = r.json()
                if j.get("error", {}).get("code") == "maxlag":
                    time.sleep(5 * (i + 1)); continue
                return j
            wait = int(r.headers.get("retry-after", 3 * (i + 1))) if r.status_code == 429 else 3 * (i + 1)
            time.sleep(min(wait, 60))
        except requests.RequestException:
            time.sleep(3 * (i + 1))
    raise RuntimeError(f"API {site} injoignable : {params.get('action')}")

def query_all(site, params):
    """Itère sur les résultats query en suivant 'continue'."""
    cont = {}
    while True:
        j = call(site, dict(params, action="query", **cont))
        yield j.get("query", {})
        if "continue" not in j: break
        cont = j["continue"]

def recent_new(site, since, until):
    out = []
    params = {"list": "recentchanges", "rctype": "new", "rcnamespace": 0, "rcdir": "newer",
              "rcstart": since, "rcend": until, "rclimit": "max",
              "rcprop": "title|ids|timestamp|user|flags|sizes|comment|tags"}
    if site != "wd": params["rcshow"] = "!redirect"
    for q in query_all(site, params):
        out.extend(q.get("recentchanges", []))
    return out

def chunks(xs, n=50):
    for i in range(0, len(xs), n): yield xs[i:i + n]

# ---------- Wikidata ----------
_ENT = {}
def get_entities(ids, props="claims|labels|sitelinks", langs="fr|en"):
    ids = [i for i in dict.fromkeys(ids) if i and i not in _ENT]
    def one(batch):
        j = call("wd", {"action": "wbgetentities", "ids": "|".join(batch), "props": props, "languages": langs})
        return j.get("entities", {})
    with ThreadPoolExecutor(3) as ex:
        for ents in ex.map(one, list(chunks(ids))):
            _ENT.update(ents)
    return _ENT

def label(e, lang="fr"):
    if not e: return ""
    L = e.get("labels", {})
    return (L.get(lang) or L.get("en" if lang == "fr" else "fr") or {}).get("value", "")

def claim_ids(e, p):
    out = []
    for c in (e or {}).get("claims", {}).get(p, []):
        v = c.get("mainsnak", {}).get("datavalue", {}).get("value")
        if isinstance(v, dict) and "id" in v: out.append(v["id"])
    return out

def coords(e):
    for c in (e or {}).get("claims", {}).get("P625", []):
        v = c.get("mainsnak", {}).get("datavalue", {}).get("value")
        if isinstance(v, dict) and v.get("globe", "").endswith("Q2"): return v["latitude"], v["longitude"]
    return None

AFR_POLY = [(-17.6,14.7),(-17.2,21),(-13.3,27.6),(-9.9,29.6),(-9.9,32.3),(-6,35.9),(-2,35.2),(11,37.4),
  (10.4,34),(11.6,33.1),(20,30.9),(25,31.8),(32.3,31.4),(34.25,31.3),(34.95,29.5),(34.3,27.8),(35.6,24),
  (37.4,21),(39.2,16),(43.4,12.6),(51.5,11.9),(48.2,4.5),(41.2,-2),(39.4,-6),(40.6,-10.5),(40.9,-15),
  (35.6,-23.5),(33,-26),(30.1,-31.6),(25.6,-34.1),(20,-35),(18.3,-34.5),(16.4,-28.6),(11.6,-17),
  (13,-8.7),(11.9,-5),(8.7,-0.8),(9.5,3.9),(8.4,4.4),(5.4,4.1),(1.6,6),(-3,4.9),(-7.6,4.2),
  (-11.6,6.7),(-13.6,9.4),(-16.9,12.4),(-17.6,14.7)]
ISLANDS = [(43,-25.8,50.7,-11.8),(-25.5,14.7,-22.5,17.3),(43,-12.6,44.7,-11.2),(57.2,-20.6,57.9,-19.9),
  (63.2,-19.8,63.6,-19.6),(46,-10.5,56.5,-3.5),(6.3,-0.2,7.6,1.8),(8.3,3.1,9,3.9)]

def in_africa(lat, lon):
    if any(a <= lon <= c and b <= lat <= d for a, b, c, d in ISLANDS): return True
    inside, n = False, len(AFR_POLY)
    for i in range(n - 1):
        x1, y1 = AFR_POLY[i]; x2, y2 = AFR_POLY[i + 1]
        if (y1 > lat) != (y2 > lat) and lon < (x2 - x1) * (lat - y1) / (y2 - y1) + x1: inside = not inside
    return inside

def africa_match(e):
    """Retourne (pays_QIDs, critère, confiance) ou None."""
    hits, why = set(), []
    for p in DIRECT_P:
        a = [q for q in claim_ids(e, p) if q in AFRICA_SET]
        if a: hits.update(a); why.append(p)
    if "Q15" in claim_ids(e, "P30"): why.append("P30=Afrique")
    for p in INDIRECT_P:
        for q in claim_ids(e, p):
            if q in AFRICA_SET: hits.add(q); why.append(p)
            else:
                a = [c for c in claim_ids(_ENT.get(q), "P17") if c in AFRICA_SET]
                if a: hits.update(a); why.append(p + "→P17")
    if hits or why: return sorted(hits), ", ".join(dict.fromkeys(why)), "haute"
    has_country = any(claim_ids(e, p) for p in DIRECT_P)
    c = coords(e)
    if c and not has_country and in_africa(*c): return [], "P625 (coordonnées)", "moyenne"
    return None

def indirect_targets(ents):
    return [q for e in ents for p in INDIRECT_P for q in claim_ids(e, p) if q not in AFRICA_SET]

# ---------- Portails ----------
def build_portals():
    get_entities(AFRICA, props="claims|labels|sitelinks")
    portal_items = [q for c in AFRICA for q in claim_ids(_ENT.get(c), "P1151")]
    get_entities(portal_items, props="sitelinks|labels")
    portals = {"en": {}, "fr": {}}
    for c in AFRICA:
        e = _ENT.get(c, {})
        for lang in ("en", "fr"):
            names = {PORTAL_PREFIX[lang] + label(e, lang)}
            for pq in claim_ids(e, "P1151"):
                sl = _ENT.get(pq, {}).get("sitelinks", {}).get(lang + "wiki")
                if sl: names.add(sl["title"])
            for n in names: portals[lang][n] = c
    for lang, regs in REGIONAL_PORTALS.items():
        for r in regs: portals[lang][PORTAL_PREFIX[lang] + r] = "Q15"
    return portals

def country_name(q, lang="fr"):
    return "Afrique (régional)" if q == "Q15" else label(_ENT.get(q), lang) or q

# ---------- Wikipédia ----------
def wikipedia(lang, since, until, portals):
    rcs = recent_new(lang, since, until)
    pages = {}
    ids = [str(r["pageid"]) for r in rcs]
    for b in chunks(ids):
        params = {"pageids": "|".join(b), "prop": "links|pageprops|info", "plnamespace": PORTAL_NS[lang],
                  "pllimit": "max", "ppprop": "wikibase_item", "inprop": "talkid"}
        for q in query_all(lang, params):
            for p in q.get("pages", []):
                d = pages.setdefault(p["pageid"], {"links": set(), "qid": None, "missing": p.get("missing", False), "title": p.get("title")})
                d["links"].update(l["title"] for l in p.get("links", []))
                d["qid"] = d["qid"] or p.get("pageprops", {}).get("wikibase_item")
    # EN : bandeaux WikiProject Africa / pays sur la page de discussion
    wp = {}
    if lang == "en":
        names = {"Template:WikiProject Africa": "Q15"}
        for c in AFRICA: names["Template:WikiProject " + label(_ENT.get(c), "en")] = c
        titles = ["Talk:" + p["title"] for p in pages.values() if p.get("title") and not p["missing"]]
        for b in chunks(titles):
            for q in query_all("en", {"titles": "|".join(b), "prop": "templates", "tlnamespace": 10, "tllimit": "max"}):
                for p in q.get("pages", []):
                    hit = [names[t["title"]] for t in p.get("templates", []) if t["title"] in names]
                    if hit: wp.setdefault(p["title"][5:], set()).update(hit)
    qids = [p["qid"] for p in pages.values() if p["qid"]]
    ents = get_entities(qids)
    get_entities(indirect_targets([ents.get(q) for q in qids]), props="claims")
    linked, unlinked = [], []
    for r in rcs:
        p = pages.get(r["pageid"])
        if not p or p["missing"]: continue  # supprimé depuis
        port = sorted(t for t in p["links"] if t in portals[lang])
        cs = {portals[lang][t] for t in port} | wp.get(r["title"], set())
        m = africa_match(ents.get(p["qid"])) if p["qid"] else None
        row = {"wiki": lang, "titre": r["title"], "url": f"https://{lang}.wikipedia.org/wiki/" + r["title"].replace(" ", "_"),
               "cree": r["timestamp"], "auteur": r.get("user", ""), "octets": r.get("newlen", 0),
               "bot": bool(r.get("bot")), "qid": p["qid"] or "", "portails": ", ".join(t.split(":", 1)[1] for t in port),
               "wikiprojects": ", ".join(country_name(c, "en") for c in sorted(wp.get(r["title"], []))),
               "pays": ", ".join(sorted({country_name(c) for c in cs | set(m[0] if m else [])}))}
        if port or wp.get(r["title"]): linked.append(row)
        elif m:
            row["critere"] = m[1]; row["confiance"] = m[2]; unlinked.append(row)
    return linked, unlinked, len(rcs)

# ---------- Wikidata ----------
def wikidata(since, until):
    rcs = recent_new("wd", since, until)
    qids = [r["title"] for r in rcs if r["title"].startswith("Q")]
    ents = get_entities(qids, props="claims|labels|sitelinks|descriptions")
    get_entities(indirect_targets([ents.get(q) for q in qids]), props="claims")
    human, bots = [], []
    for r in rcs:
        e = ents.get(r["title"])
        if not e or "missing" in e: continue
        m = africa_match(e)
        if not m: continue
        tool = MASS_TOOLS.search((r.get("comment") or "") + " " + " ".join(r.get("tags", [])))
        kind = "bot" if r.get("bot") else ("humain (outil de masse)" if tool else "humain")
        d = e.get("descriptions", {})
        row = {"qid": r["title"], "url": "https://www.wikidata.org/wiki/" + r["title"], "libelle": label(e, "fr"),
               "description": (d.get("fr") or d.get("en") or {}).get("value", ""),
               "nature": ", ".join(label(_ENT.get(q)) or q for q in claim_ids(e, "P31")[:2]),
               "cree": r["timestamp"], "auteur": r.get("user", ""), "type_createur": kind,
               "pays": ", ".join(country_name(c) for c in m[0]), "critere": m[1], "confiance": m[2],
               "sitelinks": len(e.get("sitelinks", {}))}
        (bots if kind == "bot" else human).append(row)
    p31 = [q for rows in (human, bots) for r in rows for q in claim_ids(ents.get(r["qid"]), "P31")[:2]]
    get_entities(p31, props="labels")
    for rows in (human, bots):
        for r in rows: r["nature"] = ", ".join(label(_ENT.get(q)) or q for q in claim_ids(ents.get(r["qid"]), "P31")[:2])
    return human, bots, len(rcs)

# ---------- Export ----------
def write_xlsx(path, data):
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill
    from openpyxl.utils import get_column_letter
    wb = Workbook(); ws = wb.active; ws.title = "Résumé"
    ws.append(["Veille Afrique — Wikipédia & Wikidata"]); ws["A1"].font = Font(bold=True, size=14)
    ws.append(["Fenêtre (UTC)", data["since"] + " → " + data["until"]])
    ws.append(["Généré le", data["generated"]]); ws.append([])
    for k, v in data["counts"].items(): ws.append([k, v])
    ws.column_dimensions["A"].width = 48; ws.column_dimensions["B"].width = 48
    sheets = [("Wikipédia FR", data["fr"]), ("Wikipédia EN", data["en"]),
              ("Wikidata – humains", data["wd_humains"]), ("Wikidata – bots", data["wd_bots"]),
              ("Sans portail (à baliser)", data["fr_sans_portail"] + data["en_sans_portail"])]
    for name, rows in sheets:
        s = wb.create_sheet(name[:31])
        if not rows: s.append(["Aucun élément sur la période"]); continue
        cols = list(dict.fromkeys(k for r in rows for k in r.keys()))
        s.append(cols)
        for c in s[1]: c.font = Font(bold=True, color="FFFFFF"); c.fill = PatternFill("solid", fgColor="1F4E79")
        for r in rows:
            s.append([("oui" if v is True else "non" if v is False else v) for v in (r.get(k, "") for k in cols)])
            if "url" in cols:
                cell = s.cell(row=s.max_row, column=cols.index("url") + 1); cell.hyperlink = cell.value
        s.freeze_panes = "A2"; s.auto_filter.ref = s.dimensions
        for i, k in enumerate(cols, 1):
            s.column_dimensions[get_column_letter(i)].width = min(60, max(10, max(len(str(r.get(k, ""))) for r in rows[:200] + [{k: k}]) + 2))
    wb.save(path)

def rows_for_site(data):
    """Aplatit les listes en lignes pour le site (mêmes champs que l'ancien tableau de bord)."""
    wp = []
    for lang in ("fr", "en"):
        for statut, k in (("portail", lang), ("sans portail", lang + "_sans_portail")):
            for r in data[k]:
                wp.append({"id": f"{lang}:{r['titre']}", "wiki": lang.upper(), "statut": statut, "titre": r["titre"], "url": r["url"],
                           "cree": r["cree"], "auteur": r["auteur"], "octets": r["octets"], "pays": r["pays"] or "—",
                           "portails": r["portails"] or r.get("wikiprojects", ""), "qid": r["qid"], "critere": r.get("critere", ""),
                           "nouveau": r["nouveau_depuis_7h"]})
    wd = [{"qid": r["qid"], "url": r["url"], "libelle": r["libelle"] or r["qid"], "description": r["description"], "nature": r["nature"],
           "cree": r["cree"], "auteur": r["auteur"], "createur": r["type_createur"], "pays": r["pays"] or "—", "critere": r["critere"],
           "confiance": r["confiance"], "nouveau": r["nouveau_depuis_7h"]} for r in data["wd_humains"] + data["wd_bots"]]
    return wp, wd

def dump(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w") as f: json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))
    os.replace(tmp, path)  # écriture atomique

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--mode", choices=["auto", "matin", "midi"], default="auto")
    ap.add_argument("--since"); ap.add_argument("--until")
    ap.add_argument("--data-dir", default="data", help="racine des données publiées")
    ap.add_argument("--archive-days", type=int, default=30, help="nombre de jours d'archives conservés")
    ap.add_argument("--skip-wikidata", action="store_true")
    a = ap.parse_args()
    now = dt.datetime.now(dt.timezone.utc).replace(microsecond=0)
    mode = a.mode if a.mode != "auto" else ("matin" if now.hour < 12 else "midi")
    if a.since: mode = "manuel"
    today7 = now.replace(hour=7, minute=0, second=0)
    if today7 > now: today7 -= dt.timedelta(days=1)
    since = a.since or iso(today7 - dt.timedelta(days=1))  # J-1 07:00 UTC dans les deux modes
    until = a.until or iso(now)
    cutoff = iso(today7) if mode == "midi" else None
    D = a.data_dir; latest = os.path.join(D, "latest"); arch = os.path.join(D, "archive")
    t0 = time.time(); log = lambda m: print(f"[{time.time()-t0:6.0f}s] {m}", file=sys.stderr, flush=True)
    portals = build_portals(); log(f"portails : fr={len(portals['fr'])} en={len(portals['en'])}")
    data = {"since": since, "until": until, "generated": iso(now), "mode": mode, "cutoff_nouveau": cutoff}
    tot = {}
    for lang in ("fr", "en"):
        data[lang], data[lang + "_sans_portail"], tot[lang] = wikipedia(lang, since, until, portals)
        log(f"{lang}: {tot[lang]} créations, {len(data[lang])} liées à un portail africain")
    if a.skip_wikidata: data["wd_humains"], data["wd_bots"], tot["wd"] = [], [], 0
    else:
        data["wd_humains"], data["wd_bots"], tot["wd"] = wikidata(since, until)
        log(f"wd: {tot['wd']} créations, {len(data['wd_humains'])} humaines + {len(data['wd_bots'])} bots en Afrique")
    keys = ["fr", "en", "wd_humains", "wd_bots", "fr_sans_portail", "en_sans_portail"]
    for k in keys:
        for r in data[k]: r["nouveau_depuis_7h"] = bool(cutoff and r["cree"] >= cutoff)
        data[k].sort(key=lambda r: r["cree"], reverse=True)
    data["counts"] = {
        "Créations Wikipédia FR (toutes)": tot["fr"], "Wikipédia FR – liées à un portail africain": len(data["fr"]),
        "Créations Wikipédia EN (toutes)": tot["en"], "Wikipédia EN – portail / WikiProject africain": len(data["en"]),
        "Créations Wikidata (toutes)": tot["wd"], "Wikidata Afrique – humains": len(data["wd_humains"]),
        "Wikidata Afrique – bots": len(data["wd_bots"]),
        "Articles africains SANS portail (FR+EN, via Wikidata)": len(data["fr_sans_portail"]) + len(data["en_sans_portail"])}
    nouveaux = sum(r["nouveau_depuis_7h"] for k in keys for r in data[k]) if cutoff else None
    if cutoff: data["counts"]["Nouveaux depuis 07:00 UTC (toutes listes)"] = nouveaux

    wp, wd = rows_for_site(data)
    run_id = until[:10] + "_" + mode
    meta = {"schema": 1, "id": run_id, "debut": since, "fin": until, "genere": iso(now), "mode": mode, "coupure": cutoff or "",
            "totaux": {"fr": tot["fr"], "en": tot["en"], "wd": tot["wd"]},
            "compteurs": {"fr": len(data["fr"]), "en": len(data["en"]), "wd_humains": len(data["wd_humains"]),
                          "wd_bots": len(data["wd_bots"]), "a_baliser": len(data["fr_sans_portail"]) + len(data["en_sans_portail"]),
                          "nouveaux": nouveaux},
            "requetes_api": NREQ[0]}
    dump(os.path.join(latest, "meta.json"), meta)
    dump(os.path.join(latest, "wikipedia.json"), wp)
    dump(os.path.join(latest, "wikidata.json"), wd)
    write_xlsx(os.path.join(latest, "veille_afrique.xlsx"), data)

    # Archive du passage (listes complètes) + index, avec rétention
    dump(os.path.join(arch, run_id + ".json"), {"meta": meta, "wikipedia": wp, "wikidata": wd})
    limit = (now - dt.timedelta(days=a.archive_days)).strftime("%Y-%m-%d")
    for f in os.listdir(arch):
        if f.endswith(".json") and f != "index.json" and f[:10] < limit: os.remove(os.path.join(arch, f))
    runs = sorted((f[:-5] for f in os.listdir(arch) if f.endswith(".json") and f != "index.json"), reverse=True)
    dump(os.path.join(arch, "index.json"), runs)

    # Historique : une ligne par passage, pour suivre la progression jour après jour
    hpath = os.path.join(D, "historique.json"); hist = []
    if os.path.exists(hpath):
        try:
            h = json.load(open(hpath)); hist = h if isinstance(h, list) else h.get("rows", [])
        except Exception as ex:
            log(f"historique illisible, repris à zéro : {ex}")
    row = {"id": run_id, "jour": until[:10], "passage": mode, "debut": since, "fin": until, **meta["compteurs"],
           "total_fr": tot["fr"], "total_en": tot["en"], "total_wd": tot["wd"]}
    row.pop("nouveaux", None)
    hist = [r for r in hist if r.get("id") != run_id] + [row]
    hist.sort(key=lambda r: (r.get("jour", ""), r.get("passage", "")))
    dump(hpath, hist)

    resume = f"Fenêtre {since} → {until}\n" + "\n".join(f"{k} : {v}" for k, v in data["counts"].items()) + "\n"
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a") as f: f.write("### Veille Afrique — " + run_id + "\n```\n" + resume + "```\n")
    log(f"terminé — {NREQ[0]} requêtes API"); print(resume)

if __name__ == "__main__":
    main()

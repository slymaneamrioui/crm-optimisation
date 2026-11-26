#!/usr/bin/env python3
"""Leads du matin : dépose N leads dans la boîte d'arrivée du CRM.

Variables d'environnement :
  ROBOT_PASSWORD   mot de passe du compte robot (jamais dans le dépôt)
  DESTINATAIRE     courriel de connexion du propriétaire du CRM
  NB_LEADS         nombre de leads (défaut 15)
  CODES_POSTAUX    liste séparée par des virgules (défaut : zone de Fumel)
  ESSAI=1          n'écrit rien, affiche seulement la sélection
"""
import json, os, re, sys, time, urllib.parse, urllib.request

API_KEY = "AIzaSyAnFH0OW8hDrTS9hbXFNsiIJB6HXwSe3ds"
PROJET = "crm-optimisation-8d0cc"
ROBOT = "robot-leads@crm-optimisation-8d0cc.firebaseapp.com"
REFERER = "https://slymaneamrioui.github.io/crm-optimisation/"
FS = f"https://firestore.googleapis.com/v1/projects/{PROJET}/databases/(default)/documents"

# commerces qui consomment beaucoup d'énergie (fours, froid, cuisson, lavage)
SECTEURS = {
    "10.71C": "Boulangeries-pâtisseries", "10.71D": "Boulangeries-pâtisseries", "47.24Z": "Boulangeries-pâtisseries",
    "10.13A": "Boucheries-charcuteries", "10.13B": "Boucheries-charcuteries", "47.22Z": "Boucheries-charcuteries",
    "56.10A": "Restaurants", "56.10C": "Restaurants", "56.30Z": "Bars et cafés", "55.10Z": "Hôtels",
    "47.11B": "Commerces alimentaires", "47.11C": "Commerces alimentaires", "47.11D": "Commerces alimentaires",
    "47.21Z": "Commerces alimentaires", "47.29Z": "Commerces alimentaires", "10.51C": "Commerces alimentaires",
    "96.01A": "Pressings et laveries", "96.01B": "Pressings et laveries",
}
TRANCHES = "01,02,03,11"  # 1 à 19 salariés
TR = {"01": "1 à 2 salariés", "02": "3 à 5 salariés", "03": "6 à 9 salariés", "11": "10 à 19 salariés"}


def http(url, data=None, method=None, token=None):
    h = {"Referer": REFERER, "Content-Type": "application/json", "User-Agent": "crm-optimisation-leads/1.0"}
    if token:
        h["Authorization"] = "Bearer " + token
    body = json.dumps(data).encode() if data is not None else None
    for essai in range(4):
        req = urllib.request.Request(url, data=body, headers=h, method=method or ("POST" if body else "GET"))
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.status, json.loads(r.read() or b"{}")
        except urllib.error.HTTPError as e:
            if e.code == 429 and essai < 3:
                time.sleep(2 * (essai + 1)); continue
            try:
                return e.code, json.loads(e.read() or b"{}")
            except Exception:
                return e.code, {}
        except (urllib.error.URLError, ConnectionError, TimeoutError) as e:
            if essai < 3:
                time.sleep(3 * (essai + 1)); continue
            return 0, {"error": {"message": str(e)}}
    return 0, {}


def tcase(s):
    s = str(s or "").lower()
    return re.sub(r"(^|[\s\-'’(])([a-zà-ÿ])", lambda m: m.group(1) + m.group(2).upper(), s)


def nom_usage(n):
    return tcase(re.sub(r"\s*\(.*?\)\s*", " ", str(n or "")).strip())


def lead(e, cp):
    s = e.get("siege") or {}
    ms = [m for m in (e.get("matching_etablissements") or []) if m.get("adresse")]
    et = next((m for m in ms if m.get("etat_administratif") != "F"), ms[0] if ms else s)
    if e.get("etat_administratif") == "F" or et.get("etat_administratif") == "F" or e.get("nombre_etablissements_ouverts") == 0:
        return None, "fermée"
    if e.get("opposition_diffusion_commerciale") is True or e.get("statut_diffusion") == "P":
        return None, "opposée à la prospection"
    ens = (et.get("liste_enseignes") or s.get("liste_enseignes") or [None])[0] or et.get("nom_commercial") or s.get("nom_commercial") or ""
    raison = re.sub(r"\s*\(.*\)\s*$", "", str(e.get("nom_raison_sociale") or e.get("nom_complet") or ""))
    dirs = e.get("dirigeants") or []
    phys = [d for d in dirs if (d.get("type_dirigeant") or d.get("type")) == "personne physique"]
    pers = [(tcase(str(d.get("prenoms") or "").split(" ")[0]), nom_usage(d.get("nom")), d.get("qualite") or "") for d in phys]
    ei = (e.get("complements") or {}).get("est_entrepreneur_individuel") or e.get("nature_juridique") == "1000"
    if not pers and ei and raison:
        w = raison.split()
        pers = [(tcase(w[0]), tcase(" ".join(w[1:])), "Entrepreneur individuel")]
    g = pers[0] if pers else ("", "", "")
    naf = e.get("activite_principale") or s.get("activite_principale") or ""
    return {
        "societe": tcase(ens or raison), "enseigne": tcase(ens), "raisonSociale": tcase(raison),
        "prenom": g[0], "nom": g[1], "fonction": g[2],
        "dirigeants": ", ".join((" ".join(x for x in p[:2] if x) + (f" ({p[2]})" if p[2] else "")) for p in pers[:3]),
        "adresse": tcase(et.get("adresse") or s.get("adresse") or ""), "cp": et.get("code_postal") or s.get("code_postal") or cp,
        "ville": tcase(et.get("libelle_commune") or s.get("libelle_commune") or ""),
        "siren": str(e.get("siren") or ""), "siret": et.get("siret") or s.get("siret") or "",
        "naf": naf, "secteur": SECTEURS.get(naf, "Autre"), "effectif": TR.get(e.get("tranche_effectif_salarie"), ""),
        "dateCreation": e.get("date_creation") or "",
    }, None


def fs_val(v):
    if isinstance(v, list):
        return {"arrayValue": {"values": [fs_val(x) for x in v]}}
    return {"stringValue": str(v)}


def main():
    essai = os.environ.get("ESSAI") == "1"
    n = int(os.environ.get("NB_LEADS", "15"))
    cps = [c.strip() for c in os.environ.get("CODES_POSTAUX", "47500,46700,24550,47150").split(",") if c.strip()]
    dest = os.environ.get("DESTINATAIRE", "").strip().lower()
    token = None
    deja = set()
    if not essai:
        pw = os.environ.get("ROBOT_PASSWORD")
        if not pw or not dest:
            sys.exit("ROBOT_PASSWORD et DESTINATAIRE sont obligatoires")
        st, r = http(f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={API_KEY}",
                     {"email": ROBOT, "password": pw, "returnSecureToken": True})
        if st != 200:
            sys.exit(f"Connexion du robot refusée : {r.get('error', {}).get('message')}")
        token = r["idToken"]
        st, r = http(f"{FS}/robot/livres", token=token)
        if st == 200:
            deja = {v.get("stringValue") for v in r.get("fields", {}).get("sirens", {}).get("arrayValue", {}).get("values", [])}
        elif st != 404:
            sys.exit(f"Lecture du registre refusée ({st}) : vérifie les règles Firestore")

    choisis, ecartes = [], {}
    for cp in cps:
        page, pages = 1, 1
        while page <= pages and len(choisis) < n:
            q = urllib.parse.urlencode({"code_postal": cp, "activite_principale": ",".join(SECTEURS),
                                        "tranche_effectif_salarie": TRANCHES, "etat_administratif": "A",
                                        "per_page": 25, "page": page})
            st, j = http("https://recherche-entreprises.api.gouv.fr/search?" + q)
            if st != 200:
                print(f"Annuaire indisponible pour {cp} (erreur {st})"); break
            pages = j.get("total_pages") or 1
            page += 1
            for e in j.get("results", []):
                if len(choisis) >= n:
                    break
                l, raison = lead(e, cp)
                if not l:
                    ecartes[raison] = ecartes.get(raison, 0) + 1; continue
                if l["siren"] in deja or any(c["siren"] == l["siren"] for c in choisis):
                    ecartes["déjà livrée"] = ecartes.get("déjà livrée", 0) + 1; continue
                choisis.append(l)
            time.sleep(0.3)
        if len(choisis) >= n:
            break

    jour = time.strftime("%Y-%m-%d")
    if not essai:
        for l in choisis:
            doc = dict(l, pour=dest, origine="Leads du matin", livreLe=jour)
            st, r = http(f"{FS}/arrivees", {"fields": {k: fs_val(v) for k, v in doc.items() if v != ""}}, token=token)
            if st != 200:
                sys.exit(f"Dépôt refusé ({st}) : {r.get('error', {}).get('message')}")
        tous = sorted(deja | {l["siren"] for l in choisis})
        st, r = http(f"{FS}/robot/livres", {"fields": {"sirens": fs_val(tous), "maj": fs_val(jour)}}, method="PATCH", token=token)
        if st != 200:
            print(f"Attention : registre non mis à jour ({st})")

    print(f"{len(choisis)} lead(s) {'sélectionné(s)' if essai else 'déposé(s)'} le {jour}.")
    for l in choisis:
        print(f"- {l['societe']} ({l['secteur']}, {l['ville']} {l['cp']}) – {(l['prenom'] + ' ' + l['nom']).strip() or 'gérant inconnu'}")
    if ecartes:
        print("Écartées : " + ", ".join(f"{v} {k}" for k, v in ecartes.items()))
    if len(choisis) < n:
        print(f"Seulement {len(choisis)} lead(s) disponibles dans la zone.")


if __name__ == "__main__":
    main()

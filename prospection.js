/* =====================================================================
   PROSPECTION — espace séparé du CRM clients
   Les prospects vivent dans leur propre collection « prospects ».
   Un prospect devient client (collection « clients ») seulement quand
   un rendez-vous est pris, ou quand on le convertit à la main.
   ===================================================================== */
(function(){
"use strict";

/* ---------- référentiels ---------- */
const SECTEURS=[
  {k:"Restaurants",naf:["56.10A","56.10C"],pl:"restaurants",postes:"d'énergie, de téléphone et de linge"},
  {k:"Bars et cafés",naf:["56.30Z"],pl:"bars et cafés",postes:"d'énergie et de téléphone"},
  {k:"Hôtels",naf:["55.10Z","55.20Z"],pl:"hôtels",postes:"d'énergie, de téléphone et de linge"},
  {k:"Boulangeries-pâtisseries",naf:["10.71C","10.71D","47.24Z"],pl:"boulangeries",postes:"d'électricité, de gaz et de téléphone"},
  {k:"Boucheries-charcuteries",naf:["10.13B","47.22Z"],pl:"boucheries",postes:"d'électricité, de téléphone et de vêtements de travail"},
  {k:"Garages auto",naf:["45.20A","45.20B"],pl:"garages",postes:"d'énergie, de téléphone et de vêtements de travail"},
  {k:"Coiffure et esthétique",naf:["96.02A","96.02B"],pl:"salons",postes:"d'énergie, de téléphone et de linge"},
  {k:"Commerces alimentaires",naf:["47.11B","47.11C","47.11D"],pl:"commerces",postes:"d'électricité et de téléphone"},
  {k:"Pharmacies",naf:["47.73Z"],pl:"pharmacies",postes:"d'énergie et de téléphone"},
  {k:"Artisans du bâtiment",naf:["43.21A","43.22A","43.22B","43.32A","43.34Z"],pl:"artisans",postes:"d'énergie, de téléphone et de vêtements de travail"},
  {k:"Cabinets (comptables, avocats…)",naf:["69.10Z","69.20Z"],pl:"cabinets",postes:"de téléphone, de logiciels et d'énergie"}
];
const SEC=k=>SECTEURS.find(x=>x.k===k);
const TRANCHES=[["01","1-2"],["02","3-5"],["03","6-9"],["11","10-19"],["12","20-49"]];
const TR_LABEL={"00":"0 salarié","01":"1 à 2 salariés","02":"3 à 5 salariés","03":"6 à 9 salariés","11":"10 à 19 salariés","12":"20 à 49 salariés","21":"50 à 99 salariés","NN":"Non renseigné"};
const PST=[{k:"Nouveau",c:"#706e6b"},{k:"Pas de réponse",c:"#dd7a01"},{k:"À rappeler",c:"#0176d3"},{k:"Pas intéressé",c:"#ba0517"},{k:"Fermé",c:"#3e3e3c"},{k:"Converti en client",c:"#2e844a"}];
const PSC=Object.fromEntries(PST.map(x=>[x.k,x.c]));
const A_APPELER=["Nouveau","Pas de réponse","À rappeler"];

const DEF={
  profil:{prenom:"",societe:"",tel:"",email:""},
  script:"Bonjour {prenom}, {moi} de {masociete}. On aide les {secteur} de {ville} à baisser leurs factures {postes}. Depuis janvier, les prix de l'électricité suivent le marché, et beaucoup d'entreprises paient trop cher sans le savoir. On fait l'audit gratuitement, et on n'est payés que si vous économisez. Vous êtes sous contrat avec qui pour l'électricité, et il se termine quand ?",
  objections:[
    {q:"« J'ai déjà un courtier. »",r:"Parfait. Il s'occupe aussi de votre téléphonie et de votre linge ? On peut commencer par ces deux postes-là."},
    {q:"« Les courtiers, c'est des arnaques. »",r:"Vous avez raison de vous méfier. Chez nous : rémunération écrite dès le départ, comparatif complet, et vous payez seulement après avoir vu l'économie sur votre facture."},
    {q:"« Je n'ai pas le temps. »",r:"Vous m'envoyez 3 factures en photo, je fais tout le reste. 20 minutes de votre temps au total."},
    {q:"« Je suis engagé jusqu'en 2027. »",r:"Justement : on note votre échéance et on lance la négociation 6 mois avant. Et sur le télécom, vous êtes engagé aussi ?"},
    {q:"« Je suis content de mon fournisseur. »",r:"Très bien, on ne vous fera pas changer pour rien. L'audit vous dit si vous êtes au bon prix ; si oui, ça ne vous coûte rien."}
  ],
  messages:[
    {id:"m1",nom:"Premier contact",canal:"email",sujet:"Vos factures d'énergie et de téléphone – {societe}",
     corps:"Bonjour {prenom},\n\nJe suis {moi}, de {masociete}. J'aide les {secteur} à baisser leurs factures {postes}.\n\nDepuis janvier 2026, les prix de l'électricité professionnelle suivent le marché, et beaucoup d'entreprises paient trop cher sans le savoir.\n\nMa proposition : un audit gratuit de vos factures. Je ne suis payé que si vous économisez, et seulement après avoir vu l'économie sur votre facture.\n\nAvez-vous 10 minutes cette semaine pour en parler ?\n\n{moi}\n{masociete}\n{montel}\n\nSi vous ne souhaitez plus recevoir de message de ma part, répondez simplement STOP."},
    {id:"m2",nom:"Après un appel sans réponse",canal:"sms",sujet:"",
     corps:"Bonjour {prenom}, {moi} de {masociete}. J'ai essayé de vous joindre au sujet de vos factures {postes} : audit gratuit, payé uniquement si vous économisez. Quand puis-je vous rappeler ? (STOP pour ne plus être contacté)"},
    {id:"m3",nom:"Confirmation de rendez-vous",canal:"sms",sujet:"",
     corps:"Bonjour {prenom}, je vous confirme notre rendez-vous {rdv}. Préparez si possible vos dernières factures d'électricité, de téléphone et de linge (une photo suffit). À bientôt, {moi} – {masociete}"},
    {id:"m4",nom:"Demande de factures pour l'audit",canal:"email",sujet:"Vos factures pour l'audit gratuit – {societe}",
     corps:"Bonjour {prenom},\n\nMerci pour notre échange. Pour réaliser l'audit gratuit, pouvez-vous m'envoyer (une photo ou un PDF suffit) :\n\n- Électricité et gaz : vos 12 dernières factures et votre contrat (date de fin, puissance souscrite)\n- Téléphone et internet : vos 3 dernières factures\n- Linge et vêtements de travail : votre contrat et vos dernières factures\n\nJe vous présente ensuite un comparatif écrit. Vous ne payez rien tant que vous n'avez pas vu l'économie sur votre facture.\n\nBonne journée,\n{moi}\n{masociete}\n{montel}"},
    {id:"m5",nom:"Relance après proposition",canal:"email",sujet:"Votre comparatif – {societe}",
     corps:"Bonjour {prenom},\n\nAvez-vous pu regarder le comparatif que je vous ai envoyé ? Je reste disponible pour en parler 10 minutes, par téléphone ou sur place.\n\nPour rappel, vous ne payez mes honoraires qu'après avoir constaté l'économie sur votre facture.\n\n{moi}\n{masociete}\n{montel}"}
  ]
};

/* ---------- état ---------- */
let prospects=new Map();
let reg=JSON.parse(JSON.stringify(DEF));
let pdb=null;
const P={
  search:{secteur:"Restaurants",lieu:"",q:"",tr:TRANCHES.map(t=>t[0]),results:[],page:0,pages:0,total:0,loading:false,err:"",cps:null,villeLabel:""},
  filter:"À appeler",secFilter:"",sessSec:"",skipped:new Set(),panel:null,draft:null
};
const iso=()=>new Date().toISOString();
const tcase=s=>String(s||"").toLowerCase().replace(/(^|[\s\-'’(])([a-zà-ÿ])/g,(m,a,b)=>a+b.toUpperCase());
const plist=()=>[...prospects.values()];
const today=()=>todayStr();

/* ---------- données ---------- */
claude.use("db").then(d=>{
  if(!d)return;pdb=d;
  // leads du matin : on les range dans « Mes prospects » puis on vide la boîte d'arrivée
  if(d.inbox){let first=true;const done=new Set();d.inbox.listen(async items=>{
    const known=knownSirens();let n=0;
    for(const it of items){if(done.has(it.id))continue;done.add(it.id);
      if(it.siren&&known.has(String(it.siren))){
        // fiche déjà présente : on complète seulement ce qui manque (numéro, notes)
        const ex=plist().find(x=>String(x.siren||"")===String(it.siren));
        if(ex){let ch=false;
          if(it.tel&&!ex.tel){ex.tel=String(it.tel).slice(0,40);ch=true;n++}
          if(it.siteWeb&&!ex.siteWeb&&safeUrl(it.siteWeb)){ex.siteWeb=safeUrl(it.siteWeb);ch=true;if(!it.tel)n++}
          if(it.notes&&!(ex.notes||"").includes(it.notes)){ex.notes=((ex.notes?ex.notes+"\n":"")+String(it.notes)).slice(0,2000);ch=true}
          if(ch)await saveP(ex);}
        d.inbox.remove(it.id);continue}
      const ref=d.collection("prospects").doc();
      const keep=["societe","enseigne","raisonSociale","prenom","nom","fonction","dirigeants","adresse","cp","ville","siren","siret","naf","effectif","dateCreation","secteur","tel","siteWeb","notes"];
      const pr={statut:"Nouveau",tel:"",email:"",notes:"",nbAppels:0,historique:[],createdAt:iso(),origine:it.origine||"Leads du matin",verifieLe:today()};
      keep.forEach(k=>{if(it[k]!=null&&it[k]!=="")pr[k]=String(it[k]).slice(0,500)});
      if(pr.siteWeb&&!safeUrl(pr.siteWeb))delete pr.siteWeb;
      pr.id=ref.id;prospects.set(ref.id,pr);await saveP(pr);known.add(String(it.siren||""));n++;
      d.inbox.remove(it.id);
    }
    if(n){toast("📥 "+n+" lead"+(n>1?"s":"")+" du matin ajouté"+(n>1?"s":"")+" ou complété"+(n>1?"s":"")+" dans Mes prospects");renderNav();if(state.view.startsWith("p-"))render()}
    first=false;
  })}
  d.collection("prospects").onSnapshot(s=>{
    prospects=new Map(s.docs.map(x=>[x.id,{...JSON.parse(JSON.stringify(x.data()||{})),id:x.id}]));
    if(state.view.startsWith("p-"))softRender();else renderNav();
  },()=>{});
  d.collection("reglages").onSnapshot(s=>{
    const doc=s.docs.find(x=>x.id==="prospection");
    if(doc){const v=doc.data()||{};reg={profil:{...DEF.profil,...(v.profil||{})},script:v.script||DEF.script,objections:v.objections||DEF.objections,messages:v.messages||DEF.messages,google:v.google||null}}
    if(state.view.startsWith("p-"))softRender();
  },()=>{});
});
function saveP(p){if(!pdb)return;const b=JSON.parse(JSON.stringify(p));delete b.id;b.updatedAt=iso();return pdb.collection("prospects").doc(p.id).set(b)}
function saveReg(){if(!pdb)return;return pdb.collection("reglages").doc("prospection").set(JSON.parse(JSON.stringify(reg)))}

/* ---------- file d'appels ---------- */
function queue(){
  const t=today();
  return plist().filter(p=>A_APPELER.includes(p.statut||"Nouveau")&&(!p.prochainAppel||p.prochainAppel<=t)&&!P.skipped.has(p.id)&&(!P.sessSec||p.secteur===P.sessSec))
    .sort((a,b)=>{const r=x=>x.statut==="À rappeler"?0:x.statut==="Pas de réponse"?1:2;return r(a)-r(b)||(a.prochainAppel||"").localeCompare(b.prochainAppel||"")||(a.createdAt||"").localeCompare(b.createdAt||"")});
}
function aAppelerCount(){const t=today();return plist().filter(p=>A_APPELER.includes(p.statut||"Nouveau")&&(!p.prochainAppel||p.prochainAppel<=t)).length}
function statsJour(){
  const t=today();let appels=0,rdv=0;
  plist().forEach(p=>(p.historique||[]).forEach(h=>{if(h.date===t&&h.type==="appel"&&!h.converti){appels++;if(String(h.resultat||"").startsWith("RDV pris"))rdv++}}));
  return{appels,rdv};
}
// l'anneau d'objectif du jour compte aussi les appels de prospection
window.goalCount=function(){const t=today();let n=0;list().forEach(c=>(c.activites||[]).forEach(a=>{if(a.date===t)n++}));plist().forEach(p=>(p.historique||[]).forEach(h=>{if(h.date===t&&!h.converti)n++}));return n};

window.renderProspectionNav=function(){
  const n=aAppelerCount();
  [["#pCount",n],["#tabPCount",n]].forEach(([sel,v])=>{const el=document.querySelector(sel);if(el){el.hidden=!v;el.textContent=v}});
};

/* ---------- remplissage des modèles ---------- */
function fmtRdv(v){
  if(!v)return"";const d=new Date(v.length===10?v+"T12:00":v);if(isNaN(d))return"";
  let s="du "+d.toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long"});
  if(v.length>10)s+=" à "+d.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}).replace(":"," h ");
  return s;
}
function fill(tpl,o){
  o=o||{};const sec=SEC(o.secteur);const pr=reg.profil||{};
  const v={prenom:o.prenom||"",nom:o.nom||"",societe:o.societe||"",ville:o.ville||"votre ville",secteur:sec?sec.pl:"entreprises",postes:sec?sec.postes:"d'énergie, de téléphone et de linge",
    moi:pr.prenom||"[ton prénom]",masociete:pr.societe||"[ta société]",montel:pr.tel||"",moncourriel:pr.email||"",rdv:fmtRdv(o.rdv)||"(date à préciser)"};
  return String(tpl||"").replace(/\{(\w+)\}/g,(m,k)=>k in v?v[k]:m).replace(/Bonjour ,/g,"Bonjour,").replace(/[ \t]+\n/g,"\n").replace(/\n{3,}/g,"\n\n").trim();
}

/* ---------- rendu ---------- */
const SUBS=[["p-recherche","🔍 Trouver"],["p-liste","📋 Mes prospects"],["p-appels","📞 Appels"],["p-scripts","💬 Scripts"],["p-messages","✉️ Messages"]];
function head(title,sub){
  return `<div class="p-head"><div class="p-eyebrow">Prospection</div><div class="page-h" style="margin-bottom:10px"><h1>${title}</h1>${sub?`<span class="sub">${sub}</span>`:""}</div>
  <div class="p-subnav">${SUBS.map(([v,l])=>`<button data-v="${v}" class="${state.view===v?"on":""}">${l}${v==="p-liste"&&aAppelerCount()?` <span class="p-badge">${aAppelerCount()}</span>`:""}</button>`).join("")}</div></div>`;
}
function ppill(st){st=st||"Nouveau";const c=PSC[st]||"#777";return `<span class="pill" style="background:${c}1f;color:${c}"><span class="dot" style="background:${c}"></span>${esc(st)}</span>`}
function gLink(o,label){const q=encodeURIComponent([o.societe,o.ville,"téléphone"].filter(Boolean).join(" "));return `<a class="btn sm" href="https://www.google.com/search?q=${q}" target="_blank" rel="noopener">${label||"🔎 Trouver le numéro"}</a>`}

window.renderProspection=function(v){
  if(v==="p-recherche")return rRecherche();
  if(v==="p-liste")return rListe();
  if(v==="p-appels")return rAppels();
  if(v==="p-scripts")return rScripts();
  if(v==="p-messages")return rMessages();
};

/* 1. Trouver des prospects */
function knownSirens(){const s=new Set();plist().forEach(p=>p.siren&&s.add(p.siren));list().forEach(c=>c.siren&&s.add(String(c.siren).replace(/\s/g,"")));return s}
function rRecherche(){
  const S=P.search,known=knownSirens();
  const fresh=S.results.filter(r=>!known.has(r.siren));
  $("#main").innerHTML=head("Trouver des prospects","Annuaire officiel des entreprises françaises (SIRENE)")+googleCard()+genCard()+`
  <div class="card" style="margin-bottom:14px"><div class="card-h">🔍 Recherche manuelle</div><div class="card-b">
   <form id="xSearch" class="form" style="grid-template-columns:repeat(3,1fr)">
    <div class="f"><label>Secteur</label><select name="secteur"><option value="">Tous secteurs (mot-clé)</option>${SECTEURS.map(x=>`<option ${S.secteur===x.k?"selected":""}>${esc(x.k)}</option>`).join("")}</select></div>
    <div class="f"><label>Ville, code postal ou département</label><input name="lieu" value="${esc(S.lieu)}" placeholder="Ex. Lyon, 69003 ou 69"></div>
    <div class="f"><label>Mot-clé (facultatif)</label><input name="q" value="${esc(S.q)}" placeholder="Ex. pizzeria, boulangerie bio"></div>
    <div class="f full"><label>Taille de l'entreprise</label><div class="p-checks">${TRANCHES.map(([c,l])=>`<label class="chip ${S.tr.includes(c)?"on":""}"><input type="checkbox" name="tr" value="${c}" ${S.tr.includes(c)?"checked":""} hidden>${l} salariés</label>`).join("")}</div></div>
    <div class="f full" style="flex-direction:row;gap:8px"><button class="btn primary" ${S.loading?"disabled":""}>${S.loading&&!S.results.length?"Recherche…":"🔍 Rechercher"}</button></div>
   </form></div></div>
  ${S.err?`<div class="banner">${esc(S.err)}</div>`:""}
  ${S.results.length?`<div class="card"><div class="card-h">${S.total.toLocaleString("fr-FR")} entreprise${S.total>1?"s":""} trouvée${S.total>1?"s":""}${S.villeLabel?" · "+esc(S.villeLabel):""}${S.fermes?`<span class="small muted" style="font-weight:400">· ${S.fermes} fermée${S.fermes>1?"s":""} masquée${S.fermes>1?"s":""}</span>`:""}${S.opposees?`<span class="small muted" style="font-weight:400">· ${S.opposees} opposée${S.opposees>1?"s":""} à la prospection, masquée${S.opposees>1?"s":""}</span>`:""}
     ${fresh.length?`<button class="btn sm primary ml-auto" data-xaddall>+ Ajouter les ${fresh.length} affichées</button>`:""}</div>
    ${S.results.map(r=>`<div class="list-row" style="cursor:default;flex-wrap:nowrap"><div class="avatar" style="background:${avatarColor(r.societe)}">${esc(initials(r.societe))}</div>
      <div class="grow"><div class="ellip" style="font-weight:600">${esc(r.societe)}</div>
       <div class="small muted ellip">${esc(r.effectif||"")}${r.adresse?" · "+esc(tcase(r.adresse)):r.ville?" · "+esc(r.cp+" "+r.ville):""}</div>
       <div class="small muted ellip">${r.dirigeants?"👤 "+esc(r.dirigeants):""}</div></div>
      <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end">${known.has(r.siren)?`<span class="tag soon">Déjà dans ta liste</span>`:`<button class="btn sm primary" data-xadd="${esc(r.siren)}">+ Ajouter</button>`}</div></div>`).join("")}
    ${S.page<S.pages?`<div style="padding:12px;text-align:center"><button class="btn" data-xmore ${S.loading?"disabled":""}>${S.loading?"Chargement…":"Voir plus de résultats"}</button></div>`:""}
  </div>`:!S.loading&&!S.err?`<div class="card"><div class="empty"><div class="big">🎯</div>Choisis un secteur et une ville, puis lance la recherche.<br><span class="small">Les entreprises ajoutées vont dans « Mes prospects », pas dans tes clients.</span></div></div>`:""}`;
  bindGoogleForm();bindGen();
  const f=$("#xSearch");
  f.querySelectorAll(".p-checks label").forEach(l=>l.addEventListener("click",e=>{e.preventDefault();const cb=l.querySelector("input");cb.checked=!cb.checked;l.classList.toggle("on",cb.checked)}));
  f.addEventListener("submit",e=>{e.preventDefault();S.secteur=f.secteur.value;S.lieu=f.lieu.value.trim();S.q=f.q.value.trim();S.tr=[...f.querySelectorAll("input[name=tr]:checked")].map(x=>x.value);if(!S.tr.length)S.tr=TRANCHES.map(t=>t[0]);search(false)});
}
function bindGoogleForm(){
  const g=$("#xgk");if(!g)return;
  g.addEventListener("submit",async e=>{e.preventDefault();const key=g.key.value.trim();
    reg.google={key,auto:g.auto.checked};P.showKey=false;await saveReg();gLoad=null;
    if(key){try{await loadGoogle(key);toast("✓ Clé enregistrée")}catch(x){toast(x.message);P.showKey=true}}
    render()});
}
function mapEnt(e){
  const s=e.siege||{};const dirs=e.dirigeants||[];
  // l'établissement trouvé dans la zone recherchée (sinon le siège)
  const ms=(e.matching_etablissements||[]).filter(x=>x&&x.adresse);
  const et=ms.find(x=>x.etat_administratif!=="F")||ms[0]||s;
  const ferme=e.etat_administratif==="F"||et.etat_administratif==="F"||(!ms.length&&s.etat_administratif==="F")||e.nombre_etablissements_ouverts===0;
  // l'entreprise refuse l'utilisation de ses données pour la prospection commerciale : on la respecte
  const opposition=e.opposition_diffusion_commerciale===true||e.statut_diffusion==="P";
  const ens=(et.liste_enseignes&&et.liste_enseignes[0])||(s.liste_enseignes&&s.liste_enseignes[0])||et.nom_commercial||s.nom_commercial||"";
  const raison=String(e.nom_raison_sociale||e.nom_complet||"").replace(/\s*\(.*\)\s*$/,"");
  const ei=!!((e.complements&&e.complements.est_entrepreneur_individuel)||e.nature_juridique==="1000");
  const phys=d=>(d.type_dirigeant||d.type)==="personne physique";
  const nomUsage=n=>tcase(String(n||"").replace(/\s*\(.*?\)\s*/g," ").trim());
  let pers=dirs.filter(phys).map(d=>({prenom:tcase(String(d.prenoms||"").split(/\s+/)[0]),nom:nomUsage(d.nom),fonction:d.qualite||""}));
  if(!pers.length&&ei&&raison){const w=raison.trim().split(/\s+/);pers=[{prenom:tcase(w[0]),nom:tcase(w.slice(1).join(" ")),fonction:"Entrepreneur individuel"}]}
  const morales=dirs.filter(d=>!phys(d)).map(d=>tcase(d.denomination||"")).filter(Boolean);
  const g=pers[0]||null;
  return{siren:String(e.siren||""),siret:et.siret||s.siret||"",
    societe:tcase(ens||raison),raisonSociale:tcase(raison),enseigne:tcase(ens),
    adresse:et.adresse||s.adresse||"",cp:et.code_postal||s.code_postal||"",ville:tcase(et.libelle_commune||s.libelle_commune||""),
    naf:e.activite_principale||s.activite_principale||"",effectif:TR_LABEL[e.tranche_effectif_salarie]||TR_LABEL[s.tranche_effectif_salarie]||"",dateCreation:e.date_creation||"",
    dirigeants:[...pers.map(d=>[d.prenom,d.nom].filter(Boolean).join(" ")+(d.fonction?" ("+d.fonction+")":"")),...morales].slice(0,4).join(", "),
    prenom:g?g.prenom:"",nom:g?g.nom:"",fonction:g?g.fonction:"",ferme,opposition,verifieLe:todayStr()};
}
async function resolveLieu(l){
  l=String(l||"").trim();
  if(!l)return{cps:null,label:""};
  if(/^\d{5}$/.test(l))return{cps:{code_postal:l},label:l};
  if(/^(\d{2,3}|2a|2b)$/i.test(l))return{cps:{departement:l.toUpperCase()},label:"département "+l.toUpperCase()};
  const r=await fetch("https://geo.api.gouv.fr/communes?nom="+encodeURIComponent(l)+"&fields=nom,codesPostaux,codeDepartement&boost=population&limit=1");
  const j=r.ok?await r.json():[];
  if(!j.length)throw new Error("Ville introuvable : « "+l+" ». Essaie avec le code postal.");
  return{cps:{code_postal:j[0].codesPostaux.slice(0,30).join(",")},label:j[0].nom+" ("+j[0].codeDepartement+")"};
}
async function fetchPage({secteur,q,cps,tr,page}){
  const sec=SEC(secteur);
  if(!sec&&!q&&!cps)throw new Error("Choisis au moins un secteur, un mot-clé ou un lieu.");
  const u=new URL("https://recherche-entreprises.api.gouv.fr/search");
  if(sec)u.searchParams.set("activite_principale",sec.naf.join(","));
  if(q)u.searchParams.set("q",q);
  if(cps)Object.entries(cps).forEach(([k,v])=>u.searchParams.set(k,v));
  u.searchParams.set("tranche_effectif_salarie",(tr&&tr.length?tr:TRANCHES.map(t=>t[0])).join(","));
  u.searchParams.set("etat_administratif","A");
  u.searchParams.set("per_page","25");u.searchParams.set("page",String(page||1));
  let r;
  for(let essai=0;essai<3;essai++){r=await fetch(u);if(r.status!==429)break;await sleep(1500*(essai+1))}
  if(r.status===429)throw new Error("Trop de recherches d'un coup : attends quelques secondes et réessaie.");
  if(!r.ok)throw new Error("La recherche a échoué (erreur "+r.status+"). Réessaie dans un instant.");
  return r.json();
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const netMsg=e=>(e&&e.message&&!/fetch|network/i.test(e.message))?e.message:"Recherche impossible : vérifie ta connexion internet.";
async function search(more){
  const S=P.search;
  if(!more){S.page=0;S.pages=0;S.total=0;S.results=[];S.cps=null;S.villeLabel="";S.fermes=0;S.opposees=0}
  S.loading=true;S.err="";rRecherche();
  try{
    if(!more){const L=await resolveLieu(S.lieu);S.cps=L.cps;S.villeLabel=L.label}
    const j=await fetchPage({secteur:S.secteur,q:S.q,cps:S.cps,tr:S.tr,page:S.page+1});
    S.page=j.page||S.page+1;S.pages=j.total_pages||0;S.total=j.total_results||0;
    const all=(j.results||[]).map(mapEnt);
    S.fermes=(S.fermes||0)+all.filter(r=>r.ferme).length;
    S.opposees=(S.opposees||0)+all.filter(r=>!r.ferme&&r.opposition).length;
    S.results=S.results.concat(all.filter(r=>!r.ferme&&!r.opposition));
    if(!S.results.length)S.err="Aucune entreprise trouvée. Élargis la zone ou la taille.";
  }catch(e){S.err=netMsg(e)}
  S.loading=false;if(state.view==="p-recherche")rRecherche();
}
async function addProspect(r){
  if(!pdb)return;const ref=pdb.collection("prospects").doc();
  const p={...r,ferme:undefined,opposition:undefined,id:ref.id,secteur:P.search.secteur||"",statut:"Nouveau",tel:"",email:"",notes:"",nbAppels:0,historique:[],createdAt:iso()};
  prospects.set(ref.id,p);await saveP(p);
  return ref.id;
}

/* ---------- générateur de leads ---------- */
const G={secteur:"Restaurants",lieu:"",n:20,onlyPhone:true,run:null};
function genCard(){
  const R=G.run,k=hasKey();
  if(R&&R.running)return `<div class="card p-gen" style="margin-bottom:14px"><div class="card-h">⚡ Génération en cours…<button type="button" class="btn sm ml-auto" data-xgenstop>Arrêter</button></div><div class="card-b">
    <div class="p-bar"><div style="width:${Math.min(100,Math.round(R.added/R.target*100))}%"></div></div>
    <div class="small" style="margin-top:8px"><b>${R.added}/${R.target}</b> leads ajoutés · ${R.vus} entreprises examinées · ${R.fermes} fermées écartées${k?` · ${R.sansNum} sans numéro écartées`:""}${R.deja?` · ${R.deja} déjà dans ta liste`:""}</div>
    <div class="small muted" style="margin-top:4px">${esc(R.etape||"")}</div></div></div>`;
  return `<div class="card p-gen" style="margin-bottom:14px"><div class="card-h">⚡ Générer des leads automatiquement</div><div class="card-b">
   ${R&&!R.running?`<div class="banner" style="background:#e8f6ec;border-color:#9bd3ab;color:#1f6b35;display:flex;gap:10px;align-items:center;flex-wrap:wrap">✅ ${R.added} lead${R.added>1?"s":""} ajouté${R.added>1?"s":""}${R.avecNum?` dont ${R.avecNum} avec numéro`:""}.${R.msg?" "+esc(R.msg):""} <button class="btn sm primary" data-v="p-appels">📞 Commencer les appels</button></div>`:""}
   <form id="xgen" class="form" style="grid-template-columns:repeat(4,1fr)">
    <div class="f"><label>Secteur</label><select name="secteur">${SECTEURS.map(x=>`<option ${G.secteur===x.k?"selected":""}>${esc(x.k)}</option>`).join("")}</select></div>
    <div class="f"><label>Ville, code postal ou département</label><input name="lieu" required value="${esc(G.lieu)}" placeholder="Ex. Lyon"></div>
    <div class="f"><label>Nombre de leads</label><select name="n">${[10,20,30,50].map(v=>`<option ${G.n===v?"selected":""}>${v}</option>`).join("")}</select></div>
    <div class="f" style="justify-content:flex-end"><button class="btn primary">⚡ Générer</button></div>
    <label class="f full small" style="flex-direction:row;gap:8px;align-items:center"><input type="checkbox" name="onlyPhone" ${G.onlyPhone?"checked":""} ${k?"":"disabled"} style="width:auto"> Garder seulement les leads avec un numéro de téléphone${k?"":" (configure Google Maps ci-dessus pour l'activer)"}</label>
   </form>
   <div class="small muted" style="margin-top:6px">L'appli cherche dans l'annuaire officiel, écarte les entreprises fermées et celles déjà dans ta liste, récupère le gérant et l'adresse${k?", puis le numéro sur Google Maps":""}. Les leads arrivent dans « Mes prospects » et dans ta session d'appels.</div>
  </div></div>`;
}
function bindGen(){
  const f=$("#xgen");if(!f)return;
  f.addEventListener("submit",e=>{e.preventDefault();G.secteur=f.secteur.value;G.lieu=f.lieu.value.trim();G.n=+f.n.value;G.onlyPhone=hasKey()&&f.onlyPhone.checked;generate()});
}
async function generate(){
  if(!pdb||(G.run&&G.run.running))return;
  const R=G.run={target:G.n,added:0,avecNum:0,vus:0,fermes:0,sansNum:0,deja:0,running:true,stop:false,etape:"Recherche de la ville…",msg:""};
  const redraw=()=>{if(state.view==="p-recherche")rRecherche()};redraw();
  const known=knownSirens();const k=hasKey();let gCalls=0;const maxG=G.n*5;
  try{
    const L=await resolveLieu(G.lieu);
    let page=1,pages=1;
    while(R.added<R.target&&page<=pages&&page<=40&&!R.stop){
      R.etape="Lecture de l'annuaire, page "+page+"…";redraw();
      const j=await fetchPage({secteur:G.secteur,cps:L.cps,tr:P.search.tr,page});
      pages=j.total_pages||1;page++;
      for(const e of (j.results||[])){
        if(R.added>=R.target||R.stop)break;
        const r=mapEnt(e);R.vus++;
        if(r.ferme){R.fermes++;continue}
        if(r.opposition){R.opp=(R.opp||0)+1;continue}
        if(known.has(r.siren)){R.deja++;continue}
        known.add(r.siren);
        const p={...r,ferme:undefined,opposition:undefined,secteur:G.secteur,statut:"Nouveau",tel:"",email:"",notes:"",nbAppels:0,historique:[],createdAt:iso(),origine:"Générateur de leads"};
        if(k){
          if(gCalls>=maxG){R.msg="Arrêt : limite de recherches Google atteinte pour cette génération (protection de ton quota).";R.stop=true;break}
          R.etape="Recherche du numéro de "+r.societe+"…";redraw();
          gCalls++;
          let pl=null;try{pl=await lookupPlace(p)}catch(x){if(/Clé|refus|charger/.test(x.message||"")){R.msg=x.message;R.stop=true;break}}
          applyPlace(p,pl);
          if(p.fermeGoogle){R.fermes++;continue}
          if(G.onlyPhone&&!p.tel){R.sansNum++;continue}
          await sleep(150);
        }
        const ref=pdb.collection("prospects").doc();p.id=ref.id;prospects.set(ref.id,p);await saveP(p);
        R.added++;if(p.tel)R.avecNum++;redraw();
      }
      await sleep(200);
    }
    if(!R.msg&&R.added<R.target&&!R.stop)R.msg="Plus d'entreprises disponibles dans cette zone : élargis la ville ou choisis un autre secteur.";
    if(R.stop&&!R.msg)R.msg="Génération arrêtée.";
  }catch(x){R.msg=netMsg(x)}
  R.running=false;renderNav();redraw();
  toast("⚡ "+R.added+" lead"+(R.added>1?"s":"")+" ajouté"+(R.added>1?"s":""));
}

/* ---------- toujours active ? (annuaire officiel) ---------- */
function marquerFerme(p,source){
  if(p.statut==="Fermé")return;
  p.statutAvantFermeture=p.statut;p.statut="Fermé";p.prochainAppel="";
  p.historique=[...(p.historique||[]),{date:today(),ts:Date.now(),type:"verif",resultat:"Fermé définitivement ("+source+")",statutApres:"Fermé"}];
}
async function checkActive(p){
  if(!p.siren)return null;
  try{
    const r=await fetch("https://recherche-entreprises.api.gouv.fr/search?q="+encodeURIComponent(p.siren)+"&per_page=1");
    if(!r.ok)return null;
    const j=await r.json();const e=(j.results||[]).find(x=>String(x.siren)===String(p.siren));
    if(!e)return null;
    const ets=[...(e.matching_etablissements||[]),e.siege||{}];
    const et=p.siret?ets.find(x=>x.siret===p.siret):null;
    const actif=e.etat_administratif!=="F"&&!(et&&et.etat_administratif==="F");
    p.verifieLe=today();
    if(!actif)marquerFerme(p,"annuaire officiel");
    await saveP(p);return actif;
  }catch(e){return null}
}
const aVerifier=p=>p.siren&&p.statut!=="Fermé"&&p.statut!=="Converti en client"&&(!p.verifieLe||daysFrom(p.verifieLe)<=-30);
let checking=null;
async function checkMany(list){
  if(checking)return;checking={done:0,total:list.length,fermes:0};render();
  for(const p of list){if((await checkActive(p))===false)checking.fermes++;checking.done++;if(state.view.startsWith("p-"))render();await new Promise(r=>setTimeout(r,200))}
  const c=checking;checking=null;toast(c.fermes?"🚫 "+c.fermes+" entreprise"+(c.fermes>1?"s":"")+" fermée"+(c.fermes>1?"s":"")+" retirée"+(c.fermes>1?"s":"")+" de tes appels":"✓ Toutes tes entreprises sont actives");render();
}

/* ---------- Google Maps : compléter téléphone, site web, adresse ---------- */
let gLoad=null;
function loadGoogle(key){
  if(window.google&&google.maps&&google.maps.importLibrary)return Promise.resolve();
  if(gLoad&&gLoad.key===key)return gLoad.p;
  const p=new Promise((res,rej)=>{
    window.__crmGmReady=()=>res();
    window.gm_authFailure=()=>rej(new Error("Clé Google refusée. Vérifie la clé et que « Places API (New) » et « Maps JavaScript API » sont activées."));
    const sc=document.createElement("script");
    sc.src="https://maps.googleapis.com/maps/api/js?key="+encodeURIComponent(key)+"&v=weekly&loading=async&language=fr&region=FR&callback=__crmGmReady";
    sc.async=true;sc.onerror=()=>rej(new Error("Impossible de charger Google Maps. Vérifie ta connexion."));
    document.head.appendChild(sc);
  });
  gLoad={key,p};p.catch(()=>{gLoad=null});return p;
}
function hasKey(){return !!(reg.google&&reg.google.key)}
async function lookupPlace(p){
  await loadGoogle(reg.google.key);
  const {Place}=await google.maps.importLibrary("places");
  const q=[p.enseigne||p.societe,p.adresse||[p.cp,p.ville].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const {places}=await Place.searchByText({textQuery:q,fields:["displayName","nationalPhoneNumber","formattedAddress","websiteURI","googleMapsURI","rating","userRatingCount","businessStatus"],language:"fr",region:"fr",maxResultCount:1});
  return(places&&places[0])||null;
}
function applyPlace(p,pl){
  p.googleVerifie=today();
  if(!pl){p.googleTrouve=false;return}
  p.googleTrouve=true;
  if(pl.nationalPhoneNumber&&!p.tel)p.tel=pl.nationalPhoneNumber;
  if(safeUrl(pl.websiteURI))p.siteWeb=safeUrl(pl.websiteURI);
  if(safeUrl(pl.googleMapsURI))p.googleMaps=safeUrl(pl.googleMapsURI);
  if(pl.formattedAddress)p.adresseGoogle=pl.formattedAddress;
  if(pl.displayName)p.nomGoogle=pl.displayName;
  if(pl.rating)p.noteGoogle=pl.rating+" ★ ("+(pl.userRatingCount||0)+" avis)";
  p.fermeGoogle=pl.businessStatus==="CLOSED_PERMANENTLY";p.fermeTempGoogle=pl.businessStatus==="CLOSED_TEMPORARILY";
}
async function enrich(p,silent){
  if(!hasKey())return false;
  try{
    const pl=await lookupPlace(p);
    applyPlace(p,pl);
    if(!pl){await saveP(p);if(!silent)toast("Pas trouvé sur Google Maps : essaie « Trouver le numéro »");return false}
    if(p.fermeGoogle)marquerFerme(p,"Google Maps");
    await saveP(p);
    if(p.fermeGoogle){if(!silent)toast("🚫 Fermé définitivement selon Google Maps : retiré de tes appels");return false}
    if(!silent)toast(pl.nationalPhoneNumber?"📞 Numéro trouvé : "+pl.nationalPhoneNumber:"Trouvé sur Google Maps, mais sans numéro affiché");
    return !!pl.nationalPhoneNumber;
  }catch(e){
    if(!silent||/Clé|refus|charger/.test(e.message||""))toast((e&&e.message)||"Recherche Google impossible");
    if(/Clé|refus/.test(e.message||""))throw e;
    return false;
  }
}
let bulk=null;
async function enrichMany(ids){
  if(bulk)return;bulk={done:0,total:ids.length,found:0};render();
  for(const id of ids){const p=prospects.get(id);if(!p){bulk.done++;continue}
    try{if(await enrich(p,true))bulk.found++}catch(e){break}
    bulk.done++;if(state.view.startsWith("p-"))render();await new Promise(r=>setTimeout(r,250));}
  const b=bulk;bulk=null;toast("📞 "+b.found+" numéro"+(b.found>1?"s":"")+" trouvé"+(b.found>1?"s":"")+" sur "+b.total);render();
}
function safeUrl(u){try{const x=new URL(String(u||""));return /^https?:$/.test(x.protocol)?x.href:""}catch(e){return""}}
function siteContact(p){if(!p.siteWeb)return"";try{const u=new URL(p.siteWeb);return u.origin+"/contact"}catch(e){return""}}
function mailInfo(p){
  if(p.email)return `<b>Courriel</b><a href="mailto:${esc(p.email)}">${esc(p.email)}</a>`;
  return `<b>Courriel</b><span style="color:#9a5300">Aucun courriel trouvé : demande-le pendant l'appel</span>${p.siteWeb?` · <a href="${esc(siteContact(p))}" target="_blank" rel="noopener">voir la page contact du site</a>`:""}`;
}
function sansNumero(){return plist().filter(p=>!p.tel&&!p.googleVerifie&&A_APPELER.includes(p.statut||"Nouveau"))}
function googleCard(){
  const k=hasKey();
  return `<div class="card" style="margin-bottom:14px"><div class="card-h">📞 Numéros de téléphone (Google Maps)${k?`<span class="tag" style="background:#e8f6ec;color:#1f6b35">Activé</span>`:`<span class="tag today">À configurer</span>`}<button type="button" class="btn ghost sm ml-auto" data-xgkey>${k?"Modifier":"Configurer"}</button></div>
   ${P.showKey||!k?`<div class="card-b"><div class="small muted" style="margin-bottom:8px">L'annuaire officiel ne donne pas les téléphones. Avec une clé Google, l'appli va chercher automatiquement le numéro, le site web et l'adresse sur la fiche Google Maps de chaque prospect.</div>
    <form id="xgk" style="display:flex;gap:8px;flex-wrap:wrap"><input name="key" value="${esc((reg.google&&reg.google.key)||"")}" placeholder="Colle ta clé API Google (AIza…)" style="flex:1;min-width:220px;padding:9px 11px;border:1px solid #d4d4d4;border-radius:8px">
    <label class="small" style="display:flex;gap:6px;align-items:center"><input type="checkbox" name="auto" ${!reg.google||reg.google.auto!==false?"checked":""}> Chercher le numéro dès que j'ajoute un prospect</label>
    <button class="btn primary">Enregistrer</button></form></div>`:""}</div>`;
}

/* 2. Mes prospects */
function rListe(){
  const all=plist();const t=today();
  const groups=["À appeler",...PST.map(x=>x.k),"Tous"];
  const cnt=g=>all.filter(p=>match(p,g)).length;
  function match(p,g){const st=p.statut||"Nouveau";if(g==="Tous")return true;if(g==="À appeler")return A_APPELER.includes(st)&&(!p.prochainAppel||p.prochainAppel<=t);return st===g}
  const L=all.filter(p=>match(p,P.filter)&&(!P.secFilter||p.secteur===P.secFilter)).sort((a,b)=>(a.prochainAppel||"").localeCompare(b.prochainAppel||"")||(b.createdAt||"").localeCompare(a.createdAt||""));
  const secs=[...new Set(all.map(p=>p.secteur).filter(Boolean))];
  const sn=sansNumero();const av=plist().filter(aVerifier);
  $("#main").innerHTML=head("Mes prospects",`${all.length} au total · séparés de tes clients`)+
  (bulk?`<div class="banner" style="background:#f1ecfd;border-color:#d9cdfb;color:#3b2a8a">📞 Recherche des numéros sur Google Maps : ${bulk.done}/${bulk.total} · ${bulk.found} trouvé${bulk.found>1?"s":""}</div>`
   :sn.length?(hasKey()?`<div class="banner" style="background:#f1ecfd;border-color:#d9cdfb;color:#3b2a8a;display:flex;gap:10px;align-items:center;flex-wrap:wrap">${sn.length} prospect${sn.length>1?"s":""} sans numéro <button class="btn sm primary" data-xenrichall>📞 Chercher leurs numéros sur Google Maps</button></div>`
     :`<div class="banner" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">${sn.length} prospect${sn.length>1?"s":""} sans numéro. Configure Google Maps pour les trouver automatiquement. <button class="btn sm" data-v="p-recherche">Configurer</button></div>`):"")+
  (checking?`<div class="banner" style="background:#f6f8fa;border-color:#d0d7de;color:#333">🔎 Vérification de l'activité : ${checking.done}/${checking.total} · ${checking.fermes} fermée${checking.fermes>1?"s":""}</div>`
   :av.length?`<div class="banner" style="background:#f6f8fa;border-color:#d0d7de;color:#333;display:flex;gap:10px;align-items:center;flex-wrap:wrap">${av.length} prospect${av.length>1?"s":""} à revérifier (activité non contrôlée depuis 30 jours) <button class="btn sm" data-xcheckall>🔎 Vérifier qu'ils sont toujours actifs</button></div>`:"")+`
  <div class="toolbar">${groups.map(g=>`<button class="chip ${P.filter===g?"on":""}" data-xfilter="${esc(g)}">${esc(g)} <b>${cnt(g)}</b></button>`).join("")}
   ${secs.length>1?`<select id="xSecF" style="margin-left:auto;padding:7px 10px;border:1px solid #d4d4d4;border-radius:8px"><option value="">Tous les secteurs</option>${secs.map(s=>`<option ${P.secFilter===s?"selected":""}>${esc(s)}</option>`).join("")}</select>`:""}</div>
  <div class="card">${L.length?L.map(p=>`<div class="list-row" data-xopen="${esc(p.id)}" style="flex-wrap:nowrap"><div class="avatar" style="background:${avatarColor(p.societe)}">${esc(initials(p.societe))}</div>
     <div class="grow"><div class="ellip" style="font-weight:600">${esc(p.societe||"Sans nom")}</div><div class="small muted ellip">${esc([[p.prenom,p.nom].filter(Boolean).join(" "),p.secteur,p.ville].filter(Boolean).join(" · "))}</div>
     <div class="mrow-meta">${ppill(p.statut)}${p.prochainAppel&&A_APPELER.includes(p.statut)?relTag(p.prochainAppel):""}${p.nbAppels?`<span class="small muted">${p.nbAppels} appel${p.nbAppels>1?"s":""}</span>`:""}${p.email?"":`<span class="small" style="color:#9a5300">pas de courriel</span>`}${p.siteWeb?`<span class="small">🌐 site</span>`:""}</div></div>
     ${p.tel?`<a class="qcall" href="${esc(telHref(p.tel))}" aria-label="Appeler">📞</a>`:`<span class="tag" style="background:#f1f1f1;color:#555">Pas de numéro</span>`}</div>`).join("")
   :`<div class="empty"><div class="big">📋</div>Aucun prospect ici.<br><button class="btn primary" data-v="p-recherche" style="margin-top:10px">🔍 Trouver des prospects</button></div>`}</div>`;
  const sf=$("#xSecF");if(sf)sf.onchange=()=>{P.secFilter=sf.value;rListe()};
}
function openProspect(id){
  const p=prospects.get(id);if(!p)return;
  const hist=(p.historique||[]).slice().reverse();
  openModal(`<div class="modal-h">${esc(p.societe||"Prospect")}<span style="margin-left:10px">${ppill(p.statut)}</span></div>
  <form id="xpf"><div class="modal-b">
   <div class="p-facts">
    <div><b>Adresse</b>${esc(p.adresseGoogle||tcase(p.adresse)||"—")}</div>
    <div><b>Dirigeant(s)</b>${esc(p.dirigeants||"—")}</div>
    <div><b>Entreprise</b>${esc([p.raisonSociale&&p.raisonSociale!==p.societe?p.raisonSociale:"",p.secteur,p.effectif].filter(Boolean).join(" · ")||"—")}</div>
    <div><b>SIRET</b>${esc(p.siret||"—")}</div>
    <div>${mailInfo(p)}</div>
    ${p.siteWeb||p.googleMaps||p.noteGoogle?`<div><b>En ligne</b>${p.siteWeb?`<a href="${esc(safeUrl(p.siteWeb))}" target="_blank" rel="noopener">Site web</a> · `:""}${p.googleMaps?`<a href="${esc(safeUrl(p.googleMaps))}" target="_blank" rel="noopener">Google Maps</a>`:""}${p.noteGoogle?" · "+esc(p.noteGoogle):""}</div>`:""}
    ${p.fermeGoogle?`<div style="color:var(--bad)"><b>Attention</b>Indiqué comme définitivement fermé sur Google</div>`:""}
   </div>
   <div class="form">
    <div class="f"><label>Prénom</label><input name="prenom" value="${esc(p.prenom||"")}"></div>
    <div class="f"><label>Nom</label><input name="nom" value="${esc(p.nom||"")}"></div>
    <div class="f"><label>Téléphone</label><input name="tel" type="tel" value="${esc(p.tel||"")}"></div>
    <div class="f"><label>Courriel</label><input name="email" type="email" value="${esc(p.email||"")}"></div>
    <div class="f"><label>Secteur</label><select name="secteur"><option value=""></option>${SECTEURS.map(x=>`<option ${p.secteur===x.k?"selected":""}>${esc(x.k)}</option>`).join("")}</select></div>
    <div class="f"><label>Prochain appel</label><input name="prochainAppel" type="date" value="${esc(p.prochainAppel||"")}"></div>
    <div class="f full"><label>Notes</label><textarea name="notes">${esc(p.notes||"")}</textarea></div>
   </div>
   <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">${hasKey()?`<button type="button" class="btn sm primary" data-xenrich="${esc(p.id)}">📞 Compléter avec Google Maps</button>`:""}${gLink(p)}${p.tel?`<a class="btn sm" href="${esc(telHref(p.tel))}">📞 Appeler</a>`:""}<button type="button" class="btn sm" data-xmsg="prospects:${esc(p.id)}">✉️ Message</button>
    ${p.statut!=="Converti en client"?`<button type="button" class="btn sm" data-xconvert="${esc(p.id)}">➡️ Passer en client</button>`:p.clientId?`<button type="button" class="btn sm" data-xclient="${esc(p.clientId)}">Voir la fiche client</button>`:""}</div>
   ${hist.length?`<div class="sec-t">Historique</div><ul class="timeline">${hist.map(h=>`<li><span class="tl-ic" style="background:${PSC[h.statutApres]||"#0176d3"}">${h.type==="message"?"✉":"📞"}</span><div class="small muted">${fdate(h.date)}</div><div>${esc(h.resultat||"")}${h.note?" — "+esc(h.note):""}</div></li>`).join("")}</ul>`:""}
  </div><div class="modal-f"><button type="button" class="btn ghost danger" data-xdel="${esc(p.id)}">Supprimer</button><span style="flex:1"></span><button type="button" class="btn" data-close>Fermer</button><button class="btn primary">Enregistrer</button></div></form>`);
  $("#xpf").addEventListener("submit",e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target).entries());
    Object.assign(p,f);if(p.prochainAppel&&p.statut==="Nouveau")p.statut="À rappeler";saveP(p);closeModal();toast("✓ Prospect enregistré");render()});
}

/* 3. Session d'appels */
let verifEnCours=null;
function rAppels(){
  const q=queue();const st=statsJour();const p=q[0];
  if(p&&aVerifier(p)&&verifEnCours!==p.id){verifEnCours=p.id;checkActive(p).then(a=>{verifEnCours=null;if(a===false)toast("🚫 "+p.societe+" est fermée : retirée de tes appels");if(state.view==="p-appels")rAppels()})}
  const secs=[...new Set(plist().filter(x=>A_APPELER.includes(x.statut||"Nouveau")).map(x=>x.secteur).filter(Boolean))];
  let body="";
  if(!p){
    body=`<div class="card"><div class="empty"><div class="big">✅</div><b>Plus personne à appeler pour l'instant.</b><br>${plist().length?"Les prospects à rappeler plus tard reviendront à leur date.":"Commence par trouver des prospects."}<br><br><button class="btn primary" data-v="p-recherche">🔍 Trouver des prospects</button>${P.skipped.size?` <button class="btn" data-xunskip>Revoir les ${P.skipped.size} passés</button>`:""}</div></div>`;
  }else{
    const sec=SEC(p.secteur);const pn=P.panel;
    body=`<div class="p-call card">
     <div class="p-call-h"><div class="avatar" style="width:46px;height:46px;font-size:17px;background:${avatarColor(p.societe)}">${esc(initials(p.societe))}</div>
      <div class="grow"><div style="font-size:19px;font-weight:700">${esc(p.societe)}</div><div class="small muted">${esc([p.secteur,p.effectif,p.ville].filter(Boolean).join(" · "))}</div>
      <div class="small" style="margin:3px 0">${verifEnCours===p.id?`<span class="tag" style="background:#f1f1f1;color:#555">Vérification de l'activité…</span>`:p.verifieLe?`<span class="tag" style="background:#e8f6ec;color:#1f6b35">✓ Active (vérifiée le ${fdateShort(p.verifieLe)})</span>`:""}${p.fermeTempGoogle?` <span class="tag today">Fermé temporairement selon Google</span>`:""}</div>
      <div class="small" style="margin-top:3px">${[p.prenom,p.nom].filter(Boolean).length?"👤 "+esc([p.prenom,p.nom].filter(Boolean).join(" "))+(p.fonction?" ("+esc(p.fonction)+")":""):"Contact inconnu"} ${ppill(p.statut)} ${p.nbAppels?`<span class="small muted">· ${p.nbAppels} appel${p.nbAppels>1?"s":""} déjà</span>`:""}</div></div></div>
     <div class="p-tel">${p.tel?`<a class="btn primary p-big" href="${esc(telHref(p.tel))}">📞 Appeler le ${esc(p.tel)}</a>`:`<div class="p-notel"><div class="small muted" style="margin-bottom:6px">Pas encore de numéro :</div><div style="display:flex;gap:8px;flex-wrap:wrap">${hasKey()?`<button class="btn sm primary" data-xenrich="${esc(p.id)}">📞 Chercher sur Google Maps</button>`:""}${gLink(p)}<input id="xTel" type="tel" placeholder="Colle le numéro ici" style="flex:1;min-width:150px;padding:9px 11px;border:1px solid #d4d4d4;border-radius:8px"><button class="btn" data-xsavetel="${esc(p.id)}">Enregistrer</button></div></div>`}</div>
     <div class="small muted" style="padding:0 16px 10px">📍 ${esc(p.adresseGoogle||tcase(p.adresse)||"Adresse inconnue")}${p.siteWeb?` · <a href="${esc(safeUrl(p.siteWeb))}" target="_blank" rel="noopener">site web</a>`:""}${p.noteGoogle?" · "+esc(p.noteGoogle):""}${p.fermeGoogle?` · <span style="color:var(--bad)">fermé selon Google</span>`:""}</div>
     <div class="small" style="padding:0 16px 10px">${p.email?`✉️ <a href="mailto:${esc(p.email)}">${esc(p.email)}</a>`:`<div class="p-mail">✉️ <b>Aucun courriel trouvé</b> : demande-le pendant l'appel.${p.siteWeb?` <a href="${esc(siteContact(p))}" target="_blank" rel="noopener">Page contact du site</a>`:""}<div style="display:flex;gap:8px;margin-top:6px"><input id="xMail" type="email" placeholder="Courriel donné au téléphone" style="flex:1;padding:8px 10px;border:1px solid #d4d4d4;border-radius:8px"><button class="btn sm" data-xsavemail="${esc(p.id)}">Enregistrer</button></div></div>`}</div>
     ${p.notes?`<div class="small" style="padding:0 16px 10px">📝 ${esc(p.notes)}</div>`:""}
     <div class="p-script"><div class="sec-t" style="margin:0 0 6px">Ton script</div>${esc(fill(reg.script,p)).replace(/\n/g,"<br>")}</div>
     <details class="p-obj"><summary>Objections et réponses</summary>${(reg.objections||[]).map(o=>`<div class="p-obj-i"><b>${esc(o.q)}</b><div>${esc(o.r)}</div></div>`).join("")}</details>
     <div class="f" style="padding:0 16px"><label>Note sur l'appel (facultatif)</label><input id="xNote" placeholder="Ex. rappeler après 14 h, contrat EDF jusqu'en mars"></div>
     <div class="p-res">
      <button class="btn" data-xres="nr">😶 Pas répondu</button>
      <button class="btn ${pn==="rappel"?"on":""}" data-xpanel="rappel">🔁 À rappeler</button>
      <button class="btn p-green ${pn==="rdv"?"on":""}" data-xpanel="rdv">📅 RDV pris</button>
      <button class="btn" data-xres="ni">🚫 Pas intéressé</button>
      <button class="btn ghost" data-xres="skip">⏭️ Passer</button>
     </div>
     ${pn==="rappel"?`<div class="p-panel">Rappeler : ${[[1,"Demain"],[3,"Dans 3 jours"],[7,"Dans 1 semaine"],[30,"Dans 1 mois"]].map(([d,l])=>`<button class="chip" data-xrappel="${d}">${l}</button>`).join("")}<input type="date" id="xRapDate" style="padding:6px 8px;border:1px solid #d4d4d4;border-radius:8px"><button class="btn sm" data-xrappel="date">OK</button></div>`:""}
     ${pn==="rdv"?`<div class="p-panel">Date et heure du rendez-vous : <input type="datetime-local" id="xRdv" style="padding:7px 9px;border:1px solid #d4d4d4;border-radius:8px"> <button class="btn primary sm" data-xrdv>Valider et passer en client</button><div class="small muted" style="margin-top:6px">Le prospect sera créé dans tes clients (statut « RDV pris ») avec tout son historique.</div></div>`:""}
    </div>`;
  }
  $("#main").innerHTML=head("Session d'appels",`${q.length} à appeler maintenant`)+`
  <div class="p-stats"><div class="card kpi"><div class="l">Appels aujourd'hui</div><div class="v">${st.appels}</div></div><div class="card kpi"><div class="l">RDV aujourd'hui</div><div class="v" style="color:var(--ok)">${st.rdv}</div></div><div class="card kpi"><div class="l">Reste à appeler</div><div class="v">${q.length}</div></div></div>
  ${secs.length>1?`<div class="toolbar"><button class="chip ${!P.sessSec?"on":""}" data-xsess="">Tous secteurs</button>${secs.map(s=>`<button class="chip ${P.sessSec===s?"on":""}" data-xsess="${esc(s)}">${esc(s)}</button>`).join("")}</div>`:""}
  ${body}`;
}
function logAppel(p,resultat,statut,extra){
  const note=($("#xNote")||{}).value||"";
  const mail=(($("#xMail")||{}).value||"").trim();if(mail&&!p.email)p.email=mail;
  p.historique=[...(p.historique||[]),{date:today(),ts:Date.now(),type:"appel",resultat,note,statutApres:statut}];
  p.nbAppels=(p.nbAppels||0)+1;p.statut=statut;Object.assign(p,extra||{});
  if(note)p.notes=(p.notes?p.notes+"\n":"")+fdate(today())+" : "+note;
  P.panel=null;saveP(p);
}
function result(kind,val){
  const p=queue()[0];if(!p)return;
  if(kind==="nr"){const n=(p.nbAppels||0)+1;logAppel(p,"Pas de réponse","Pas de réponse",{prochainAppel:addDays(today(),n>=3?3:1)});toast("😶 Pas répondu · on réessaie "+(n>=3?"dans 3 jours":"demain"))}
  else if(kind==="ni"){logAppel(p,"Pas intéressé","Pas intéressé",{prochainAppel:""});toast("Noté : pas intéressé")}
  else if(kind==="skip"){P.skipped.add(p.id);P.panel=null}
  else if(kind==="rappel"){let d=val==="date"?(($("#xRapDate")||{}).value||""):addDays(today(),+val);if(!d){toast("Choisis une date");return}logAppel(p,"À rappeler le "+fdate(d),"À rappeler",{prochainAppel:d});toast("🔁 Rappel le "+fdate(d))}
  else if(kind==="rdv"){const v=($("#xRdv")||{}).value;if(!v){toast("Choisis la date du rendez-vous");return}
    logAppel(p,"RDV pris "+fmtRdv(v),"Converti en client",{prochainAppel:"",rdv:v});
    convert(p,{statut:"RDV pris",rdv:v,prochaineRelance:v.slice(0,10),actionRelance:"RDV "+fmtRdv(v)}).then(()=>{confetti();toast("🎉 RDV pris ! "+p.societe+" est maintenant dans tes clients")});}
  renderGoal();rAppels();
}
async function convert(p,extra){
  if(!pdb)return;
  const ref=db.collection("clients").doc();
  const keep=["societe","prenom","nom","fonction","tel","email","siren","siret","adresse","cp","ville","naf","effectif","dirigeants","dateCreation","secteur"];
  if(p.siteWeb){c.marketing={site:"Oui",urlSite:p.siteWeb}}
  const c={statut:"À contacter",source:"Prospection directe",createdAt:iso(),notes:p.notes||"",
    activites:(p.historique||[]).map(h=>({date:h.date,canal:h.type==="message"?"Email":"Appel",resume:(h.resultat||"")+(h.note?" — "+h.note:""),ts:h.ts||Date.now()}))};
  keep.forEach(k=>{if(p[k])c[k]=p[k]});
  Object.assign(c,extra||{});c.id=ref.id;
  clients.set(ref.id,c);await saveNow(ref.id);
  p.statut="Converti en client";p.clientId=ref.id;p.historique=[...(p.historique||[]),{date:today(),ts:Date.now(),type:"appel",resultat:"Passé en client",statutApres:"Converti en client",converti:true}];
  await saveP(p);return ref.id;
}

/* 4. Scripts et objections */
function rScripts(){
  const pr=reg.profil||{};const ex={societe:"Boulangerie Martin",prenom:"Julie",ville:"Lyon",secteur:"Boulangeries-pâtisseries"};
  $("#main").innerHTML=head("Scripts et objections","Utilisés pendant la session d'appels")+`
  <form id="xsf">
  <div class="card" style="margin-bottom:14px"><div class="card-h">👤 Toi (repris dans les scripts et messages)</div><div class="card-b"><div class="form">
   <div class="f"><label>Ton prénom</label><input name="prenom" value="${esc(pr.prenom||"")}"></div>
   <div class="f"><label>Ta société</label><input name="societe" value="${esc(pr.societe||"")}"></div>
   <div class="f"><label>Ton téléphone</label><input name="tel" value="${esc(pr.tel||"")}"></div>
   <div class="f"><label>Ton courriel</label><input name="email" value="${esc(pr.email||"")}"></div></div></div></div>
  <div class="card" style="margin-bottom:14px"><div class="card-h">📞 Script d'appel</div><div class="card-b">
   <div class="f"><textarea name="script" style="min-height:130px">${esc(reg.script)}</textarea></div>
   <div class="small muted" style="margin-top:6px">Remplacés automatiquement : {prenom} {societe} {ville} {secteur} {postes} {moi} {masociete}. Le secteur et les postes s'adaptent au prospect.</div>
   <div class="p-script" style="margin:12px 0 0"><div class="sec-t" style="margin:0 0 6px">Exemple pour une boulangerie à Lyon</div><span id="xPrev">${esc(fill(reg.script,ex))}</span></div></div></div>
  <div class="card" style="margin-bottom:14px"><div class="card-h">🛡️ Objections<button type="button" class="btn sm ml-auto" data-xaddobj>+ Ajouter</button></div><div class="card-b">
   ${(reg.objections||[]).map((o,i)=>`<div class="p-objedit"><div class="f"><label>Objection</label><input name="oq${i}" value="${esc(o.q)}"></div><div class="f"><label>Ta réponse</label><textarea name="or${i}">${esc(o.r)}</textarea></div><button type="button" class="btn ghost sm danger" data-xdelobj="${i}">Supprimer</button></div>`).join("")}
  </div></div>
  <div class="p-savebar"><button type="button" class="btn ghost" data-xresetscripts>Remettre les textes d'origine</button><button class="btn primary">💾 Enregistrer</button></div></form>`;
  const f=$("#xsf");
  f.script.addEventListener("input",()=>{$("#xPrev").textContent=fill(f.script.value,ex)});
  f.addEventListener("submit",e=>{e.preventDefault();readScripts(f);saveReg();toast("✓ Scripts enregistrés")});
}
function readScripts(f){
  reg.profil={prenom:f.prenom.value.trim(),societe:f.societe.value.trim(),tel:f.tel.value.trim(),email:f.email.value.trim()};
  reg.script=f.script.value;
  reg.objections=(reg.objections||[]).map((o,i)=>({q:(f["oq"+i]||{}).value||"",r:(f["or"+i]||{}).value||""})).filter(o=>o.q||o.r);
}

/* 5. Modèles de messages */
function rMessages(){
  $("#main").innerHTML=head("Modèles de messages","Courriels et SMS pré-remplis avec le nom du prospect ou du client")+`
  <form id="xmf">
  ${(reg.messages||[]).map((m,i)=>`<div class="card" style="margin-bottom:12px"><div class="card-h">${m.canal==="sms"?"💬":"✉️"} <input name="n${i}" value="${esc(m.nom)}" style="flex:1;border:0;font:inherit;font-weight:600;background:none;outline:none">
     <select name="c${i}" style="padding:5px 8px;border:1px solid #d4d4d4;border-radius:7px"><option value="email" ${m.canal==="email"?"selected":""}>Courriel</option><option value="sms" ${m.canal==="sms"?"selected":""}>SMS</option></select>
     <button type="button" class="btn ghost sm danger" data-xdelmsg="${i}">Supprimer</button></div>
    <div class="card-b"><div class="form" style="grid-template-columns:1fr">
     ${m.canal==="email"?`<div class="f"><label>Objet</label><input name="s${i}" value="${esc(m.sujet||"")}"></div>`:""}
     <div class="f"><label>Message</label><textarea name="b${i}" style="min-height:${m.canal==="sms"?80:170}px">${esc(m.corps)}</textarea></div></div></div></div>`).join("")}
  <div class="small muted" style="margin:4px 0 12px">Remplacés automatiquement : {prenom} {nom} {societe} {ville} {secteur} {postes} {rdv} {moi} {masociete} {montel} {moncourriel}. Ton prénom et ta société se règlent dans l'onglet Scripts.</div>
  <div class="p-savebar"><button type="button" class="btn" data-xaddmsg>+ Nouveau modèle</button><span style="flex:1"></span><button type="button" class="btn ghost" data-xresetmsgs>Remettre les textes d'origine</button><button class="btn primary">💾 Enregistrer</button></div></form>`;
  const f=$("#xmf");
  f.addEventListener("submit",e=>{e.preventDefault();readMsgs(f);saveReg();toast("✓ Modèles enregistrés");rMessages()});
  f.querySelectorAll("select[name^=c]").forEach(sel=>sel.addEventListener("change",()=>{readMsgs(f);rMessages()}));
}
function readMsgs(f){
  reg.messages=(reg.messages||[]).map((m,i)=>({id:m.id||("m"+Date.now()+i),nom:(f["n"+i]||{}).value||m.nom,canal:(f["c"+i]||{}).value||m.canal,sujet:f["s"+i]?f["s"+i].value:(m.sujet||""),corps:(f["b"+i]||{}).value??m.corps}));
}

/* ---------- envoyer un message (prospect ou client) ---------- */
function openMsg(kind,id){
  const o=kind==="clients"?clients.get(id):prospects.get(id);if(!o)return;
  const ms=reg.messages||[];
  openModal(`<div class="modal-h">✉️ Message à ${esc(o.societe||"")}</div><div class="modal-b">
   <div class="small muted" style="margin-bottom:8px">Choisis un modèle :</div>
   <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">${ms.map((m,i)=>`<button class="chip" data-xtpl="${i}">${m.canal==="sms"?"💬":"✉️"} ${esc(m.nom)}</button>`).join("")}<button class="chip" data-xtpl="-1">✏️ Message libre</button></div>
   <div id="xMsgEd"></div></div><div class="modal-f"><button class="btn" data-close>Fermer</button></div>`);
  P.draft={kind,id};
}
function showTpl(i){
  const d=P.draft;if(!d)return;const o=d.kind==="clients"?clients.get(d.id):prospects.get(d.id);if(!o)return;
  const m=i>=0?(reg.messages||[])[i]:{nom:"Message libre",canal:o.email?"email":"sms",sujet:"",corps:""};
  document.querySelectorAll("[data-xtpl]").forEach(b=>b.classList.toggle("on",+b.dataset.xtpl===i));
  $("#xMsgEd").innerHTML=`<div class="form" style="grid-template-columns:1fr">
   ${m.canal==="email"?`<div class="f"><label>Objet</label><input id="xSubj" value="${esc(fill(m.sujet,o))}"></div>`:""}
   <div class="f"><label>Message</label><textarea id="xBody" style="min-height:180px">${esc(fill(m.corps,o))}</textarea></div></div>
   <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
    ${m.canal==="email"?(o.email?`<button class="btn primary" data-xsend="email">✉️ Ouvrir dans mon courriel</button>`:`<span class="small" style="color:var(--bad)">Pas de courriel sur cette fiche.</span>`):(o.tel?`<button class="btn primary" data-xsend="sms">💬 Envoyer par SMS</button>`:`<span class="small" style="color:var(--bad)">Pas de numéro sur cette fiche.</span>`)}
    <button class="btn" data-xsend="copy">📋 Copier le texte</button></div>`;
  P.draft.tpl=m;
}
function send(how){
  const d=P.draft;if(!d)return;const o=d.kind==="clients"?clients.get(d.id):prospects.get(d.id);if(!o)return;
  const body=($("#xBody")||{}).value||"";const subj=($("#xSubj")||{}).value||"";
  if(how==="copy"){(navigator.clipboard?navigator.clipboard.writeText((subj?subj+"\n\n":"")+body):Promise.reject()).then(()=>toast("📋 Texte copié"),()=>toast("Copie impossible : sélectionne le texte à la main"));return}
  if(how==="email")location.href="mailto:"+encodeURIComponent(o.email)+"?subject="+encodeURIComponent(subj)+"&body="+encodeURIComponent(body);
  if(how==="sms")location.href="sms:"+String(o.tel).replace(/[^\d+]/g,"")+"?&body="+encodeURIComponent(body);
  const nom=(d.tpl&&d.tpl.nom)||"Message";const canal=how==="email"?"Email":"SMS";
  if(d.kind==="clients"){o.activites=[...(o.activites||[]),{date:today(),canal,resume:nom+" envoyé",ts:Date.now()}];scheduleSave(o.id)}
  else{o.historique=[...(o.historique||[]),{date:today(),ts:Date.now(),type:"message",resultat:canal+" : "+nom,statutApres:o.statut}];saveP(o)}
  closeModal();toast("✓ Noté dans l'historique");
}

/* ---------- clics ---------- */
document.addEventListener("click",e=>{
  if(e.target.closest('a[href^="tel:"],a[href^="sms:"],a[href^="mailto:"],a[target=_blank]'))return;
  const t=e.target.closest("[data-xopen],[data-xadd],[data-xaddall],[data-xmore],[data-xfilter],[data-xsess],[data-xres],[data-xpanel],[data-xrappel],[data-xrdv],[data-xsavetel],[data-xunskip],[data-xconvert],[data-xclient],[data-xdel],[data-xmsg],[data-xtpl],[data-xsend],[data-xaddobj],[data-xdelobj],[data-xresetscripts],[data-xaddmsg],[data-xdelmsg],[data-xresetmsgs],.p-subnav [data-v],.empty [data-v],.banner [data-v],[data-xgkey],[data-xenrichall],[data-xenrich],[data-xsavemail],[data-xcheckall],[data-xgenstop],.p-gen [data-v]");
  if(!t)return;
  const ds=t.dataset;
  if(t.matches(".p-subnav [data-v],.empty [data-v],.banner [data-v],.p-gen [data-v]")){go(ds.v);return}
  if(t.hasAttribute("data-xgenstop")){if(G.run)G.run.stop=true;t.disabled=true;t.textContent="Arrêt…";return}
  if(ds.xsavemail){const p=prospects.get(ds.xsavemail);const v=(($("#xMail")||{}).value||"").trim();if(p&&/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)){p.email=v;saveP(p);toast("✓ Courriel enregistré");rAppels()}else toast("Courriel invalide");return}
  if(t.hasAttribute("data-xcheckall")){checkMany(plist().filter(aVerifier));return}
  if(t.hasAttribute("data-xgkey")){P.showKey=!P.showKey;render();return}
  if(t.hasAttribute("data-xenrichall")){enrichMany(sansNumero().map(p=>p.id));return}
  if(ds.xenrich){const p=prospects.get(ds.xenrich);if(p){t.disabled=true;t.textContent="Recherche…";enrich(p).then(()=>{if($("#scrim").classList.contains("open"))openProspect(p.id);render()})}return}
  if(ds.xopen){openProspect(ds.xopen);return}
  if(ds.xadd){const r=P.search.results.find(x=>x.siren===ds.xadd);if(r){addProspect(r).then(id=>{toast("+ "+r.societe+" ajouté à tes prospects");rRecherche();if(hasKey()&&reg.google.auto!==false)enrichMany([id])})}return}
  if(t.hasAttribute("data-xaddall")){const k=knownSirens();const rs=P.search.results.filter(r=>!k.has(r.siren));t.disabled=true;Promise.all(rs.map(addProspect)).then(ids=>{toast("+ "+rs.length+" prospects ajoutés");rRecherche();if(hasKey()&&reg.google.auto!==false)enrichMany(ids)});return}
  if(t.hasAttribute("data-xmore")){search(true);return}
  if(ds.xfilter){P.filter=ds.xfilter;rListe();return}
  if(ds.xsess!==undefined){P.sessSec=ds.xsess;P.panel=null;rAppels();return}
  if(ds.xpanel){P.panel=P.panel===ds.xpanel?null:ds.xpanel;const note=($("#xNote")||{}).value;rAppels();if(note&&$("#xNote"))$("#xNote").value=note;return}
  if(ds.xres){result(ds.xres);return}
  if(ds.xrappel){result("rappel",ds.xrappel);return}
  if(t.hasAttribute("data-xrdv")){result("rdv");return}
  if(ds.xsavetel){const p=prospects.get(ds.xsavetel);const v=($("#xTel")||{}).value.trim();if(p&&v){p.tel=v;saveP(p);toast("✓ Numéro enregistré");rAppels()}return}
  if(t.hasAttribute("data-xunskip")){P.skipped.clear();rAppels();return}
  if(ds.xconvert){const p=prospects.get(ds.xconvert);if(p){closeModal();convert(p).then(id=>{toast("➡️ "+p.societe+" est maintenant dans tes clients");if(id)openRec(id)})}return}
  if(ds.xclient){closeModal();openRec(ds.xclient);return}
  if(ds.xdel){const p=prospects.get(ds.xdel);if(p&&pdb){pdb.collection("prospects").doc(p.id).delete();prospects.delete(p.id);closeModal();toast("Prospect supprimé");render()}return}
  if(ds.xmsg){const [k,id]=ds.xmsg.split(":");openMsg(k,id);return}
  if(ds.xtpl!==undefined){showTpl(+ds.xtpl);return}
  if(ds.xsend){send(ds.xsend);return}
  const sf=$("#xsf"),mf=$("#xmf");
  if(t.hasAttribute("data-xaddobj")&&sf){readScripts(sf);reg.objections.push({q:"",r:""});rScripts();return}
  if(ds.xdelobj&&sf){readScripts(sf);reg.objections.splice(+ds.xdelobj,1);rScripts();return}
  if(t.hasAttribute("data-xresetscripts")){const pr=reg.profil;reg.script=DEF.script;reg.objections=JSON.parse(JSON.stringify(DEF.objections));reg.profil=pr;rScripts();toast("Textes d'origine remis : clique sur Enregistrer pour les garder");return}
  if(t.hasAttribute("data-xaddmsg")&&mf){readMsgs(mf);reg.messages.push({id:"m"+Date.now(),nom:"Nouveau modèle",canal:"email",sujet:"",corps:""});rMessages();return}
  if(ds.xdelmsg&&mf){readMsgs(mf);reg.messages.splice(+ds.xdelmsg,1);rMessages();return}
  if(t.hasAttribute("data-xresetmsgs")){reg.messages=JSON.parse(JSON.stringify(DEF.messages));rMessages();toast("Textes d'origine remis : clique sur Enregistrer pour les garder");return}
});

/* ---------- styles du module ---------- */
const css=document.createElement("style");
css.textContent=`
.p-head{margin-bottom:14px}
.p-gen{border-top:4px solid #f0b400}
.p-bar{height:10px;background:#eee;border-radius:999px;overflow:hidden}.p-bar div{height:100%;background:linear-gradient(90deg,#f0b400,#2e844a);transition:width .3s}
@media (max-width:760px){#xgen.form{grid-template-columns:1fr!important}}
.p-mail{background:#fff8ec;border:1px solid #f3d9a8;border-radius:10px;padding:10px 12px;color:#7a4300}
.p-facts{display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;font-size:13px;margin-bottom:14px;padding:12px;background:#fafafa;border-radius:10px}
.p-facts b{display:block;font-size:11px;color:var(--ink-3);text-transform:uppercase;letter-spacing:.04em}
@media (max-width:760px){.p-facts{grid-template-columns:1fr}}
.p-eyebrow{display:inline-block;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#5b3cc4;background:#f1ecfd;border-radius:6px;padding:3px 8px;margin-bottom:8px}
.p-subnav{display:flex;gap:4px;background:#ebe6fb;border-radius:12px;padding:4px;overflow-x:auto;scrollbar-width:none}
.p-subnav::-webkit-scrollbar{display:none}
.p-subnav button{flex:1;border:0;background:none;border-radius:9px;padding:9px 12px;font-weight:600;color:#4b3a8f;white-space:nowrap}
.p-subnav button.on{background:#fff;color:#3b2a8a;box-shadow:0 1px 3px rgba(0,0,0,.1)}
.p-badge{background:var(--violet);color:#fff;border-radius:999px;font-size:11px;padding:1px 7px}
.p-checks{display:flex;gap:6px;flex-wrap:wrap}
.p-checks .chip{cursor:pointer}
.p-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:12px}
.p-stats .kpi{padding:12px 14px}.p-stats .kpi .v{font-size:22px}
.p-call{overflow:hidden;border-top:4px solid var(--violet)}
.p-call-h{display:flex;gap:14px;padding:16px;align-items:flex-start}
.p-tel{padding:0 16px 14px}
.p-big{display:block;text-align:center;font-size:17px;padding:14px;text-decoration:none;border-radius:12px}
.p-notel{background:#fafafa;border:1px dashed #d4d4d4;border-radius:10px;padding:10px 12px}
.p-script{margin:0 16px 12px;background:#f6f3ff;border:1px solid #e2dafc;border-radius:12px;padding:14px;line-height:1.55;font-size:15px}
.p-obj{margin:0 16px 12px;border:1px solid var(--line);border-radius:10px;padding:10px 14px}
.p-obj summary{font-weight:600;cursor:pointer}
.p-obj-i{padding:8px 0;border-bottom:1px dashed #eee;font-size:14px}.p-obj-i:last-child{border-bottom:0}
.p-obj-i div{color:var(--ink-2);margin-top:2px}
.p-res{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;padding:14px 16px 16px}
.p-res .btn{padding:12px 6px;font-weight:600}
.p-res .btn.on{background:var(--brand-soft);border-color:var(--brand-2)}
.p-res .p-green{border-color:#9bd3ab;background:#e8f6ec;color:#1f6b35}
.p-panel{margin:0 16px 16px;padding:12px;background:#f6f8fa;border-radius:10px;display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.p-objedit{display:grid;grid-template-columns:1fr 2fr auto;gap:10px;align-items:end;padding:10px 0;border-bottom:1px dashed #eee}
.p-savebar{position:sticky;bottom:0;display:flex;gap:8px;justify-content:flex-end;padding:12px 0;background:linear-gradient(transparent,var(--bg) 30%)}
@media (max-width:760px){
 .p-res{grid-template-columns:1fr 1fr}.p-res .btn.ghost{grid-column:1/-1}
 .p-objedit{grid-template-columns:1fr}
 #xSearch.form{grid-template-columns:1fr!important}
 .p-savebar{bottom:calc(72px + env(safe-area-inset-bottom))}
 .p-subnav button{flex:none}
}`;
document.head.appendChild(css);
})();

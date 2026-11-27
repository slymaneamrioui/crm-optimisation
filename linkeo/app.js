/* ---------- config ---------- */
const STATUTS=[
 {k:"nouveau",l:"Nouveau",c:"var(--accent)"},{k:"pas_repondu",l:"Pas répondu",c:"var(--grey)"},{k:"rappel",l:"À rappeler",c:"var(--warn)"},
 {k:"rdv",l:"RDV pris",c:"var(--ok)"},{k:"refus",l:"Refus",c:"var(--bad)"},{k:"hors_cible",l:"Hors cible",c:"var(--violet)"},{k:"mauvais_num",l:"Mauvais numéro",c:"var(--ink-3)"}];
const SL=Object.fromEntries(STATUTS.map(s=>[s.k,s.l]));
const RESULTATS=[
 {k:"rdv",l:"RDV",s:"rendez-vous fixé",key:"1"},{k:"rappel",l:"Rappel",s:"intéressé, pas le temps",key:"2"},{k:"pas_repondu",l:"Pas répondu",s:"messagerie, revient en file",key:"3"},
 {k:"refus",l:"Refus",s:"pas intéressé",key:"4"},{k:"hors_cible",l:"Hors cible",s:"pas notre client type",key:"5"},{k:"mauvais_num",l:"Mauvais no",s:"numéro invalide",key:"6"}];
const RL=Object.fromEntries(RESULTATS.map(r=>[r.k,r.l]));RL.passer="Passé";
const REGIONS=["Montréal","Laval","Rive-Sud","Rive-Nord","Montérégie","Laurentides","Lanaudière","Estrie","Centre-du-Québec","Mauricie","Capitale-Nationale","Chaudière-Appalaches","Outaouais","Saguenay–Lac-Saint-Jean","Bas-Saint-Laurent","Abitibi-Témiscamingue","Côte-Nord","Gaspésie"];
const INDICATIFS={"514":"Montréal","438":"Montréal","263":"Montréal","450":"Couronne de Montréal","579":"Couronne de Montréal","354":"Couronne de Montréal","819":"Estrie, Mauricie, Outaouais, Centre-du-Québec","873":"Estrie, Mauricie, Outaouais, Centre-du-Québec","418":"Québec et Est","581":"Québec et Est","367":"Québec et Est"};
const CHAMPS=[
 {k:"entreprise",l:"Entreprise",syn:["entreprise","societe","société","compagnie","nom entreprise","business","raison sociale","company","nom"]},
 {k:"contact",l:"Contact (propriétaire)",syn:["contact","gerant","gérant","proprietaire","propriétaire","dirigeant","owner","responsable","prenom nom","nom du contact"]},
 {k:"tel",l:"Téléphone",syn:["tel","tél","téléphone","telephone","phone","numero","numéro","cellulaire","cell"]},
 {k:"email",l:"Courriel",syn:["email","courriel","e-mail","mail","adresse courriel"]},
 {k:"ville",l:"Ville",syn:["ville","city","municipalite","municipalité","localite"]},
 {k:"region",l:"Région",syn:["region","région","secteur geographique","zone"]},
 {k:"secteur",l:"Secteur d'activité",syn:["secteur","activite","activité","metier","métier","categorie","catégorie","industrie","domaine d'activite"]},
 {k:"adresse",l:"Adresse",syn:["adresse","address","rue","adresse complete"]},
 {k:"site",l:"Site web (oui/non ou URL)",syn:["site","site web","website","url","web","site internet"]},
 {k:"ads",l:"Google Ads (oui/non)",syn:["ads","google ads","pub","publicite","publicité","adwords"]},
 {k:"google",l:"Fiche Google (note, avis)",syn:["note","note google","avis","google","fiche google","etoiles","étoiles","rating"]},
 {k:"annee",l:"Année de fondation",syn:["annee","année","fondation","depuis","year","immatriculation"]},
 {k:"fournisseur",l:"Fournisseur web actuel",syn:["fournisseur","fournisseur web","fournisseur actuel","prestataire","agence","hebergeur","hébergeur","concurrent"]},
 {k:"domaine",l:"Création du domaine",syn:["creation du domaine","date du nom de domaine","date du domaine","nom de domaine","domaine"]},
 {k:"neq",l:"NEQ",syn:["neq","numero d'entreprise","no entreprise","numéro d'entreprise du québec"]},
 {k:"forme",l:"Forme juridique",syn:["forme juridique","forme","type d'entreprise","statut juridique"]},
 {k:"source",l:"Source / liste",syn:["source","lot","liste","provenance","origine"]},
 {k:"commentaire",l:"Commentaire",syn:["commentaire","commentaires","notes","remarque","remarques","comment"]}];
const OBJECTIONS=[
 {q:"« Pas intéressé »",a:"Je comprends, vous ne me connaissez pas encore. Juste une question : aujourd'hui, vos nouveaux clients vous trouvent comment ? Si c'est surtout Google, ça vaut 20 minutes pour voir ce que vos concurrents à {ville} font de plus."},
 {q:"« J'ai déjà quelqu'un / une agence »",a:"Parfait, ça veut dire que le web compte pour vous. Combien d'appels par mois ça vous amène ? Si vous n'avez pas le chiffre, c'est exactement ce que je vous montre au rendez-vous, sans rien changer à ce que vous avez."},
 {q:"« Envoyez-moi ça par courriel »",a:"Avec plaisir. Pour vous envoyer quelque chose d'utile et pas une brochure, je dois voir votre situation 20 minutes avec vous. Ça vous va mardi à 10 h ou jeudi à 14 h ?"},
 {q:"« J'ai pas le budget »",a:"On ne parle pas de budget au premier rendez-vous. Je vous montre où vous sortez sur Google à {ville} et ce que ça vous coûte de ne pas y être. Après, vous décidez."},
 {q:"« J'ai assez d'ouvrage / bouche-à-oreille »",a:"Tant mieux. Le but n'est pas plus de volume, c'est de choisir de meilleurs contrats et de ne pas dépendre d'un seul canal quand ça ralentit."},
 {q:"« Rappelez-moi plus tard »",a:"Pas de problème. C'est mieux en début de matinée ou en fin de journée ? Je note l'heure exacte et je vous rappelle à ce moment-là. (Clique sur Rappel.)"},
 {q:"« C'est quoi Linkeo ? »",a:"On aide les entreprises d'ici à recevoir plus d'appels de clients : site web, référencement sur Google, fiche Google et avis, publicité locale. Tout est géré pour vous, vous n'avez rien à faire de technique."}];

/* ---------- helpers ---------- */
const $=s=>document.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const norm=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").trim();
const digits=t=>{let d=String(t||"").replace(/\D/g,"");if(d.length===11&&d[0]==="1")d=d.slice(1);return d};
function phoneFmt(t){const d=digits(t);return d.length===10?d.slice(0,3)+" "+d.slice(3,6)+"-"+d.slice(6):String(t||"")}
const telHref=t=>{const d=digits(t);return "tel:+1"+d};
const dayKey=(d=new Date())=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const keyOf=iso=>iso?dayKey(new Date(iso)):"";
function daysFrom(iso){if(!iso)return null;const a=new Date(keyOf(iso)+"T12:00:00"),b=new Date(dayKey()+"T12:00:00");return Math.round((a-b)/864e5)}
const fmtDT=iso=>{if(!iso)return"—";const d=new Date(iso);return d.toLocaleDateString("fr-CA",{weekday:"short",day:"numeric",month:"short"})+" "+d.toLocaleTimeString("fr-CA",{hour:"2-digit",minute:"2-digit"})};
const fmtD=iso=>iso?new Date(iso).toLocaleDateString("fr-CA",{day:"numeric",month:"short",year:"numeric"}):"—";
const COLORS=["#1f6fde","#0f8f86","#6d4fd1","#c26a00","#1f8a4c","#c2312f","#3a49da","#8a5a00"];
const avColor=s=>{let h=0;for(const ch of String(s))h=(h*31+ch.charCodeAt(0))>>>0;return COLORS[h%COLORS.length]};
const initials=s=>String(s||"?").trim().split(/\s+/).slice(0,2).map(w=>w[0]||"").join("").toUpperCase()||"?";
const pill=st=>`<span class="pill s-${esc(st||"nouveau")}"><span class="dot"></span>${esc(SL[st]||"Nouveau")}</span>`;
function relTag(iso){const d=daysFrom(iso);if(d===null)return"";if(d<0)return`<span class="tag late">En retard ${-d} j</span>`;if(d===0)return`<span class="tag today">Aujourd'hui ${new Date(iso).toLocaleTimeString("fr-CA",{hour:"2-digit",minute:"2-digit"})}</span>`;if(d<=7)return`<span class="tag soon">Dans ${d} j</span>`;return`<span class="tag soon">${esc(fmtD(iso))}</span>`}
function toast(m){const t=$("#toast");t.textContent=m;t.hidden=false;clearTimeout(t._t);t._t=setTimeout(()=>t.hidden=true,2600)}
function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}}
function regionOf(l){if(l.region)return l.region;const d=digits(l.tel);return INDICATIFS[d.slice(0,3)]||""}
function googleInfo(l){const m=/([\d]+(?:[.,]\d)?)\s*★?\s*\(?\s*(\d+)\s*avis/i.exec(l.google||"");return m?{note:parseFloat(m[1].replace(",",".")),avis:+m[2]}:null}
function concurrent(l){const m=/devant\s*:\s*([^-|)]+)/i.exec((l.google||"")+" "+(l.commentaire||""));return m?m[1].trim():""}
function yn(v){const s=norm(v);if(!s||s==="?")return"?";if(/^(o|y|1|vrai|true)/.test(s))return"oui";if(/^(n|0|faux|false|aucun)/.test(s))return"non";if(/\.|http|www/.test(s))return"oui";return"?"}
function copy(txt,msg){try{navigator.clipboard.writeText(txt).then(()=>toast(msg||"Copié"),()=>toast("Copie refusée : sélectionne le texte à la main"))}catch(e){toast("Copie refusée : sélectionne le texte à la main")}}

/* ---------- accroche Linkeo ---------- */
function angle(l){
  const v=l.ville||"leur ville",c=concurrent(l),g=googleInfo(l),a=anniv(l);
  if(l.fournisseur&&a&&a.mois<=6)return`Il est chez ${l.fournisseur} depuis ${a.ans} an${a.ans>1?"s":""} et son contrat se renouvelle autour du ${fmtA(a.date)}. Ne critique pas ${l.fournisseur} : demande combien d'appels son site lui amène par mois et s'il sait ce qu'il paie. Propose de comparer avant la date de renouvellement, pendant qu'il peut encore changer.`;
  if(l.fournisseur)return`Il est déjà chez ${l.fournisseur} : demande combien d'appels son site lui amène et quand son contrat finit. Note la date : c'est ton meilleur moment pour rappeler.`;
  if(/shortkut/i.test((l.google||"")+(l.source||"")+(l.commentaire||"")))return"Il paie déjà un site chaque mois : demande combien d'appels ce site lui amène et s'il sort sur Google pour son métier à "+v+". S'il ne sait pas, ouvre là-dessus.";
  if(/pages ?jaunes/i.test((l.google||"")+(l.source||"")+(l.commentaire||"")))return"Il paie PagesJaunes : demande combien d'appels ça lui rapporte vraiment, puis montre que ses clients cherchent maintenant sur Google (fiche, avis, annonces).";
  if(l.site==="non")return"Aucun site web : ouvre sur ce qu'il perd quand un client le cherche sur Google à "+v+", puis présente un site clé en main avec la fiche Google.";
  if(l.ads==="oui")return"Il paie déjà de la pub : demande combien d'appels ça lui rapporte, puis montre ce qu'un bon référencement local ajoute sans payer chaque clic.";
  if(g&&g.note<3.8)return"Sa note Google ("+String(g.note).replace(".",",")+" étoiles) fait fuir les clients"+(c?" vers "+c:"")+" : ouvre là-dessus, puis propose la gestion des avis.";
  if(g&&g.avis<30)return"Presque invisible sur Google ("+g.avis+" avis)"+(c?" : "+c+" prend les appels à sa place":"")+". Propose fiche Google, avis et référencement local.";
  if(c)return"Il a un site mais "+c+" sort devant lui sur Google à "+v+". Nomme le concurrent, puis propose le diagnostic de visibilité.";
  return"Valide ce qui marche déjà, puis ouvre sur la visibilité Google à "+v+" : fiche, avis et pub locale pour aller chercher plus d'appels.";
}
function accroche(l){
  const who=l.contact?l.contact.split(" ")[0]:"";
  return `Bonjour${who?" "+who:""}, c'est Slymane de Linkeo. Je vous appelle parce que j'ai regardé comment ${l.entreprise} sort sur Google${l.secteur?" quand quelqu'un cherche "+l.secteur.toLowerCase():""}${l.ville?" à "+l.ville:""}. J'ai remarqué deux ou trois choses qui vous font perdre des appels. Avez-vous deux minutes ?`;
}

/* ---------- état ---------- */
const state={view:"accueil",recId:null,filter:"tous",fSecteur:"",fVille:"",fSource:"",q:"",sort:"recent",shown:200,sel:new Set(),cSecteur:"",cVille:"",cSource:"",fFour:"",cFour:"",cFin:"",cStat:"",cSite:"",fin:"2-4",finFour:""};
let leads=new Map(),db=null,col=null,loaded=false,canWrite=true,undo=[],skipped=new Set();
const pending={},busy={};
const list=()=>[...leads.values()];

async function init(){
  render();
  const timer=setTimeout(()=>{if(!loaded){$("#sync").textContent="Connexion lente…"}},10000);
  try{db=await claude.use("db")}catch(e){db=null}
  if(!db){clearTimeout(timer);loaded=true;render();return}
  try{const u=await claude.use("user");if(u&&u.can){const w=await u.can("data.write");if(w===false)canWrite=false}}catch(e){}
  col=db.collection("leads");
  col.onSnapshot(snap=>{
    clearTimeout(timer);
    const next=new Map();
    snap.docs.forEach(d=>{const id=d.id;if((busy[id]||pending[id])&&leads.has(id))next.set(id,leads.get(id));else next.set(id,{...d.data(),id})});
    leads=next;loaded=true;
    if(!snap.metadata.fromCache&&$("#sync").textContent==="Connexion lente…")$("#sync").textContent="";
    softRender();
  },err=>{clearTimeout(timer);loaded=true;$("#sync").textContent="Données inaccessibles";render()});
  giftsRef=db.collection("config").doc("cadeaux");
  giftsRef.onSnapshot(s=>{if(s.exists){const d=s.data()||{};gifts={items:Array.isArray(d.items)?d.items:null,pris:Array.isArray(d.pris)?d.pris:[]}}softRender()},()=>{});
  setTimeout(checkAlarms,3000);
}
function save(id){pending[id]=true;$("#sync").textContent="Enregistrement…";if(!busy[id])run(id)}
async function run(id){
  busy[id]=true;
  while(pending[id]){pending[id]=false;const l=leads.get(id);if(!l||!col)break;const body=JSON.parse(JSON.stringify(l));delete body.id;body.maj=new Date().toISOString();
    try{await col.doc(id).set(body);$("#sync").textContent="✓ Enregistré"}catch(e){errMsg(e)}}
  busy[id]=false;
}
function errMsg(e){const c=e&&e.code;$("#sync").textContent=c==="quota_exceeded"?"Base pleine":"⚠ Non enregistré";
  if(c==="quota_exceeded")toast("La base est pleine (25 000 fiches max). Supprime des leads refusés ou hors cible pour faire de la place.");
  else if(c==="invalid_argument"){canWrite=false;toast("Tu n'as pas les droits de modification sur cette app.")}}
async function remove(ids){for(const id of ids){leads.delete(id);try{await col.doc(id).delete()}catch(e){errMsg(e)}}}

/* ---------- file d'appels ---------- */
function inFilters(l,p){return(!state[p+"Secteur"]||l.secteur===state[p+"Secteur"])&&(!state[p+"Ville"]||(l.ville||"")===state[p+"Ville"])&&(!state[p+"Source"]||(l.source||"")===state[p+"Source"])&&(!state[p+"Four"]||(l.fournisseur||"")===state[p+"Four"])&&(p!=="c"||((!state.cFin||inFin(l,state.cFin))&&(!state.cSite||(l.site||"?")===state.cSite)))}
/* fins de contrat : anniversaire de la création du domaine */
function addMonthsD(d,n){const r=new Date(d.getFullYear(),d.getMonth()+n,1);const last=new Date(r.getFullYear(),r.getMonth()+1,0).getDate();r.setDate(Math.min(d.getDate(),last));return r}
function anniv(l){const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(l.domaine||"");if(!m)return null;const t=new Date();t.setHours(0,0,0,0);
  let a=new Date(t.getFullYear(),+m[2]-1,+m[3]);if(a<t)a=new Date(t.getFullYear()+1,+m[2]-1,+m[3]);
  const days=Math.round((a-t)/864e5);return{date:a,days,mois:Math.round(days/30.4*10)/10,ans:a.getFullYear()-(+m[1])}}
const FENETRES={"0-2":[0,2,"Moins de 2 mois"],"2-4":[2,4,"Entre 2 et 4 mois"],"4-12":[4,12,"Entre 4 et 12 mois"],"tous":[0,12,"Toute l'année"]};
function inFin(l,w){const a=anniv(l);if(!a)return false;const [lo,hi]=FENETRES[w||"2-4"],t=new Date();t.setHours(0,0,0,0);return a.date>=addMonthsD(t,lo)&&a.date<addMonthsD(t,hi)}
const fmtA=d=>d.toLocaleDateString("fr-CA",{day:"numeric",month:"long",year:"numeric"});
function queue(){
  const now=Date.now(),L=list().filter(l=>inFilters(l,"c"));
  const due=L.filter(l=>l.statut==="rappel"&&l.rappel&&new Date(l.rappel).getTime()<=now).sort((a,b)=>a.rappel.localeCompare(b.rappel));
  const neu=L.filter(l=>(l.statut||"nouveau")==="nouveau").sort((a,b)=>(a.ordre||0)-(b.ordre||0));
  const pr=L.filter(l=>l.statut==="pas_repondu"&&(!l.dernierAppel||now-new Date(l.dernierAppel).getTime()>3*36e5)).sort((a,b)=>(a.appels||0)-(b.appels||0)||(a.dernierAppel||"").localeCompare(b.dernierAppel||""));
  const all=state.cStat==="rappel"?due:state.cStat==="nouveau"?neu:state.cStat==="pas_repondu"?pr:[...due,...neu,...pr];
  return[...all.filter(l=>!skipped.has(l.id)),...all.filter(l=>skipped.has(l.id))];
}
function histAll(){const out=[];list().forEach(l=>(l.historique||[]).forEach(h=>out.push({...h,l})));return out}
function todayCalls(){const t=dayKey();return histAll().filter(h=>keyOf(h.d)===t&&h.r!=="passer")}
function record(l,r,extra={}){
  if(!canWrite)return toast("Lecture seule.");
  undo.push({id:l.id,prev:JSON.stringify(l)});if(undo.length>30)undo.shift();
  const now=new Date().toISOString();
  l.historique=[...(l.historique||[]),{d:now,r,note:extra.note||"",quand:extra.when||null}].slice(-60);
  l.appels=(l.appels||0)+1;l.dernierAppel=now;l.statut=r;
  l.rappel=r==="rappel"?extra.when:null;
  if(r==="rdv")l.rdv=extra.when||null;
  if(extra.note)l.commentaire=(l.commentaire?l.commentaire+"\n":"")+"["+new Date().toLocaleDateString("fr-CA",{day:"numeric",month:"short"})+"] "+extra.note;
  skipped.delete(l.id);save(l.id);render();cheer(r);
}
function undoLast(){const u=undo.pop();if(!u)return;const prev=JSON.parse(u.prev);leads.set(u.id,prev);save(u.id);render();toast("Dernier résultat annulé")}

/* ---------- motivation : points, niveaux, série, cadeaux ---------- */
const PTS={rdv:15,rappel:3,pas_repondu:1,refus:1,hors_cible:1,mauvais_num:1};
const BONUS_OBJ=10;
const NIVEAUX=[{n:"Débutant",p:0},{n:"Prospecteur",p:100},{n:"Chasseur de RDV",p:300},{n:"Closer",p:700},{n:"Machine à RDV",p:1500},{n:"Légende Linkeo",p:3000}];
const BADGES=[
 {k:"first",n:"Premier appel",d:"Tu as lancé la machine",t:s=>s.calls>=1},{k:"rdv1",n:"Premier RDV",d:"Le premier oui",t:s=>s.rdv>=1},
 {k:"c100",n:"100 appels",d:"Au total",t:s=>s.calls>=100},{k:"r10",n:"10 RDV",d:"Au total",t:s=>s.rdv>=10},
 {k:"day50",n:"Journée à 50",d:"50 appels en un jour",t:s=>s.bestDay>=50},{k:"rdv3",n:"Triplé",d:"3 RDV en un jour",t:s=>s.bestRdvDay>=3},
 {k:"st5",n:"Série de 5",d:"5 jours d'objectif d'affilée",t:s=>s.bestStreak>=5},{k:"c1000",n:"1 000 appels",d:"Respect",t:s=>s.calls>=1000}];
const CADEAUX_DEF=[{id:"g1",nom:"Café et viennoiserie",cout:50},{id:"g2",nom:"Lunch au resto",cout:150},{id:"g3",nom:"Soirée cinéma ou match",cout:400},{id:"g4",nom:"Gros cadeau (à toi de choisir)",cout:1200}];
let gifts={items:null,pris:[]};let giftsRef=null;
const goalN=()=>parseInt(ls("lk-goal")||"40")||40;
function stats(){
  const H=histAll().filter(h=>h.r!=="passer"),byDay={};
  H.forEach(h=>{const k=keyOf(h.d);(byDay[k]=byDay[k]||{c:0,r:0,p:0});byDay[k].c++;if(h.r==="rdv")byDay[k].r++;byDay[k].p+=PTS[h.r]||0});
  const g=goalN();let earned=0,bestDay=0,bestRdvDay=0;
  Object.values(byDay).forEach(d=>{earned+=d.p+(d.c>=g?BONUS_OBJ:0);bestDay=Math.max(bestDay,d.c);bestRdvDay=Math.max(bestRdvDay,d.r)});
  // série : jours ouvrables consécutifs avec objectif atteint (aujourd'hui compte s'il est atteint)
  const okDay=k=>byDay[k]&&byDay[k].c>=g;let streak=0;const d=new Date();if(!okDay(dayKey(d)))d.setDate(d.getDate()-1);
  for(let i=0;i<400;i++){const wd=d.getDay();if(wd===0||wd===6){d.setDate(d.getDate()-1);continue}if(okDay(dayKey(d))){streak++;d.setDate(d.getDate()-1)}else break}
  const days=Object.keys(byDay).sort();let bestStreak=0,run=0,prev=null;
  days.forEach(k=>{if(!okDay(k))return;if(prev){const p=new Date(prev+"T12:00:00");do{p.setDate(p.getDate()+1)}while(p.getDay()===0||p.getDay()===6);run=dayKey(p)===k?run+1:1}else run=1;prev=k;bestStreak=Math.max(bestStreak,run)});
  const spent=(gifts.pris||[]).reduce((s,x)=>s+(+x.cout||0),0);
  const lv=[...NIVEAUX].reverse().find(x=>earned>=x.p)||NIVEAUX[0],nx=NIVEAUX[NIVEAUX.indexOf(lv)+1];
  const today=byDay[dayKey()]||{c:0,r:0,p:0};
  return{earned,spent,solde:earned-spent,calls:H.length,rdv:H.filter(h=>h.r==="rdv").length,bestDay,bestRdvDay,streak,bestStreak:Math.max(bestStreak,streak),lv,nx,today,goal:g};
}
const ENCOURAGE={
 rdv:["RDV ! Voilà pourquoi tu décroches.","Encore un dans l'agenda. Tu es en feu.","Un RDV de plus, une vente de plus en vue."],
 rappel:["Intéressé : la porte est ouverte. Rappelle-le à l'heure dite.","Bon signe, il veut en parler. Note bien le moment."],
 pas_repondu:["Pas de réponse, pas grave : il revient dans ta file dans 3 h.","Messagerie. Au suivant, le prochain répond peut-être."],
 refus:["Un non de plus, un oui de plus proche. En moyenne, il en faut une dizaine.","Ne le prends pas perso. Au suivant !","Les meilleurs entendent non toute la journée. Continue."],
 hors_cible:["Bien vu, tu protèges ton temps.","Une fiche nettoyée, ta file est plus propre."],
 mauvais_num:["Numéro corrigé de ta liste. Au suivant."]};
function cheer(r){
  const s=stats(),pts=PTS[r]||0,arr=ENCOURAGE[r]||[""],msg=arr[Math.floor(Math.random()*arr.length)];
  const left=s.goal-s.today.c;let extra="";
  if(s.today.c===s.goal)extra=`Objectif du jour atteint : +${BONUS_OBJ} pts bonus !`;
  else if(left>0&&left<=5)extra=`Plus que ${left} appel${left>1?"s":""} pour ton objectif.`;
  else if(s.today.c%10===0&&s.today.c)extra=`${s.today.c} appels aujourd'hui. Belle cadence.`;
  const prevLv=[...NIVEAUX].reverse().find(x=>s.earned-pts-(s.today.c===s.goal?BONUS_OBJ:0)>=x.p);
  if(prevLv&&prevLv.n!==s.lv.n)extra=`Nouveau niveau : ${s.lv.n} !`;
  if(r==="rdv"||s.today.c===s.goal||(prevLv&&prevLv.n!==s.lv.n)){
    $("#cheerRoot").innerHTML=`<div class="cheer" role="status"><b>+${pts+(s.today.c===s.goal?BONUS_OBJ:0)} pts</b>${esc(msg)}${extra?`<div class="small" style="margin-top:6px;font-weight:600">${esc(extra)}</div>`:""}</div>`;
    clearTimeout(cheer._t);cheer._t=setTimeout(()=>$("#cheerRoot").innerHTML="",2600);confetti(r==="rdv"?160:90);beep(r==="rdv"?[660,880,1100]:[660,880]);
  }else toast(`+${pts} pt${pts>1?"s":""} · ${msg}${extra?" "+extra:""}`);
}
function confetti(n){
  if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  const c=$("#confetti"),x=c.getContext("2d");c.width=innerWidth;c.height=innerHeight;
  const cols=["#1f6fde","#f5b301","#1f8a4c","#c2312f","#6d4fd1","#0f8f86"];
  const P=Array.from({length:n},()=>({x:c.width/2+(Math.random()-.5)*200,y:c.height*.3,vx:(Math.random()-.5)*12,vy:-Math.random()*12-4,s:Math.random()*6+4,c:cols[Math.floor(Math.random()*cols.length)],r:Math.random()*6}));
  let f=0;(function tick(){x.clearRect(0,0,c.width,c.height);P.forEach(p=>{p.vy+=.35;p.x+=p.vx;p.y+=p.vy;p.r+=.1;x.save();x.translate(p.x,p.y);x.rotate(p.r);x.fillStyle=p.c;x.fillRect(-p.s/2,-p.s/4,p.s,p.s/2);x.restore()});if(++f<110)requestAnimationFrame(tick);else x.clearRect(0,0,c.width,c.height)})();
}
let actx=null;
function beep(notes){if(ls("lk-son")==="off")return;try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();notes.forEach((fq,i)=>{const o=actx.createOscillator(),g=actx.createGain();o.frequency.value=fq;o.connect(g);g.connect(actx.destination);const t=actx.currentTime+i*.12;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.15,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+.18);o.start(t);o.stop(t+.2)})}catch(e){}}
function giftItems(){return gifts.items||CADEAUX_DEF}
async function saveGifts(){if(!giftsRef||!canWrite)return;try{await giftsRef.set({items:giftItems(),pris:gifts.pris||[]})}catch(e){errMsg(e)}}
function cadeauxHTML(){
  const s=stats(),G=giftItems(),pct=s.nx?Math.round((s.earned-s.lv.p)*100/(s.nx.p-s.lv.p)):100;
  const S=s;
  return`<div class="page-h"><h1>Points et cadeaux</h1><span class="sub">Tu gagnes des points à chaque appel. Tu les échanges contre les cadeaux que tu te fixes.</span></div>
  <div class="hero-call"><div style="flex:1;min-width:220px"><div class="big">${s.solde} pts à dépenser</div><p>Niveau <b>${esc(s.lv.n)}</b>${s.nx?` · encore ${s.nx.p-s.earned} pts pour ${esc(s.nx.n)}`:" · niveau max atteint"}</p><div class="lvl"><i style="width:${pct}%"></i></div></div>
    <div style="text-align:center"><div class="big">${s.streak} j</div><p>série d'objectif</p></div><button class="btn" data-go="appeler">Gagner des points</button></div>
  <div class="kpis"><div class="card kpi"><div class="l">Barème</div><div class="s" style="font-size:13px;line-height:1.6;color:var(--ink-2)">RDV <b>+15</b> · Rappel <b>+3</b><br>Tout autre appel <b>+1</b><br>Objectif du jour <b>+${BONUS_OBJ}</b></div></div>
    <div class="card kpi"><div class="l">Points gagnés</div><div class="v">${s.earned}</div><div class="s">${s.spent} déjà dépensés</div></div>
    <div class="card kpi"><div class="l">Record d'appels</div><div class="v">${s.bestDay}</div><div class="s">en une journée</div></div>
    <div class="card kpi"><div class="l">Meilleure série</div><div class="v">${s.bestStreak} j</div><div class="s">jours ouvrables d'affilée</div></div></div>
  <div class="card" style="margin-bottom:16px"><div class="card-h">Mes cadeaux<button class="btn sm ml-auto" id="gAdd">+ Ajouter un cadeau</button></div><div class="card-b"><div class="gifts">
  ${G.map(g=>{const p=Math.min(100,Math.round(s.solde*100/(g.cout||1)));return`<div class="card gift"><div class="nm">${esc(g.nom)}</div><div class="cost">${+g.cout||0} pts</div><div class="gbar"><i style="width:${p}%"></i></div>
    <div class="small muted">${s.solde>=g.cout?"Tu peux te l'offrir !":"Encore "+(g.cout-s.solde)+" pts"}</div><div style="display:flex;gap:6px"><button class="btn sm primary" data-claim="${esc(g.id)}" ${s.solde>=g.cout&&canWrite?"":"disabled"}>Je me l'offre</button><button class="btn sm ghost" data-gdel="${esc(g.id)}">Retirer</button></div></div>`}).join("")}
  </div></div></div>
  <div class="grid2"><div class="card"><div class="card-h">Badges</div><div class="card-b"><div class="badges">${BADGES.map(b=>`<div class="badge-i ${b.t(S)?"got":""}"><b>${b.t(S)?"✓ ":""}${esc(b.n)}</b>${esc(b.d)}</div>`).join("")}</div></div></div>
  <div class="card"><div class="card-h">Cadeaux déjà pris</div><div class="card-b">${(gifts.pris||[]).length?`<ul class="tl">${gifts.pris.slice().reverse().map(x=>`<li><b>${esc(x.nom)}</b> · ${+x.cout} pts · ${esc(fmtD(x.d))}</li>`).join("")}</ul>`:`<div class="muted small">Rien encore. Ton premier cadeau t'attend.</div>`}
    <div style="margin-top:12px;display:flex;gap:8px;align-items:center"><button class="btn sm" id="bSon">${ls("lk-son")==="off"?"Activer le son":"Couper le son"}</button><span class="small muted">Sons de célébration et d'alerte de rappel</span></div>
    ${window.LK_STANDALONE&&"Notification" in window&&Notification.permission!=="granted"?`<div style="margin-top:8px;display:flex;gap:8px;align-items:center;flex-wrap:wrap"><button class="btn sm primary" id="bNotif">Activer les notifications</button><span class="small muted">Une notification du téléphone quand un rappel arrive</span></div>`:""}
    ${window.LK_STANDALONE&&window.CRMAuth?`<div style="margin-top:8px"><button class="btn sm ghost" id="bOut">Se déconnecter</button></div>`:""}</div></div></div>`;
}
/* alertes de rappel (quand l'app est ouverte) */
const alerted=new Set();
function checkAlarms(){
  if(!loaded)return;const now=Date.now();
  const due=list().filter(l=>(l.statut==="rappel"&&l.rappel&&new Date(l.rappel).getTime()<=now+60e3&&new Date(l.rappel).getTime()>now-12*36e5)||(l.statut==="rdv"&&l.rdv&&new Date(l.rdv).getTime()-now<=15*60e3&&new Date(l.rdv).getTime()>now-30*60e3)).filter(l=>!alerted.has(l.id+(l.rappel||l.rdv)));
  const n=list().filter(l=>l.statut==="rappel"&&l.rappel&&new Date(l.rappel).getTime()<=now).length;
  document.title=(n?"("+n+") ":"")+"Prospection Linkeo Québec";
  if(!due.length||$("#alarmRoot").innerHTML)return;
  const l=due[0];alerted.add(l.id+(l.rappel||l.rdv));const isRdv=l.statut==="rdv";
  $("#alarmRoot").innerHTML=`<div class="alarm" role="alert"><span class="small muted">${isRdv?"RDV dans moins de 15 min":"C'est l'heure de rappeler"}</span><b>${esc(l.entreprise)}</b><span class="small">${esc([l.contact,phoneFmt(l.tel)].filter(Boolean).join(" · "))}</span>
    <div style="display:flex;gap:6px;flex-wrap:wrap">${!isRdv?`<button class="btn sm primary" id="alCall" data-id="${esc(l.id)}">Appeler maintenant</button>`:`<button class="btn sm primary" data-open="${esc(l.id)}" id="alOpen">Voir la fiche</button>`}<button class="btn sm" id="alSnooze" data-id="${esc(l.id)}">Dans 15 min</button><button class="btn sm ghost" id="alX">Fermer</button></div></div>`;
  beep([880,660,880]);
  if(window.LK_STANDALONE&&"Notification" in window&&Notification.permission==="granted"){
    const title=isRdv?"RDV bientôt : "+l.entreprise:"Rappel : "+l.entreprise,body=[l.contact,phoneFmt(l.tel)].filter(Boolean).join(" · ");
    try{navigator.serviceWorker.ready.then(r=>r.showNotification(title,{body,tag:l.id,icon:"icon-192.png"})).catch(()=>{new Notification(title,{body})})}catch(e){}
  }
}
document.addEventListener("lk-sync",()=>render());
document.addEventListener("toggle",e=>{if(e.target.id==="fbox")state.fOpen=e.target.open},true);
setInterval(checkAlarms,30000);

/* ---------- rendu ---------- */
function softRender(){const a=document.activeElement;if($(".scrim"))return renderChrome();if(a&&a.closest&&a.closest("[data-keep]")&&/INPUT|TEXTAREA|SELECT/.test(a.tagName))return renderChrome();render()}
function renderChrome(){
  document.querySelectorAll("#nav button[data-v],#tabbar button[data-v]").forEach(b=>b.classList.toggle("on",b.dataset.v===state.view||(state.view==="fiche"&&b.dataset.v==="leads")));
  const n=list().filter(l=>(l.statut==="rappel"&&l.rappel&&daysFrom(l.rappel)<=0)||(l.statut==="rdv"&&l.rdv&&daysFrom(l.rdv)===0)).length;
  const nf=list().filter(l=>inFin(l,"2-4")&&["nouveau","pas_repondu","rappel"].includes(l.statut||"nouveau")).length;
  [["#navCount",n],["#tabCount",n],["#finCount",nf]].forEach(([s,v])=>{const e=$(s);e.hidden=!v;e.textContent=v});
  const st=stats();$("#ptsBtn").innerHTML=`<span class="coin">★</span>${st.solde}<small>pts${st.streak?" · série "+st.streak+" j":""}</small>`;
  $("#ptsBtn").classList.toggle("on",state.view==="cadeaux");
  const g=goalN(),c=st.today.c,p=Math.min(1,c/g),r=13,C=2*Math.PI*r;
  $("#goal").innerHTML=`<svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true"><circle cx="17" cy="17" r="${r}" fill="none" stroke="var(--grey-bg)" stroke-width="4"/><circle cx="17" cy="17" r="${r}" fill="none" stroke="${p>=1?"var(--ok)":"var(--accent)"}" stroke-width="4" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-p)}" transform="rotate(-90 17 17)"/></svg><span><b>${c}/${g}</b> appels aujourd'hui</span>`;
}
function render(){
  renderChrome();
  const m=$("#main");
  if(!loaded){m.innerHTML=`<div class="empty">Chargement de tes leads…</div>`;return}
  if(!db){m.innerHTML=`<div class="banner">Ouvre cette app depuis ton compte Claude pour enregistrer tes leads.</div>`+homeHTML();return}
  const v=state.view;
  m.innerHTML=(canWrite?"":`<div class="banner">Lecture seule : tu ne peux pas modifier ces leads avec ton accès.</div>`)+
    (window.LK_SYNC==="local"&&window.FIREBASE_CONFIG?`<div class="banner">Synchronisation pas encore activée : tes leads restent sur cet appareil pour l'instant.</div>`:"")+
    (v==="appeler"?callHTML():v==="leads"?leadsHTML():v==="rappels"?rappelsHTML():v==="import"?importHTML():v==="cadeaux"?cadeauxHTML():v==="contrats"?contratsHTML():v==="fiche"?ficheHTML():homeHTML());
  m.scrollTop=m._keepScroll?m.scrollTop:0;
}
function go(v){state.view=v;$("#main").scrollTop=0;render()}
function emptyLeads(){return`<div class="card"><div class="empty"><b>Aucun lead pour l'instant.</b><br>Colle ta liste depuis Excel ou Google Sheets, ou importe un fichier CSV. L'app reconnaît les colonnes toute seule et enlève les doublons.<br><br><button class="btn primary" data-go="import">Importer mes leads</button></div></div>`}
function rowLead(l,right){const nm=l.entreprise||"Sans nom";return`<div class="row" data-open="${esc(l.id)}"><div class="av" style="background:${avColor(nm)}">${esc(initials(nm))}</div><div class="grow"><div class="ellip" style="font-weight:600">${esc(nm)}</div><div class="small muted ellip">${esc([l.contact,l.ville,phoneFmt(l.tel)].filter(Boolean).join(" · "))}</div></div><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end">${right||""}</div></div>`}

/* accueil */
function homeHTML(){
  const L=list(),h=new Date().getHours(),calls=todayCalls(),now=new Date();
  const wk=new Date(now.getFullYear(),now.getMonth(),now.getDate()-((now.getDay()+6)%7));
  const H=histAll(),rdvWeek=H.filter(x=>x.r==="rdv"&&new Date(x.d)>=wk).length;
  const mo=new Date(now.getFullYear(),now.getMonth(),1),HM=H.filter(x=>new Date(x.d)>=mo&&x.r!=="passer"),taux=HM.length?Math.round(HM.filter(x=>x.r==="rdv").length*100/HM.length):0;
  const todo=L.filter(l=>(l.statut==="rappel"&&l.rappel&&daysFrom(l.rappel)<=0)||(l.statut==="rdv"&&l.rdv&&daysFrom(l.rdv)===0)).sort((a,b)=>(a.rappel||a.rdv).localeCompare(b.rappel||b.rdv));
  const nextRdv=L.filter(l=>l.statut==="rdv"&&l.rdv&&daysFrom(l.rdv)>=0).sort((a,b)=>a.rdv.localeCompare(b.rdv)).slice(0,6);
  const tot=L.length||1,counts=STATUTS.map(s=>({...s,n:L.filter(l=>(l.statut||"nouveau")===s.k).length}));
  const q=queue().length,s=stats(),left=Math.max(0,s.goal-s.today.c);
  const pep=s.today.c===0?(h<12?"Les proprios répondent le plus tôt le matin. C'est le moment.":"Une heure d'appels maintenant, c'est 2 ou 3 RDV de plus cette semaine."):left?`Encore ${left} appel${left>1?"s":""} pour ton objectif et +${BONUS_OBJ} pts bonus.`:"Objectif atteint. Chaque appel de plus, c'est du bonus.";
  return`<div class="page-h"><div><h1>${h<12?"Bon matin":h<18?"Bon après-midi":"Bonsoir"}, Slymane</h1><div class="sub">${esc(now.toLocaleDateString("fr-CA",{weekday:"long",day:"numeric",month:"long"}))}</div></div></div>
  <div class="hero-call"><div style="flex:1;min-width:220px"><div class="big">${q} lead${q>1?"s":""} t'attend${q>1?"ent":""}</div><p>${esc(pep)}</p>
    <p class="small">Niveau <b>${esc(s.lv.n)}</b> · ${s.solde} pts${s.streak?` · série de ${s.streak} jour${s.streak>1?"s":""} 🔥`:""}</p></div>
    <button class="btn" data-go="${L.length?"appeler":"import"}">${L.length?"Lancer mes appels":"Importer mes leads"}</button></div>
  <div class="kpis">
    <div class="card kpi"><div class="l">Appels aujourd'hui</div><div class="v">${calls.length}</div><div class="s">${calls.filter(x=>x.r==="rdv").length} RDV · ${calls.filter(x=>x.r==="pas_repondu").length} sans réponse</div></div>
    <div class="card kpi"><div class="l">RDV cette semaine</div><div class="v" style="color:var(--ok)">${rdvWeek}</div><div class="s">depuis lundi</div></div>
    <div class="card kpi"><div class="l">À faire aujourd'hui</div><div class="v" style="color:${todo.length?"var(--warn)":"inherit"}">${todo.length}</div><div class="s">rappels dus et RDV du jour</div></div>
    <div class="card kpi"><div class="l">Taux de RDV (mois)</div><div class="v">${taux} %</div><div class="s">${HM.length} appels ce mois-ci</div></div>
  </div>
  ${L.length?`<div class="grid2">
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="card"><div class="card-h">À faire aujourd'hui<button class="btn ghost sm ml-auto" data-go="rappels">Tout voir</button></div>
        ${todo.length?todo.map(l=>rowLead(l,l.statut==="rdv"?`<span class="pill s-rdv">RDV ${esc(new Date(l.rdv).toLocaleTimeString("fr-CA",{hour:"2-digit",minute:"2-digit"}))}</span>`:relTag(l.rappel))).join(""):`<div class="empty">Aucun rappel dû aujourd'hui. Lance une session d'appels pour remplir ton agenda.</div>`}</div>
      <div class="card"><div class="card-h">Répartition de tes ${L.length} leads</div><div class="card-b">
        <div class="bar">${counts.filter(s=>s.n).map(s=>`<div style="width:${s.n/tot*100}%;background:${s.c}" title="${esc(s.l)} : ${s.n}"></div>`).join("")}</div>
        <div class="legend">${counts.map(s=>`<span><span class="pill" style="padding:0;color:${s.c}"><span class="dot"></span></span> ${esc(s.l)} <b>${s.n}</b></span>`).join("")}</div></div></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:16px;min-width:0">
    ${(()=>{const F=L.filter(l=>inFin(l,"2-4")&&["nouveau","pas_repondu","rappel"].includes(l.statut||"nouveau")).sort((a,b)=>anniv(a).days-anniv(b).days);return F.length?`<div class="card"><div class="card-h">Fins de contrat dans 2 à 4 mois<span class="muted small">${F.length}</span><button class="btn ghost sm ml-auto" data-go="contrats">Tout voir</button></div>${F.slice(0,5).map(l=>rowLead(l,`<span class="small">${esc(l.fournisseur||"")}</span><span class="tag today">${esc(fmtA(anniv(l).date))}</span>`)).join("")}</div>`:""})()}
    <div class="card"><div class="card-h">Prochains rendez-vous</div>
      ${nextRdv.length?nextRdv.map(l=>rowLead(l,`<span class="small"><b>${esc(fmtDT(l.rdv))}</b></span>`)).join(""):`<div class="empty">Pas encore de RDV à venir.</div>`}</div></div>
  </div>`:emptyLeads()}`;
}

/* session d'appels */
function options(arr,cur,all){return`<option value="">${esc(all)}</option>`+arr.map(x=>`<option value="${esc(x)}" ${x===cur?"selected":""}>${esc(x)}</option>`).join("")}
const uniq=(k)=>[...new Set(list().map(l=>l[k]).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"fr"));
function callHTML(){
  if(!leads.size)return`<div class="page-h"><h1>Session d'appels</h1></div>`+emptyLeads();
  const q=queue(),l=q[0];
  const nAct=["cSecteur","cVille","cSource","cFour","cFin","cStat","cSite"].filter(k=>state[k]).length;
  const filt=`<details class="fbox" id="fbox" ${state.fOpen??!matchMedia("(max-width:760px)").matches?"open":""}><summary>Filtres${nAct?` · ${nAct} actif${nAct>1?"s":""}`:""}</summary><div class="filters" data-keep><label for="cSecteur">Secteur</label><select class="sel" id="cSecteur">${options(uniq("secteur"),state.cSecteur,"Tous les secteurs")}</select>
    <label for="cVille">Ville</label><select class="sel" id="cVille">${options(uniq("ville"),state.cVille,"Toutes les villes")}</select>
    <label for="cSource">Liste</label><select class="sel" id="cSource">${options(uniq("source"),state.cSource,"Toutes les listes")}</select>
    <label for="cFour">Fournisseur</label><select class="sel" id="cFour">${options(uniq("fournisseur"),state.cFour,"Tous les fournisseurs")}</select>
    <label for="cFin">Fin de contrat</label><select class="sel" id="cFin"><option value="">Tous les leads</option>${Object.entries(FENETRES).map(([k,v])=>`<option value="${k}" ${state.cFin===k?"selected":""}>${esc(v[2])}</option>`).join("")}</select>
    <label for="cStat">Type</label><select class="sel" id="cStat">${[["","Tous les types"],["nouveau","Nouveaux seulement"],["rappel","Rappels dus seulement"],["pas_repondu","Pas répondu seulement"]].map(([k,t])=>`<option value="${k}" ${state.cStat===k?"selected":""}>${t}</option>`).join("")}</select>
    <label for="cSite">Site web</label><select class="sel" id="cSite">${[["","Avec ou sans site"],["non","Sans site web"],["oui","Avec site web"]].map(([k,t])=>`<option value="${k}" ${state.cSite===k?"selected":""}>${t}</option>`).join("")}</select>
    ${state.cSecteur||state.cVille||state.cSource||state.cFour||state.cFin||state.cStat||state.cSite?`<button class="btn sm ghost" id="cReset">Enlever les filtres</button>`:""}</div></details>`;
  const head=`<div class="page-h"><h1>Session d'appels</h1><span class="sub">${q.length} en file · ${todayCalls().length} appels faits aujourd'hui</span><button class="btn sm ml-auto" id="bUndo" ${undo.length?"":"disabled"}>Annuler le dernier résultat</button></div>`;
  if(!l)return head+filt+`<div class="card"><div class="empty"><b>File vide${state.cSecteur||state.cVille||state.cSource||state.cFour||state.cFin||state.cStat||state.cSite?" pour ces filtres":""}.</b><br>Les leads sans réponse reviennent 3 h après le dernier essai. Les rappels reviennent à l'heure prévue.</div></div>`;
  const g=googleInfo(l),reg=regionOf(l);
  const facts=[l.appels?`<span class="fact">${l.appels} appel${l.appels>1?"s":""} · dernier ${esc(fmtDT(l.dernierAppel))}</span>`:`<span class="fact">Jamais appelé</span>`,
    l.statut==="rappel"?`<span class="fact amber">Rappel prévu ${esc(fmtDT(l.rappel))}</span>`:"",
    l.site==="non"?`<span class="fact red">Aucun site</span>`:l.site==="oui"?`<span class="fact green">Site actif</span>`:`<span class="fact">Site ?</span>`,
    l.ads==="oui"?`<span class="fact amber">Fait des Google Ads</span>`:l.ads==="non"?`<span class="fact red">Pas de Google Ads</span>`:"",
    g?`<span class="fact ${g.note<3.8||g.avis<30?"red":"green"}">${String(g.note).replace(".",",")} ★ · ${g.avis} avis</span>`:"",
    l.fournisseur?`<span class="fact red">Chez ${esc(l.fournisseur)}</span>`:"",
    (()=>{const a=anniv(l);return a&&a.mois<=6?`<span class="fact amber">Renouvellement le ${esc(fmtA(a.date))} (dans ${a.days} j)</span>`:""})(),
    l.annee?`<span class="fact">Entreprise depuis ${esc(l.annee)}</span>`:"",
    l.domaine?`<span class="fact">Domaine créé le ${esc(l.domaine.length>4?fmtD(l.domaine+"T12:00:00"):l.domaine)}</span>`:"",reg?`<span class="fact">${esc(reg)}</span>`:""].join("");
  const last=(l.historique||[]).slice(-3).reverse();
  return head+filt+`<div class="call-grid"><div style="display:flex;flex-direction:column;gap:12px;min-width:0">
    <div class="card lead-card">
      <div class="meta"><span>${esc([l.secteur,l.ville].filter(Boolean).join(" · ")||"Secteur à préciser")}</span><span>${esc(l.source||"")}</span></div>
      <div class="lead-name">${esc(l.entreprise||"Sans nom")}</div>
      <p class="ask">${l.contact?`Demander <b>${esc(l.contact)}</b>`:`Demander <b>le propriétaire</b> (nom à trouver)`}${l.adresse?` · <span class="muted">${esc(l.adresse)}</span>`:""}</p>
      <div class="facts">${facts}</div>
      <div class="phone"><span class="num">${esc(phoneFmt(l.tel)||"Pas de numéro")}</span>${l.tel?`<a class="btn primary" href="${esc(telHref(l.tel))}">Appeler</a><button class="btn" data-copy="${esc(phoneFmt(l.tel))}">Copier</button>`:""}<button class="btn ghost" data-open="${esc(l.id)}">Ouvrir la fiche</button></div>
      <div class="box"><span class="lbl">Accroche</span>${esc(accroche(l))}</div>
      <div class="box" style="border-color:var(--ok)"><span class="lbl">Angle Linkeo</span>${esc(angle(l))}</div>
      ${l.google?`<div class="box" style="border-color:var(--line)"><span class="lbl">Infos Google</span>${esc(l.google)}</div>`:""}
      ${l.commentaire?`<div class="box" style="border-color:var(--warn);white-space:pre-wrap"><span class="lbl">Tes notes</span>${esc(l.commentaire)}</div>`:""}
      <div class="f" style="margin-top:12px" data-keep><label for="cNote">Note sur cet appel (ajoutée à la fiche)</label><textarea id="cNote" style="min-height:60px" placeholder="Ex. : sa femme gère le web, rappeler après 16 h, contrat avec une agence jusqu'en mars"></textarea></div>
      <div class="res-grid">${RESULTATS.map(r=>`<button class="res ${r.k}" data-res="${r.k}">${esc(r.l)}<span>${esc(r.s)}</span></button>`).join("")}</div>
      <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap"><button class="btn" id="bPass">Passer (garder en file)</button></div>
      <p class="kbd">Clavier : <b>1</b> RDV <b>2</b> Rappel <b>3</b> Pas répondu <b>4</b> Refus <b>5</b> Hors cible <b>6</b> Mauvais no <b>P</b> Passer <b>Z</b> Annuler</p>
    </div></div>
    <aside style="display:flex;flex-direction:column;gap:12px;min-width:0">
      <div class="card"><div class="card-h">Objections</div>${OBJECTIONS.map(o=>`<details class="obj"><summary>${esc(o.q)}</summary><p>${esc(o.a.replace(/\{ville\}/g,l.ville||"votre ville"))}</p></details>`).join("")}</div>
      ${last.length?`<div class="card"><div class="card-h">Derniers échanges</div><div class="card-b"><ul class="tl">${last.map(h=>`<li><b>${esc(RL[h.r]||h.r)}</b> · ${esc(fmtDT(h.d))}${h.note?`<br><span class="muted">${esc(h.note)}</span>`:""}</li>`).join("")}</ul></div></div>`:""}
      <div class="card"><div class="card-h">Ensuite dans la file</div>${q.slice(1,7).map(x=>rowLead(x,"")).join("")||`<div class="empty">Rien après ce lead.</div>`}</div>
    </aside></div>`;
}

/* leads */
function matches(l,q){if(!q)return true;const hay=norm([l.fournisseur,l.entreprise,l.contact,l.ville,l.region,l.secteur,l.tel,digits(l.tel),l.email,l.adresse,l.source].join(" "));return norm(q).split(/\s+/).every(w=>hay.includes(w))}
function filtered(){
  let L=list().filter(l=>state.filter==="tous"||(l.statut||"nouveau")===state.filter).filter(l=>inFilters(l,"f")).filter(l=>matches(l,state.q));
  const s=state.sort;
  L.sort((a,b)=>s==="nom"?(a.entreprise||"").localeCompare(b.entreprise||"","fr"):s==="ville"?(a.ville||"").localeCompare(b.ville||"","fr"):s==="appel"?(b.dernierAppel||"").localeCompare(a.dernierAppel||""):(b.ordre||0)-(a.ordre||0));
  return L;
}
function leadsHTML(){
  if(!leads.size)return`<div class="page-h"><h1>Mes leads</h1></div>`+emptyLeads();
  const L=filtered(),shown=L.slice(0,state.shown),sel=state.sel;
  const cnt=k=>list().filter(l=>k==="tous"||(l.statut||"nouveau")===k).length;
  return`<div class="page-h"><h1>Mes leads</h1><span class="sub">${L.length} sur ${leads.size}</span>${(()=>{const n=list().filter(l=>badSect(l)&&secteurAuto(l.entreprise,l.siteUrl)).length;return n&&canWrite?`<button class="btn ml-auto" id="bSect">Trouver le secteur de ${n} lead${n>1?"s":""}</button>`:""})()}<button class="btn ${list().some(l=>badSect(l)&&secteurAuto(l.entreprise,l.siteUrl))&&canWrite?"":"ml-auto"}" id="bNew">+ Ajouter un lead</button><button class="btn primary" data-go="import">Importer</button></div>
  <div class="toolbar">${[{k:"tous",l:"Tous"},...STATUTS].map(s=>`<button class="chip ${state.filter===s.k?"on":""}" data-filter="${s.k}">${esc(s.l)} · ${cnt(s.k)}</button>`).join("")}</div>
  <div class="filters" data-keep><input class="sel" id="fQ" placeholder="Filtrer…" value="${esc(state.q)}" style="max-width:220px">
    <select class="sel" id="fSecteur" aria-label="Secteur">${options(uniq("secteur"),state.fSecteur,"Tous les secteurs")}</select>
    <select class="sel" id="fVille" aria-label="Ville">${options(uniq("ville"),state.fVille,"Toutes les villes")}</select>
    <select class="sel" id="fSource" aria-label="Liste">${options(uniq("source"),state.fSource,"Toutes les listes")}</select>
    <select class="sel" id="fFour" aria-label="Fournisseur">${options(uniq("fournisseur"),state.fFour,"Tous les fournisseurs")}</select>
    <select class="sel" id="fSort" aria-label="Trier">${[["recent","Plus récents"],["nom","Entreprise A-Z"],["ville","Ville A-Z"],["appel","Dernier appel"]].map(([k,t])=>`<option value="${k}" ${state.sort===k?"selected":""}>${t}</option>`).join("")}</select></div>
  ${sel.size?`<div class="bulk"><b>${sel.size} sélectionné${sel.size>1?"s":""}</b><select class="sel" id="bulkSt" aria-label="Nouveau statut"><option value="">Changer le statut…</option>${STATUTS.map(s=>`<option value="${s.k}">${esc(s.l)}</option>`).join("")}</select><button class="btn sm" id="bulkFour">Définir le fournisseur</button><button class="btn sm danger" id="bulkDel">Supprimer</button><button class="btn sm ghost" id="bulkClear">Tout désélectionner</button></div>`:""}
  <div class="card tbl-wrap"><table class="t"><thead><tr><th><input type="checkbox" id="selAll" aria-label="Tout sélectionner" ${L.length&&L.every(l=>sel.has(l.id))?"checked":""}></th><th data-sort="nom">Entreprise</th><th class="hide-m">Contact</th><th>Téléphone</th><th data-sort="ville">Ville</th><th class="hide-m">Secteur</th><th class="hide-m">Fournisseur</th><th>Statut</th><th class="hide-m" data-sort="appel">Dernier appel</th></tr></thead><tbody>
  ${shown.map(l=>`<tr class="r" data-open="${esc(l.id)}"><td><input type="checkbox" data-sel="${esc(l.id)}" ${sel.has(l.id)?"checked":""} aria-label="Sélectionner"></td><td><b>${esc(l.entreprise||"Sans nom")}</b></td><td class="hide-m">${esc(l.contact||"")}</td><td style="white-space:nowrap">${esc(phoneFmt(l.tel))}</td><td>${esc(l.ville||"")}</td><td class="hide-m">${esc(l.secteur||"")}</td><td class="hide-m">${esc(l.fournisseur||"")}</td><td>${pill(l.statut)}${l.statut==="rappel"?" "+relTag(l.rappel):""}</td><td class="hide-m small muted">${l.dernierAppel?esc(fmtDT(l.dernierAppel)):"—"}</td></tr>`).join("")||`<tr><td colspan="9"><div class="empty">Aucun lead ne correspond.</div></td></tr>`}
  </tbody></table></div>
  ${L.length>shown.length?`<div style="text-align:center;margin-top:12px"><button class="btn" id="bMore">Afficher ${Math.min(200,L.length-shown.length)} de plus</button></div>`:""}`;
}

/* fins de contrat */
function contratsHTML(){
  const withDom=list().filter(l=>anniv(l)),w=state.fin;
  const L=withDom.filter(l=>inFin(l,w)&&(!state.finFour||(l.fournisseur||"")===state.finFour)).sort((a,b)=>anniv(a).days-anniv(b).days);
  const n=k=>withDom.filter(l=>inFin(l,k)&&(!state.finFour||(l.fournisseur||"")===state.finFour)).length;
  const sansDate=list().length-withDom.length;
  return`<div class="page-h"><h1>Fins de contrat</h1><span class="sub">Date anniversaire de la création du domaine · ${L.length} lead${L.length>1?"s":""}</span>
    ${L.length?`<button class="btn primary ml-auto" id="bFinCall">${L.length>1?`Appeler ces ${L.length} leads`:"Appeler ce lead"}</button>`:""}</div>
  <div class="toolbar">${Object.entries(FENETRES).map(([k,v])=>`<button class="chip ${w===k?"on":""}" data-fin="${k}">${esc(v[2])} · ${n(k)}</button>`).join("")}</div>
  <div class="filters" data-keep><label for="finFour">Fournisseur</label><select class="sel" id="finFour">${options(uniq("fournisseur"),state.finFour,"Tous les fournisseurs")}</select>
    <span class="small muted">${sansDate?sansDate+" lead"+(sansDate>1?"s":"")+" sans date de création du domaine ne figure"+(sansDate>1?"nt":"")+" pas ici.":""}</span></div>
  <div class="card tbl-wrap"><table class="t"><thead><tr><th>Entreprise</th><th>Fournisseur</th><th class="hide-m">Ville</th><th class="hide-m">Secteur</th><th class="hide-m">Création du domaine</th><th>Renouvellement</th><th>Dans</th><th>Statut</th></tr></thead><tbody>
  ${L.map(l=>{const a=anniv(l);return`<tr class="r" data-open="${esc(l.id)}"><td><b>${esc(l.entreprise)}</b><div class="small muted">${esc(phoneFmt(l.tel))}</div></td><td>${esc(l.fournisseur||"—")}</td><td class="hide-m">${esc(l.ville||"")}</td><td class="hide-m">${esc(l.secteur||"")}</td><td class="hide-m">${esc(l.domaine)}</td><td style="white-space:nowrap"><b>${esc(fmtA(a.date))}</b><div class="small muted">${a.ans} an${a.ans>1?"s":""}</div></td><td><span class="tag ${a.mois<2?"late":a.mois<=4?"today":"soon"}">${a.days} j</span></td><td>${pill(l.statut)}</td></tr>`}).join("")||`<tr><td colspan="8"><div class="empty">Aucun lead dans cette période.${withDom.length?"":"<br>Importe des leads avec la colonne « Création du domaine » pour les voir ici."}</div></td></tr>`}
  </tbody></table></div>`;
}

/* rappels */
function rappelsHTML(){
  const L=list(),R=L.filter(l=>l.statut==="rappel"&&l.rappel).sort((a,b)=>a.rappel.localeCompare(b.rappel));
  const D=L.filter(l=>l.statut==="rdv"&&l.rdv&&daysFrom(l.rdv)>=0).sort((a,b)=>a.rdv.localeCompare(b.rdv));
  const groups=[["En retard",l=>daysFrom(l.rappel)<0],["Aujourd'hui",l=>daysFrom(l.rappel)===0],["Cette semaine",l=>{const d=daysFrom(l.rappel);return d>0&&d<=7}],["Plus tard",l=>daysFrom(l.rappel)>7]];
  return`<div class="page-h"><h1>Rappels et RDV</h1><span class="sub">${R.length} rappel${R.length>1?"s":""} · ${D.length} RDV à venir</span><button class="btn ml-auto" id="bBilan">Copier le bilan du jour</button></div>
  <div class="grid2"><div style="display:flex;flex-direction:column;gap:14px">
  ${groups.map(([t,f])=>{const g=R.filter(f);if(!g.length)return"";return`<div class="card"><div class="card-h">${t}<span class="muted small">${g.length}</span></div>${g.map(l=>rowLead(l,`<span class="small muted">${esc(fmtDT(l.rappel))}</span>${relTag(l.rappel)}`)).join("")}</div>`}).join("")||`<div class="card"><div class="empty">Aucun rappel programmé.</div></div>`}
  </div><div class="card" style="align-self:start"><div class="card-h">RDV à venir<span class="muted small">${D.length}</span></div>${D.map(l=>rowLead(l,`<span class="small"><b>${esc(fmtDT(l.rdv))}</b></span>`)).join("")||`<div class="empty">Pas de RDV à venir.</div>`}</div></div>`;
}

/* fiche */
const FORM=[
 {t:"Entreprise"},{k:"entreprise",l:"Entreprise"},{k:"secteur",l:"Secteur d'activité",dl:"secteur"},{k:"contact",l:"Contact (propriétaire)"},{k:"tel",l:"Téléphone",type:"tel"},
 {k:"email",l:"Courriel",type:"email"},{k:"annee",l:"En affaires depuis"},{k:"neq",l:"NEQ"},{k:"forme",l:"Forme juridique"},{k:"adresse",l:"Adresse",full:true},{k:"ville",l:"Ville",dl:"ville"},{k:"region",l:"Région",dl:"region"},
 {t:"Présence web"},{k:"site",l:"Site web",type:"select",o:[["?","Je ne sais pas"],["oui","Oui"],["non","Non"]]},{k:"siteUrl",l:"Adresse du site"},{k:"fournisseur",l:"Fournisseur web actuel",dl:"fournisseur"},{k:"domaine",l:"Création du domaine",type:"date"},
 {k:"ads",l:"Google Ads",type:"select",o:[["?","Je ne sais pas"],["oui","Oui"],["non","Non"]]},{k:"google",l:"Fiche Google (note, avis, concurrents)"},
 {t:"Suivi"},{k:"statut",l:"Statut",type:"select",o:STATUTS.map(s=>[s.k,s.l])},{k:"source",l:"Liste / source",dl:"source"},
 {k:"rappelLocal",l:"Rappel prévu",type:"datetime-local"},{k:"rdvLocal",l:"Rendez-vous",type:"datetime-local"},{k:"commentaire",l:"Notes",type:"textarea",full:true}];
const toLocal=iso=>iso?new Date(new Date(iso).getTime()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,16):"";
function ficheHTML(){
  const l=leads.get(state.recId);if(!l)return`<div class="empty">Ce lead n'existe plus. <button class="btn" data-go="leads">Retour à mes leads</button></div>`;
  const nm=l.entreprise||"Sans nom",ro=canWrite?"":"disabled";
  const val=f=>f.k==="rappelLocal"?toLocal(l.rappel):f.k==="rdvLocal"?toLocal(l.rdv):(l[f.k]??(f.k==="statut"?"nouveau":f.k==="site"||f.k==="ads"?"?":""));
  const field=f=>f.t?`<div class="sec-t f full">${esc(f.t)}</div>`:`<div class="f ${f.full?"full":""}"><label for="p_${f.k}">${esc(f.l)}</label>${f.type==="select"?`<select id="p_${f.k}" data-p="${f.k}" ${ro}>${f.o.map(([k,t])=>`<option value="${esc(k)}" ${val(f)===k?"selected":""}>${esc(t)}</option>`).join("")}</select>`:f.type==="textarea"?`<textarea id="p_${f.k}" data-p="${f.k}" ${ro}>${esc(val(f))}</textarea>`:`<input id="p_${f.k}" data-p="${f.k}" type="${f.type||"text"}" value="${esc(val(f))}" ${f.dl?`list="dl_${f.dl}"`:""} ${ro}>`}</div>`;
  const dls=["secteur","ville","source","fournisseur"].map(k=>`<datalist id="dl_${k}">${uniq(k).map(x=>`<option value="${esc(x)}">`).join("")}</datalist>`).join("")+`<datalist id="dl_region">${REGIONS.map(x=>`<option value="${esc(x)}">`).join("")}</datalist>`;
  const H=(l.historique||[]).slice().reverse();
  return`<div class="card"><div class="rec-head"><div class="av" style="background:${avColor(nm)}">${esc(initials(nm))}</div><div class="grow"><button class="btn ghost sm" data-go="leads" style="padding:0;margin-bottom:4px">‹ Mes leads</button><h1 class="rec-title">${esc(nm)}</h1>
  <div class="small muted" style="margin-top:4px">${esc([l.contact,l.secteur,l.ville,regionOf(l)].filter(Boolean).join(" · "))}</div><div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">${pill(l.statut)}${l.statut==="rappel"?relTag(l.rappel):""}${l.statut==="rdv"&&l.rdv?`<span class="pill s-rdv">${esc(fmtDT(l.rdv))}</span>`:""}</div></div>
  <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><span style="font-family:var(--display);font-weight:800;font-size:24px;user-select:all">${esc(phoneFmt(l.tel))}</span>${l.tel?`<a class="btn primary" href="${esc(telHref(l.tel))}">Appeler</a><button class="btn" data-copy="${esc(phoneFmt(l.tel))}">Copier</button>`:""}</div></div></div>
  <div class="rec-layout"><div class="card"><div class="card-b"><div class="form" data-keep id="recBody">${FORM.map(field).join("")}</div>${dls}</div></div>
  <div style="display:flex;flex-direction:column;gap:14px;min-width:0">
    <div class="card"><div class="card-h">Noter un appel</div><div class="card-b" style="display:flex;flex-direction:column;gap:10px">
      <div class="res-grid" style="margin:0">${RESULTATS.map(r=>`<button class="res ${r.k}" data-res="${r.k}" style="font-size:15px;padding:10px 4px">${esc(r.l)}</button>`).join("")}</div>
      <div class="sec-t" style="margin:4px 0 0">Rappel rapide</div><div class="quick">${[["Demain",1],["Dans 3 j",3],["Dans 1 sem.",7],["Dans 1 mois",30]].map(([t,n])=>`<button class="btn sm" data-quick="${n}">${t}</button>`).join("")}</div></div></div>
    <div class="card"><div class="card-h">Historique<span class="muted small">${H.length}</span></div><div class="card-b">${H.length?`<ul class="tl">${H.map(h=>`<li><b>${esc(RL[h.r]||h.r)}</b> · ${esc(fmtDT(h.d))}${h.quand?` → ${esc(fmtDT(h.quand))}`:""}${h.note?`<br><span class="muted">${esc(h.note)}</span>`:""}</li>`).join("")}</ul>`:`<div class="muted small">Aucun appel noté pour l'instant.</div>`}</div></div>
    ${canWrite?`<button class="btn danger" id="bDel">Supprimer ce lead</button>`:""}
  </div></div>`;
}

/* import */
const imp={step:1,raw:"",rows:[],head:[],map:[],hasHead:true,source:"",running:false,done:0,total:0,added:0,dupes:0};
function parseTable(txt){
  txt=txt.replace(/^﻿/,"");const first=txt.split(/\r?\n/).find(x=>x.trim())||"";
  const delim=first.includes("\t")?"\t":(first.split(";").length>=first.split(",").length?";":",");
  const rows=[];let row=[],cur="",q=false;
  for(let i=0;i<txt.length;i++){const ch=txt[i];
    if(q){if(ch==='"'){if(txt[i+1]==='"'){cur+='"';i++}else q=false}else cur+=ch}
    else if(ch==='"'&&cur==="")q=true;
    else if(ch===delim){row.push(cur.trim());cur=""}
    else if(ch==="\n"||ch==="\r"){if(ch==="\r"&&txt[i+1]==="\n")i++;row.push(cur.trim());cur="";if(row.some(x=>x))rows.push(row);row=[]}
    else cur+=ch}
  row.push(cur.trim());if(row.some(x=>x))rows.push(row);
  return rows;
}
function guessField(h){const n=norm(h);if(!n)return"";let best="";CHAMPS.forEach(c=>{if(c.syn.some(s=>n===norm(s)))best=best||c.k});if(best)return best;let bl=0;CHAMPS.forEach(c=>c.syn.forEach(s=>{const ns=norm(s);if(ns.length>2&&n.includes(ns)&&ns.length>bl){bl=ns.length;best=c.k}}));return best}
/* secteur d'activité déduit du nom de l'entreprise et du site */
const SECTEURS=[
 ["Extermination",["extermin","parasit","punaise","antiparasit","gestion parasitaire"]],["Fosses septiques",["fosse septique","fosses septiques","vidange septique","septique"]],
 ["Forage de puits",["forage","puits artesien","puisatier"]],["Fondation et béton",["fondation","beton","coffrage","drain francais","impermeabilis","fissure"]],
 ["Émondage et abattage",["emondage","abattage","elagage","arboricult","arboriste","essouchage"]],["Déneigement",["deneigement"]],
 ["Toiture",["toiture","couvreur","bardeau","toit "]],["Gouttières",["gouttiere"]],["Excavation",["excavation","terrassement"]],
 ["Asphalte et pavage",["asphalte","pavage","scellant"]],["Pavé uni et maçonnerie",["pave uni","paves","maconn","pierre"]],
 ["Paysagement",["paysag","amenagement exterieur","tonte","gazon","pelouse","horticult"]],["Clôtures",["cloture"]],["Piscines et spas",["piscine","spa "]],
 ["Plomberie",["plomb"]],["Électricité",["electri"]],["Chauffage et climatisation",["chauffage","climatis","thermopompe","ventilation","refrigeration","hvac","geotherm"]],
 ["Isolation",["isolation","uretha"]],["Portes et fenêtres",["porte","fenetre"]],["Vitrerie",["vitre","vitrerie"]],
 ["Armoires et ébénisterie",["armoire","ebenist","cuisine"]],["Comptoirs",["comptoir","quartz","granit"]],["Salle de bain",["salle de bain"]],
 ["Planchers et céramique",["plancher","ceramique","couvre-sol","couvre sol","tuile"]],["Peinture",["peintur","peintre"]],["Gypse et plâtre",["gypse","platre","tirage de joint"]],
 ["Rénovation et construction",["renovation","reno ","construction","entrepreneur general","batiment","habitation","menuiserie","charpent"]],
 ["Nettoyage",["nettoyage","entretien menager","conciergerie","menage"]],["Déménagement",["demenag"]],["Serrurerie",["serrur"]],["Remorquage",["remorquage"]],
 ["Automobile",["garage","mecanique","carrosserie","pneu","auto "]],["Taxi",["taxi"]],["Transport",["transport","camionnage"]],
 ["Restauration",["restaurant","resto","pizzeria","bistro","traiteur","cafe "]],["Beauté et coiffure",["coiffure","esthetique","salon de beaute","barbier","ongle"]],
 ["Santé",["dentist","dentaire","clinique","physio","chiropr","massotherap","optom"]],["Animaux",["veterinaire","toilettage"]],
 ["Immobilier",["immobili","courtier"]],["Assurance",["assurance"]],["Comptabilité",["comptab","fiscal"]],["Juridique",["notaire","avocat"]],
 ["Informatique",["informatique","techno"]],["Photographie",["photograph"]],["Location d'équipement",["location"]]];
const badSect=l=>!l.secteur||/^\d{4}-\d{2}-\d{2}/.test(l.secteur);
function secteurAuto(nom,site){
  const t=" "+norm(String(nom||"")+" "+String(site||"").replace(/https?:\/\/|www\.|\.(com|ca|net|org|quebec)\/?/gi," ").replace(/[-_.\/]/g," "))+" ";
  for(const [sec,keys] of SECTEURS)if(keys.some(k=>t.includes(k)))return sec;
  return"";
}

/* reconnaissance d'une colonne par son contenu (listes sans ligne de titres) */
function kindOf(v,row){
  v=String(v||"").trim();if(!v)return"";const n=norm(v);
  if(/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v))return"email";
  if(/^\d{10}$/.test(v)&&/^(11|22|33)/.test(v))return"neq";
  if(/^[\d\s().+-]{10,}(\s*(x|ext|poste)\.?\s*\d+)?$/i.test(v)&&digits(v.replace(/(x|ext|poste).*/i,"")).length===10)return"tel";
  if(!/\s/.test(v)&&/^(https?:\/\/|www\.)|\.(com|ca|net|org|quebec|info|biz)(\/|$)/i.test(v))return"site";
  if(/^\d{4}-\d{2}-\d{2}/.test(v)||/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(v))return"date";
  if(/[a-z]\d[a-z]\s?\d[a-z]\d/i.test(v)||/^\d+[\s,-]+(rue|av|avenue|boul|boulevard|ch|chemin|rang|route|montée|place|rte)\b/i.test(v))return"adresse";
  if(/soci[eé]t[eé] par actions|entreprise individuelle|soci[eé]t[eé] en nom collectif|soci[eé]t[eé] en commandite|personne morale|coop[eé]rative|organisme sans but/i.test(v))return"forme";
  if(/^(oui|non)\s*:/i.test(v))return"registre";
  if(/^(oui|non|o|n|yes|no)$/i.test(v))return"yn";
  if(/non indiqu|n\/d|^a demander/i.test(n))return"contact";
  if(/(★|\bavis\b|\betoiles?\b)/i.test(v))return"google";
  const adr=row.find(x=>kindOf.adrRe.test(x||""));
  if(adr&&v.length<40&&!/\d/.test(v)&&norm(adr).includes(n))return"ville";
  if(/^[A-ZÀ-Ý][a-zà-ÿ'-]+(\s+[A-ZÀ-Ý][a-zà-ÿ'-]+){1,2}$/.test(v)&&!/\b(inc|ltee|ltée|enr|construction|toiture|excavation|services?)\b/i.test(v))return"personne";
  return"texte";
}
kindOf.adrRe=/[a-z]\d[a-z]\s?\d[a-z]\d/i;
function guessByContent(rows,map){
  const nc=Math.max(...rows.map(r=>r.length)),S=rows.slice(0,60),kinds=[];
  for(let i=0;i<nc;i++){const cnt={};S.forEach(r=>{const k=kindOf(r[i],r);if(k)cnt[k]=(cnt[k]||0)+1});kinds.push(Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0]?.[0]||"")}
  const out=map?map.slice():Array(nc).fill(""),used=new Set(out.filter(Boolean));
  const put=(i,k)=>{if(out[i]||(used.has(k)&&k!=="commentaire"))return;out[i]=k;used.add(k)};
  kinds.forEach((k,i)=>{if(["email","neq","tel","site","adresse","forme","google","ville"].includes(k))put(i,k)});
  kinds.forEach((k,i)=>{if(k==="contact"||k==="personne")put(i,"contact")});
  const neqI=out.indexOf("neq");kinds.forEach((k,i)=>{if(k==="date"&&neqI>=0&&i===neqI+1)put(i,"annee")});
  const adrI=out.indexOf("adresse");kinds.forEach((k,i)=>{if(k==="date"&&!out[i]&&(adrI<0||i<adrI))put(i,"domaine")});
  const firstText=kinds.findIndex((k,i)=>(k==="texte"||k==="personne")&&!out[i]);if(!used.has("entreprise")&&firstText>=0)put(firstText,"entreprise");
  if(!used.has("entreprise")&&nc)out[0]=out[0]||"entreprise";
  kinds.forEach((k,i)=>{if(k==="texte"&&!out[i])put(i,"commentaire")});
  return out;
}
function prepImport(){
  const rows=parseTable(imp.raw);if(!rows.length){toast("Rien à importer : colle tes lignes d'abord.");return false}
  let nc=0;rows.forEach(r=>r.forEach((v,i)=>{if(v)nc=Math.max(nc,i+1)}));rows.forEach((r,i)=>rows[i]=r.slice(0,nc));
  const g=rows[0].map(guessField);
  const looksData=rows[0].some(v=>["email","tel","site","date","adresse","neq"].includes(kindOf(v,rows[0])));
  imp.hasHead=g.filter(Boolean).length>=2&&!looksData;
  imp.rows=imp.hasHead?rows.slice(1):rows;
  imp.head=Array.from({length:nc},(_,i)=>imp.hasHead?(rows[0][i]||"Colonne "+(i+1)):"Colonne "+(i+1));
  const saved=(()=>{try{return JSON.parse(ls("lk-map-"+nc)||"null")}catch(e){return null}})();
  if(imp.hasHead)imp.map=guessByContent(imp.rows.length?imp.rows:rows,g.map((k,i)=>g.indexOf(k)===i?k:"").concat(Array(Math.max(0,nc-g.length)).fill("")));
  else if(saved&&saved.length===nc){imp.map=saved;imp.memo=true}
  else imp.map=guessByContent(rows);
  imp.step=2;return true;
}
function buildLeads(){
  const known=new Set();list().forEach(l=>{const d=digits(l.tel);known.add(d.length>=10?d:norm(l.entreprise)+"|"+norm(l.ville))});
  const out=[];let dup=0,base=Date.now();
  imp.rows.forEach((r,ri)=>{const o={};imp.map.forEach((k,i)=>{if(k&&r[i])o[k]=o[k]?o[k]+(k==="commentaire"?" · ":" ")+r[i]:r[i]});
    if(o.contact&&/non indiqu|^n\/?d$|^a demander|^aucun/i.test(norm(o.contact)))o.contact="";
    if(o.annee){const y=/(\d{4})/.exec(o.annee);o.annee=y?y[1]:""}
    if(o.domaine){const dm=/(\d{4})-(\d{2})-(\d{2})/.exec(o.domaine);o.domaine=dm?dm[0]:(/(\d{4})/.exec(o.domaine)||[""])[0]}
    if(!o.secteur){o.secteur=secteurAuto(o.entreprise,o.site);if(o.secteur)o._auto=1}
    if(!o.ville&&o.adresse){const m=/(?:^|,)\s*([^,]+?),\s*(QC|Qu[eé]bec)\b/i.exec(o.adresse);if(m)o.ville=m[1].trim()}
    if(!o.entreprise&&!o.tel)return;
    const d=digits(o.tel),key=d.length>=10?d:norm(o.entreprise)+"|"+norm(o.ville);if(known.has(key)){dup++;return}known.add(key);
    const siteRaw=o.site||"";const l={entreprise:o.entreprise||"Sans nom",contact:(o.contact||"").replace(/^à demander$/i,""),tel:o.tel?phoneFmt(o.tel):"",email:o.email||"",ville:o.ville||"",region:o.region||"",secteur:o.secteur||"",adresse:o.adresse||"",
      site:yn(siteRaw),siteUrl:/\.|http/.test(siteRaw)?siteRaw:"",ads:yn(o.ads),google:o.google||"",annee:o.annee||"",domaine:o.domaine||"",fournisseur:o.fournisseur||imp.fournisseur||"",neq:o.neq||"",forme:o.forme||"",source:o.source||imp.source||"",commentaire:o.commentaire||"",
      statut:"nouveau",appels:0,historique:[],ordre:base+ri,cree:new Date().toISOString()};
    if(o._auto)Object.defineProperty(l,"_auto",{value:1,enumerable:false});
    out.push(l)});
  return{out,dup};
}
async function runImport(){
  if(!col||!canWrite)return toast("Impossible d'importer : ouvre l'app depuis ton compte Claude avec les droits d'écriture.");
  const {out,dup}=buildLeads();if(!out.length){toast(dup?"Tous ces leads sont déjà dans ta liste.":"Aucune ligne avec une entreprise ou un téléphone.");return}
  if(!imp.hasHead)ls("lk-map-"+imp.head.length,JSON.stringify(imp.map));
  Object.assign(imp,{running:true,done:0,total:out.length,added:0,dupes:dup,step:3});render();
  let i=0,stop=false;
  const worker=async()=>{while(i<out.length&&!stop){const l=out[i++];const ref=col.doc();
    for(let t=0;t<4;t++){try{await ref.set(l);imp.added++;break}catch(e){if(e&&e.code==="quota_exceeded"){stop=true;errMsg(e);break}if(e&&(e.code==="resource_exhausted"||e.code==="unavailable")){await new Promise(r=>setTimeout(r,800*(t+1)+Math.random()*400));continue}errMsg(e);break}}
    imp.done++;const p=$("#impProg");if(p){p.style.width=(imp.done/imp.total*100)+"%";$("#impTxt").textContent=imp.done+" / "+imp.total}}};
  await Promise.all([0,1,2,3].map(worker));
  imp.running=false;render();toast(imp.added+" lead"+(imp.added>1?"s":"")+" ajouté"+(imp.added>1?"s":"")+(dup?", "+dup+" doublon"+(dup>1?"s":"")+" ignoré"+(dup>1?"s":""):""));
}
function importHTML(){
  const st=(n,t,d)=>`<div class="card step ${imp.step===n?"on":""}"><b>${n}. ${t}</b><span class="small muted">${d}</span></div>`;
  let body="";
  if(imp.step===1)body=`<div class="card"><div class="card-b" style="display:flex;flex-direction:column;gap:12px" data-keep>
    <p style="margin:0;line-height:1.5">Dans Excel ou Google Sheets, sélectionne tes lignes <b>avec la ligne de titres</b>, copie, puis colle ici. Tu peux aussi choisir un fichier <code>.csv</code>. Les colonnes sont reconnues automatiquement : Entreprise, Contact, Téléphone, Ville, Secteur, Adresse, Site, Ads, Note Google, Courriel…</p>
    <textarea class="paste" id="impRaw" placeholder="Entreprise	Contact	Téléphone	Ville	Secteur&#10;Toitures Gagnon inc.	Marc Gagnon	450 555-0101	Longueuil	Toiture&#10;Excavation Roy	Julie Roy	819 555-0144	Drummondville	Excavation">${esc(imp.raw)}</textarea>
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center"><label class="btn" for="impFile" style="cursor:pointer">Choisir un fichier CSV</label><input type="file" id="impFile" accept=".csv,.txt,.tsv,text/csv" hidden>
      <div class="f" style="flex:1;min-width:200px"><input id="impSource" placeholder="Nom de la liste (ex. : Paysagistes Laval, nov. 2026)" value="${esc(imp.source)}" aria-label="Nom de la liste"></div>
      <div class="f" style="flex:1;min-width:200px"><input id="impFour" list="dl_fourImp" placeholder="Fournisseur de ces leads (ex. : Ubiweb)" value="${esc(imp.fournisseur||"")}" aria-label="Fournisseur web de ces leads"><datalist id="dl_fourImp">${["Ubiweb",...uniq("fournisseur")].filter((x,i,a)=>a.indexOf(x)===i).map(x=>`<option value="${esc(x)}">`).join("")}</datalist></div>
      <button class="btn primary" id="impNext">Vérifier les colonnes</button></div>
    <p class="small muted" style="margin:0">Fichier Excel (.xlsx) : ouvre-le et copie-colle les lignes, ou fais Fichier › Enregistrer sous › CSV.</p></div></div>`;
  if(imp.step===2){const {out,dup}=buildLeads();
    body=`<div class="card"><div class="card-b" style="display:flex;flex-direction:column;gap:14px" data-keep>
    <p style="margin:0">${imp.rows.length} ligne${imp.rows.length>1?"s":""} trouvée${imp.rows.length>1?"s":""}. ${imp.hasHead?"Vérifie à quoi correspond chaque colonne.":imp.memo?"Même format que ta dernière liste : j'ai repris tes réglages de colonnes.":"Pas de ligne de titres : j'ai reconnu les colonnes à leur contenu. Corrige si besoin, ce sera mémorisé pour la prochaine fois."}</p>
    <div class="map">${imp.head.map((h,i)=>`<div class="f"><label for="map_${i}">${esc(h||"Colonne "+(i+1))}</label><select id="map_${i}" data-map="${i}"><option value="">Ignorer</option>${CHAMPS.map(c=>`<option value="${c.k}" ${imp.map[i]===c.k?"selected":""}>${esc(c.l)}</option>`).join("")}</select><span class="ex">${esc(imp.rows.slice(0,2).map(r=>r[i]||"").filter(Boolean).join(" · ")||"vide")}</span></div>`).join("")}</div>
    <div class="banner" style="margin:0;background:var(--soft);color:var(--ink-2)"><b>${out.length}</b> lead${out.length>1?"s":""} à ajouter${out.some(l=>l._auto)?` · secteur trouvé d'après le nom pour <b>${out.filter(l=>l._auto).length}</b>, à vérifier dans la fiche`:""}${dup?` · <b>${dup}</b> doublon${dup>1?"s":""} ignoré${dup>1?"s":""} (même téléphone déjà dans ta liste)`:""}${imp.map.includes("entreprise")?"":" · ⚠ aucune colonne Entreprise choisie"}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="impBack">Retour</button><button class="btn primary ml-auto" id="impGo" ${out.length?"":"disabled"}>Ajouter ${out.length} lead${out.length>1?"s":""} à ma file</button></div></div></div>`}
  if(imp.step===3)body=`<div class="card"><div class="card-b">
    ${imp.running?`<b>Import en cours…</b> garde cette page ouverte.<div class="prog"><i id="impProg" style="width:${imp.total?imp.done/imp.total*100:0}%"></i></div><span id="impTxt" class="small muted">${imp.done} / ${imp.total}</span>`:
    `<b style="font-family:var(--display);font-size:24px">${imp.added} lead${imp.added>1?"s":""} ajouté${imp.added>1?"s":""}</b><p class="muted">${imp.dupes?imp.dupes+" doublon"+(imp.dupes>1?"s":"")+" ignoré"+(imp.dupes>1?"s":"")+". ":""}Ils sont en file dans ta session d'appels.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn primary" data-go="appeler">Commencer à appeler</button><button class="btn" id="impAgain">Importer une autre liste</button></div>`}</div></div>`;
  return`<div class="page-h"><h1>Importer des leads</h1><span class="sub">${leads.size} lead${leads.size>1?"s":""} dans ta liste</span></div>
  <div class="steps">${st(1,"Coller ta liste","Excel, Sheets ou CSV")}${st(2,"Vérifier les colonnes","Doublons enlevés")}${st(3,"Ajouter à la file","Prêts à appeler")}</div>${body}`;
}

/* modals */
function modal(html){$("#modalRoot").innerHTML=`<div class="scrim" id="scrim"><div class="modal" role="dialog" aria-modal="true">${html}</div></div>`;setTimeout(()=>{const f=$("#modalRoot input,#modalRoot textarea");f&&f.focus()},40)}
function closeModal(){$("#modalRoot").innerHTML="";render()}
function askWhen(l,r){
  const d=new Date();d.setDate(d.getDate()+(r==="rdv"?2:1));if(d.getDay()===6)d.setDate(d.getDate()+2);if(d.getDay()===0)d.setDate(d.getDate()+1);
  const note=($("#cNote")||{}).value||"";
  modal(`<div class="modal-h">${r==="rdv"?"Rendez-vous avec ":"Rappeler "}${esc(l.contact||l.entreprise)}</div><div class="modal-b">
    <div class="form"><div class="f"><label for="mD">Date</label><input id="mD" type="date" value="${dayKey(d)}"></div><div class="f"><label for="mH">Heure</label><input id="mH" type="time" value="10:00"></div>
    <div class="f full"><label for="mN">Note</label><input id="mN" value="${esc(note)}" placeholder="${r==="rdv"?"Ex. : visio, veut voir un exemple de site de paysagiste":"Ex. : rappeler après 16 h, la conjointe gère le web"}"></div></div></div>
    <div class="modal-f"><button class="btn" id="mX">Annuler</button><button class="btn primary" id="mOk" data-res-ok="${r}" data-id="${esc(l.id)}">Enregistrer</button></div>`);
}
function newLead(){modal(`<div class="modal-h">Ajouter un lead</div><div class="modal-b"><div class="form">
  <div class="f full"><label for="nE">Entreprise *</label><input id="nE" placeholder="Toitures Gagnon inc."></div><div class="f"><label for="nC">Contact</label><input id="nC" placeholder="Marc Gagnon"></div>
  <div class="f"><label for="nT">Téléphone</label><input id="nT" type="tel" placeholder="450 555-0101"></div><div class="f"><label for="nV">Ville</label><input id="nV" placeholder="Longueuil"></div>
  <div class="f"><label for="nS">Secteur</label><input id="nS" placeholder="Toiture"></div></div></div>
  <div class="modal-f"><button class="btn" id="mX">Annuler</button><button class="btn primary" id="nOk">Ajouter</button></div>`)}
function confirmBox(title,txt,ok){modal(`<div class="modal-h">${esc(title)}</div><div class="modal-b"><p style="margin:0">${esc(txt)}</p></div><div class="modal-f"><button class="btn" id="mX">Annuler</button><button class="btn primary" id="cOk" style="background:var(--bad);border-color:var(--bad)">Supprimer</button></div>`);$("#cOk").onclick=async()=>{await ok();closeModal()}}

/* ---------- événements ---------- */
function current(){return state.view==="fiche"?leads.get(state.recId):queue()[0]}
document.addEventListener("click",e=>{
  if(e.target.closest("input[type=checkbox]")){const cb=e.target.closest("input[type=checkbox]");e.stopPropagation();
    if(cb.id==="selAll"){const L=filtered();if(cb.checked)L.forEach(l=>state.sel.add(l.id));else L.forEach(l=>state.sel.delete(l.id))}else if(cb.dataset.sel){cb.checked?state.sel.add(cb.dataset.sel):state.sel.delete(cb.dataset.sel)}
    render();return}
  const sr=e.target.closest(".sr-i");if(sr){state.recId=sr.dataset.id;$("#sr").hidden=true;$("#q").value="";go("fiche");return}
  if(e.target.id==="scrim"){closeModal();return}
  const t=e.target.closest("button,[data-open],a");if(!t)return;
  if(t.tagName==="A")return;
  if(t.dataset.v){go(t.dataset.v);return}
  if(t.dataset.go){if(t.dataset.go==="import"&&imp.step===3&&!imp.running)imp.step=1;go(t.dataset.go);return}
  if(t.dataset.copy){copy(t.dataset.copy,"Numéro copié");return}
  if(t.dataset.fin){state.fin=t.dataset.fin;render();return}
  if(t.dataset.filter){state.filter=t.dataset.filter;state.shown=200;render();return}
  if(t.dataset.sort){state.sort=t.dataset.sort;render();return}
  if(t.dataset.res){const l=current();if(!l)return;if(t.dataset.res==="rdv"||t.dataset.res==="rappel")askWhen(l,t.dataset.res);else record(l,t.dataset.res,{note:(($("#cNote")||{}).value||"").trim()});return}
  if(t.dataset.resOk){const l=leads.get(t.dataset.id);const when=new Date($("#mD").value+"T"+($("#mH").value||"10:00")).toISOString();const note=$("#mN").value.trim();$("#modalRoot").innerHTML="";if(l)record(l,t.dataset.resOk,{when,note});return}
  if(t.dataset.quick){const l=leads.get(state.recId);if(!l||!canWrite)return;const d=new Date();d.setDate(d.getDate()+(+t.dataset.quick));d.setHours(10,0,0,0);l.statut="rappel";l.rappel=d.toISOString();save(l.id);render();toast("Rappel programmé le "+fmtDT(l.rappel));return}
  if(t.dataset.open){if(t.id==="alOpen")$("#alarmRoot").innerHTML="";state.recId=t.dataset.open;go("fiche");return}
  if(t.dataset.claim){const g=giftItems().find(x=>x.id===t.dataset.claim);if(!g||stats().solde<g.cout)return;gifts.pris=[...(gifts.pris||[]),{id:g.id,nom:g.nom,cout:g.cout,d:new Date().toISOString()}];if(!gifts.items)gifts.items=CADEAUX_DEF;saveGifts();render();confetti(200);beep([523,659,784,1046]);
    $("#cheerRoot").innerHTML=`<div class="cheer" role="status"><b>Bien mérité !</b>Profite de : ${esc(g.nom)}</div>`;setTimeout(()=>$("#cheerRoot").innerHTML="",3000);return}
  if(t.dataset.gdel){gifts.items=giftItems().filter(x=>x.id!==t.dataset.gdel);saveGifts();render();return}
  switch(t.id){
    case"mX":closeModal();break;
    case"alX":$("#alarmRoot").innerHTML="";break;
    case"alOpen":$("#alarmRoot").innerHTML="";break;
    case"alCall":{const l=leads.get(t.dataset.id);$("#alarmRoot").innerHTML="";if(l){state.cSecteur=state.cVille=state.cSource="";skipped.clear();state.view="appeler";render()}break}
    case"alSnooze":{const l=leads.get(t.dataset.id);$("#alarmRoot").innerHTML="";if(l&&l.statut==="rappel"&&canWrite){l.rappel=new Date(Date.now()+15*6e4).toISOString();save(l.id);render();toast("Rappel repoussé de 15 min")}break}
    case"bNotif":try{Notification.requestPermission().then(r=>{toast(r==="granted"?"Notifications activées":"Notifications refusées : active-les dans les réglages du téléphone");render()})}catch(e){toast("Ton téléphone ne permet pas les notifications ici.")}break;
    case"bOut":window.CRMAuth&&CRMAuth.signOut();break;
    case"bSon":ls("lk-son",ls("lk-son")==="off"?"on":"off");render();break;
    case"gAdd":modal(`<div class="modal-h">Nouveau cadeau</div><div class="modal-b"><div class="form"><div class="f full"><label for="gN">Ce que tu t'offres</label><input id="gN" placeholder="Ex. : souper au Toqué, nouveaux écouteurs"></div><div class="f"><label for="gC">Prix en points</label><input id="gC" type="number" min="1" value="300"></div></div><p class="small muted" style="margin:0">Repère : une bonne journée (40 appels, 2 RDV) rapporte environ 80 pts.</p></div><div class="modal-f"><button class="btn" id="mX">Annuler</button><button class="btn primary" id="gOk2">Ajouter</button></div>`);break;
    case"gOk2":{const nom=$("#gN").value.trim(),cout=Math.max(1,parseInt($("#gC").value)||0);if(!nom){toast("Donne un nom au cadeau.");break}gifts.items=[...giftItems(),{id:"g"+Date.now(),nom,cout}];saveGifts();closeModal();break}
    case"bUndo":undoLast();break;
    case"bPass":{const l=queue()[0];if(l){skipped.add(l.id);render()}break}
    case"goal":{modal(`<div class="modal-h">Objectif d'appels par jour</div><div class="modal-b"><div class="f"><label for="gV">Nombre d'appels</label><input id="gV" type="number" min="1" value="${esc(ls("lk-goal")||"40")}"></div></div><div class="modal-f"><button class="btn" id="mX">Annuler</button><button class="btn primary" id="gOk">Enregistrer</button></div>`);break}
    case"gOk":ls("lk-goal",String(Math.max(1,parseInt($("#gV").value)||40)));closeModal();break;
    case"bNew":newLead();break;
    case"nOk":{const ent=$("#nE").value.trim();if(!ent){toast("Indique au moins le nom de l'entreprise.");break}if(!col||!canWrite)break;const ref=col.doc();const l={entreprise:ent,contact:$("#nC").value.trim(),tel:phoneFmt($("#nT").value.trim()),ville:$("#nV").value.trim(),secteur:$("#nS").value.trim(),site:"?",ads:"?",statut:"nouveau",appels:0,historique:[],ordre:Date.now(),cree:new Date().toISOString(),id:ref.id};leads.set(ref.id,l);save(ref.id);closeModal();toast("Lead ajouté en file");break}
    case"bSect":{let n=0;list().forEach(l=>{if(badSect(l)){const sct=secteurAuto(l.entreprise,l.siteUrl);if(sct){if(/^\d{4}-\d{2}-\d{2}/.test(l.secteur||"")&&!l.domaine)l.domaine=l.secteur.slice(0,10);l.secteur=sct;save(l.id);n++}}});render();toast("Secteur ajouté à "+n+" lead"+(n>1?"s":""));break}
    case"cReset":Object.assign(state,{cSecteur:"",cVille:"",cSource:"",cFour:"",cFin:"",cStat:"",cSite:""});skipped.clear();render();break;
    case"bFinCall":state.cFin=state.fin;state.cStat="";state.cSite="";state.cFour=state.finFour;state.cSecteur=state.cVille=state.cSource="";skipped.clear();go("appeler");break;
    case"bulkFour":modal(`<div class="modal-h">Fournisseur de ${state.sel.size} lead${state.sel.size>1?"s":""}</div><div class="modal-b"><div class="f"><label for="bfV">Fournisseur web actuel</label><input id="bfV" list="dl_bf" placeholder="Ubiweb"><datalist id="dl_bf">${["Ubiweb",...uniq("fournisseur")].filter((x,i,a)=>a.indexOf(x)===i).map(x=>`<option value="${esc(x)}">`).join("")}</datalist></div><p class="small muted" style="margin:0">Laisse vide pour effacer le fournisseur.</p></div><div class="modal-f"><button class="btn" id="mX">Annuler</button><button class="btn primary" id="bfOk">Enregistrer</button></div>`);break;
    case"bfOk":{const v=$("#bfV").value.trim();const ids=[...state.sel];ids.forEach(id=>{const l=leads.get(id);if(l){l.fournisseur=v;save(id)}});state.sel.clear();closeModal();toast(ids.length+" lead(s) : fournisseur "+(v||"effacé"));break}
    case"bMore":state.shown+=200;render();break;
    case"bulkClear":state.sel.clear();render();break;
    case"bulkDel":{const ids=[...state.sel];confirmBox("Supprimer "+ids.length+" lead"+(ids.length>1?"s":"")+" ?","Ces fiches et leur historique seront effacés pour de bon.",async()=>{await remove(ids);state.sel.clear();toast(ids.length+" lead(s) supprimé(s)")});break}
    case"bDel":{const id=state.recId;confirmBox("Supprimer ce lead ?","La fiche et son historique seront effacés pour de bon.",async()=>{await remove([id]);state.view="leads";toast("Lead supprimé")});break}
    case"bBilan":{const t0=dayKey(),C=todayCalls(),by=r=>C.filter(x=>x.r===r);
      const txt=`Bilan du ${t0} : ${C.length} appels, ${by("rdv").length} RDV, ${by("rappel").length} rappels, ${by("pas_repondu").length} sans réponse, ${by("refus").length} refus, ${by("hors_cible").length} hors cible.`+
        (by("rdv").length?"\n\nRDV :\n"+by("rdv").map(x=>`- ${x.l.entreprise}${x.l.contact?" ("+x.l.contact+")":""} · ${x.quand?fmtDT(x.quand):""} · ${phoneFmt(x.l.tel)}`).join("\n"):"")+
        (by("rappel").length?"\n\nRappels :\n"+by("rappel").map(x=>`- ${x.l.entreprise} · ${x.quand?fmtDT(x.quand):""}`).join("\n"):"");
      copy(txt,"Bilan copié");break}
    case"impNext":imp.raw=$("#impRaw").value;imp.source=$("#impSource").value.trim();imp.fournisseur=$("#impFour").value.trim();if(prepImport())render();break;
    case"impBack":imp.step=1;render();break;
    case"impGo":runImport();break;
    case"impAgain":Object.assign(imp,{step:1,raw:"",rows:[],source:"",fournisseur:""});render();break;
  }
});
document.addEventListener("change",e=>{const el=e.target;
  if(el.id==="finFour"){state.finFour=el.value;render();return}
  if(["cSecteur","cVille","cSource","cFour","cFin","cStat","cSite","fSecteur","fVille","fSource","fFour"].includes(el.id)){state[el.id]=el.value;skipped.clear();state.shown=200;render();return}
  if(el.id==="fSort"){state.sort=el.value;render();return}
  if(el.id==="bulkSt"&&el.value){[...state.sel].forEach(id=>{const l=leads.get(id);if(l){l.statut=el.value;if(el.value!=="rappel")l.rappel=null;save(id)}});toast(state.sel.size+" lead(s) passé(s) en « "+SL[el.value]+" »");state.sel.clear();render();return}
  if(el.dataset.map!=null){imp.map[+el.dataset.map]=el.value;render();return}
  if(el.id==="impFile"&&el.files[0]){const r=new FileReader();r.onload=()=>{imp.raw=String(r.result);imp.source=$("#impSource").value.trim()||el.files[0].name.replace(/\.[^.]+$/,"");imp.fournisseur=$("#impFour").value.trim();if(prepImport())render()};r.readAsText(el.files[0]);return}
  if(el.dataset.p){const l=leads.get(state.recId);if(!l||!canWrite)return;const k=el.dataset.p;
    if(k==="rappelLocal"){l.rappel=el.value?new Date(el.value).toISOString():null;if(el.value)l.statut="rappel"}
    else if(k==="rdvLocal"){l.rdv=el.value?new Date(el.value).toISOString():null;if(el.value)l.statut="rdv"}
    else if(k==="tel")l.tel=phoneFmt(el.value.trim());else l[k]=el.value;
    save(l.id);if(el.tagName==="SELECT"||/Local$/.test(k)){const m=$("#main");const s=m.scrollTop;render();m.scrollTop=s}}
});
document.addEventListener("input",e=>{const el=e.target;
  if(el.id==="fQ"){state.q=el.value;state.shown=200;const p=el.selectionStart;render();const n=$("#fQ");n.focus();n.setSelectionRange(p,p);return}
  if(el.id==="q"){const v=el.value.trim(),box=$("#sr");if(!v){box.hidden=true;return}const R=list().filter(l=>matches(l,v)).slice(0,12);
    box.innerHTML=R.map(l=>`<div class="sr-i" data-id="${esc(l.id)}"><span><b>${esc(l.entreprise||"Sans nom")}</b><br><small class="muted">${esc([l.contact,l.ville,phoneFmt(l.tel)].filter(Boolean).join(" · "))}</small></span>${pill(l.statut)}</div>`).join("")||`<div class="empty">Aucun lead trouvé.</div>`;box.hidden=false}
});
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"){if($(".scrim"))closeModal();$("#sr").hidden=true;return}
  if(state.view!=="appeler"||e.metaKey||e.ctrlKey||e.altKey||$(".scrim"))return;
  if(/INPUT|TEXTAREA|SELECT/.test((document.activeElement||{}).tagName||""))return;
  const k=e.key.toLowerCase(),r=RESULTATS.find(x=>x.key===k);
  if(r){e.preventDefault();const b=document.querySelector(`[data-res="${r.k}"]`);b&&b.click();return}
  if(k==="p"){e.preventDefault();$("#bPass")&&$("#bPass").click()}
  if(k==="z"){e.preventDefault();undoLast()}
});
document.addEventListener("focusout",e=>{if(e.target.id==="q")setTimeout(()=>{$("#sr").hidden=true},200)});
init();

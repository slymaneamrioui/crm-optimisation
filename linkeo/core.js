/* Prospection Linkeo : stockage.
   Même compte Firebase que le CRM (../config.js). Les leads vont dans users/{uid}/linkeo_leads.
   Si la base refuse cette collection (règle Firestore pas encore ajoutée), l'appli garde tout sur l'appareil. */
(function(){
  window.LK_STANDALONE=true;
  const rid=()=>Math.random().toString(36).slice(2,10)+Date.now().toString(36);
  const colls={};
  function localColl(name){
    if(colls[name])return colls[name];
    const KEY="linkeo-"+name+"-v1";
    let data={};try{data=JSON.parse(localStorage.getItem(KEY)||"{}")||{}}catch(e){data={}}
    const subs=new Set(),dsubs={};
    const snap=()=>({docs:Object.entries(data).map(([id,d])=>({id,data:()=>d})),metadata:{fromCache:false}});
    function persist(){try{localStorage.setItem(KEY,JSON.stringify(data))}catch(e){const er=new Error("Stockage plein");er.code="quota_exceeded";throw er}}
    function emit(id){const s=snap();subs.forEach(f=>{try{f(s)}catch(e){}});(dsubs[id]||new Set()).forEach(f=>{try{f({exists:!!data[id],data:()=>data[id]})}catch(e){}})}
    return colls[name]={
      all:()=>data,
      onSnapshot(cb){subs.add(cb);setTimeout(()=>cb(snap()),0);return()=>subs.delete(cb)},
      doc(id){id=id||rid();return{id,
        onSnapshot(cb){(dsubs[id]=dsubs[id]||new Set()).add(cb);setTimeout(()=>cb({exists:!!data[id],data:()=>data[id]}),0);return()=>dsubs[id].delete(cb)},
        async set(b){data[id]=JSON.parse(JSON.stringify(b));persist();emit(id)},
        async delete(){delete data[id];persist();emit(id)}}}
    };
  }
  const LocalDB={collection:n=>localColl(n)};

  let resolveDb;const dbReady=new Promise(r=>resolveDb=r);
  window.claude={use:async n=>n==="db"?dbReady:null};
  try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}
  if("serviceWorker" in navigator)addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));

  if(!window.FIREBASE_CONFIG){window.LK_SYNC="local";resolveDb(LocalDB);return}

  const V="10.12.2",B="https://www.gstatic.com/firebasejs/"+V+"/";
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  (async()=>{
    let A,F,app,auth,fs;
    try{
      const [m1,m2,m3]=await Promise.all([import(B+"firebase-app.js"),import(B+"firebase-auth.js"),import(B+"firebase-firestore.js")]);
      A=m2;F=m3;app=m1.initializeApp(window.FIREBASE_CONFIG);auth=A.getAuth(app);
      try{fs=F.initializeFirestore(app,{localCache:F.persistentLocalCache({tabManager:F.persistentMultipleTabManager()})})}catch(e){fs=F.getFirestore(app)}
    }catch(e){LoginUI.show("Impossible de joindre le serveur. Vérifie ta connexion internet puis rouvre l'appli.",true);return}
    window.CRMAuth={
      signIn:(e,p)=>A.signInWithEmailAndPassword(auth,e,p),
      signUp:async(e,p)=>{const c=await A.createUserWithEmailAndPassword(auth,e,p);try{await A.sendEmailVerification(c.user)}catch(x){}return c},
      reset:e=>A.sendPasswordResetEmail(auth,e),
      signOut:async()=>{try{await A.signOut(auth)}catch(e){}location.reload()},
      email:()=>auth.currentUser&&auth.currentUser.email
    };
    let current=null;
    A.onAuthStateChanged(auth,user=>{
      if(user){if(current&&current!==user.uid){location.reload();return}
        if(!current){current=user.uid;LoginUI.hide();resolveDb(makeAdapter(user.uid))}}
      else{if(current){location.reload();return}LoginUI.show()}
    });
    function makeAdapter(uid){
      // leads : users/{uid}/linkeo_leads ; réglages (cadeaux) : users/{uid}/reglages/linkeo-<id>
      let local=false;window.LK_SYNC="cloud";
      const goLocal=()=>{if(!local){local=true;window.LK_SYNC="local";document.dispatchEvent(new Event("lk-sync"))}};
      const denied=e=>e&&(e.code==="permission-denied"||e.code==="firestore/permission-denied");
      return{collection:(name)=>{
        if(name==="config")return{doc(id){
          const ref=F.doc(fs,"users",uid,"reglages","linkeo-"+id);
          return{id,onSnapshot(cb){return F.onSnapshot(ref,s=>cb({exists:s.exists(),data:()=>s.data()}),()=>{})},
            set(b){const p=F.setDoc(ref,b);p.catch(()=>{});return Promise.race([p,wait(400)])}}}};
        const col=F.collection(fs,"users",uid,"linkeo_"+name);
        return{
          onSnapshot(cb,err){
            return F.onSnapshot(col,s=>cb({docs:s.docs.map(d=>({id:d.id,data:()=>d.data()})),metadata:{fromCache:s.metadata.fromCache}}),
              e=>{if(denied(e)){goLocal();localColl(name).onSnapshot(cb)}else err&&err(e)});
          },
          doc(id){
            if(local)return localColl(name).doc(id);
            const ref=id?F.doc(col,id):F.doc(col);
            return{id:ref.id,
              set(b){if(local)return localColl(name).doc(ref.id).set(b);const p=F.setDoc(ref,b);p.catch(e=>{if(denied(e)){goLocal();localColl(name).doc(ref.id).set(b)}});return Promise.race([p,wait(400)])},
              delete(){if(local)return localColl(name).doc(ref.id).delete();const p=F.deleteDoc(ref);return Promise.race([p,wait(400)])}};
          }
        }}};
    }
  })();
})();

/* --- écran de connexion (même compte que le CRM Optimisation) --- */
const LoginUI={
  show(msg,fatal){
    let el=document.getElementById("login");
    if(!el){
      el=document.createElement("div");el.id="login";
      el.innerHTML=`<div class="lg-card">
        <div class="logo-mark" style="display:inline-block;margin:0 auto 12px">Linkeo</div>
        <h1>Prospection Québec</h1>
        <p class="muted small" style="margin:4px 0 18px">Connecte-toi avec le même compte que ton CRM pour retrouver tes leads sur ton cellulaire et ton ordinateur.</p>
        <form id="lgf">
          <div class="f"><label for="lgE">Courriel</label><input id="lgE" name="e" type="email" autocomplete="username" required></div>
          <div class="f" style="margin-top:10px"><label for="lgP">Mot de passe</label><input id="lgP" name="p" type="password" autocomplete="current-password" minlength="6" required></div>
          <div id="lgMsg" class="small" style="min-height:20px;margin:10px 0;color:var(--bad)"></div>
          <button class="btn primary" style="width:100%;padding:12px" name="in">Se connecter</button>
          <button class="btn" style="width:100%;padding:12px;margin-top:8px" name="up">Créer mon compte</button>
          <button type="button" class="btn ghost sm" style="margin-top:10px" id="lgReset">Mot de passe oublié ?</button>
        </form></div>`;
      document.body.appendChild(el);
      const f=el.querySelector("#lgf"),m=el.querySelector("#lgMsg");
      const err=c=>({"auth/invalid-credential":"Courriel ou mot de passe incorrect.","auth/wrong-password":"Courriel ou mot de passe incorrect.","auth/user-not-found":"Aucun compte avec ce courriel.","auth/email-already-in-use":"Un compte existe déjà avec ce courriel. Touche « Se connecter ».","auth/invalid-email":"Courriel invalide.","auth/network-request-failed":"Pas de réseau. Réessaie quand tu es connecté.","auth/too-many-requests":"Trop d'essais. Réessaie dans quelques minutes."}[c]||"Erreur : "+c);
      f.addEventListener("submit",async e=>{e.preventDefault();if(!window.CRMAuth)return;
        const em=f.e.value.trim(),pw=f.p.value,up=e.submitter&&e.submitter.name==="up";
        if(up&&!(pw.length>=10&&/[a-zA-Z]/.test(pw)&&/\d/.test(pw))){m.style.color="var(--bad)";m.textContent="Mot de passe trop faible : 10 caractères minimum, avec des lettres et des chiffres.";return}
        m.style.color="var(--ink-3)";m.textContent="Connexion…";
        try{up?await CRMAuth.signUp(em,pw):await CRMAuth.signIn(em,pw)}catch(x){m.style.color="var(--bad)";m.textContent=err(x.code)}});
      el.querySelector("#lgReset").onclick=async()=>{const em=f.e.value.trim();if(!em){m.style.color="var(--bad)";m.textContent="Écris ton courriel d'abord.";return}
        try{await CRMAuth.reset(em);m.style.color="var(--ok)";m.textContent="Courriel de réinitialisation envoyé."}catch(x){m.style.color="var(--bad)";m.textContent=err(x.code)}};
    }
    el.style.display="flex";
    const m=el.querySelector("#lgMsg");m.textContent=msg||"";m.style.color="var(--bad)";
    el.querySelector("#lgf").style.display=fatal?"none":"";
  },
  hide(){const el=document.getElementById("login");if(el)el.style.display="none"}
};

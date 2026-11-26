(function(){
  /* --- stockage local (mode sans Firebase, et ancienne version de l'appli) --- */
  const rid=()=>Math.random().toString(36).slice(2,10)+Date.now().toString(36);
  const colls={};
  function localColl(name){
    if(colls[name])return colls[name];
    const KEY=name==="clients"?"crm-optim-clients-v1":"crm-optim-"+name+"-v1";
    let data={};try{data=JSON.parse(localStorage.getItem(KEY)||"{}")||{}}catch(e){data={}}
    const subs=new Set();
    const snap=()=>({docs:Object.entries(data).map(([id,d])=>({id,data:()=>d})),metadata:{fromCache:false}});
    function persist(){try{localStorage.setItem(KEY,JSON.stringify(data))}catch(e){const er=new Error("Stockage plein");er.code="quota_exceeded";throw er}}
    function emit(){const s=snap();subs.forEach(f=>{try{f(s)}catch(e){}})}
    addEventListener("storage",e=>{if(e.key===KEY){try{data=JSON.parse(e.newValue||"{}")||{}}catch(_){data={}}emit()}});
    return colls[name]={
      all:()=>data,
      onSnapshot(cb){subs.add(cb);setTimeout(()=>cb(snap()),0);return()=>subs.delete(cb)},
      doc(id){id=id||rid();return{id,
        async set(b){data[id]=JSON.parse(JSON.stringify(b));persist();emit()},
        async delete(){delete data[id];persist();emit()}}}
    };
  }
  const LocalDB={collection:n=>localColl(n||"clients"),all:()=>localColl("clients").all()};
  window.LocalDB=LocalDB;

  let resolveDb;const dbReady=new Promise(r=>resolveDb=r);
  window.claude={use:async n=>n==="db"?dbReady:null};
  try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}
  if("serviceWorker" in navigator)addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));

  if(!window.FIREBASE_CONFIG){resolveDb(LocalDB);return}

  /* --- mode synchronisé : Firebase (connexion + base Firestore) --- */
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
      signOut:async()=>{
        loggingOut=true;
        try{await A.signOut(auth)}catch(e){}
        try{await F.terminate(fs);await F.clearIndexedDbPersistence(fs)}catch(e){}
        try{Object.keys(localStorage).filter(k=>/^crm-optim-|^crm-migrated-/.test(k)).forEach(k=>localStorage.removeItem(k))}catch(e){}
        location.reload();
      },
      email:()=>auth.currentUser&&auth.currentUser.email
    };
    let current=null,loggingOut=false;
    A.onAuthStateChanged(auth,user=>{
      if(loggingOut)return;
      if(user){
        if(current&&current!==user.uid){location.reload();return}
        if(!current){current=user.uid;LoginUI.hide();resolveDb(makeAdapter(user.uid))}
      }else{
        if(current){location.reload();return}
        LoginUI.show();
      }
    });
    function makeAdapter(uid){
      const flag="crm-migrated-"+uid;
      function migrate(s){
        let done=null;try{done=localStorage.getItem(flag)}catch(e){}
        if(done)return;
        const L=LocalDB.all(),ids=Object.keys(L);
        const col=F.collection(fs,"users",uid,"clients");
        if(ids.length&&s.size===0){ids.forEach(id=>F.setDoc(F.doc(col,id),L[id]).catch(()=>{}))}
        try{localStorage.setItem(flag,"1")}catch(e){}
      }
      // boîte d'arrivée : leads déposés par le robot du matin pour ce compte (lecture et suppression seulement)
      const inbox={
        listen(cb){const em=(auth.currentUser&&auth.currentUser.email||"").toLowerCase();if(!em)return()=>{};
          return F.onSnapshot(F.query(F.collection(fs,"arrivees"),F.where("pour","==",em)),s=>cb(s.docs.map(d=>({id:d.id,...d.data()}))),()=>{})},
        remove(id){return F.deleteDoc(F.doc(fs,"arrivees",id)).catch(()=>{})}
      };
      return{inbox,collection:(name)=>{const nm=name||"clients";const col=F.collection(fs,"users",uid,nm);return{
        onSnapshot(cb,err){
          return F.onSnapshot(col,s=>{
            if(nm==="clients"&&!s.metadata.fromCache)migrate(s);
            cb({docs:s.docs.map(d=>({id:d.id,data:()=>d.data()})),metadata:{fromCache:s.metadata.fromCache}});
          },err);
        },
        doc(id){
          const ref=id?F.doc(col,id):F.doc(col);
          return{id:ref.id,
            // l'écriture est gardée sur l'appareil tout de suite, puis envoyée au serveur dès que le réseau est là
            set(b){const p=F.setDoc(ref,b);p.catch(e=>console.warn("Synchronisation refusée",e));return Promise.race([p,wait(400)])},
            delete(){const p=F.deleteDoc(ref);return Promise.race([p,wait(400)])}};
        }
      }}};
    }
  })();
})();

/* --- écran de connexion --- */
const LoginUI={
  show(msg,fatal){
    let el=document.getElementById("login");
    if(!el){
      el=document.createElement("div");el.id="login";
      el.innerHTML=`<div class="lg-card">
        <div class="logo-mark" style="width:52px;height:52px;font-size:24px;border-radius:14px;margin:0 auto 12px">€</div>
        <h1>CRM Optimisation</h1>
        <p class="muted small" style="margin:4px 0 18px">Connecte-toi pour retrouver tes clients sur tous tes appareils.</p>
        <form id="lgf">
          <div class="f"><label>Courriel</label><input name="e" type="email" autocomplete="username" required></div>
          <div class="f" style="margin-top:10px"><label>Mot de passe</label><input name="p" type="password" autocomplete="current-password" minlength="6" required></div>
          <div id="lgMsg" class="small" style="min-height:20px;margin:10px 0;color:var(--bad)"></div>
          <button class="btn primary" style="width:100%;padding:12px" name="in">Se connecter</button>
          <button class="btn" style="width:100%;padding:12px;margin-top:8px" name="up">Créer mon compte</button>
          <button type="button" class="btn ghost sm" style="margin-top:10px" id="lgReset">Mot de passe oublié ?</button>
        </form></div>`;
      document.body.appendChild(el);
      const f=el.querySelector("#lgf"),m=el.querySelector("#lgMsg");
      const err=c=>({"auth/invalid-credential":"Courriel ou mot de passe incorrect.","auth/wrong-password":"Courriel ou mot de passe incorrect.","auth/user-not-found":"Aucun compte avec ce courriel. Touche « Créer mon compte ».","auth/email-already-in-use":"Un compte existe déjà avec ce courriel. Touche « Se connecter ».","auth/weak-password":"Mot de passe trop court (6 caractères minimum).","auth/invalid-email":"Courriel invalide.","auth/network-request-failed":"Pas de réseau. Réessaie quand tu es connecté.","auth/too-many-requests":"Trop d'essais. Réessaie dans quelques minutes."}[c]||"Erreur : "+c);
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

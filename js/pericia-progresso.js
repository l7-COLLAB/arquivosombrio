/* Arquivo Sombrio — sincronização PRIVADA de exercícios educativos de Perícia.
 * Sem acesso administrativo ou chaves secretas. Conquistas não são certificações.
 * Dados de visitantes permanecem locais até importação explícita.
 */
(function (root) {
  "use strict";
  var TABLE = "forensic_activity_progress";
  var API_URL = "https://iuhotznurbyujzbyhizf.supabase.co";
  var PUBLISHABLE_KEY = "sb_publishable_bpAZ5EhYLIuVoE4Q97s_-A_XQwwRxUj";
  var GUEST_KEYS = Object.freeze({
    trilha:"arquivo-sombrio-pericia-trilha-v1",
    custodia:"arquivo-sombrio-custodia-v1",
    papiloscopia:"arquivo-sombrio-papiloscopia-v1"
  });
  var CODES = Object.freeze(Object.keys(GUEST_KEYS));
  var CORRECT = Object.freeze([0,2,1,3,0,2,1,3,0]);
  var ADAPTERS = new Map();
  var records = new Map();
  var user = null, client = null, loading = null, connected = false;
  var queue = Promise.resolve(), generation = 0;
  var authSubscriber = false;
  function changed() {
    if(root && root.dispatchEvent) root.dispatchEvent(new Event("arquivo-pericia-progresso"));
  }
  function defaultState(code) {
    if (code === "trilha") return {index:0,answers:[]};
    if (code === "custodia") return {order:[3,0,4,1,2],sorted:false,complete:false};
    return {compared:false,complete:false,reference:"r17",marks:false};
  }
  function normalise(code,value) {
    if (!CODES.includes(code) || !value || typeof value !== "object" || Array.isArray(value)) return null;
    if (code === "trilha") {
      if (!Array.isArray(value.answers) || value.answers.length>9
          || !value.answers.every(function(x){return Number.isInteger(x)&&x>=0&&x<=3;})
          || !Number.isInteger(value.index) || value.index<0 || value.index>9
          || value.index>value.answers.length) return null;
      return {index:value.index,answers:value.answers.slice()};
    }
    if (code === "custodia") {
      var order = value.order;
      if (!Array.isArray(order) || order.length!==5 || new Set(order).size!==5
          || !order.every(function(x){return Number.isInteger(x)&&x>=0&&x<5;})) return null;
      var sorted = value.sorted===true && order.every(function(x,i){return x===i;});
      return {order:order.slice(),sorted:sorted,complete:value.complete===true && sorted};
    }
    if (!["r17","r24"].includes(value.reference)) return null;
    var compared = value.compared===true && value.reference==="r17";
    return {compared:compared,complete:value.complete===true && compared,
      reference:value.reference,marks:value.marks===true};
  }
  function metrics(code,state) {
    var s=normalise(code,state) || defaultState(code);
    if (code==="trilha") {
      var steps=s.answers.length,score=s.answers.reduce(function(n,x,i){return n+(x===CORRECT[i]?10:0);},0);
      return {steps:steps,score:score,completed:steps===9};
    }
    var steps=code==="custodia"?(s.complete?2:s.sorted?1:0):(s.complete?2:s.compared?1:0);
    return {steps:steps,score:0,completed:steps===2};
  }
  function guestState(code) {
    try {return normalise(code,JSON.parse(localStorage.getItem(GUEST_KEYS[code]))) || defaultState(code);}
    catch (_) {return defaultState(code);}
  }
  function guestStats() {
    return CODES.map(function(code){
      var state=guestState(code),m=metrics(code,state);
      return {activity_code:code,state:state,best_steps:m.steps,best_score:m.score,ever_completed:m.completed};
    }).filter(function(x){return x.best_steps>0;});
  }
  function memberKey(code,id) {return "as-forensic-member-"+id+"-"+code;}
  function status(value) {
    var label = value==="member"?"Progresso vinculado à sua conta."
      :value==="working"?"Conectando ao Meu Arquivo…"
      :value==="offline"?"A sincronização não está disponível. Você pode continuar estudando neste navegador."
      :"Progresso salvo apenas neste navegador. Entre em sua conta para sincronizar.";
    document.querySelectorAll("[data-forensic-sync-status]").forEach(function(node){node.textContent=label;});
  }
  async function getClient() {
    if (client) return client;
    if (typeof obterClienteSupabase==="function") {
      client=await obterClienteSupabase();
    } else if (root.supabase && typeof root.supabase.createClient==="function") {
      client=root.supabase.createClient(API_URL,PUBLISHABLE_KEY,{
        auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
      });
    } else throw new Error("Cliente de autenticação indisponível");
    if (!authSubscriber) {
      authSubscriber=true;
      client.auth.onAuthStateChange(function(event){
        if (event==="SIGNED_OUT" || event==="SIGNED_IN") {
          // A verificação de identidade e as consultas são feitas fora do callback.
          Promise.resolve().then(function(){return connect(true);}).catch(function(){status("offline");});
        }
      });
    }
    return client;
  }
  async function connect(force) {
    if (loading && !force) return loading;
    var token=++generation;
    connected=false;
    loading=(async function(){
      status("working");
      var sb;
      try {
        sb=await getClient();
        var ses=await sb.auth.getSession();
        if (ses.error) throw ses.error;
        if (!ses.data?.session) {
          user=null;records.clear();
          ADAPTERS.forEach(function(adapter,code){adapter.apply(guestState(code));});
          connected=true;status("guest");changed();return null;
        }
        var result=await sb.auth.getUser();
        if (result.error || !result.data?.user) throw result.error||new Error("Sessão inválida");
        var next=result.data.user;
        var query=await sb.from(TABLE).select("activity_code,state,best_steps,best_score,ever_completed,updated_at")
          .eq("user_id",next.id);
        if (query.error) throw query.error;
        if (token!==generation) return null;
        user=next;records.clear();
        (query.data||[]).forEach(function(row){
          if (CODES.includes(row.activity_code) && normalise(row.activity_code,row.state)) records.set(row.activity_code,row);
        });
        connected=true;
        ADAPTERS.forEach(function(adapter,code){
          var row=records.get(code);
          var pending=null;
          try {pending=JSON.parse(localStorage.getItem(memberKey(code,next.id)));}catch(_){}
          var localPending=pending?.pending && normalise(code,pending.state);
          var state=localPending || (row?normalise(code,row.state):defaultState(code));
          adapter.apply(state);
          if (localPending) save(code,state);
        });
        status("member");changed();return next;
      }catch(error) {
        if(token!==generation)return null;
        console.warn("Perícia: sincronização indisponível",error);
        // Falha de rede não confirma logout. Manter somente o estado atual no navegador.
        user=null;connected=false;status("offline");changed();return null;
      }
    })();
    return loading;
  }
  function register(code,adapter) {
    if(!CODES.includes(code) || !adapter || typeof adapter.apply!=="function")return;
    ADAPTERS.set(code,adapter);
    // Uma atualização local em andamento não pode sobrescrever o servidor antes da leitura.
    if(connected && user){
      var row=records.get(code);
      adapter.apply(row?normalise(code,row.state):defaultState(code));
    }else connect(false);
  }
  function isAccountActive(){return Boolean(connected&&user);}
  function safePending(code,row){
    try {localStorage.setItem(memberKey(code,user.id),JSON.stringify({pending:true,state:row.state}));}catch(_){}
  }
  function clearPending(code,id){
    try {localStorage.removeItem(memberKey(code,id));}catch(_){}
  }
  function upsert(code,state,forced) {
    if(!CODES.includes(code))return Promise.resolve(false);
    state=normalise(code,state);
    if(!state)return Promise.resolve(false);
    if(!isAccountActive())return Promise.resolve(false);
    var owner=user.id,m=metrics(code,state),old=records.get(code);
    var row={user_id:owner,activity_code:code,state:state,
      best_steps:Math.max(Number(old?.best_steps)||0,m.steps),
      best_score:Math.max(Number(old?.best_score)||0,m.score),
      ever_completed:Boolean(old?.ever_completed)||m.completed,
      updated_at:new Date().toISOString()};
    safePending(code,row);
    records.set(code,row);
    changed();
    // Serializar gravações: uma resposta lenta não deve sobrescrever a seguinte.
    queue=queue.catch(function(){}).then(async function(){
      if(!user || user.id!==owner) return false;
      try {
        var sb=await getClient();
        var result=await sb.from(TABLE).upsert(row,{onConflict:"user_id,activity_code"});
        if(result.error)throw result.error;
        clearPending(code,owner);changed();
        return true;
      }catch(err){console.warn("Não foi possível sincronizar o exercício",err);status("offline");return false;}
    });
    return queue;
  }
  function save(code,state){return upsert(code,state,false);}
  function listRecords(){return CODES.map(function(code){return records.get(code)||null;});}
  async function importGuest() {
    await connect(false);
    if(!isAccountActive())throw new Error("Entre na sua conta antes de importar.");
    var items=guestStats(), imported=0;
    for(const item of items){
      var old=records.get(item.activity_code),oldSteps=Number(old?.best_steps)||0;
      var oldScore=Number(old?.best_score)||0;
      if (old && oldSteps>item.best_steps && oldScore>=item.best_score) continue;
      // Se a conta já possui resultados, preserve a maior conquista.
      var result=await upsert(item.activity_code,item.state,true);
      if(result){imported++;try{localStorage.removeItem(GUEST_KEYS[item.activity_code]);}catch(_){}}
    }
    return {available:items.length,imported:imported};
  }
  function subscribeAuth() {return connect(false);}
  var API=Object.freeze({CODES:CODES,GUEST_KEYS:GUEST_KEYS,normalise:normalise,metrics:metrics,
    guestState:guestState,guestStats:guestStats,register:register,save:save,
    connect:connect,subscribeAuth:subscribeAuth,isAccountActive:isAccountActive,
    importGuest:importGuest,listRecords:listRecords,defaultState:defaultState});
  if(typeof module!=="undefined" && module.exports)module.exports=API;
  if(root && root.document)root.ArquivoPericiaProgresso=API;
}(typeof window!=="undefined"?window:null));

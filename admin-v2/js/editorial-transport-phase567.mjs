// Alternativa desativada por padrao: exige proxy de mesma origem autenticado no servidor.
// Nunca encaminhe JWT a uma origem fornecida por query string ou armazenamento do navegador.
export function resolveEditorialTransport(origin, proxyPath = null) {
 if(proxyPath === null) return {mode:"supabase",functionName:"editorial-candidates"};
 if(typeof proxyPath!=="string" || !/^\/api\/admin\/editorial-candidates$/.test(proxyPath)) throw new Error("Caminho de proxy nao permitido");
 const url=new URL(proxyPath,origin);
 if(url.origin!==origin)throw new Error("Proxy deve usar a mesma origem");
 return {mode:"same-origin-proxy",path:url.pathname,requiresServerAuthorization:true,enabled:false};
}

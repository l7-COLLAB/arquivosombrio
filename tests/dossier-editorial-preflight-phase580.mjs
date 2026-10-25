import { spawnSync } from "node:child_process";
const check=(command,args)=>{
 const x=spawnSync(command,args,{encoding:"utf8",timeout:8000,env:{PATH:process.env.PATH||""}});
 return {available:!x.error&&x.status===0};
};
const docker=check("docker",["--version"]);
const engine=docker.available?check("docker",["info","--format","{{.ServerVersion}}"]):{available:false};
const supabase=check("supabase",["--version"]);
const nodeMajor=Number(process.versions.node.split(".")[0]);
const result={fase:"5.80",node_adequado:nodeMajor>=22,docker_cli_disponivel:docker.available,docker_engine_disponivel:engine.available,supabase_cli_disponivel:supabase.available,preparado_para_homologacao_local:nodeMajor>=22&&engine.available&&supabase.available,servicos_iniciados:false,conexao_externa:false};
console.log(JSON.stringify(result,null,2));
if(!result.preparado_para_homologacao_local)process.exitCode=2;

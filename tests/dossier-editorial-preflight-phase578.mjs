import {spawnSync} from "node:child_process";
const run=(command,args)=>{const x=spawnSync(command,args,{encoding:"utf8",timeout:8000,env:{PATH:process.env.PATH||""}});return {available:!x.error&&x.status===0,status:x.status??null};};
const docker=run("docker",["--version"]);
const supabase=run("supabase",["--version"]);
const nodeMajor=Number(process.versions.node.split(".")[0]);
const result={fase:"5.78",node_adequado:nodeMajor>=22,docker_cli_disponivel:docker.available,supabase_cli_disponivel:supabase.available,seguro_para_tentar_start:nodeMajor>=22&&docker.available&&supabase.available,servicos_iniciados:false,conexao_externa:false};
console.log(JSON.stringify(result,null,2));
if(!result.seguro_para_tentar_start)process.exitCode=2;

#!/usr/bin/env node
// Valida o registro editorial internacional sem acessar o banco de produção.
// Execução: node scripts/validar-conteudos-internacionais.mjs
import {readFileSync, existsSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const readJSON=(name)=>JSON.parse(readFileSync(resolve(root,name),'utf8'));
const fail=(message)=>{throw new Error(message)};
const config=readJSON('i18n/config-internacional.json');
const registry=readJSON('i18n/registro-conteudos.json');
const schema=readJSON('i18n/esquema-conteudo.schema.json');
const active=config.locales.filter(x=>x.code!==config.defaultLocale).map(x=>x.code);
const categoryOptions=schema.properties.category.enum;
const localesFromSchema=schema.properties.locale.enum;

if(!Array.isArray(registry.items)||registry.schemaVersion!==1)fail('Registro inválido');
if(registry.publicIndexEnabled!==false||registry.localeRoutesEnabled!==false)fail('Não ativar rotas sem revisão');
if(JSON.stringify([...active].sort())!==JSON.stringify([...localesFromSchema].sort()))fail('Idiomas divergentes entre registro e contrato');
const seen=new Set();
const validStates=new Set(['not_started','draft','in_review','approved','published','archived']);
let unpublished=0;
for(const item of registry.items){
 if(!item.sourceKey||seen.has(item.sourceKey))fail('sourceKey duplicada ou ausente: '+item.sourceKey);
 seen.add(item.sourceKey);
 if(!categoryOptions.includes(item.category))fail('Categoria inválida: '+item.sourceKey);
 if(item.sourceLocale!==config.defaultLocale)fail('Origem deve ser pt-BR: '+item.sourceKey);
 if(!item.sourcePath?.startsWith('/')||item.sourcePath.includes('..'))fail('Path de origem inválido: '+item.sourceKey);
 const keys=Object.keys(item.translations||{}).sort();
 if(JSON.stringify(keys)!==JSON.stringify([...active].sort()))fail('Cobertura de idiomas inconsistente: '+item.sourceKey);
 for(const [locale,record] of Object.entries(item.translations)){
  if(!validStates.has(record.status))fail('Status desconhecido: '+locale);
  if(record.status==='not_started'){
   if(record.contentPath!==null)fail('Rascunho inexistente não pode ter caminho: '+locale);
   unpublished++;
   continue;
  }
  if(typeof record.contentPath!=='string'||!/^i18n\/conteudos\/(en-US|es-ES|fr-FR)\/[a-z0-9-]+\.json$/.test(record.contentPath))fail('Path de tradução inválido: '+locale);
  if(!record.contentPath.startsWith('i18n/conteudos/'+locale+'/'))fail('Idioma do caminho divergente');
  if(!existsSync(resolve(root,record.contentPath)))fail('Arquivo de tradução ausente: '+record.contentPath);
  const payload=readJSON(record.contentPath);
  if(payload.sourceKey!==item.sourceKey||payload.locale!==locale||payload.category!==item.category)fail('Tradução incompatível: '+record.contentPath);
  if(payload.status!==record.status)fail('Estados divergentes: '+record.contentPath);
  if(!payload.sourceRevision||payload.sourceRevision==='unverified')fail('Origem sem revisão: '+record.contentPath);
  if(!payload.editorial||!payload.editorial.title?.trim()||!payload.editorial.summary?.trim()||!Array.isArray(payload.editorial.bodyBlocks)||!payload.editorial.bodyBlocks.length)fail('Conteúdo incompleto: '+record.contentPath);
  if(record.status==='published'){
   if(payload.editorial.factCheckStatus!=='verified'||!payload.editorial.reviewer?.trim()||!payload.editorial.translator?.trim()||payload.editorial.imageRightsChecked!==true||payload.editorial.legalReviewChecked!==true)fail('Publicação sem controles editoriais');
   if(!payload.publication?.path?.startsWith(config.locales.find(x=>x.code===locale).plannedPath))fail('Rota de publicação inválida');
   if(!payload.publication?.publishedAt||!payload.publication?.approvedAt)fail('Publicação sem datas');
   if(!config.productionRoutesEnabled)fail('Conteúdo marcado publicado com rotas internacionais desativadas');
  }else{unpublished++}
 }
}
console.log('VALIDADO: '+registry.items.length+' arquivo(s); '+active.length+' idiomas; '+unpublished+' tradução(ões) pendente(s). Rotas públicas desativadas.');

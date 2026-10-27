(function(){
'use strict';
// Fase 6.12: integra apenas sob habilitacao explicita APOS ensaio e deploy.
var enabled=window.ARQUIVO_I18N_WRITES_ENABLED===true;
function $id(id){return document.getElementById(id)}
function parseBlocks(raw){
 var blocks=JSON.parse(raw);
 if(!Array.isArray(blocks)||!blocks.length||!blocks.every(function(b){return b&&typeof b.text==='string'&&b.text.trim()&&['paragraph','heading','quote','fact','testimony','hypothesis','controversy'].includes(b.type)}))throw Error('Blocos devem ser uma lista JSON com type e text.');
 return blocks;
}
function parseSources(raw){
 var sources=JSON.parse(raw);
 if(!Array.isArray(sources)||!sources.length||!sources.every(function(s){if(!s||typeof s.url!=='string'||typeof s.description!=='string'||!s.description.trim()||!s.id)return false;try{var u=new URL(s.url);return u.protocol==='https:'||u.protocol==='http:'}catch(_){return false}}))throw Error('Fontes devem ser uma lista JSON com id, url e description válidos.');
 return sources;
}
window.arquivoI18nDraft={
 enabled:enabled,
 validate:function(){
  var title=$id('draft-title').value.trim(),summary=$id('draft-summary').value.trim();
  if(title.length<3||title.length>200)throw Error('Título deve ter entre 3 e 200 caracteres.');
  if(summary.length<20||summary.length>2000)throw Error('Resumo deve ter entre 20 e 2000 caracteres.');
  return {title:title,summary:summary,blocks:parseBlocks($id('draft-body').value),sources:parseSources($id('draft-sources').value)};
 },
 async save:function(client,record,table,revision){
  if(!enabled)throw Error('Gravação desativada até os testes de segurança.');
  var body=this.validate();
  var {data,error}=await client.rpc('international_save_draft',{
   p_source_type:table==='Casos'?'dossie':'garimpo',p_source_id:record.id,
   p_locale:$id('draft-locale').value,p_expected_revision:revision,
   p_title:body.title,p_summary:body.summary,p_blocks:body.blocks,p_sources:body.sources
  });
  if(error)throw error;
  return Array.isArray(data)?data[0]:data;
 },
 async submit:function(client,translationId,revision){
  if(!enabled)throw Error('Envio para revisão desativado.');
  if(!translationId)throw Error('Salve o rascunho antes de enviar.');
  var {data,error}=await client.rpc('international_submit_review',{p_translation_id:translationId,p_expected_revision:revision});
  if(error)throw error;
  return data;
 },
 async audit:function(client,translationId){
  if(!translationId)return [];
  var {data,error}=await client.from('international_content_audit')
    .select('action,from_revision,to_revision,occurred_at,actor_id')
    .eq('translation_id',translationId).order('occurred_at',{ascending:false}).limit(20);
  if(error)throw error;return data||[];
 }
};
})();

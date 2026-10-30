const { randomUUID, randomBytes } = require('crypto');
const Model = require('../models/calibracoes.model');
const referencia = require('../data/calibracoes-referencia.json');
const TIPOS = new Set(['multimetro', 'alicate', 'energia', 'luximetro', 'isolamento', 'resistencia', 'termico', 'temperatura', 'transformacao', 'tensao', 'fase', 'luva', 'aterramento', 'outro']);
const BUCKET = process.env.SUPABASE_CALIBRACOES_BUCKET || 'calibracoes';
const MAX_PDF = 20 * 1024 * 1024;
function erro(status, message) { return Object.assign(new Error(message), { status }); }
function texto(v, max) { const s = String(v ?? '').trim(); if (s.length > max) throw erro(400, 'Um dos campos excede o tamanho permitido.'); return s; }
function data(v, obrigatoria = false) {
  if (!v && !obrigatoria) return null;
  const s = String(v || ''); const d = new Date(s + 'T00:00:00Z');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || !Number.isFinite(d.getTime()) || d.toISOString().slice(0,10) !== s || s < '1900-01-01' || s > '2200-12-31') throw erro(400, 'Informe uma data válida.'); return s;
}
function tipoAutomatico(nome) {
  const n = nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (/luva/.test(n)) return 'luva'; if (/alicate/.test(n)) return 'alicate'; if (/lux/.test(n)) return 'luximetro';
  if (/meg[ooh]|hipot/.test(n)) return 'isolamento'; if (/ohm|millio|milliom|terrom/.test(n)) return 'resistencia';
  if (/analisador/.test(n)) return 'energia'; if (/camera/.test(n)) return 'termico'; if (/higrom|temper|termomet/.test(n)) return 'temperatura';
  if (/transform/.test(n)) return 'transformacao'; if (/detector/.test(n)) return 'tensao'; if (/fas/.test(n)) return 'fase'; if (/aterramento/.test(n)) return 'aterramento'; return 'multimetro';
}
function normalizarEquipamento(p = {}) {
  const nome = texto(p.nome, 180); if (!nome) throw erro(400, 'Informe o nome do equipamento.');
  if (p.tipo && !TIPOS.has(p.tipo)) throw erro(400, 'Tipo de equipamento inválido.');
  return { id: randomUUID(), nome, modelo: texto(p.modelo,180), fabricante: texto(p.fabricante,120), numero_serie: texto(p.numero_serie,120), codigo: texto(p.codigo,80), tipo: p.tipo || tipoAutomatico(nome), observacoes: texto(p.observacoes,5000), ativo: p.ativo !== false && p.ativo !== 0 };
}
function proximaCalibracao(calibracao) {
  const [ano,mes,dia] = calibracao.split('-').map(Number),ultimoDia = new Date(Date.UTC(ano+1,mes,0)).getUTCDate();
  return String(ano+1)+'-'+String(mes).padStart(2,'0')+'-'+String(Math.min(dia,ultimoDia)).padStart(2,'0');
}
function normalizarCertificado(p = {}) {
  const calibracao = data(p.data_calibracao,true), recalibracao = data(p.data_recalibracao) || proximaCalibracao(calibracao);
  if(recalibracao<calibracao)throw erro(400,'O vencimento não pode ser anterior à calibração.');
  const link = texto(p.link_externo,2048);
  if (link) { let u; try { u = new URL(link); } catch { throw erro(400,'Informe um link HTTPS válido para o PDF.'); } if (u.protocol !== 'https:' || u.username || u.password) throw erro(400,'Informe um link HTTPS válido para o PDF.'); }
  return { id: randomUUID(), data_calibracao: calibracao, data_recalibracao: recalibracao, numero: texto(p.numero,120), laboratorio: texto(p.laboratorio,180), observacoes: texto(p.observacoes,5000), link_externo: link || null };
}
async function exigirEquipamento(escopo,id) { const e = await Model.equipamento(escopo,id); if (!e) throw erro(404,'Equipamento não encontrado.'); return e; }
async function exigirCertificado(escopo,id) { const c = await Model.certificado(escopo,id); if (!c) throw erro(404,'Certificado não encontrado.'); return c; }
async function criar(escopo,usuario,p = {}) {
  const e = normalizarEquipamento(p);
  await Model.cadastrar([{equipamento:e,certificado:null}],escopo,usuario); return { id:e.id };
}

async function atualizar(escopo,id,p) { await exigirEquipamento(escopo,id); await Model.atualizar(normalizarEquipamento(p),escopo,id); return {id}; }
async function importar(escopo,usuario) {
  const registros = referencia.map(r => ({ equipamento: normalizarEquipamento({...r,observacoes: !r.numero_serie ? 'Número de série não informado na planilha de origem.' : ''}), certificado: normalizarCertificado({data_calibracao:r.calibracao,data_recalibracao:r.recalibracao,observacoes:'Registro da planilha de controle. Certificado PDF ainda não anexado.'}), origem:'controle-planilha-2026:linha-' + r.linha_origem }));
  return { criados: await Model.cadastrar(registros,escopo,usuario,true), total:referencia.length };
}
function storage() { return require('../config/supabase').storage; }
function validarStorage() {
  if(!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.SUPABASE_URL) throw erro(503,'O armazenamento dos certificados ainda não está configurado no servidor.');
}
function registrarErroStorage(operacao,e){console.error('Calibrações - armazenamento:',{operacao,status:e?.statusCode || e?.status || null,codigo:e?.code || e?.name || null});}
function erroUpload(e){
  registrarErroStorage('enviar PDF',e);
  const status=Number(e?.statusCode || e?.status);
  if(status===401 || status===403 || /row.level security|not authorized|unauthorized|permission denied/i.test(e?.message || ''))return erro(503,'O Supabase bloqueou o envio para o bucket '+BUCKET+'. Ser público libera a leitura, mas o envio exige uma chave de servidor ou uma permissão de upload autorizada.');
  if(e?.code==='NoSuchBucket' || /bucket not found/i.test(e?.message || ''))return erro(503,'O bucket '+BUCKET+' não foi encontrado no Supabase. Confira o nome, incluindo letras maiúsculas e minúsculas.');
  return erro(503,'Não foi possível enviar o PDF para a nuvem. Verifique as permissões do armazenamento e tente novamente.');
}
async function anexar(escopo,usuario,id,p,file) {
  await exigirEquipamento(escopo,id); const c = normalizarCertificado(p);
  if (!file && !c.link_externo) throw erro(400,'Anexe um PDF ou informe o link HTTPS do documento.');
  if (file && c.link_externo) throw erro(400,'Escolha um PDF ou um link, não os dois.');
  if (file) {
    if (file.size > MAX_PDF || file.mimetype !== 'application/pdf' || !/\.pdf$/i.test(file.originalname || '') || file.buffer.subarray(0,5).toString() !== '%PDF-') throw erro(400,'Envie um arquivo PDF válido de até 20 MB.');
    validarStorage(); c.arquivo_bucket = BUCKET; c.arquivo_path = escopo + '/' + id + '/' + c.id + '.pdf'; c.arquivo_nome = texto(file.originalname,240);
    const {error} = await storage().from(BUCKET).upload(c.arquivo_path,file.buffer,{contentType:'application/pdf',upsert:false});
    if (error) throw erroUpload(error);
    c.link_externo = storage().from(BUCKET).getPublicUrl(c.arquivo_path).data.publicUrl;
  }
  try { await Model.adicionarCertificado(c,escopo,id,usuario); }
  catch (e) { if (c.arquivo_path) await storage().from(BUCKET).remove([c.arquivo_path]); throw e; }
  return {id:c.id};
}
async function urlDocumento(c) {
  if (c.link_externo) return c.link_externo;
  if (!c.arquivo_path) throw erro(404,'Este registro ainda não possui PDF.');
  const {data,error} = await storage().from(c.arquivo_bucket || 'Calibracoes').createSignedUrl(c.arquivo_path,300);
  if (error || !data?.signedUrl) throw erro(503,'Não foi possível abrir o PDF. Tente novamente.'); return data.signedUrl;
}
async function compartilhar(escopo,id) { const c = await exigirCertificado(escopo,id); if (!c.arquivo_path && !c.link_externo) throw erro(400,'Anexe o documento antes de compartilhar.'); if(c.arquivo_path && c.link_externo)return {caminho:c.link_externo,publico:true}; const token = c.compartilhamento || randomBytes(24).toString('hex'); await Model.compartilhar(escopo,id,token); return { caminho:'/api/calibracoes/publico/' + token }; }
async function revogar(escopo,id) { const c=await exigirCertificado(escopo,id); if(c.arquivo_path && c.link_externo)throw erro(400,'Este PDF está em um bucket público. O acesso pelo link direto não pode ser revogado pelo ConnectPear.'); await Model.compartilhar(escopo,id,null); return {sucesso:true}; }
async function publico(token) { if (!/^[a-f0-9]{48}$/.test(token)) throw erro(404,'Link não encontrado ou revogado.'); const c = await Model.publico(token); if (!c) throw erro(404,'Link não encontrado ou revogado.'); return urlDocumento(c); }
async function abrir(escopo,id) { return urlDocumento(await exigirCertificado(escopo,id)); }
async function remover(escopo,id) {
  const c=await exigirCertificado(escopo,id);
  if(c.arquivo_path){
    validarStorage();
    const {data,error}=await storage().from(c.arquivo_bucket || 'Calibracoes').remove([c.arquivo_path]);
    if(error || !Array.isArray(data) || !data.length){
      registrarErroStorage('excluir PDF',error || {code:'ExclusaoNaoAutorizada'});
      throw erro(503,'O Supabase não confirmou a exclusão do PDF. O registro foi preservado. Confira as políticas SELECT e DELETE do bucket calibracoes para a mesma chave já usada em Exames e Cursos.');
    }
  }
  await Model.removerCertificado(escopo,id);return {sucesso:true};
}
module.exports = { criar, atualizar, importar, anexar, compartilhar, revogar, publico, abrir, remover, listar:Model.listar, normalizarEquipamento, normalizarCertificado, tipoAutomatico, proximaCalibracao };

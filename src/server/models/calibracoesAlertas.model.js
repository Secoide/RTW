const db = require('../config/db');
const Calibracoes = require('./calibracoes.model');
const Notificacoes = require('./notificacoes.model');
let pronta;
function garantirTabela() {
 if(!pronta)pronta=(async()=>{
  await Calibracoes.garantirTabelas();await Notificacoes.garantirTabelas();
  await db.query(`CREATE TABLE IF NOT EXISTS calibracao_alertas (
    id_usuario INT NOT NULL, escopo BIGINT NOT NULL, referencia VARCHAR(100) NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_usuario, referencia), INDEX idx_cal_alerta_escopo (escopo, id_usuario)
  )`);
 })().catch(e=>{pronta=null;throw e;});return pronta;
}
async function usuariosEngenharia(id=null){
 const [rows]=await db.query(`SELECT DISTINCT f.id FROM funcionarios f
   JOIN tb_cargos c ON c.id=f.cargo JOIN tb_setores s ON s.id_catnvl=c.idsetor
   WHERE c.ativo_colaborador=1 AND LOWER(TRIM(s.categoria)) LIKE '%engenharia%'
   ${id === null ? '' : 'AND f.id = ?'}`,id===null?[]:[id]);return rows;
}
async function vigentes(escopo,hoje){
 await garantirTabela();
 const [rows]=await db.query(`SELECT e.id, e.nome, e.numero_serie, DATE_FORMAT(c.data_calibracao,'%Y-%m-%d') AS data_calibracao,
     DATE_FORMAT(c.data_recalibracao,'%Y-%m-%d') AS data_recalibracao
   FROM calibracao_equipamentos e
   JOIN calibracao_certificados c ON c.equipamento_id=e.id AND c.escopo=e.escopo
   WHERE e.escopo=? AND e.ativo=1 AND c.data_calibracao<=?
   AND NOT EXISTS (SELECT 1 FROM calibracao_certificados novo WHERE novo.escopo=c.escopo
     AND novo.equipamento_id=c.equipamento_id AND novo.data_calibracao<=?
     AND (novo.data_calibracao>c.data_calibracao OR (novo.data_calibracao=c.data_calibracao
       AND (novo.criado_em>c.criado_em OR (novo.criado_em=c.criado_em AND novo.id>c.id)))))`,[escopo,hoje,hoje]);return rows;
}
async function sincronizar(escopo,idUsuario,alertas){
 await garantirTabela();const conexao=await db.getConnection();
 try{
  await conexao.beginTransaction();
  const [existentes]=await conexao.query('SELECT referencia FROM calibracao_alertas WHERE id_usuario=? AND escopo=?',[idUsuario,escopo]);
  const enviadas=new Set(existentes.map(a=>a.referencia));
  for(const a of alertas){
   if(enviadas.has(a.referencia))continue;
   const [r]=await conexao.query('INSERT IGNORE INTO calibracao_alertas (id_usuario,escopo,referencia) VALUES (?,?,?)',[idUsuario,escopo,a.referencia]);
   if(r.affectedRows)await conexao.query(`INSERT INTO sistema_notificacoes (id_destinatario,tipo,referencia,mensagem) VALUES (?,'calibracao_vencimento',?,?)`,[idUsuario,a.referencia,a.mensagem]);
  }
  const refs=alertas.map(a=>a.referencia);
  await conexao.query(`UPDATE sistema_notificacoes SET ativo=0 WHERE tipo='calibracao_vencimento'
    AND id_destinatario=? AND referencia LIKE ? AND ativo=1 ${refs.length?'AND referencia NOT IN (?)':''}`,[idUsuario,'cal:'+escopo+':%',...(refs.length?[refs]:[])]);
  await conexao.commit();
 }catch(e){await conexao.rollback();throw e;}finally{conexao.release();}
}
module.exports={usuariosEngenharia,vigentes,sincronizar};

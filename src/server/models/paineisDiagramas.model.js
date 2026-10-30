const db=require('../config/db');
let pronta;
async function garantir(){if(!pronta)pronta=db.query(`CREATE TABLE IF NOT EXISTS paineis_eletricos_diagramas (id INT AUTO_INCREMENT PRIMARY KEY,id_painel INT NOT NULL,nome VARCHAR(255) NOT NULL,arquivo_path VARCHAR(1024) NOT NULL,url TEXT NOT NULL,criado_por INT NULL,criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,INDEX idx_diagrama_painel (id_painel))`).catch(e=>{pronta=null;throw e;});await pronta;}
async function listar(id){await garantir();const [rows]=await db.query('SELECT id,id_painel,nome,url,criado_em FROM paineis_eletricos_diagramas WHERE id_painel=? ORDER BY criado_em DESC,id DESC',[id]);return rows;}
async function buscar(id,painel){await garantir();const [rows]=await db.query('SELECT * FROM paineis_eletricos_diagramas WHERE id=? AND id_painel=?',[id,painel]);return rows[0] || null;}
async function criar(painel,nome,path,url,usuario){await garantir();const [r]=await db.query('INSERT INTO paineis_eletricos_diagramas (id_painel,nome,arquivo_path,url,criado_por) VALUES (?,?,?,?,?)',[painel,nome,path,url,usuario]);return buscar(r.insertId,painel);}
async function remover(id,painel){await garantir();await db.query('DELETE FROM paineis_eletricos_diagramas WHERE id=? AND id_painel=?',[id,painel]);}
async function contarPorPaineis(ids){if(!ids.length)return [];await garantir();const [rows]=await db.query('SELECT id_painel,COUNT(*) AS total FROM paineis_eletricos_diagramas WHERE id_painel IN (?) GROUP BY id_painel',[ids]);return rows;}
module.exports={listar,buscar,criar,remover,contarPorPaineis};

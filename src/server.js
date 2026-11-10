import express from 'express';
import pg from 'pg';
import { readFile } from 'node:fs/promises';
if (!process.env.DATABASE_URL || !process.env.API_KEY) throw new Error('Configura DATABASE_URL y API_KEY');
const pool = new pg.Pool({connectionString:process.env.DATABASE_URL,max:5,connectionTimeoutMillis:10000,query_timeout:10000});
pool.on('error', () => console.error('Conexion PostgreSQL interrumpida'));
await pool.query(await readFile(new URL('../sql/schema.sql',import.meta.url),'utf8'));
const app=express();
app.disable('x-powered-by');
app.use(express.json({limit:'16kb'}));
app.get('/',(req,res)=>res.json({servicio:'Soporte tecnico',salud:'/health',solicitudes:'/api/solicitudes'}));
app.get('/health',async(req,res)=>{try{await pool.query('SELECT 1');res.json({estado:'ok'});}catch{res.status(503).json({error:'Base no disponible'});}});
app.use('/api',(req,res,next)=>req.get('x-api-key')===process.env.API_KEY?next():res.status(401).json({error:'Credencial requerida'}));
const projection="id, 'ST-' || lpad(id::text, 6, '0') AS folio, nombre, correo, categoria, prioridad, descripcion, estado, creado_en";
app.post('/api/solicitudes',async(req,res)=>{
 const b=req.body??{};
 for(const k of ['origen_id','nombre','correo','categoria','prioridad','descripcion'])
  if(typeof b[k]!=='string'||!b[k].trim()||b[k].length>2000)return res.status(400).json({error:`Campo invalido: ${k}`});
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.correo)||!['Hardware','Software','Red','Otro'].includes(b.categoria)||!['Baja','Media','Alta'].includes(b.prioridad))return res.status(400).json({error:'Correo, categoria o prioridad invalida'});
 const values=['origen_id','nombre','correo','categoria','prioridad','descripcion'].map(k=>b[k].trim());
 const result=await pool.query(`INSERT INTO soporte.solicitudes(origen_id,nombre,correo,categoria,prioridad,descripcion) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(origen_id) DO NOTHING RETURNING ${projection}`,values);
 if(result.rows.length)return res.status(201).json(result.rows[0]);
 const existing=await pool.query(`SELECT ${projection} FROM soporte.solicitudes WHERE origen_id=$1`,[values[0]]);
 res.json(existing.rows[0]);
});
app.get('/api/solicitudes',async(req,res)=>res.json((await pool.query(`SELECT ${projection} FROM soporte.solicitudes ORDER BY id DESC LIMIT 1000`)).rows));
app.get('/api/solicitudes/:id',async(req,res)=>{
 if(!/^[1-9]\d{0,8}$/.test(req.params.id))return res.status(400).json({error:'ID invalido'});
 const result=await pool.query(`SELECT ${projection} FROM soporte.solicitudes WHERE id=$1`,[Number(req.params.id)]);
 res.status(result.rows.length?200:404).json(result.rows[0]??{error:'Solicitud no encontrada'});
});
app.use((req,res)=>res.status(404).json({error:'Ruta no encontrada'}));
app.use((err,req,res,next)=>{console.error(err.code||err.name);res.status(err.status===400?400:500).json({error:err.status===400?'JSON invalido':'Error del servidor'});});
const server=app.listen(process.env.PORT||3001,'0.0.0.0',()=>console.log('API soporte lista'));
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>{server.close(async()=>{await pool.end();process.exit(0);});setTimeout(()=>process.exit(1),10000).unref();});

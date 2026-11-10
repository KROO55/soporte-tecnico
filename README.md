# Sistema de solicitudes de soporte tecnico

Proyecto del segundo parcial. Backend minimo en Express con PostgreSQL en Neon.

## Enlaces

- API: https://soporte-tecnico-jonn.onrender.com
- Estado: https://soporte-tecnico-jonn.onrender.com/health
- GitHub: https://github.com/KROO55/soporte-tecnico
- Forms: https://docs.google.com/forms/d/e/1FAIpQLSd2jQlzcBoiUFXv9ys0r5sMbnwQOOyH14VbSoUoWlMiTxgTWw/viewform
- Sheets y dashboard: https://docs.google.com/spreadsheets/d/1RNyV_viqziJc0f8l4EJkTdX8pWTfoqcTr3Heh1NjSn8/edit#gid=20261110
- n8n local: http://localhost:5678/workflow/ProyectoSoporte2026

## Instalacion

Node 22 o posterior. Ejecuta `npm ci`, copia `.env.example` como `.env` y configura DATABASE_URL con la conexion de Neon y API_KEY con una clave privada aleatoria. Ejecuta `npm start`. El servidor escucha en el puerto 3001, o en PORT si esta definido. Al iniciar crea el esquema soporte y la tabla solicitudes sin borrar los datos existentes.

Render ya esta vinculado al repositorio. Usa `npm ci` como build y `npm start` como inicio. Las variables DATABASE_URL y API_KEY se guardan en Render, nunca en Git. El esquema soporte esta dentro de la base Neon existente, separado del inventario de camisetas.

## API

En todas las rutas /api incluye el encabezado `x-api-key`. Las consultas contienen datos personales y requieren la misma clave que esta configurada en la credencial de n8n.

- POST /api/solicitudes: origen_id, nombre, correo, categoria, prioridad, descripcion. Devuelve 201 para una nueva solicitud o 200 para un origen_id existente con el mismo folio.
- GET /api/solicitudes: hasta 1000 solicitudes, mas recientes primero.
- GET /api/solicitudes/:id: una solicitud; 404 si no existe y 400 si el ID es invalido.
- GET /health: verifica conexion con Neon.

Categorias: Hardware, Software, Red y Otro. Prioridades: Baja, Media y Alta. Estado inicial: Pendiente. Una solicitud equivale a una fila; folio ST- seguido del ID con al menos seis digitos. La secuencia puede contener saltos por reintentos y eso no implica registros perdidos.

## Automatizacion

El workflow esta publicado y consulta Sheets cada minuto mientras Docker y n8n esten encendidos. Tiene un disparador manual para la demostracion. No requiere nodos Code.

1. Leer respuestas y filtrar las que no tienen Correo enviado en TRUE.
2. Recorrer de una en una; llamar POST a la API publica.
3. Guardar Folio, Procesado y Registrado en en Sheets.
4. Enviar confirmacion mediante Gmail.
5. Marcar Correo enviado en TRUE y volver al ciclo.

El identificador de origen combina marca temporal y correo; no edites esos datos despues del envio. No ordenes filas durante una ejecucion, porque se actualiza por row_number. El reintento no duplica solicitudes en PostgreSQL. Si Gmail envia pero falla justo la actualizacion final de Sheets, puede repetirse el correo; no se promete entrega exactamente una vez entre servicios distintos.

## Importar en otra instalacion

Importa workflow-n8n.json, selecciona tus credenciales Google Sheets y Gmail, y crea una credencial Header Auth con nombre x-api-key y la clave de Render. Elige tu documento y su hoja en los tres nodos Sheets. Publica el workflow. El archivo exportado no contiene claves ni tokens. La importacion queda inactiva para revisar la configuracion antes de publicar.

## Dashboard y demostracion

La hoja Dashboard usa COUNTA y COUNTIF con INDIRECT para que Forms no desplace el rango inicial al insertar filas. Tiene tres graficos: total, por categoria y por prioridad. Cuenta respuestas recibidas en Forms, no las pruebas directas realizadas sobre la API.

Envia una solicitud con tu correo, espera un minuto, comprueba folio y marcas TRUE en Sheets y revisa Gmail. Repite el workflow sin nuevas respuestas: el filtro debe detener el recorrido sin registrar ni enviar de nuevo. Revisa las evidencias de esta entrega.

Las pruebas registradas incluyen una prueba directa de API y una prueba completa desde Forms. Render gratuito puede tardar en reactivarse. El timeout HTTP de n8n es 120 segundos. No se han cambiado planes de pago.

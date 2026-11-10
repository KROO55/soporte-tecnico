CREATE SCHEMA IF NOT EXISTS soporte;
CREATE TABLE IF NOT EXISTS soporte.solicitudes (
 id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 origen_id text NOT NULL UNIQUE,
 nombre text NOT NULL,
 correo text NOT NULL,
 categoria text NOT NULL CHECK(categoria IN ('Hardware','Software','Red','Otro')),
 prioridad text NOT NULL CHECK(prioridad IN ('Baja','Media','Alta')),
 descripcion text NOT NULL,
 estado text NOT NULL DEFAULT 'Pendiente',
 creado_en timestamptz NOT NULL DEFAULT now()
);

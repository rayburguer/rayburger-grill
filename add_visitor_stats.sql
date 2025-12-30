-- Tabla para estadísticas generales del sitio
CREATE TABLE IF NOT EXISTS rb_site_stats (
    id text PRIMARY KEY,
    value numeric DEFAULT 0,
    updated_at timestamptz DEFAULT now()
);

-- Inicializar contador de visitas si no existe
INSERT INTO rb_site_stats (id, value)
VALUES ('visitors', 0)
ON CONFLICT (id) DO NOTHING;

-- Función segura para incrementar visitas
CREATE OR REPLACE FUNCTION increment_visitors()
RETURNS void AS $$
BEGIN
    UPDATE rb_site_stats
    SET value = value + 1,
        updated_at = now()
    WHERE id = 'visitors';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Habilitar RLS
ALTER TABLE rb_site_stats ENABLE ROW LEVEL SECURITY;

-- Política de lectura pública
DROP POLICY IF EXISTS "Public Read Stats" ON rb_site_stats;
CREATE POLICY "Public Read Stats" ON rb_site_stats FOR SELECT USING (true);

-- Política de incremento (solo vía RPC)
-- Nota: Al ser SECURITY DEFINER, la función puede ejecutarse sin permisos directos de escritura en la tabla.

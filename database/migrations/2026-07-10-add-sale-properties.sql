ALTER TABLE properties
  MODIFY COLUMN type ENUM('temporada', 'anio', 'venta') NOT NULL DEFAULT 'temporada',
  MODIFY COLUMN price_unit ENUM('noche', 'mes', 'uf') NOT NULL DEFAULT 'noche';

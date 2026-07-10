ALTER TABLE properties
  ADD COLUMN price_currency ENUM('clp', 'uf') NOT NULL DEFAULT 'clp' AFTER price;

UPDATE properties
SET price_currency = 'uf',
    price_unit = 'mes'
WHERE price_unit = 'uf';

ALTER TABLE properties
  MODIFY COLUMN price_unit ENUM('noche', 'mes') NOT NULL DEFAULT 'noche';

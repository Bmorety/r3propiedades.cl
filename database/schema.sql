CREATE TABLE properties (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(120) NOT NULL,
  type ENUM('temporada', 'anio') NOT NULL DEFAULT 'temporada',
  zone VARCHAR(90) NOT NULL DEFAULT '',
  bedrooms TINYINT UNSIGNED NOT NULL DEFAULT 0,
  bathrooms TINYINT UNSIGNED NOT NULL DEFAULT 0,
  area SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  price INT UNSIGNED NOT NULL DEFAULT 0,
  price_unit ENUM('noche', 'mes') NOT NULL DEFAULT 'noche',
  title_es VARCHAR(180) NOT NULL,
  title_en VARCHAR(180) NOT NULL DEFAULT '',
  desc_es TEXT NOT NULL,
  desc_en TEXT NOT NULL,
  featured TINYINT(1) NOT NULL DEFAULT 0,
  visible TINYINT(1) NOT NULL DEFAULT 1,
  availability_status ENUM('available', 'available_from', 'unavailable') NOT NULL DEFAULT 'available',
  available_from DATE NULL,
  airbnb_url VARCHAR(500) NULL,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 100,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_properties_slug (slug),
  KEY idx_public_order (visible, featured, sort_order, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE property_photos (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  property_id INT UNSIGNED NOT NULL,
  filename VARCHAR(180) NOT NULL,
  original_name VARCHAR(180) NOT NULL DEFAULT '',
  mime VARCHAR(60) NOT NULL DEFAULT 'image/webp',
  width SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  height SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  size_bytes INT UNSIGNED NOT NULL DEFAULT 0,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 100,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_property_photos_order (property_id, sort_order, id),
  CONSTRAINT fk_property_photos_property
    FOREIGN KEY (property_id) REFERENCES properties(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

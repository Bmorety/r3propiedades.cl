ALTER TABLE properties
  ADD COLUMN availability_status ENUM('available', 'available_from', 'unavailable') NOT NULL DEFAULT 'available' AFTER visible,
  ADD COLUMN available_from DATE NULL AFTER availability_status;

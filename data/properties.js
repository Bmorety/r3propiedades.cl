/* ============================================================
   R3 PROPIEDADES — Base de datos DRAFT de propiedades
   ------------------------------------------------------------
   Este archivo es temporal. Más adelante estos datos vendrán
   desde MySQL (phpMyAdmin / Bluehosting) a través de una API.
   Por ahora, para editar/agregar una propiedad basta con copiar
   un bloque { ... } y cambiar los valores.

   CAMPOS:
   - id        : identificador único (texto)
   - type      : "temporada"  (arriendo por temporada/verano)
                 "anio"       (arriendo año corrido)
   - zone      : "Concón" | "Reñaca" | "Viña del Mar"
   - bedrooms  : nº de dormitorios (1, 2, 3...)
   - bathrooms : nº de baños
   - area      : superficie en m²
   - price     : valor numérico (sin puntos)
   - priceUnit : "noche" | "mes"
   - showPrice : true/false para mostrar u ocultar precio
   - image     : URL de la foto (Unsplash u otra)
   - title     : { es, en }
   - desc      : { es, en }
   - featured  : true para destacarla (opcional)
   ============================================================ */

window.R3_PROPERTIES = [
  {
    id: "con-3d-mirador",
    type: "anio",
    zone: "Concón",
    bedrooms: 3,
    bathrooms: 2,
    area: 110,
    price: 980000,
    priceUnit: "mes",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80",
    title: { es: "Departamento Mirador del Mar", en: "Ocean View Apartment" },
    desc: {
      es: "Amplio 3 dormitorios con terraza y vista despejada al Pacífico, en torre con piscina y conserjería.",
      en: "Spacious 3-bedroom with terrace and open Pacific views, in a tower with pool and concierge."
    },
    featured: true
  },
  {
    id: "ren-2d-dunas",
    type: "temporada",
    zone: "Reñaca",
    bedrooms: 2,
    bathrooms: 2,
    area: 78,
    price: 95000,
    priceUnit: "noche",
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=900&q=80",
    title: { es: "Frente a las Dunas", en: "Facing the Dunes" },
    desc: {
      es: "A pasos de la playa de Reñaca. Luminoso, totalmente equipado, ideal para vacaciones en familia.",
      en: "Steps from Reñaca beach. Bright, fully equipped, perfect for a family holiday."
    },
    featured: true
  },
  {
    id: "vin-1d-centro",
    type: "anio",
    zone: "Viña del Mar",
    bedrooms: 1,
    bathrooms: 1,
    area: 42,
    price: 520000,
    priceUnit: "mes",
    image: "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=900&q=80",
    title: { es: "Studio Plaza Viña", en: "Plaza Viña Studio" },
    desc: {
      es: "Acogedor 1 dormitorio en pleno centro, cercano a comercio, metro y universidades.",
      en: "Cozy 1-bedroom in the heart of downtown, near shops, metro and universities."
    }
  },
  {
    id: "con-2d-bosques",
    type: "anio",
    zone: "Concón",
    bedrooms: 2,
    bathrooms: 2,
    area: 84,
    price: 720000,
    priceUnit: "mes",
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=900&q=80",
    title: { es: "Bosques de Montemar", en: "Montemar Forest" },
    desc: {
      es: "Departamento en sector tranquilo y verde, con estacionamiento y bodega. Listo para habitar.",
      en: "Apartment in a quiet, green sector with parking and storage. Move-in ready."
    }
  },
  {
    id: "ren-3d-cumbres",
    type: "temporada",
    zone: "Reñaca",
    bedrooms: 3,
    bathrooms: 3,
    area: 130,
    price: 140000,
    priceUnit: "noche",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=80",
    title: { es: "Cumbres de Reñaca", en: "Reñaca Heights" },
    desc: {
      es: "Penthouse con vista panorámica, terraza amplia y quincho. Perfecto para grupos en verano.",
      en: "Penthouse with panoramic views, large terrace and BBQ. Perfect for summer groups."
    },
    featured: true
  },
  {
    id: "vin-2d-recreo",
    type: "anio",
    zone: "Viña del Mar",
    bedrooms: 2,
    bathrooms: 1,
    area: 66,
    price: 640000,
    priceUnit: "mes",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=900&q=80",
    title: { es: "Recreo con Vista", en: "Recreo with a View" },
    desc: {
      es: "2 dormitorios remodelado, balcón con vista al mar y excelente conectividad hacia Valparaíso.",
      en: "Remodeled 2-bedroom, balcony with sea view and great connectivity to Valparaíso."
    }
  },
  {
    id: "con-1d-bahia",
    type: "temporada",
    zone: "Concón",
    bedrooms: 1,
    bathrooms: 1,
    area: 48,
    price: 70000,
    priceUnit: "noche",
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
    title: { es: "Bahía de Concón", en: "Concón Bay" },
    desc: {
      es: "Encantador 1 dormitorio a metros de la costanera y los mejores restaurantes de mariscos.",
      en: "Charming 1-bedroom steps from the boardwalk and the best seafood restaurants."
    }
  },
  {
    id: "ren-2d-costa",
    type: "anio",
    zone: "Reñaca",
    bedrooms: 2,
    bathrooms: 2,
    area: 80,
    price: 750000,
    priceUnit: "mes",
    image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=900&q=80",
    title: { es: "Costa Reñaca", en: "Reñaca Coast" },
    desc: {
      es: "Moderno departamento full amoblado, con gimnasio y piscina temperada en el edificio.",
      en: "Modern fully-furnished apartment, with gym and heated pool in the building."
    }
  }
];

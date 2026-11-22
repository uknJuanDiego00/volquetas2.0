import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando Seed de VOLQUETA PRO...');

  // 1. ROLES
  const rolAdmin = await prisma.rol.upsert({
    where: { nombre: 'ADMIN' },
    update: {},
    create: {
      nombre: 'ADMIN',
      descripcion: 'Administrador con acceso total al sistema',
      permisos: JSON.stringify(['ALL'])
    }
  });

  await prisma.rol.upsert({
    where: { nombre: 'OPERADOR' },
    update: {},
    create: {
      nombre: 'OPERADOR',
      descripcion: 'Operador de flota y cotizaciones',
      permisos: JSON.stringify(['VEHICULOS_READ', 'COTIZACIONES_ALL', 'VIAJES_ALL', 'RUTAS_READ'])
    }
  });

  await prisma.rol.upsert({
    where: { nombre: 'CONDUCTOR' },
    update: {},
    create: {
      nombre: 'CONDUCTOR',
      descripcion: 'Conductor asignado con vista de viajes y gastos',
      permisos: JSON.stringify(['VIAJES_READ', 'GASTOS_CREATE'])
    }
  });

  // 2. USUARIOS
  const passwordHash = await bcrypt.hash('Admin2026*', 10);
  await prisma.usuario.upsert({
    where: { email: 'admin@volquetapro.co' },
    update: {},
    create: {
      nombre: 'Administrador de Flota',
      email: 'admin@volquetapro.co',
      passwordHash,
      rolId: rolAdmin.id,
      activo: true
    }
  });

  // 3. DEPARTAMENTOS Y MUNICIPIOS PRIORIZADOS
  // Santander (68), Boyacá (15), Antioquia (05), Cundinamarca/Bogotá (11/25)
  const dptosData = [
    { codigoDane: '68', nombre: 'SANTANDER' },
    { codigoDane: '15', nombre: 'BOYACÁ' },
    { codigoDane: '05', nombre: 'ANTIOQUIA' },
    { codigoDane: '11', nombre: 'BOGOTÁ D.C.' }
  ];

  const dptosMap = new Map<string, number>();

  for (const d of dptosData) {
    const dpto = await prisma.departamento.upsert({
      where: { codigoDane: d.codigoDane },
      update: { nombre: d.nombre },
      create: { codigoDane: d.codigoDane, nombre: d.nombre }
    });
    dptosMap.set(d.codigoDane, dpto.id);
  }

  // Municipios de Santander solicitados con coordenadas reales
  const santanderMpios = [
    { codigoDane: '68001', nombre: 'BUCARAMANGA', lat: 7.1254, lon: -73.1198 },
    { codigoDane: '68276', nombre: 'FLORIDABLANCA', lat: 7.0622, lon: -73.0864 },
    { codigoDane: '68307', nombre: 'GIRÓN', lat: 7.0682, lon: -73.1698 },
    { codigoDane: '68547', nombre: 'PIEDECUESTA', lat: 6.9878, lon: -73.0494 },
    { codigoDane: '68406', nombre: 'LEBRIJA', lat: 7.1167, lon: -73.2167 },
    { codigoDane: '68615', nombre: 'RIONEGRO', lat: 7.2625, lon: -73.1511 },
    { codigoDane: '68255', nombre: 'EL PLAYÓN', lat: 7.4722, lon: -73.2033 },
    { codigoDane: '68444', nombre: 'MATANZA', lat: 7.3167, lon: -73.0167 },
    { codigoDane: '68780', nombre: 'SURATÁ', lat: 7.3750, lon: -72.9861 },
    { codigoDane: '68132', nombre: 'CALIFORNIA', lat: 7.3500, lon: -72.9500 },
    { codigoDane: '68867', nombre: 'VETAS', lat: 7.3100, lon: -72.8800 },
    { codigoDane: '68820', nombre: 'TONA', lat: 7.2000, lon: -72.9667 },
    { codigoDane: '68179', nombre: 'CHARTA', lat: 7.2833, lon: -73.0500 },
    { codigoDane: '68895', nombre: 'ZAPATOCA', lat: 6.8167, lon: -73.2667 },
    { codigoDane: '68092', nombre: 'BETULIA', lat: 6.9167, lon: -73.2833 },
    { codigoDane: '68689', nombre: 'SAN VICENTE DE CHUCURÍ', lat: 6.8833, lon: -73.4167 },
    { codigoDane: '68081', nombre: 'BARRANCABERMEJA', lat: 7.0653, lon: -73.8547 },
    { codigoDane: '68575', nombre: 'PUERTO WILCHES', lat: 7.3486, lon: -73.9019 },
    { codigoDane: '68655', nombre: 'SABANA DE TORRES', lat: 7.3917, lon: -73.4972 },
    { codigoDane: '68679', nombre: 'SAN GIL', lat: 6.5558, lon: -73.1348 },
    { codigoDane: '68755', nombre: 'SOCORRO', lat: 6.4667, lon: -73.2667 },
    { codigoDane: '68077', nombre: 'BARBOSA', lat: 5.9317, lon: -73.6167 },
    { codigoDane: '68861', nombre: 'VÉLEZ', lat: 6.0125, lon: -73.6736 },
    { codigoDane: '68425', nombre: 'MÁLAGA', lat: 6.7022, lon: -72.7328 },
    { codigoDane: '68669', nombre: 'SAN ANDRÉS', lat: 6.8167, lon: -72.8500 },
    { codigoDane: '68176', nombre: 'CHARALÁ', lat: 6.2833, lon: -73.1667 },
    { codigoDane: '68500', nombre: 'OIBA', lat: 6.2628, lon: -73.3000 },
    { codigoDane: '68229', nombre: 'CURITÍ', lat: 6.6167, lon: -73.0667 },
    { codigoDane: '68549', nombre: 'PINCHOTE', lat: 6.5333, lon: -73.1833 },
    { codigoDane: '68051', nombre: 'ARATOCA', lat: 6.6942, lon: -73.0208 },
    { codigoDane: '68418', nombre: 'LOS SANTOS', lat: 6.7833, lon: -73.1167 },
    { codigoDane: '68147', nombre: 'CAPITANEJO', lat: 6.5306, lon: -72.6972 },
    { codigoDane: '68190', nombre: 'CIMITARRA', lat: 6.3167, lon: -74.0500 }
  ];

  // Municipios de Boyacá solicitados
  const boyacaMpios = [
    { codigoDane: '15001', nombre: 'TUNJA', lat: 5.5353, lon: -73.3678 },
    { codigoDane: '15238', nombre: 'DUITAMA', lat: 5.8267, lon: -73.0333 },
    { codigoDane: '15759', nombre: 'SOGAMOSO', lat: 5.7167, lon: -72.9333 },
    { codigoDane: '15176', nombre: 'CHIQUINQUIRÁ', lat: 5.6167, lon: -73.8167 },
    { codigoDane: '15516', nombre: 'PAIPA', lat: 5.7833, lon: -73.1167 },
    { codigoDane: '15407', nombre: 'VILLA DE LEYVA', lat: 5.6333, lon: -73.5333 },
    { codigoDane: '15572', nombre: 'PUERTO BOYACÁ', lat: 5.9758, lon: -74.5889 },
    { codigoDane: '15469', nombre: 'MONIQUIRÁ', lat: 5.8750, lon: -73.5722 },
    { codigoDane: '15299', nombre: 'GARAGOA', lat: 5.0833, lon: -73.3667 },
    { codigoDane: '15322', nombre: 'GUATEQUE', lat: 5.0083, lon: -73.4750 },
    { codigoDane: '15753', nombre: 'SOATÁ', lat: 6.3333, lon: -72.6833 },
    { codigoDane: '15646', nombre: 'SAMACÁ', lat: 5.4833, lon: -73.4833 }
  ];

  // Municipios de Antioquia solicitados
  const antioquiaMpios = [
    { codigoDane: '05001', nombre: 'MEDELLÍN', lat: 6.2466, lon: -75.5818 },
    { codigoDane: '05615', nombre: 'RIONEGRO (ANT)', lat: 6.1552, lon: -75.3736 },
    { codigoDane: '05579', nombre: 'PUERTO BERRÍO', lat: 6.4917, lon: -74.4028 },
    { codigoDane: '05440', nombre: 'MARINILLA', lat: 6.1750, lon: -75.3333 },
    { codigoDane: '05318', nombre: 'GUARNE', lat: 6.2806, lon: -75.4417 },
    { codigoDane: '05376', nombre: 'LA CEJA', lat: 6.0333, lon: -75.4333 },
    { codigoDane: '05756', nombre: 'SONSÓN', lat: 5.7111, lon: -75.3111 },
    { codigoDane: '05154', nombre: 'CAUCASIA', lat: 7.9861, lon: -75.1956 },
    { codigoDane: '05042', nombre: 'SANTA FE DE ANTIOQUIA', lat: 6.5569, lon: -75.8281 },
    { codigoDane: '05697', nombre: 'EL SANTUARIO', lat: 6.1389, lon: -75.2639 },
    { codigoDane: '05045', nombre: 'APARTADÓ', lat: 7.8825, lon: -76.6258 }
  ];

  // Bogotá D.C.
  const bogotaMpio = [
    { codigoDane: '11001', nombre: 'BOGOTÁ D.C.', lat: 4.7110, lon: -74.0721 }
  ];

  const allMpios = [
    ...santanderMpios.map(m => ({ ...m, dptoId: dptosMap.get('68')! })),
    ...boyacaMpios.map(m => ({ ...m, dptoId: dptosMap.get('15')! })),
    ...antioquiaMpios.map(m => ({ ...m, dptoId: dptosMap.get('05')! })),
    ...bogotaMpio.map(m => ({ ...m, dptoId: dptosMap.get('11')! }))
  ];

  for (const m of allMpios) {
    await prisma.municipio.upsert({
      where: { codigoDane: m.codigoDane },
      update: {
        nombre: m.nombre,
        latitud: m.lat,
        longitud: m.lon,
        departamentoId: m.dptoId
      },
      create: {
        codigoDane: m.codigoDane,
        nombre: m.nombre,
        latitud: m.lat,
        longitud: m.lon,
        departamentoId: m.dptoId
      }
    });
  }

  // 4. PRECIOS VIGENTES DE ACPM EN COLOMBIA (Resolución CREG oficial y referencias)
  const acpmData = [
    { ciudad: 'BUCARAMANGA', dpto: 'SANTANDER', precio: 10077, codigoDane: '68001' },
    { ciudad: 'MEDELLÍN', dpto: 'ANTIOQUIA', precio: 10377, codigoDane: '05001' },
    { ciudad: 'TUNJA', dpto: 'BOYACÁ', precio: 10450, codigoDane: '15001' },
    { ciudad: 'BOGOTÁ D.C.', dpto: 'BOGOTA D.C.', precio: 10392, codigoDane: '11001' },
    { ciudad: 'BARRANCABERMEJA', dpto: 'SANTANDER', precio: 9980, codigoDane: '68081' },
    { ciudad: 'SAN GIL', dpto: 'SANTANDER', precio: 10150, codigoDane: '68679' },
    { ciudad: 'DUITAMA', dpto: 'BOYACÁ', precio: 10420, codigoDane: '15238' },
    { ciudad: 'SOGAMOSO', dpto: 'BOYACÁ', precio: 10420, codigoDane: '15759' }
  ];

  for (const item of acpmData) {
    const mpio = await prisma.municipio.findUnique({ where: { codigoDane: item.codigoDane } });
    const p = await prisma.precioAcpm.create({
      data: {
        municipioId: mpio?.id,
        ciudadNombre: item.ciudad,
        departamentoNombre: item.dpto,
        precioGalon: item.precio,
        fuente: 'REGULATORIO_CREG',
        vigente: true
      }
    });

    await prisma.historialPrecioAcpm.create({
      data: {
        precioAcpmId: p.id,
        precioGalon: item.precio,
        fuente: 'REGULATORIO_CREG',
        observaciones: 'Precio oficial de referencia CREG/MinMinas cargado en el sistema'
      }
    });
  }

  // 5. PEAJES REALES Y TARIFAS OFICIALES (INVÍAS y ANI corredores Santander, Boyacá, Antioquia)
  const peajesData = [
    {
      nombre: 'Curití',
      sector: 'San Gil - Bucaramanga',
      responsable: 'INVIAS',
      codigoPeaje: '6801',
      lat: 6.6432,
      lon: -73.0854,
      tarifas: { CAT_I: 11200, CAT_II: 16500, CAT_III: 28400, CAT_IV: 37800, CAT_V: 43200 }
    },
    {
      nombre: 'Los Curos',
      sector: 'Piedecuesta - Pescadero',
      responsable: 'INVIAS',
      codigoPeaje: '6802',
      lat: 6.8921,
      lon: -73.0312,
      tarifas: { CAT_I: 10800, CAT_II: 15900, CAT_III: 27900, CAT_IV: 36500, CAT_V: 42100 }
    },
    {
      nombre: 'Lebrija',
      sector: 'Bucaramanga - Barrancabermeja',
      responsable: 'CONCESION',
      codigoPeaje: '6803',
      lat: 7.1084,
      lon: -73.2389,
      tarifas: { CAT_I: 16200, CAT_II: 22400, CAT_III: 38700, CAT_IV: 49500, CAT_V: 57200 }
    },
    {
      nombre: 'Picacho',
      sector: 'Bucaramanga - Pamplona',
      responsable: 'INVIAS',
      codigoPeaje: '6804',
      lat: 7.1856,
      lon: -72.9124,
      tarifas: { CAT_I: 12800, CAT_II: 13700, CAT_III: 29300, CAT_IV: 37200, CAT_V: 41800 }
    },
    {
      nombre: 'Oiba',
      sector: 'Barbosa - Socorro',
      responsable: 'INVIAS',
      codigoPeaje: '6805',
      lat: 6.2412,
      lon: -73.3150,
      tarifas: { CAT_I: 11500, CAT_II: 16800, CAT_III: 28900, CAT_IV: 37500, CAT_V: 42800 }
    },
    {
      nombre: 'Arcabuco',
      sector: 'Tunja - Moniquirá',
      responsable: 'INVIAS',
      codigoPeaje: '1501',
      lat: 5.7512,
      lon: -73.4891,
      tarifas: { CAT_I: 11000, CAT_II: 15200, CAT_III: 26800, CAT_IV: 35100, CAT_V: 40500 }
    },
    {
      nombre: 'Copacabana',
      sector: 'Medellín - Guarne',
      responsable: 'CONCESION',
      codigoPeaje: '0501',
      lat: 6.3421,
      lon: -75.4982,
      tarifas: { CAT_I: 17100, CAT_II: 24300, CAT_III: 41200, CAT_IV: 53100, CAT_V: 61400 }
    },
    {
      nombre: 'Las Palmas',
      sector: 'Medellín - Rionegro',
      responsable: 'CONCESION',
      codigoPeaje: '0502',
      lat: 6.1823,
      lon: -75.5124,
      tarifas: { CAT_I: 15800, CAT_II: 21900, CAT_III: 37500, CAT_IV: 48900, CAT_V: 56100 }
    }
  ];

  for (const p of peajesData) {
    const peaje = await prisma.peaje.create({
      data: {
        nombre: p.nombre,
        sector: p.sector,
        responsable: p.responsable,
        codigoPeaje: p.codigoPeaje,
        latitud: p.lat,
        longitud: p.lon,
        activo: true
      }
    });

    for (const [cat, val] of Object.entries(p.tarifas)) {
      await prisma.tarifaPeaje.create({
        data: {
          peajeId: peaje.id,
          categoria: cat,
          valor: val,
          fuente: 'TARIFAS_VIGENTES_INVIAS_ANI'
        }
      });
    }
  }

  // 6. VEHÍCULOS VOLQUETAS REALES CON RENDIMIENTO Y COSTOS OPERATIVOS
  const vehiculosData = [
    {
      placa: 'WZM-458',
      marca: 'International',
      modelo: 'WorkStar 7600 (Doble Troque C3)',
      anio: 2021,
      tipoVolqueta: 'DOBLE_TROQUE_3_EJES',
      capacidadToneladas: 17.5,
      capacidadM3: 14.0,
      rendimientoKmGalonVacio: 8.5,
      rendimientoKmGalonCargado: 6.2,
      kilometrajeActual: 114500,
      precioGalonAcpm: 10077,
      costoMantenimientoKm: 750, // Filtros, aceite, engrase
      costoLlantasKm: 520,        // 10 llantas 12R22.5
      costoDepreciacionKm: 450,   // Depreciación de capital
      estado: 'ACTIVO'
    },
    {
      placa: 'TLO-892',
      marca: 'Chevrolet',
      modelo: 'Kodiak 7500 (Sencilla 2 Ejes C2)',
      anio: 2018,
      tipoVolqueta: 'SENCILLA_2_EJES',
      capacidadToneladas: 8.5,
      capacidadM3: 7.0,
      rendimientoKmGalonVacio: 11.0,
      rendimientoKmGalonCargado: 8.2,
      kilometrajeActual: 187200,
      precioGalonAcpm: 10077,
      costoMantenimientoKm: 580,
      costoLlantasKm: 340,        // 6 llantas
      costoDepreciacionKm: 320,
      estado: 'ACTIVO'
    },
    {
      placa: 'SVP-314',
      marca: 'Kenworth',
      modelo: 'T800 Cuatro Manos (4 Ejes C4)',
      anio: 2023,
      tipoVolqueta: 'CUATRO_MANOS_4_EJES',
      capacidadToneladas: 24.0,
      capacidadM3: 18.0,
      rendimientoKmGalonVacio: 6.8,
      rendimientoKmGalonCargado: 4.8,
      kilometrajeActual: 46200,
      precioGalonAcpm: 10077,
      costoMantenimientoKm: 980,
      costoLlantasKm: 720,        // 14 llantas
      costoDepreciacionKm: 620,
      estado: 'ACTIVO'
    }
  ];

  for (const v of vehiculosData) {
    await prisma.vehiculo.upsert({
      where: { placa: v.placa },
      update: {},
      create: v
    });
  }

  // 7. CONDUCTORES
  await prisma.conductor.upsert({
    where: { documento: '91284562' },
    update: {},
    create: {
      nombre: 'Carlos Humberto Pedraza',
      documento: '91284562',
      telefono: '3158941203',
      tipoPagoDefecto: 'VIAJE',
      tarifaBase: 120000,
      activo: true
    }
  });

  await prisma.conductor.upsert({
    where: { documento: '1098675432' },
    update: {},
    create: {
      nombre: 'Javier Enrique Gómez',
      documento: '1098675432',
      telefono: '3187654321',
      tipoPagoDefecto: 'KM',
      tarifaBase: 850, // COP por km
      activo: true
    }
  });

  // 8. CLIENTES
  await prisma.cliente.upsert({
    where: { nitCedula: '900876543-1' },
    update: {},
    create: {
      razonSocial: 'Consorcio Vial Santander 2026',
      nitCedula: '900876543-1',
      contacto: 'Ing. Mauricio Morales',
      telefono: '3104567890',
      email: 'logistica@consorciovialsantander.com',
      direccion: 'Carrera 27 # 45-12, Bucaramanga'
    }
  });

  await prisma.cliente.upsert({
    where: { nitCedula: '800123987-4' },
    update: {},
    create: {
      razonSocial: 'Canteras & Agregados del Chicamocha S.A.S.',
      nitCedula: '800123987-4',
      contacto: 'Arq. Andrea Flórez',
      telefono: '3209876543',
      email: 'despachos@canteraschicamocha.co',
      direccion: 'Vía Pescadero Km 14, Aratoca'
    }
  });

  // 9. CONFIGURACIONES GENERALES DE COSTOS
  const configs = [
    { clave: 'MARGEN_GANANCIA_DEFECTO_PCT', valorNumerico: 25, descripcion: 'Margen de ganancia porcentual sugerido por defecto sobre el costo total', categoria: 'FINANCIERA' },
    { clave: 'FACTOR_CONSUMO_TERRENO_PLANO', valorNumerico: 1.0, descripcion: 'Multiplicador de consumo en carretera plana', categoria: 'COMBUSTIBLE' },
    { clave: 'FACTOR_CONSUMO_TERRENO_ONDULADO', valorNumerico: 1.12, descripcion: 'Multiplicador de consumo en carretera ondulada', categoria: 'COMBUSTIBLE' },
    { clave: 'FACTOR_CONSUMO_TERRENO_MONTAÑA', valorNumerico: 1.28, descripcion: 'Multiplicador de consumo en carretera de montaña / cordillera', categoria: 'COMBUSTIBLE' },
    { clave: 'DESCUENTO_PRECIO_COMPETITIVO_PCT', valorNumerico: 6, descripcion: 'Porcentaje de reducción de ganancia para escenario competitivo', categoria: 'FINANCIERA' },
    { clave: 'VIATICO_ALIMENTACION_DIA', valorNumerico: 35000, descripcion: 'Costo estándar viático alimentación por turno/día', categoria: 'CONDUCTOR' },
    { clave: 'VIATICO_HOSPEDAJE_NOCHE', valorNumerico: 55000, descripcion: 'Costo estándar hospedaje conductor por noche', categoria: 'CONDUCTOR' }
  ];

  for (const c of configs) {
    await prisma.configuracionCosto.upsert({
      where: { clave: c.clave },
      update: {},
      create: c
    });
  }

  console.log('✅ Base de datos inicializada exitosamente con datos reales.');
}

main()
  .catch(e => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

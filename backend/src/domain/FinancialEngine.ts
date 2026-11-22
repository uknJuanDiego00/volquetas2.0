export interface VehicleParams {
  capacidadToneladas: number;
  capacidadM3: number;
  rendimientoKmGalonVacio: number;   // km por galón sin carga
  rendimientoKmGalonCargado: number; // km por galón a plena carga
  costoMantenimientoKm: number;       // COP por km
  costoLlantasKm: number;             // COP por km
  costoDepreciacionKm: number;        // COP por km
}

export interface ConductorParams {
  tipoPago: 'VIAJE' | 'KM' | 'DIA';
  tarifaBase: number;
  diasViaje?: number;
  viaticosAlimentacion?: number;
  viaticosHospedaje?: number;
  horasAdicionales?: number;
  tarifaHoraAdicional?: number;
}

export type TipoTerreno = 'PLANO' | 'ONDULADO' | 'MONTANA';

export interface CalculationInput {
  distanciaKm: number;             // km de un trayecto
  tipoViaje: 'SOLO_IDA' | 'IDA_Y_REGRESO';
  pesoToneladas: number;           // peso de la carga
  tipoTerreno?: TipoTerreno;
  factorTraficoEspera?: number;    // % incremento combustible por tráfico (ej. 0 a 20%)
  regresoCargado?: boolean;        // si el viaje es ida y regreso, ¿vuelve cargado o vacío?
  precioAcpmGalon: number;         // COP por galón
  vehiculo: VehicleParams;
  conductor: ConductorParams;
  peajesIda: number;               // Suma peajes ida
  peajesRegreso: number;           // Suma peajes regreso
  otrosGastos: {
    cargueDescargue?: number;
    lavado?: number;
    parqueadero?: number;
    imprevistos?: number;
    adicionales?: number;
  };
  margenGananciaPct?: number;      // % sobre costo total (ej. 25%)
  gananciaFijaDeseada?: number;    // COP fijo alternativo
  gananciaDeseadaPorKm?: number;   // COP/km alternativo
  tipoCalculoGanancia?: 'PORCENTAJE' | 'VALOR_FIJO' | 'POR_KM';
  descuentoCompetitivoPct?: number;// % reducción para escenario competitivo (ej. 6%)
}

export interface CalculationOutput {
  // Distancias y carga
  kmTotales: number;
  kmCargado: number;
  kmVacio: number;
  porcentajeCapacidadUtilizada: number;
  alertaSobrecarga: boolean;
  pesoExcedenteToneladas: number;

  // Combustible
  galonesConsumidosIda: number;
  galonesConsumidosRegreso: number;
  galonesConsumidosTotal: number;
  costoCombustibleTotal: number;

  // Desglose de Costos
  costoConductorTotal: number;
  costoMantenimientoTotal: number;
  costoLlantasTotal: number;
  costoDepreciacionTotal: number;
  costoPeajesTotal: number;
  costoOtrosGastosTotal: number;

  // Costo Total
  costoTotalViaje: number;
  costoPorKm: number;
  costoPorTonelada: number;
  costoPorToneladaKm: number;

  // Escenarios de Precios
  precioMinimo: number;         // Punto de equilibrio
  precioRecomendado: number;    // Rentabilidad meta
  precioCompetitivo: number;    // Oferta ajustada pero rentable

  // Márgenes y Utilidades del Escenario Recomendado
  gananciaEsperadaRecomendada: number;
  margenRentabilidadPct: number;
  ingresoRecomendadoPorKm: number;
  ingresoRecomendadoPorTonelada: number;
  gananciaNetaPorTonelada: number;

  // Métricas del Escenario Competitivo
  gananciaCompetitiva: number;
  margenCompetitivoPct: number;
  alertaBajoPuntoEquilibrio: boolean;
}

export class FinancialEngine {
  private static readonly FACTORES_TERRENO: Record<TipoTerreno, number> = {
    PLANO: 1.0,
    ONDULADO: 1.12,
    MONTANA: 1.28
  };

  /**
   * Ejecuta el cálculo financiero completo con validaciones matemáticas
   */
  public static calculate(input: CalculationInput): CalculationOutput {
    const {
      distanciaKm,
      tipoViaje,
      pesoToneladas,
      tipoTerreno = 'ONDULADO',
      factorTraficoEspera = 0,
      regresoCargado = false,
      precioAcpmGalon,
      vehiculo,
      conductor,
      peajesIda,
      peajesRegreso,
      otrosGastos,
      margenGananciaPct = 25,
      gananciaFijaDeseada = 0,
      gananciaDeseadaPorKm = 0,
      tipoCalculoGanancia = 'PORCENTAJE',
      descuentoCompetitivoPct = 6
    } = input;

    // 1. DISTANCIAS
    const esIdaYRegreso = tipoViaje === 'IDA_Y_REGRESO';
    const kmTotales = esIdaYRegreso ? distanciaKm * 2 : distanciaKm;

    let kmCargado = distanciaKm;
    let kmVacio = 0;

    if (esIdaYRegreso) {
      if (regresoCargado) {
        kmCargado = distanciaKm * 2;
        kmVacio = 0;
      } else {
        kmCargado = distanciaKm;
        kmVacio = distanciaKm;
      }
    }

    // 2. CAPACIDAD Y SOBRECARGA
    const porcentajeCapacidad = vehiculo.capacidadToneladas > 0
      ? (pesoToneladas / vehiculo.capacidadToneladas) * 100
      : 0;

    const alertaSobrecarga = pesoToneladas > vehiculo.capacidadToneladas;
    const pesoExcedente = alertaSobrecarga ? pesoToneladas - vehiculo.capacidadToneladas : 0;

    // 3. RENDIMIENTO DE COMBUSTIBLE
    // Interpolar rendimiento según la fracción de peso si está parcialmente cargado
    const fraccionCarga = Math.min(1, Math.max(0, pesoToneladas / (vehiculo.capacidadToneladas || 1)));
    const rendimientoEfectivoCargado = vehiculo.rendimientoKmGalonVacio -
      (fraccionCarga * (vehiculo.rendimientoKmGalonVacio - vehiculo.rendimientoKmGalonCargado));

    const factorTerreno = this.FACTORES_TERRENO[tipoTerreno] || 1.12;
    const factorTrafico = 1 + (Math.max(0, factorTraficoEspera) / 100);

    // Galones consumidos
    // Galones = (Km / Rendimiento) * FactorTerreno * FactorTrafico
    const galonesIda = (distanciaKm / (rendimientoEfectivoCargado || 6.5)) * factorTerreno * factorTrafico;

    let galonesRegreso = 0;
    if (esIdaYRegreso) {
      const rendimientoRegreso = regresoCargado
        ? rendimientoEfectivoCargado
        : vehiculo.rendimientoKmGalonVacio;
      galonesRegreso = (distanciaKm / (rendimientoRegreso || 8.5)) * factorTerreno * factorTrafico;
    }

    const galonesTotales = galonesIda + galonesRegreso;
    const costoCombustibleTotal = Math.round(galonesTotales * precioAcpmGalon);

    // 4. COSTO DEL CONDUCTOR
    let costoConductor = 0;
    if (conductor.tipoPago === 'VIAJE') {
      costoConductor = conductor.tarifaBase;
    } else if (conductor.tipoPago === 'KM') {
      costoConductor = conductor.tarifaBase * kmTotales;
    } else if (conductor.tipoPago === 'DIA') {
      const dias = Math.max(1, conductor.diasViaje || 1);
      costoConductor = conductor.tarifaBase * dias;
    }

    // Viáticos
    const viaticos = (conductor.viaticosAlimentacion || 0) + (conductor.viaticosHospedaje || 0);
    const horasExtras = (conductor.horasAdicionales || 0) * (conductor.tarifaHoraAdicional || 0);
    const costoConductorTotal = Math.round(costoConductor + viaticos + horasExtras);

    // 5. MANTENIMIENTO, LLANTAS Y DEPRECIACIÓN
    const costoMantenimientoTotal = Math.round(kmTotales * vehiculo.costoMantenimientoKm);
    const costoLlantasTotal = Math.round(kmTotales * vehiculo.costoLlantasKm);
    const costoDepreciacionTotal = Math.round(kmTotales * vehiculo.costoDepreciacionKm);

    // 6. PEAJES
    const costoPeajesTotal = esIdaYRegreso ? peajesIda + peajesRegreso : peajesIda;

    // 7. OTROS GASTOS OPERATIVOS
    const costoOtrosGastosTotal = Math.round(
      (otrosGastos.cargueDescargue || 0) +
      (otrosGastos.lavado || 0) +
      (otrosGastos.parqueadero || 0) +
      (otrosGastos.imprevistos || 0) +
      (otrosGastos.adicionales || 0)
    );

    // 8. COSTO TOTAL DEL VIAJE
    const costoTotalViaje = Math.round(
      costoCombustibleTotal +
      costoConductorTotal +
      costoMantenimientoTotal +
      costoLlantasTotal +
      costoDepreciacionTotal +
      costoPeajesTotal +
      costoOtrosGastosTotal
    );

    const costoPorKm = kmTotales > 0 ? Math.round(costoTotalViaje / kmTotales) : 0;
    const costoPorTonelada = pesoToneladas > 0 ? Math.round(costoTotalViaje / pesoToneladas) : 0;
    const costoPorToneladaKm = (pesoToneladas > 0 && kmTotales > 0)
      ? parseFloat((costoTotalViaje / (pesoToneladas * kmTotales)).toFixed(2))
      : 0;

    // 9. ESCENARIOS DE PRECIOS Y GANANCIA
    // Escenario 1: Precio Mínimo (Punto de Equilibrio = costo exacto)
    const precioMinimo = costoTotalViaje;

    // Determinación de la Ganancia Meta
    let gananciaEsperada = 0;
    if (tipoCalculoGanancia === 'PORCENTAJE') {
      gananciaEsperada = Math.round(costoTotalViaje * (margenGananciaPct / 100));
    } else if (tipoCalculoGanancia === 'VALOR_FIJO') {
      gananciaEsperada = Math.round(gananciaFijaDeseada);
    } else if (tipoCalculoGanancia === 'POR_KM') {
      gananciaEsperada = Math.round(gananciaDeseadaPorKm * kmTotales);
    }

    // Escenario 2: Precio Recomendado
    const precioRecomendado = Math.round(costoTotalViaje + gananciaEsperada);
    const margenRentabilidadPct = precioRecomendado > 0
      ? parseFloat(((gananciaEsperada / precioRecomendado) * 100).toFixed(2))
      : 0;

    const ingresoRecomendadoPorKm = kmTotales > 0 ? Math.round(precioRecomendado / kmTotales) : 0;
    const ingresoRecomendadoPorTonelada = pesoToneladas > 0 ? Math.round(precioRecomendado / pesoToneladas) : 0;
    const gananciaNetaPorTonelada = pesoToneladas > 0 ? Math.round(gananciaEsperada / pesoToneladas) : 0;

    // Escenario 3: Precio Competitivo (reducción controlada)
    // Se reduce un % sobre el precio recomendado o ganancia
    const reduccion = Math.round(precioRecomendado * (descuentoCompetitivoPct / 100));
    let precioCompetitivo = precioRecomendado - reduccion;
    let gananciaCompetitiva = precioCompetitivo - costoTotalViaje;
    const alertaBajoPuntoEquilibrio = precioCompetitivo < precioMinimo;

    if (alertaBajoPuntoEquilibrio) {
      // Advertencia de riesgo: nunca se aconseja por debajo de costo total
      gananciaCompetitiva = precioCompetitivo - costoTotalViaje;
    }

    const margenCompetitivoPct = precioCompetitivo > 0
      ? parseFloat(((gananciaCompetitiva / precioCompetitivo) * 100).toFixed(2))
      : 0;

    return {
      kmTotales,
      kmCargado,
      kmVacio,
      porcentajeCapacidadUtilizada: parseFloat(porcentajeCapacidad.toFixed(2)),
      alertaSobrecarga,
      pesoExcedenteToneladas: parseFloat(pesoExcedente.toFixed(2)),

      galonesConsumidosIda: parseFloat(galonesIda.toFixed(2)),
      galonesConsumidosRegreso: parseFloat(galonesRegreso.toFixed(2)),
      galonesConsumidosTotal: parseFloat(galonesTotales.toFixed(2)),
      costoCombustibleTotal,

      costoConductorTotal,
      costoMantenimientoTotal,
      costoLlantasTotal,
      costoDepreciacionTotal,
      costoPeajesTotal,
      costoOtrosGastosTotal,

      costoTotalViaje,
      costoPorKm,
      costoPorTonelada,
      costoPorToneladaKm,

      precioMinimo,
      precioRecomendado,
      precioCompetitivo,

      gananciaEsperadaRecomendada: gananciaEsperada,
      margenRentabilidadPct,
      ingresoRecomendadoPorKm,
      ingresoRecomendadoPorTonelada,
      gananciaNetaPorTonelada,

      gananciaCompetitiva,
      margenCompetitivoPct,
      alertaBajoPuntoEquilibrio
    };
  }
}

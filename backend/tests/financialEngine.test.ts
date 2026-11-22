import { FinancialEngine, CalculationInput } from '../src/domain/FinancialEngine';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ FALLÓ ASERCIÓN: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runTests() {
  console.log('🧪 Iniciando Pruebas Unitarias del Motor Financiero de VOLQUETA PRO...');

  // Caso 1: Viaje Bucaramanga -> San Gil (98.65 km), Doble Troque 17.5 Toneladas, Carga 15 Ton, Ida y Regreso
  const inputBgaSanGil: CalculationInput = {
    distanciaKm: 98.65,
    tipoViaje: 'IDA_Y_REGRESO',
    pesoToneladas: 15.0,
    tipoTerreno: 'MONTANA', // Pescadero / Cañón del Chicamocha es montaña
    factorTraficoEspera: 5,
    regresoCargado: false,
    precioAcpmGalon: 10077,
    vehiculo: {
      capacidadToneladas: 17.5,
      capacidadM3: 14.0,
      rendimientoKmGalonVacio: 8.5,
      rendimientoKmGalonCargado: 6.2,
      costoMantenimientoKm: 750,
      costoLlantasKm: 520,
      costoDepreciacionKm: 450
    },
    conductor: {
      tipoPago: 'VIAJE',
      tarifaBase: 130000,
      viaticosAlimentacion: 35000,
      viaticosHospedaje: 0
    },
    peajesIda: 27900 + 28400,    // Los Curos + Curití Cat III
    peajesRegreso: 27900 + 28400,
    otrosGastos: {
      cargueDescargue: 50000,
      lavado: 30000,
      imprevistos: 20000
    },
    margenGananciaPct: 25,
    tipoCalculoGanancia: 'PORCENTAJE',
    descuentoCompetitivoPct: 6
  };

  const res = FinancialEngine.calculate(inputBgaSanGil);

  console.log('\n--- Resultados Caso 1 (Bucaramanga - San Gil Doble Troque) ---');
  console.log(`Km Totales: ${res.kmTotales}`);
  console.log(`Galones Consumidos Total: ${res.galonesConsumidosTotal}`);
  console.log(`Costo Combustible: $${res.costoCombustibleTotal.toLocaleString('es-CO')}`);
  console.log(`Costo Conductor: $${res.costoConductorTotal.toLocaleString('es-CO')}`);
  console.log(`Costo Peajes: $${res.costoPeajesTotal.toLocaleString('es-CO')}`);
  console.log(`Costo Total Viaje: $${res.costoTotalViaje.toLocaleString('es-CO')}`);
  console.log(`Precio Mínimo (Punto Equilibrio): $${res.precioMinimo.toLocaleString('es-CO')}`);
  console.log(`Precio Recomendado (25% ganancia): $${res.precioRecomendado.toLocaleString('es-CO')}`);
  console.log(`Precio Competitivo: $${res.precioCompetitivo.toLocaleString('es-CO')}`);
  console.log(`Costo por Tonelada: $${res.costoPorTonelada.toLocaleString('es-CO')}`);
  console.log(`Ingreso Recomendado por Km: $${res.ingresoRecomendadoPorKm.toLocaleString('es-CO')}`);

  // Aserciones Matemáticas
  assert(res.kmTotales === 98.65 * 2, 'Los km totales deben ser el doble en viaje de ida y regreso');
  assert(res.kmCargado === 98.65, 'Km cargado debe ser exactamente la distancia de ida');
  assert(res.kmVacio === 98.65, 'Km vacío debe ser la distancia de regreso si vuelve sin carga');
  assert(!res.alertaSobrecarga, 'No debe haber alerta de sobrecarga con 15 ton sobre capacidad de 17.5 ton');
  assert(res.costoTotalViaje > 0, 'El costo total debe ser mayor a cero');
  assert(
    res.costoTotalViaje === (
      res.costoCombustibleTotal +
      res.costoConductorTotal +
      res.costoMantenimientoTotal +
      res.costoLlantasTotal +
      res.costoDepreciacionTotal +
      res.costoPeajesTotal +
      res.costoOtrosGastosTotal
    ),
    'El costo total debe ser la suma exacta sin duplicidades de todos los rubros operativos'
  );
  assert(res.precioRecomendado > res.costoTotalViaje, 'El precio recomendado debe generar utilidad sobre el costo total');
  assert(res.precioMinimo === res.costoTotalViaje, 'El precio mínimo debe ser igual al punto de equilibrio');
  assert(res.precioCompetitivo >= res.precioMinimo, 'El precio competitivo con descuento del 6% debe estar por encima del punto de equilibrio');

  // Caso 2: Prueba de Alerta de Sobrecarga (22 Ton en volqueta de 17.5 Ton)
  const inputSobrecarga = { ...inputBgaSanGil, pesoToneladas: 22.0 };
  const resSobrecarga = FinancialEngine.calculate(inputSobrecarga);
  assert(resSobrecarga.alertaSobrecarga === true, 'Debe activar alerta de sobrecarga si el peso excede la capacidad');
  assert(resSobrecarga.pesoExcedenteToneladas === 4.5, 'El excedente debe ser de 4.5 toneladas');

  console.log('\n✅ TODAS LAS PRUEBAS MATEMÁTICAS DEL MOTOR FINANCIERO PASARON SATISFACTORIAMENTE.\n');
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});

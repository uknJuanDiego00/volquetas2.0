# VOLQUETA PRO – Calculadora Inteligente de Transporte Pesado en Colombia

Sistema integral Full Stack para calcular, administrar y analizar con precisión matemática los costos operativos, el consumo de combustible ACPM, las tarifas de peajes viales (INVÍAS/ANI), los gastos del conductor, el desgaste del vehículo y los precios recomendados de viajes en volqueta en Colombia.

---

## 1. TECNOLOGÍAS UTILIZADAS

### Frontend:
- **Vue 3** con **Composition API** y **TypeScript**.
- **Vite 6** como bundler de última generación.
- **Vue Router 4** para navegación SPA.
- **Pinia** para gestión del estado global.
- **Tailwind CSS** con paleta corporativa de transporte pesado (Verde oscuro `#0e3a2f`, Grafito, Blanco, Verde claro `#22c55e`, Rojo de alerta `#ef4444`).
- **Leaflet & OpenStreetMap** para renderizado interactivo de rutas viales y peajes.
- **Chart.js** y **vue-chartjs** para analítica estadística y visualización de indicadores financieros.
- **Axios** para comunicación asíncrona con el backend.

### Backend:
- **Node.js** (v20+) y **Express.js** con **TypeScript**.
- **Prisma ORM** para gestión de base de datos relacional y migraciones.
- **Motor Financiero Centralizado (`FinancialEngine.ts`)**: Lógica pura de cálculo de punto de equilibrio, consumo por terreno/tráfico, desgaste y rentabilidad.
- **Autenticación JWT** y encriptación de contraseñas con **bcryptjs**.
- **Seguridad**: Helmet, CORS y validaciones de datos.
- **Integraciones con Fuentes Oficiales de Colombia**:
  - **DANE DIVIPOLA**: Catálogo geográfico de municipios y coordenadas.
  - **OSRM (Open Source Routing Machine)**: Distancias reales por carretera (en kilómetros viales reales, descartando líneas rectas).
  - **MinMinas / SICOM & CREG**: Monitor de precios de referencia de ACPM en Colombia.
  - **INVÍAS & ANI**: Tarifas de peajes discriminadas por categoría vehicular.

### Base de Datos & Auditoría:
- Base de datos relacional normalizada (**SQLite** para desarrollo local cero-configuración y **PostgreSQL 16** listo para producción con Docker).
- **Auditoría inmutable (`auditoria_cambios`)** con registro de usuario, IP, acción y deltas before/after.
- **Inmutabilidad de cotizaciones y viajes**: Se almacena un snapshot JSON de las tarifas y precios vigentes en el instante de creación.

---

## 2. ARQUITECTURA DEL SISTEMA Y MODELO DE DATOS

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Vue 3 + Vite)                         │
│  Pinia Stores ──► Tailwind UI ──► Leaflet Map ──► Chart.js ──► Axios   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ REST API / JWT
┌───────────────────────────────────▼────────────────────────────────────┐
│                       BACKEND (Node.js + Express)                      │
│  Middlewares ──► Routes ──► Controllers ──► FinancialEngine.ts         │
│  Services (AcpmService, GeoRouteService, TollService, AuditService)    │
│  Prisma Client (ORM)                                                   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ SQL Connection Pool
┌───────────────────────────────────▼────────────────────────────────────┐
│                    BASE DE DATOS (PostgreSQL / SQLite)                 │
│  17 Tablas Relacionales Normalizadas e Historial Inmutable             │
└────────────────────────────────────────────────────────────────────────┘
```

### Tablas Implementadas:
1. `usuarios`: Credenciales, roles y estado.
2. `roles`: ADMIN, OPERADOR, CONDUCTOR con matriz de permisos.
3. `vehiculos`: Placa, modelo, tipo de volqueta (Sencilla 2 ejes, Doble Troque 3 ejes, 4 Manos 4 ejes), capacidades en toneladas y m³, rendimientos vacío/cargado, odómetro y costos de desgaste por km.
4. `conductores`: Datos, modalidad de pago (viaje, km, día) y viáticos.
5. `clientes`: Razón social, NIT, teléfono y contacto.
6. `departamentos`: Códigos oficiales DANE.
7. `municipios`: 1.122 municipios con coordenadas geográficas oficiales (prioridad Santander, Boyacá y Antioquia).
8. `rutas`: Caché de distancias reales OSRM, duración y polilíneas GeoJSON.
9. `historial_rutas`: Registro de consultas viales.
10. `precios_acpm`: Precio vigente por ciudad con fuente oficial (SICOM / CREG / Manual).
11. `historial_precios_acpm`: Trazabilidad inmutable de cada cambio de precio de combustible.
12. `peajes`: Estaciones con coordenadas y tramos viales INVÍAS / ANI.
13. `tarifas_peajes`: Tarifas discriminadas por categoría oficial (CAT_I a CAT_V).
14. `cotizaciones`: Cálculos, costos, escenarios de precios y snapshot inmutable.
15. `viajes`: Control de ejecución real, odómetro y balance de utilidad.
16. `gastos_viaje`: Comprobantes de gastos en ruta (combustible, viáticos, peajes, lavado).
17. `auditoria_cambios`: Registro estricto de auditoría para cada transacción.

---

## 3. FÓRMULAS MATEMÁTICAS Y MOTOR FINANCIERO

### 3.1. Consumo de Combustible ACPM:
$$\text{Rendimiento Efectivo} = \text{Rendimiento Vacío} - \left( \frac{\text{Peso}}{\text{Capacidad}} \times (\text{Rendimiento Vacío} - \text{Rendimiento Cargado}) \right)$$
$$\text{Galones Consumidos} = \left( \frac{\text{Km Recorridos}}{\text{Rendimiento Efectivo}} \right) \times \text{Factor Terreno} \times \left(1 + \frac{\text{Factor Tráfico}}{100}\right)$$
$$\text{Costo Combustible} = \text{Galones Consumidos} \times \text{Precio Galón ACPM}$$

- *Factores de Terreno:* Plano ($1.0$), Ondulado ($1.12$), Montaña ($1.28$).
- *Diferenciación:* Ida con carga y regreso vacío (o cargado si aplica carga de retorno).

### 3.2. Desgaste y Costos Operativos por Kilómetro:
$$\text{Costo Mantenimiento} = \text{Km Totales} \times \text{Costo Mantenimiento/Km}$$
$$\text{Costo Llantas} = \text{Km Totales} \times \text{Costo Llantas/Km}$$
$$\text{Costo Depreciación} = \text{Km Totales} \times \text{Costo Depreciación/Km}$$

### 3.3. Costo Total del Viaje (Punto de Equilibrio):
$$\text{Costo Total} = \text{Combustible} + \text{Conductor} + \text{Peajes} + \text{Mantenimiento} + \text{Llantas} + \text{Depreciación} + \text{Otros Gastos}$$

### 3.4. Escenarios de Precios al Cliente:
1. **Precio Mínimo (Punto de Equilibrio):** Cubre el 100% de los costos operativos ($\text{Utilidad} = \$0$).
2. **Precio Recomendado:** Cubre los costos y genera el margen de utilidad esperado:
   $$\text{Precio Recomendado} = \text{Costo Total} \times \left(1 + \frac{\text{Margen \%}}{100}\right)$$
3. **Precio Competitivo:** Aplica una reducción controlada del margen para licitaciones o negociación, con alerta obligatoria si cae por debajo del punto de equilibrio.

### 3.5. Alerta Legal y Mecánica de Sobrecarga:
$$\text{Alerta} = \text{Peso Transportado} > \text{Capacidad Máxima Legal de la Volqueta}$$
El sistema calcula el tonelaje excedente y bloquea la normalización de la sobrecarga.

---

## 4. GUÍA DE INSTALACIÓN Y EJECUCIÓN

### Requisitos Previos:
- Node.js v20+ o v24+
- npm v10+ o v11+
- (Opcional) Docker y Docker Compose

### Modo Desarrollo Rápido (Local):

1. **Clonar e inicializar el Backend:**
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts   # Carga datos oficiales de Santander, Boyacá, Antioquia, Peajes y Flota
npm run dev              # Inicia API en http://localhost:4000
```

2. **Ejecutar Pruebas Unitarias del Motor Financiero:**
```bash
cd backend
npm test                 # Ejecuta tests matemáticos de FinancialEngine.ts
```

3. **Iniciar el Frontend (Vue 3 + Vite):**
```bash
cd frontend
npm install
npm run dev              # Inicia aplicación en http://localhost:5173
```

### Credenciales de Acceso por Defecto:
- **Usuario:** `admin@volquetapro.co`
- **Contraseña:** `Admin2026*`

---

## 5. DESPLIEGUE EN PRODUCCIÓN CON DOCKER

El proyecto incluye orquestación completa con Docker Compose:

```bash
docker-compose up -d --build
```

Esto desplegará:
- `volqueta_pro_postgres`: Base de datos PostgreSQL 16 en el puerto 5432 con volumen persistente.
- `volqueta_pro_backend`: API REST Express en el puerto 4000.
- `volqueta_pro_frontend`: Aplicación Vue 3 servida por Nginx en el puerto 80 con proxy reverso automático para `/api/`.

---

## 6. MÓDULOS DE LA APLICACIÓN

1. **Dashboard:** Métricas ejecutivas (Facturación, Gastos, Ganancia Neta, Rendimiento por Km, Precios de ACPM en ciudades principales, Gráficos estadísticos con Chart.js).
2. **Flota de Volquetas:** Administración técnica de volquetas con cálculo individual de consumo vacío/cargado y costos de desgaste por km.
3. **Monitor de ACPM:** Consulta de precios vigentes CREG / SICOM, sincronización en vivo con `datos.gov.co` y módulo de ajuste manual con trazabilidad inmutable.
4. **Rutas Viales & OSRM:** Catálogo DIVIPOLA de municipios de Colombia con prioridad en Santander, Boyacá y Antioquia, cálculo de distancia real por carretera y visor cartográfico interactivo con Leaflet.
5. **Peajes:** Tarifas oficiales INVÍAS/ANI discriminadas por categoría y geodetección en ruta.
6. **Calculadora Inteligente de Cotizaciones:** Generación interactiva y reactiva de cotizaciones con los 3 escenarios de precios, alerta de sobrecarga y guardado con snapshot inmutable.
7. **Detalle & Exportación PDF:** Vista profesional de cotización lista para impresión formal y envío al cliente.
8. **Control de Viajes:** Liquidación de viajes en ejecución, odómetro y registro de gastos reales en ruta.
9. **Auditoría:** Registro cronológico inmutable de todas las transacciones del sistema.

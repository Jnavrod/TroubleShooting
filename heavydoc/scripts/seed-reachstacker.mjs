/**
 * Seed: Sistemas, subsistemas, errores, pasos, herramientas y peligros
 * para Reachstacker — datos de ejemplo (sin asignar a ninguna máquina).
 *
 * Uso: node scripts/seed-reachstacker.mjs
 */

import { createClient } from "@supabase/supabase-js";
import ws from "ws";

const SUPABASE_URL = "https://ddapxklkfzfnakgslxml.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkYXB4a2xrZnpmbmFrZ3NseG1sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODAyMTkyOSwiZXhwIjoyMDkzNTk3OTI5fQ.ZyD9kh-pmnp5pt5Ag-NMINhMWBW7dgfY_cQxtyvdys4";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  realtime: { transport: ws },
});

// ─── Helpers ────────────────────────────────────────────────────────────────

function tiptap(...blocks) {
  return { type: "doc", content: blocks };
}
function p(...texts) {
  return {
    type: "paragraph",
    content: texts.map((t) =>
      typeof t === "string"
        ? { type: "text", text: t }
        : t
    ),
  };
}
function bold(text) {
  return { type: "text", marks: [{ type: "bold" }], text };
}
function h2(text) {
  return { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text }] };
}
function ul(...items) {
  return {
    type: "bulletList",
    content: items.map((item) => ({
      type: "listItem",
      content: [p(item)],
    })),
  };
}
function ol(...items) {
  return {
    type: "orderedList",
    content: items.map((item) => ({
      type: "listItem",
      content: [p(item)],
    })),
  };
}

async function insert(table, rows) {
  const { data, error } = await supabase.from(table).insert(rows).select();
  if (error) throw new Error(`[${table}] ${error.message}`);
  console.log(`  ✓ ${table}: ${data.length} fila(s)`);
  return data;
}

// ─── MAIN ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🔧 Seed Reachstacker — iniciando…\n");

  // ══════════════════════════════════════════════════════════════════════════
  // 1. TOOLS (catálogo global)
  // ══════════════════════════════════════════════════════════════════════════
  console.log("— Tools");
  const toolsData = await insert("tools", [
    {
      part_number: "HT-400BAR",
      translations: {
        es: { name: "Manómetro hidráulico 0-400 bar", description: "Manómetro analógico para verificar presión en circuitos hidráulicos de alta presión." },
        en: { name: "Hydraulic pressure gauge 0-400 bar", description: "Analog gauge for high-pressure hydraulic circuit testing." },
        pt: { name: "Manômetro hidráulico 0-400 bar", description: "Manômetro analógico para verificar pressão em circuitos hidráulicos de alta pressão." },
      },
    },
    {
      part_number: "FLUKE-87V",
      translations: {
        es: { name: "Multímetro digital Fluke 87V", description: "Multímetro TRMS con medición de temperatura, frecuencia y capacitancia." },
        en: { name: "Fluke 87V digital multimeter", description: "TRMS multimeter with temperature, frequency, and capacitance." },
        pt: { name: "Multímetro digital Fluke 87V", description: "Multímetro TRMS com medição de temperatura, frequência e capacitância." },
      },
    },
    {
      part_number: "DIAG-KAL-01",
      translations: {
        es: { name: "Scanner de diagnóstico Kalmar", description: "Herramienta de diagnóstico OEM para lectura de códigos de falla y monitoreo en tiempo real." },
        en: { name: "Kalmar diagnostic scanner", description: "OEM diagnostic tool for fault code reading and real-time monitoring." },
        pt: { name: "Scanner de diagnóstico Kalmar", description: "Ferramenta de diagnóstico OEM para leitura de códigos de falha e monitoramento em tempo real." },
      },
    },
    {
      part_number: "THERMO-IR-300",
      translations: {
        es: { name: "Termómetro infrarrojo -50 a 300 °C", description: "Termómetro sin contacto para medición de temperatura en componentes hidráulicos y transmisión." },
        en: { name: "Infrared thermometer -50 to 300 °C", description: "Non-contact thermometer for hydraulic and transmission component temperature." },
        pt: { name: "Termômetro infravermelho -50 a 300 °C", description: "Termômetro sem contato para medição de temperatura em componentes hidráulicos e transmissão." },
      },
    },
    {
      part_number: "HYD-TEST-KIT",
      translations: {
        es: { name: "Kit de mangueras de prueba hidráulica", description: "Juego de adaptadores y mangueras de alta presión para toma de puntos de medición en circuito hidráulico." },
        en: { name: "Hydraulic test hose kit", description: "High-pressure adapters and hoses for hydraulic circuit measurement points." },
        pt: { name: "Kit de mangueiras de teste hidráulico", description: "Conjunto de adaptadores e mangueiras de alta pressão para pontos de medição no circuito hidráulico." },
      },
    },
    {
      part_number: "CANT-BUS-ADP",
      translations: {
        es: { name: "Adaptador CAN Bus USB", description: "Interfaz USB-CAN para diagnóstico de red CAN J1939 / CANopen en equipos de elevación." },
        en: { name: "CAN Bus USB adapter", description: "USB-CAN interface for J1939 / CANopen network diagnostics on lifting equipment." },
        pt: { name: "Adaptador CAN Bus USB", description: "Interface USB-CAN para diagnóstico de rede CAN J1939 / CANopen em equipamentos de elevação." },
      },
    },
  ]);

  const tools = {};
  for (const t of toolsData) {
    tools[t.part_number] = t.id;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 2. SYSTEMS
  // ══════════════════════════════════════════════════════════════════════════
  console.log("\n— Systems");
  const systemsData = await insert("systems", [
    {
      slug: "rs-hidraulico",
      translations: {
        es: { name: "Sistema Hidráulico", description: "Circuito hidráulico de trabajo que incluye bomba, cilindros de elevación, extensión de pluma y válvulas de control." },
        en: { name: "Hydraulic System", description: "Work hydraulic circuit including pump, lift cylinders, boom extension, and control valves." },
        pt: { name: "Sistema Hidráulico", description: "Circuito hidráulico de trabalho incluindo bomba, cilindros de elevação, extensão de lança e válvulas de controle." },
      },
    },
    {
      slug: "rs-electrico",
      translations: {
        es: { name: "Sistema Eléctrico", description: "Sistema eléctrico y electrónico: panel de control, red CAN Bus, sensores de posición y actuadores." },
        en: { name: "Electrical System", description: "Electrical and electronic system: control panel, CAN Bus network, position sensors, and actuators." },
        pt: { name: "Sistema Elétrico", description: "Sistema elétrico e eletrônico: painel de controle, rede CAN Bus, sensores de posição e atuadores." },
      },
    },
    {
      slug: "rs-transmision",
      translations: {
        es: { name: "Sistema de Transmisión", description: "Transmisión hidrostática o hidrodinámica, convertidor de par, eje de transmisión y diferencial." },
        en: { name: "Transmission System", description: "Hydrostatic or hydrodynamic transmission, torque converter, drive shaft, and differential." },
        pt: { name: "Sistema de Transmissão", description: "Transmissão hidrostática ou hidrodinâmica, conversor de torque, eixo cardã e diferencial." },
      },
    },
  ]);

  const sys = {};
  for (const s of systemsData) sys[s.slug] = s.id;

  // ══════════════════════════════════════════════════════════════════════════
  // 3. SUBSYSTEMS
  // ══════════════════════════════════════════════════════════════════════════
  console.log("\n— Subsystems");
  const subsystemsData = await insert("subsystems", [
    // Hidráulico
    {
      system_id: sys["rs-hidraulico"],
      slug: "bomba-hidraulica",
      display_order: 1,
      translations: {
        es: { name: "Bomba Hidráulica", description: "Bomba de pistones axiales de caudal variable accionada por el motor diésel." },
        en: { name: "Hydraulic Pump", description: "Variable displacement axial piston pump driven by the diesel engine." },
        pt: { name: "Bomba Hidráulica", description: "Bomba de pistões axiais de vazão variável acionada pelo motor diesel." },
      },
    },
    {
      system_id: sys["rs-hidraulico"],
      slug: "cilindros-elevacion",
      display_order: 2,
      translations: {
        es: { name: "Cilindros de Elevación", description: "Cilindros hidráulicos principales de elevación y extensión de pluma telescópica." },
        en: { name: "Lift Cylinders", description: "Main hydraulic cylinders for lifting and telescopic boom extension." },
        pt: { name: "Cilindros de Elevação", description: "Cilindros hidráulicos principais de elevação e extensão de lança telescópica." },
      },
    },
    {
      system_id: sys["rs-hidraulico"],
      slug: "valvulas-control",
      display_order: 3,
      translations: {
        es: { name: "Válvulas de Control", description: "Bloque de válvulas de control proporcional para funciones de elevación, extensión, inclinación y rotación." },
        en: { name: "Control Valves", description: "Proportional control valve block for lift, extension, tilt, and rotation functions." },
        pt: { name: "Válvulas de Controle", description: "Bloco de válvulas de controle proporcional para funções de elevação, extensão, inclinação e rotação." },
      },
    },
    // Eléctrico
    {
      system_id: sys["rs-electrico"],
      slug: "panel-control",
      display_order: 1,
      translations: {
        es: { name: "Panel de Control (ECU/MCU)", description: "Unidad de control del equipo, joysticks y pantalla de operador." },
        en: { name: "Control Panel (ECU/MCU)", description: "Machine control unit, joysticks, and operator display." },
        pt: { name: "Painel de Controle (ECU/MCU)", description: "Unidade de controle do equipamento, joysticks e tela do operador." },
      },
    },
    {
      system_id: sys["rs-electrico"],
      slug: "sensores-actuadores",
      display_order: 2,
      translations: {
        es: { name: "Sensores y Actuadores", description: "Sensores de presión, ángulo, temperatura, velocidad y actuadores proporcionales." },
        en: { name: "Sensors & Actuators", description: "Pressure, angle, temperature, speed sensors and proportional actuators." },
        pt: { name: "Sensores e Atuadores", description: "Sensores de pressão, ângulo, temperatura, velocidade e atuadores proporcionais." },
      },
    },
    // Transmisión
    {
      system_id: sys["rs-transmision"],
      slug: "caja-cambios",
      display_order: 1,
      translations: {
        es: { name: "Caja de Cambios", description: "Caja de cambios powershift de 3 velocidades con control electrónico." },
        en: { name: "Gearbox", description: "3-speed powershift gearbox with electronic control." },
        pt: { name: "Caixa de Câmbio", description: "Caixa powershift de 3 velocidades com controle eletrônico." },
      },
    },
    {
      system_id: sys["rs-transmision"],
      slug: "convertidor-par",
      display_order: 2,
      translations: {
        es: { name: "Convertidor de Par", description: "Convertidor de par hidráulico con bloqueo de embrague para modo de transferencia directa." },
        en: { name: "Torque Converter", description: "Hydraulic torque converter with lock-up clutch for direct drive mode." },
        pt: { name: "Conversor de Torque", description: "Conversor de torque hidráulico com embreagem lock-up para modo de transmissão direta." },
      },
    },
  ]);

  const sub = {};
  for (const s of subsystemsData) sub[`${s.system_id}:${s.slug}`] = s.id;

  // Alias cortos por slug (únicos en este seed)
  const subBySlug = {};
  for (const s of subsystemsData) subBySlug[s.slug] = s.id;

  // ══════════════════════════════════════════════════════════════════════════
  // 4. ERROR CODES
  // ══════════════════════════════════════════════════════════════════════════
  console.log("\n— Error codes");
  const ecData = await insert("error_codes", [
    // ── Bomba Hidráulica ──
    {
      subsystem_id: subBySlug["bomba-hidraulica"],
      code: "HYD-001",
      severity: "high",
      translations: {
        es: { title: "Baja presión en bomba hidráulica", description: "La presión de trabajo del circuito principal cae por debajo de 220 bar en condición de carga nominal. El equipo puede reducir velocidad de elevación o entrar en modo de protección." },
        en: { title: "Low hydraulic pump pressure", description: "Main circuit working pressure drops below 220 bar at rated load. Equipment may reduce lift speed or enter protection mode." },
        pt: { title: "Baixa pressão na bomba hidráulica", description: "A pressão de trabalho do circuito principal cai abaixo de 220 bar na condição de carga nominal." },
      },
    },
    {
      subsystem_id: subBySlug["bomba-hidraulica"],
      code: "HYD-002",
      severity: "critical",
      translations: {
        es: { title: "Sobrecalentamiento del aceite hidráulico", description: "Temperatura del aceite hidráulico supera los 95 °C. El sistema de enfriamiento no mantiene la temperatura en rango operativo. Riesgo de daño a sellos y componentes internos." },
        en: { title: "Hydraulic oil overheating", description: "Hydraulic oil temperature exceeds 95 °C. Cooling system cannot maintain operating temperature range. Risk of seal and internal component damage." },
        pt: { title: "Superaquecimento do óleo hidráulico", description: "Temperatura do óleo hidráulico ultrapassa 95 °C. O sistema de arrefecimento não mantém a temperatura na faixa operacional." },
      },
    },
    // ── Cilindros de Elevación ──
    {
      subsystem_id: subBySlug["cilindros-elevacion"],
      code: "HYD-010",
      severity: "medium",
      translations: {
        es: { title: "Deriva en cilindros de elevación", description: "La pluma desciende más de 50 mm en 10 minutos con carga nominal y motobomba detenida. Indica fuga interna en cilindro o válvula de retención." },
        en: { title: "Lift cylinder drift", description: "Boom descends more than 50 mm in 10 minutes under rated load with pump stopped. Indicates internal cylinder or check valve leak." },
        pt: { title: "Deriva nos cilindros de elevação", description: "A lança desce mais de 50 mm em 10 minutos com carga nominal e bomba parada." },
      },
    },
    {
      subsystem_id: subBySlug["cilindros-elevacion"],
      code: "HYD-011",
      severity: "high",
      translations: {
        es: { title: "Fuga de aceite en cilindro principal", description: "Fuga visible de aceite hidráulico en vástago o cabezal del cilindro de elevación principal. Puede provocar contaminación ambiental y pérdida de capacidad de carga." },
        en: { title: "Main cylinder oil leak", description: "Visible hydraulic oil leak on rod or head of main lift cylinder. May cause environmental contamination and loss of load capacity." },
        pt: { title: "Vazamento de óleo no cilindro principal", description: "Vazamento visível de óleo hidráulico no haste ou cabeçote do cilindro de elevação principal." },
      },
    },
    // ── Válvulas de Control ──
    {
      subsystem_id: subBySlug["valvulas-control"],
      code: "HYD-020",
      severity: "medium",
      translations: {
        es: { title: "Respuesta lenta en función de inclinación", description: "La función de inclinación de spreader responde con retardo superior a 1,5 segundos desde comando de joystick. Posible solenoide desgastado o presión piloto insuficiente." },
        en: { title: "Slow tilt function response", description: "Spreader tilt function responds with more than 1.5-second delay from joystick command. Possible worn solenoid or insufficient pilot pressure." },
        pt: { title: "Resposta lenta na função de inclinação", description: "A função de inclinação do spreader responde com atraso superior a 1,5 segundos a partir do comando do joystick." },
      },
    },
    // ── Panel de Control ──
    {
      subsystem_id: subBySlug["panel-control"],
      code: "ELE-001",
      severity: "high",
      translations: {
        es: { title: "Error de comunicación CAN Bus", description: "La ECU principal pierde comunicación con uno o más nodos de la red CAN J1939. El equipo puede quedar inoperativo o restringir funciones de seguridad." },
        en: { title: "CAN Bus communication error", description: "Main ECU loses communication with one or more J1939 CAN network nodes. Equipment may become inoperative or restrict safety functions." },
        pt: { title: "Erro de comunicação CAN Bus", description: "A ECU principal perde comunicação com um ou mais nós da rede CAN J1939." },
      },
    },
    {
      subsystem_id: subBySlug["panel-control"],
      code: "ELE-002",
      severity: "medium",
      translations: {
        es: { title: "Falla en joystick de control de pluma", description: "El joystick de control de elevación/extensión envía señal fuera de rango (< 0,5 V o > 4,5 V). El sistema bloquea la función afectada como medida de seguridad." },
        en: { title: "Boom control joystick failure", description: "Lift/extension control joystick sends out-of-range signal (< 0.5 V or > 4.5 V). System blocks the affected function as a safety measure." },
        pt: { title: "Falha no joystick de controle de lança", description: "O joystick de controle de elevação/extensão envia sinal fora do intervalo (< 0,5 V ou > 4,5 V)." },
      },
    },
    // ── Sensores y Actuadores ──
    {
      subsystem_id: subBySlug["sensores-actuadores"],
      code: "ELE-010",
      severity: "medium",
      translations: {
        es: { title: "Sensor de presión hidráulica fuera de rango", description: "El sensor de presión del circuito principal reporta valores fuera del rango operativo (0-400 bar). La ECU usa valor de sustitución y activa alarma." },
        en: { title: "Hydraulic pressure sensor out of range", description: "Main circuit pressure sensor reports values outside operating range (0-400 bar). ECU uses substitute value and activates alarm." },
        pt: { title: "Sensor de pressão hidráulica fora do intervalo", description: "O sensor de pressão do circuito principal reporta valores fora do intervalo operacional (0-400 bar)." },
      },
    },
    {
      subsystem_id: subBySlug["sensores-actuadores"],
      code: "ELE-011",
      severity: "high",
      translations: {
        es: { title: "Falla en sensor de ángulo de pluma", description: "El sensor de ángulo de pluma (potenciómetro o encoder) reporta señal errónea. El sistema de limitación de carga (SLI) no puede calcular el radio de trabajo y bloquea el equipo." },
        en: { title: "Boom angle sensor failure", description: "Boom angle sensor (potentiometer or encoder) reports erroneous signal. Load limit system (SLI) cannot calculate working radius and locks the equipment." },
        pt: { title: "Falha no sensor de ângulo de lança", description: "O sensor de ângulo de lança (potenciômetro ou encoder) reporta sinal errôneo. O sistema SLI não consegue calcular o raio de trabalho e trava o equipamento." },
      },
    },
    // ── Caja de Cambios ──
    {
      subsystem_id: subBySlug["caja-cambios"],
      code: "TRX-001",
      severity: "critical",
      translations: {
        es: { title: "Temperatura de transmisión elevada", description: "La temperatura del aceite de transmisión supera los 120 °C. El sistema activa protección térmica reduciendo la potencia. Riesgo de daño irreversible a embragues y sellos." },
        en: { title: "High transmission temperature", description: "Transmission oil temperature exceeds 120 °C. System activates thermal protection reducing power. Risk of irreversible damage to clutches and seals." },
        pt: { title: "Temperatura de transmissão elevada", description: "A temperatura do óleo de transmissão ultrapassa 120 °C. O sistema ativa proteção térmica reduzindo a potência." },
      },
    },
    {
      subsystem_id: subBySlug["caja-cambios"],
      code: "TRX-002",
      severity: "high",
      translations: {
        es: { title: "Falla en selección de marcha", description: "La transmisión no responde al comando de cambio de marcha o queda bloqueada en neutro. Puede deberse a solenoide de cambio defectuoso o presión de embrague insuficiente." },
        en: { title: "Gear selection failure", description: "Transmission does not respond to gear change command or stays locked in neutral. May be caused by faulty shift solenoid or insufficient clutch pressure." },
        pt: { title: "Falha na seleção de marcha", description: "A transmissão não responde ao comando de troca de marcha ou fica bloqueada em neutro." },
      },
    },
    // ── Convertidor de Par ──
    {
      subsystem_id: subBySlug["convertidor-par"],
      code: "TRX-010",
      severity: "medium",
      translations: {
        es: { title: "Falla en embrague lock-up del convertidor", description: "El embrague de bloqueo del convertidor de par no se activa en las condiciones de velocidad requeridas. Aumenta el consumo de combustible y reduce eficiencia de transmisión." },
        en: { title: "Torque converter lock-up clutch failure", description: "Converter lock-up clutch does not engage at required speed conditions. Increases fuel consumption and reduces transmission efficiency." },
        pt: { title: "Falha na embreagem lock-up do conversor", description: "A embreagem de bloqueio do conversor de torque não se engaja nas condições de velocidade requeridas." },
      },
    },
  ]);

  const ec = {};
  for (const e of ecData) ec[e.code] = e.id;

  // ══════════════════════════════════════════════════════════════════════════
  // 5. DIAGNOSTIC STEPS
  // ══════════════════════════════════════════════════════════════════════════
  console.log("\n— Diagnostic steps");
  await insert("diagnostic_steps", [
    // HYD-001 — Baja presión bomba
    {
      error_code_id: ec["HYD-001"],
      step_order: 1,
      content_json: tiptap(
        h2("Verificar nivel de aceite hidráulico"),
        p("Con el equipo en reposo y pluma en posición de transporte, verificar el nivel de aceite en el visor del depósito hidráulico."),
        ul(
          "Nivel mínimo aceptable: marca MIN del visor",
          "Si el nivel es bajo, identificar fuga antes de agregar aceite",
          "Usar aceite ISO VG 46 o según especificación del fabricante"
        )
      ),
    },
    {
      error_code_id: ec["HYD-001"],
      step_order: 2,
      content_json: tiptap(
        h2("Medir presión en punto de test P1"),
        p("Conectar el manómetro de prueba (0-400 bar) en el punto de toma de presión P1 del bloque de válvulas."),
        ol(
          "Instalar adaptador del kit HYD-TEST-KIT en punto P1",
          "Arrancar el motor al ralentí (800 rpm)",
          "Activar función de elevación con carga nominal",
          "Registrar presión de alivio (debe ser 310 ± 5 bar)"
        ),
        p(bold("Valor esperado:"), " 300–320 bar en carga nominal.")
      ),
    },
    {
      error_code_id: ec["HYD-001"],
      step_order: 3,
      content_json: tiptap(
        h2("Verificar regulación de caudal de bomba"),
        p("Si la presión en P1 es correcta pero la velocidad de elevación es baja, el problema puede estar en la regulación del caudal variable de la bomba."),
        ul(
          "Conectar el scanner DIAG-KAL-01 y revisar el parámetro 'Pump displacement %'",
          "Valor esperado en carga máxima: 90–100 % de desplazamiento",
          "Si el desplazamiento es bajo, revisar la señal de corriente al regulador de caudal (4–20 mA)"
        )
      ),
    },
    // HYD-002 — Sobrecalentamiento
    {
      error_code_id: ec["HYD-002"],
      step_order: 1,
      content_json: tiptap(
        h2("Medir temperatura real del aceite"),
        p("Verificar con termómetro infrarrojo la temperatura superficial del depósito hidráulico y del intercambiador de calor (radiador hidráulico)."),
        ul(
          "Temperatura normal de trabajo: 60–80 °C",
          "Temperatura de alarma: > 90 °C",
          "Temperatura de parada: > 95 °C"
        )
      ),
    },
    {
      error_code_id: ec["HYD-002"],
      step_order: 2,
      content_json: tiptap(
        h2("Inspeccionar radiador hidráulico"),
        p("Revisar el intercambiador de calor (radiador de aceite hidráulico) por obstrucciones, suciedad o daño en aletas."),
        ol(
          "Apagar el equipo y esperar 5 minutos",
          "Inspeccionar visualmente el radiador hidráulico por obstrucción de aletas",
          "Si está sucio, limpiar con aire comprimido (máx. 3 bar) de adentro hacia afuera",
          "Verificar que el ventilador del radiador gire libremente y a la velocidad correcta"
        )
      ),
    },
    // ELE-001 — CAN Bus
    {
      error_code_id: ec["ELE-001"],
      step_order: 1,
      content_json: tiptap(
        h2("Leer códigos de falla con scanner"),
        p("Conectar el scanner de diagnóstico DIAG-KAL-01 al conector de diagnóstico (OBD / Deutsch 9-pin) ubicado en la cabina del operador."),
        ol(
          "Encender llave sin arrancar el motor",
          "Conectar DIAG-KAL-01 al puerto de diagnóstico",
          "Navegar a: Diagnóstico → CAN Bus → Nodos activos",
          "Registrar qué nodos NO aparecen en la lista (comparar con el manual de configuración del equipo)"
        )
      ),
    },
    {
      error_code_id: ec["ELE-001"],
      step_order: 2,
      content_json: tiptap(
        h2("Verificar resistencias de terminación CAN"),
        p("La red CAN debe tener exactamente ", bold("dos resistencias de terminación de 120 Ω"), " (una en cada extremo del bus)."),
        ol(
          "Apagar el equipo (llave en OFF, esperar 30 seg)",
          "Desconectar el conector del nodo sospechoso",
          "Medir resistencia entre pines CAN-H y CAN-L en el conector del arnés",
          "Valor esperado con ambas terminaciones: ~60 Ω (paralelo de dos 120 Ω)",
          "Si mide 120 Ω: falta una terminación. Si mide > 130 Ω: circuito abierto en el bus"
        )
      ),
    },
    // ELE-011 — Sensor ángulo de pluma
    {
      error_code_id: ec["ELE-011"],
      step_order: 1,
      content_json: tiptap(
        h2("Verificar alimentación del sensor"),
        p("El sensor de ángulo (tipo potenciómetro o encoder absoluto) requiere alimentación de 5 V DC ± 0,1 V."),
        ol(
          "Localizar el conector del sensor de ángulo en la articulación principal de la pluma",
          "Con el multímetro Fluke 87V, medir entre pines VCC y GND del conector del sensor",
          "Valor esperado: 5,0 V ± 0,1 V",
          "Si la tensión está fuera de rango, trazar el arnés hacia la ECU para localizar corte o cortocircuito"
        )
      ),
    },
    {
      error_code_id: ec["ELE-011"],
      step_order: 2,
      content_json: tiptap(
        h2("Verificar señal de salida del sensor"),
        p("Con el equipo encendido y sensor alimentado correctamente, medir la señal de salida mientras se mueve manualmente la pluma (si es posible en mantenimiento sin carga)."),
        ul(
          "Tipo potenciómetro: señal debe variar linealmente de 0,5 V (0°) a 4,5 V (máx. ángulo)",
          "Tipo encoder: verificar señal PWM con frecuencia y duty cycle en rango especificado",
          "Verificar que no haya saltos bruscos de señal (indica pista desgastada en potenciómetro)"
        )
      ),
    },
    // TRX-001 — Temperatura transmisión
    {
      error_code_id: ec["TRX-001"],
      step_order: 1,
      content_json: tiptap(
        h2("Verificar nivel de aceite de transmisión"),
        p("Con el equipo en ralentí y temperatura normal de trabajo, verificar el nivel del aceite de transmisión en el visor o varilla de medición."),
        ul(
          "Nivel debe estar entre MIN y MAX con temperatura de 80 °C",
          "Aceite bajo puede causar cavitación y sobrecalentamiento",
          "Si hay consumo anormal de aceite, buscar fugas en sellos de ejes y tapas"
        )
      ),
    },
    {
      error_code_id: ec["TRX-001"],
      step_order: 2,
      content_json: tiptap(
        h2("Inspeccionar radiador de transmisión"),
        p("El aceite de transmisión se enfría en un intercambiador dedicado, diferente al radiador hidráulico."),
        ol(
          "Localizar el intercambiador de calor de transmisión (generalmente junto al radiador del motor)",
          "Verificar que no haya obstrucciones en las aletas",
          "Verificar caudal de refrigerante en el intercambiador (si es agua-aceite)",
          "Comprobar que las mangueras de conexión no estén colapsadas"
        )
      ),
    },
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // 6. REPAIR STEPS
  // ══════════════════════════════════════════════════════════════════════════
  console.log("\n— Repair steps");
  await insert("repair_steps", [
    // HYD-001 — Baja presión
    {
      error_code_id: ec["HYD-001"],
      step_order: 1,
      content_json: tiptap(
        h2("Ajustar válvula de alivio principal"),
        p("Si la presión de alivio medida es inferior a 305 bar, ajustar la válvula de alivio principal del bloque de válvulas."),
        ol(
          "Aflojar la contratuerca de la válvula de alivio principal (llave 22 mm)",
          "Girar el tornillo de ajuste en sentido horario para aumentar la presión (¼ vuelta ≈ 15 bar aprox.)",
          "Verificar presión nuevamente con el manómetro en P1",
          "Repetir hasta alcanzar 310 ± 5 bar",
          "Apretar la contratuerca al torque especificado (35 Nm)"
        ),
        p(bold("Nota:"), " No superar 320 bar para no dañar mangueras y sellos del sistema.")
      ),
    },
    {
      error_code_id: ec["HYD-001"],
      step_order: 2,
      content_json: tiptap(
        h2("Reemplazar bomba hidráulica (si no responde al ajuste)"),
        p("Si la presión no alcanza el valor especificado tras el ajuste de la válvula de alivio, la bomba tiene desgaste interno excesivo."),
        ol(
          "Despresurizar el sistema: motor apagado, operar joysticks varias veces",
          "Drenar aceite del circuito o usar tapones magnéticos en las líneas",
          "Desconectar líneas de alta presión (P y T) y la línea de carga sensible (LS)",
          "Desmontar la bomba del motor (4 tornillos M16, torque 195 Nm al montar)",
          "Instalar bomba nueva cebada con aceite limpio",
          "Purgar el circuito antes de poner en carga"
        )
      ),
    },
    // HYD-002 — Sobrecalentamiento
    {
      error_code_id: ec["HYD-002"],
      step_order: 1,
      content_json: tiptap(
        h2("Limpiar radiador hidráulico"),
        p("Si el radiador está obstruido con polvo, pelusa o residuos del ambiente portuario:"),
        ol(
          "Apagar el equipo y bloquear por LOTO (candado en llave + tarjeta)",
          "Aplicar aire comprimido (máx. 3 bar) desde el lado interior del radiador hacia afuera",
          "Para suciedad grasa, usar desengrasante industrial, dejar actuar 5 min y enjuagar con agua a presión moderada",
          "Secar antes de arrancar",
          "Verificar temperatura en operación normal tras la limpieza"
        )
      ),
    },
    // ELE-001 — CAN Bus
    {
      error_code_id: ec["ELE-001"],
      step_order: 1,
      content_json: tiptap(
        h2("Reparar arnés o conector del nodo defectuoso"),
        p("Una vez identificado el nodo con falla de comunicación:"),
        ol(
          "Inspeccionar el conector Deutsch del nodo: pines doblados, corrosión o humedad",
          "Limpiar con spray limpia-contactos y aire comprimido",
          "Si hay pin dañado, extraer con herramienta de extracción de pines y reemplazar",
          "Verificar continuidad del arnés CAN-H y CAN-L entre el nodo y el conector de derivación más cercano",
          "Reemplazar tramo de arnés si hay corte o cortocircuito confirmado"
        )
      ),
    },
    // TRX-001 — Temperatura transmisión
    {
      error_code_id: ec["TRX-001"],
      step_order: 1,
      content_json: tiptap(
        h2("Cambio de aceite de transmisión"),
        p("Si el aceite está degradado (oscuro, olor a quemado o con partículas metálicas en el imán del tapón de drenaje):"),
        ol(
          "Calentar el equipo a temperatura de trabajo (80 °C) para facilitar el drenaje",
          "Colocar bandeja de recolección bajo el tapón de drenaje",
          "Drenar el aceite completamente (aprox. 25–30 L según modelo)",
          "Limpiar el filtro de succión interno y reemplazar el filtro de retorno",
          "Rellenar con aceite nuevo según especificación (Allison TES-295 o equivalente)",
          "Verificar nivel en caliente y comprobar temperatura en operación"
        ),
        p(bold("Cantidad aproximada:"), " 28 L (verificar siempre en el manual de servicio del modelo específico).")
      ),
    },
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // 7. HAZARDS
  // ══════════════════════════════════════════════════════════════════════════
  console.log("\n— Hazards");
  await insert("hazards", [
    // HYD-001
    {
      error_code_id: ec["HYD-001"],
      severity: "caution",
      icon: "pressure",
      display_order: 1,
      translations: {
        es: { title: "Alta presión hidráulica", description: "El circuito opera a 310 bar. Nunca aflojar conexiones con el sistema en presión. Despresurizar completamente antes de intervenir." },
        en: { title: "High hydraulic pressure", description: "Circuit operates at 310 bar. Never loosen connections under pressure. Fully depressurize before intervention." },
        pt: { title: "Alta pressão hidráulica", description: "O circuito opera a 310 bar. Nunca afrouxar conexões com o sistema pressurizado. Despressurize completamente antes de intervir." },
      },
    },
    // HYD-002
    {
      error_code_id: ec["HYD-002"],
      severity: "danger",
      icon: "burn",
      display_order: 1,
      translations: {
        es: { title: "Riesgo de quemadura por aceite caliente", description: "El aceite hidráulico puede estar a más de 90 °C. Usar guantes resistentes al calor y gafas de protección al manipular conexiones del circuito." },
        en: { title: "Hot oil burn risk", description: "Hydraulic oil may be above 90 °C. Use heat-resistant gloves and safety glasses when handling circuit connections." },
        pt: { title: "Risco de queimadura por óleo quente", description: "O óleo hidráulico pode estar acima de 90 °C. Use luvas resistentes ao calor e óculos de proteção." },
      },
    },
    {
      error_code_id: ec["HYD-002"],
      severity: "warning",
      icon: "pressure",
      display_order: 2,
      translations: {
        es: { title: "Presión residual", description: "Aunque el equipo esté apagado puede quedar presión residual en los acumuladores. Operar joysticks varias veces tras apagar para liberar presión." },
        en: { title: "Residual pressure", description: "Even with equipment off, residual pressure may remain in accumulators. Operate joysticks several times after shutdown to release pressure." },
        pt: { title: "Pressão residual", description: "Mesmo com o equipamento desligado, pode haver pressão residual nos acumuladores. Opere os joysticks várias vezes após desligar para liberar pressão." },
      },
    },
    // HYD-011
    {
      error_code_id: ec["HYD-011"],
      severity: "danger",
      icon: "pressure",
      display_order: 1,
      translations: {
        es: { title: "Inyección de fluido a presión", description: "Una fuga de aceite hidráulico a alta presión puede penetrar la piel causando lesiones graves. Detectar fugas con cartón o papel, nunca con la mano desnuda." },
        en: { title: "High-pressure fluid injection", description: "A high-pressure hydraulic oil leak can penetrate skin causing serious injury. Detect leaks with cardboard or paper, never with bare hands." },
        pt: { title: "Injeção de fluido sob pressão", description: "Um vazamento de óleo hidráulico a alta pressão pode penetrar na pele causando lesões graves. Detecte vazamentos com papelão ou papel, nunca com as mãos desprotegidas." },
      },
    },
    // ELE-001
    {
      error_code_id: ec["ELE-001"],
      severity: "warning",
      icon: "electric",
      display_order: 1,
      translations: {
        es: { title: "Tensión en arnés eléctrico", description: "El arnés CAN Bus puede estar alimentado con 24 V DC. Usar multímetro antes de tocar conectores." },
        en: { title: "Electrical harness voltage", description: "CAN Bus harness may carry 24 V DC. Use multimeter before touching connectors." },
        pt: { title: "Tensão no arnês elétrico", description: "O arnês CAN Bus pode estar alimentado com 24 V DC. Use multímetro antes de tocar nos conectores." },
      },
    },
    // ELE-011
    {
      error_code_id: ec["ELE-011"],
      severity: "caution",
      icon: "crush",
      display_order: 1,
      translations: {
        es: { title: "Riesgo de aplastamiento en articulación de pluma", description: "Al verificar el sensor de ángulo, la pluma puede moverse inesperadamente. Asegurar zona de trabajo con topes mecánicos y personal alejado del radio de acción." },
        en: { title: "Boom joint crush risk", description: "When checking the angle sensor, the boom may move unexpectedly. Secure work area with mechanical stops and keep personnel away from swing radius." },
        pt: { title: "Risco de esmagamento na articulação da lança", description: "Ao verificar o sensor de ângulo, a lança pode se mover inesperadamente. Garanta a zona de trabalho com batentes mecânicos." },
      },
    },
    // TRX-001
    {
      error_code_id: ec["TRX-001"],
      severity: "danger",
      icon: "burn",
      display_order: 1,
      translations: {
        es: { title: "Aceite de transmisión a alta temperatura", description: "El aceite de transmisión puede superar los 120 °C durante el fallo. Esperar al menos 30 minutos tras apagar el equipo antes de intervenir en la transmisión." },
        en: { title: "High temperature transmission oil", description: "Transmission oil may exceed 120 °C during the fault. Wait at least 30 minutes after shutdown before working on the transmission." },
        pt: { title: "Óleo de transmissão em alta temperatura", description: "O óleo de transmissão pode ultrapassar 120 °C durante a falha. Aguarde pelo menos 30 minutos após desligar o equipamento antes de intervir na transmissão." },
      },
    },
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // 8. ERROR_CODE_TOOLS (asociar herramientas a errores)
  // ══════════════════════════════════════════════════════════════════════════
  console.log("\n— Error code tools");
  await insert("error_code_tools", [
    // HYD-001
    { error_code_id: ec["HYD-001"], tool_id: tools["HT-400BAR"], quantity: 1, notes: "Conectar en punto de test P1 del bloque de válvulas" },
    { error_code_id: ec["HYD-001"], tool_id: tools["HYD-TEST-KIT"], quantity: 1, notes: "Adaptadores de ¼\" BSP para puntos de test del fabricante" },
    { error_code_id: ec["HYD-001"], tool_id: tools["DIAG-KAL-01"], quantity: 1, notes: "Para leer parámetro 'Pump displacement %'" },
    // HYD-002
    { error_code_id: ec["HYD-002"], tool_id: tools["THERMO-IR-300"], quantity: 1, notes: "Medir temperatura del depósito y radiador hidráulico" },
    { error_code_id: ec["HYD-002"], tool_id: tools["DIAG-KAL-01"], quantity: 1, notes: "Verificar lectura de sensor de temperatura del aceite" },
    // HYD-010
    { error_code_id: ec["HYD-010"], tool_id: tools["HT-400BAR"], quantity: 1, notes: "Verificar presión de carga de válvulas de retención" },
    // ELE-001
    { error_code_id: ec["ELE-001"], tool_id: tools["DIAG-KAL-01"], quantity: 1, notes: "Leer nodos CAN activos e inactivos" },
    { error_code_id: ec["ELE-001"], tool_id: tools["FLUKE-87V"], quantity: 1, notes: "Medir resistencia de terminación y continuidad de bus" },
    { error_code_id: ec["ELE-001"], tool_id: tools["CANT-BUS-ADP"], quantity: 1, notes: "Monitoreo en tiempo real de tráfico CAN J1939" },
    // ELE-002
    { error_code_id: ec["ELE-002"], tool_id: tools["FLUKE-87V"], quantity: 1, notes: "Medir señal de salida del joystick (0,5–4,5 V DC)" },
    { error_code_id: ec["ELE-002"], tool_id: tools["DIAG-KAL-01"], quantity: 1, notes: "Leer valor crudo del joystick en parámetros de la ECU" },
    // ELE-010
    { error_code_id: ec["ELE-010"], tool_id: tools["FLUKE-87V"], quantity: 1, notes: "Verificar alimentación de 5 V y señal 4–20 mA del sensor" },
    { error_code_id: ec["ELE-010"], tool_id: tools["HT-400BAR"], quantity: 1, notes: "Comparar presión real vs. lectura del sensor" },
    // ELE-011
    { error_code_id: ec["ELE-011"], tool_id: tools["FLUKE-87V"], quantity: 1, notes: "Verificar señal analógica 0,5–4,5 V del potenciómetro de ángulo" },
    { error_code_id: ec["ELE-011"], tool_id: tools["DIAG-KAL-01"], quantity: 1, notes: "Monitorear ángulo de pluma en tiempo real desde la ECU" },
    // TRX-001
    { error_code_id: ec["TRX-001"], tool_id: tools["THERMO-IR-300"], quantity: 1, notes: "Medir temperatura superficial del cárter de transmisión y radiador" },
    { error_code_id: ec["TRX-001"], tool_id: tools["DIAG-KAL-01"], quantity: 1, notes: "Leer temperatura interna de transmisión desde ECU" },
    // TRX-002
    { error_code_id: ec["TRX-002"], tool_id: tools["DIAG-KAL-01"], quantity: 1, notes: "Leer presión de clutch y solenoide de marcha en ECU" },
    { error_code_id: ec["TRX-002"], tool_id: tools["HT-400BAR"], quantity: 1, notes: "Medir presión de embrague en punto de test de transmisión" },
    // TRX-010
    { error_code_id: ec["TRX-010"], tool_id: tools["DIAG-KAL-01"], quantity: 1, notes: "Verificar parámetro 'Lock-up clutch status' en tiempo real" },
    { error_code_id: ec["TRX-010"], tool_id: tools["FLUKE-87V"], quantity: 1, notes: "Medir resistencia del solenoide de lock-up (12–15 Ω típico)" },
  ]);

  console.log("\n✅ Seed completado exitosamente.");
  console.log("\nResumen:");
  console.log("  • 3 sistemas (hidráulico, eléctrico, transmisión)");
  console.log("  • 7 subsistemas");
  console.log("  • 11 códigos de error (HYD-001/002/010/011/020, ELE-001/002/010/011, TRX-001/002/010)");
  console.log("  • 6 herramientas de diagnóstico");
  console.log("  • Pasos de diagnóstico, reparación, peligros y herramientas asociadas");
  console.log("  • Ningún sistema asignado a máquina aún\n");
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
});

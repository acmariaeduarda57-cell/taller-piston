/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  // 1. Colección de Clientes
  const clientes = new Collection({
    type: "base", name: "clientes",
    fields: [
      { name: "nombre", type: "text", required: true },
      { name: "telefono", type: "text", required: true },
      { name: "direccion", type: "text" },
    ],
    listRule: "", viewRule: "", createRule: "", updateRule: "", deleteRule: ""
  });
  app.save(clientes);

  // 2. Colección de Vehículos
  const vehiculos = new Collection({
    type: "base", name: "vehiculos",
    fields: [
      { name: "matricula", type: "text", required: true },
      { name: "marca", type: "text", required: true },
      { name: "modelo", type: "text" },
      { name: "anio", type: "number" },
      { name: "kilometraje", type: "number" },
      { name: "cliente", type: "relation", required: true, collectionId: clientes.id, maxSelect: 1, cascadeDelete: true },
    ],
    listRule: "", viewRule: "", createRule: "", updateRule: "", deleteRule: ""
  });
  app.save(vehiculos);

  // 3. Colección de Repuestos
  const repuestos = new Collection({
    type: "base", name: "repuestos",
    fields: [
      { name: "nombre", type: "text", required: true },
      { name: "codigo", type: "text", required: true },
      { name: "precio_venta", type: "number", required: true },
      { name: "existencias", type: "number", required: true },
    ],
    listRule: "", viewRule: "", createRule: "", updateRule: "", deleteRule: ""
  });
  app.save(repuestos);

  // 4. Colección de Órdenes
  const ordenes = new Collection({
    type: "base", name: "ordenes",
    fields: [
      { name: "problema", type: "text", required: true },
      { name: "estado", type: "select", values: ["recibida", "en diagnóstico", "en reparación", "lista para entregar", "entregada", "cancelada"], maxSelect: 1 },
      { name: "fecha_entrada", type: "date" },
      { name: "vehiculo", type: "relation", required: true, collectionId: vehiculos.id, maxSelect: 1, cascadeDelete: true },
      // Usamos la colección _superusers que ya existe para asignar mecánicos
      { name: "mecanico", type: "text" },
    ],
    listRule: "", viewRule: "", createRule: "", updateRule: "", deleteRule: ""
  });
  app.save(ordenes);

  // 5. Colección de Trabajos (Mano de obra)
  const trabajos = new Collection({
    type: "base", name: "trabajos",
    fields: [
      { name: "descripcion", type: "text", required: true },
      { name: "precio", type: "number", required: true },
      { name: "orden", type: "relation", required: true, collectionId: ordenes.id, maxSelect: 1, cascadeDelete: true },
    ],
    listRule: "", viewRule: "", createRule: "", updateRule: "", deleteRule: ""
  });
  app.save(trabajos);

  // 6. Colección de Repuestos Usados
  const repuestosUsados = new Collection({
    type: "base", name: "repuestos_usados",
    fields: [
      { name: "cantidad", type: "number", required: true },
      { name: "orden", type: "relation", required: true, collectionId: ordenes.id, maxSelect: 1, cascadeDelete: true },
      { name: "repuesto", type: "relation", required: true, collectionId: repuestos.id, maxSelect: 1, cascadeDelete: true },
    ],
    listRule: "", viewRule: "", createRule: "", updateRule: "", deleteRule: ""
  });
  app.save(repuestosUsados);

  // 7. Colección de Pagos
  const pagos = new Collection({
    type: "base", name: "pagos",
    fields: [
      { name: "monto", type: "number", required: true },
      { name: "fecha", type: "date" },
      { name: "orden", type: "relation", required: true, collectionId: ordenes.id, maxSelect: 1, cascadeDelete: true },
    ],
    listRule: "", viewRule: "", createRule: "", updateRule: "", deleteRule: ""
  });
  app.save(pagos);

}, (app) => {
  // Si algo falla, se borran en orden inverso
  app.delete(app.findCollectionByNameOrId("pagos"));
  app.delete(app.findCollectionByNameOrId("repuestos_usados"));
  app.delete(app.findCollectionByNameOrId("trabajos"));
  app.delete(app.findCollectionByNameOrId("ordenes"));
  app.delete(app.findCollectionByNameOrId("repuestos"));
  app.delete(app.findCollectionByNameOrId("vehiculos"));
  app.delete(app.findCollectionByNameOrId("clientes"));
})
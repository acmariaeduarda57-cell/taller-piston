/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const colecciones = ["clientes", "vehiculos", "ordenes", "repuestos", "trabajos", "repuestos_usados", "pagos"];
  
  for (const nombre of colecciones) {
    const col = app.findCollectionByNameOrId(nombre);
    col.listRule = "";
    col.viewRule = "";
    col.createRule = "";
    col.updateRule = "";
    col.deleteRule = "";
    app.save(col);
  }
}, (app) => {
  // No hace falta revertir nada
});
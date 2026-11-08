// Hook: Restar existencias cuando se registra un repuesto usado en una orden
onRecordCreateRequest((e) => {
  const cantidadUsada = e.record.getInt("cantidad");
  const idRepuesto = e.record.getString("repuesto");

  // Buscar el repuesto en la base de datos
  const repuesto = $app.findRecordById("repuestos", idRepuesto);
  const existenciasActuales = repuesto.getInt("existencias");

  if (existenciasActuales < cantidadUsada) {
    throw new BadRequestError("No hay suficientes existencias de este repuesto.");
  }

  // Restar las existencias y guardar
  repuesto.set("existencias", existenciasActuales - cantidadUsada);
  $app.save(repuesto);

  e.next(); // Continuar con el guardado normal del repuesto usado
}, "repuestos_usados");
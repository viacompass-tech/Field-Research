# Modelo de datos

## Jerarquía

```
equipo → entidad → visita → captura (una por módulo)
                          → fotos
                          → items (procesos, herramientas, intenciones, flujos…)
                          → estado_negocio (nueve dimensiones)

entidad → documentos (desk research)
        → hipótesis (del escritorio o nacidas en campo)
```

## Por qué la entidad y la visita están separadas

Un mismo negocio se visita varias veces: levantamiento, intervención, medición posterior.
La entidad guarda lo que no cambia y sus documentos; la visita guarda lo que se observó ese
día. Los veredictos de las hipótesis se acumulan en la entidad, con referencia a la visita
que los produjo.

## Por qué `capturas.datos` es jsonb

Los campos de cada módulo están definidos en `modulos-campo.json` y van a seguir
cambiando: el instrumento se corrige con cada salida a campo. Una columna por campo
obligaría a migrar la base cada vez que se agrega un contador.

Lo que sí es tabla propia es lo que se consulta entre visitas: `items`, estado del negocio,
hipótesis. Ahí el índice importa.

## Nueve dimensiones del estado del negocio

`auto` autonomía operativa · `caja` separación de cajas · `legib` legibilidad financiera ·
`demanda` continuidad de demanda · `conc` concentración de riesgo · `colchon` colchón de
operación · `capital` acceso a capital · `adapta` capacidad de adaptación · `exposicion`
exposición asumida.

Escala 0–4 con anclajes conductuales en `taxonomias.json`. Es un instrumento v0
hipotético: son la apuesta del equipo sobre qué predice supervivencia, no un modelo
validado. El promedio que se muestre debe decir que no tiene ponderación validada.

Guardar siempre la evidencia junto al valor. Una puntuación sin cita es una opinión.

## Origen del dato

Todo item lleva `origen`: `ia` o `persona`. No es metadato decorativo — es lo que permite
después preguntar cuánto del corpus lo escribió alguien que estuvo ahí.

# Reglas de interacción

Cada una salió de un problema real del prototipo. El número entre paréntesis es cuántas
iteraciones costó llegar ahí.

## Scroll y foco (4)

Toda interacción dentro de un módulo conserva scroll, foco y posición del cursor. El salto
al inicio solo ocurre al cambiar de pantalla.

El prototipo repintaba el módulo entero en cada cambio y terminaba con `scrollTo(0,0)`.
Tocabas un contador y volvías arriba. En React esto se evita solo si el estado de cada campo
es local al componente; si sube al padre en cada tecla, vuelve el problema.

## Densidad y alcance del pulgar (3)

Objetivos táctiles de 44px mínimo. Contadores de 60px, con el número a 38 puntos: se usan
parado en la calle sin mirar. Inputs a 16px para que iOS no haga zoom al enfocar.

Cabecera del módulo y encabezados de banda pegajosos: siempre sabes dónde estás.

## Progresión visible (2)

En el índice, cada módulo muestra su progreso y en naranja lo que falta: no negociables
pendientes, hipótesis por validar. De un vistazo, sin entrar.

Dentro del módulo, barra inferior con anterior · posición · siguiente. Solo dentro del
módulo: en las listas es ruido.

## Destructivo (2)

Nada se borra a un toque. Confirmación explícita que dice qué se pierde y cuánto pesa,
más deshacer durante nueve segundos. Para documentos grandes, escribir `QUITAR`.

## Escritura (3)

El cuadro de captura es lo primero y lo más grande. Contador de caracteres en vivo.
Dictado por voz donde el navegador lo permita.

Nunca se pide una cifra que se puede derivar. Se cuenta o se cronometra.

## La IA no interrumpe (3)

Su botón va al final de la captura, nunca arriba. Sus campos no existen en pantalla hasta
que produce algo. Lo que devuelve queda marcado como borrador y jamás pisa lo escrito por
una persona.

Cuando falla, muestra el error real, no "algo salió mal".

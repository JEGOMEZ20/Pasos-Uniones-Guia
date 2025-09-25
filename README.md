# Pasos de verificación

1. Abrir `index.html` en el navegador. Desde la tarjeta del asesor, pulsar **Explorar asesor** y comprobar que `asesor-grip-type.html` se carga y muestra la interfaz.
2. Con las DevTools abiertas, revisar la pestaña **Network** y confirmar que `asesor-grip-type.html` responde `200` al navegar desde la portada. Verificar en **Console** que no aparezcan errores (incluido CSP) ni mensajes de React indefinido.
3. Probar ambas variantes directamente con rutas relativas:
   - `./asesor-grip-type.html` (versión con Babel).
   - `./asesor-grip-type-nobabel.html` (versión sin Babel, apta para CSP estricta).
4. Si algún CDN estuviera bloqueado (ad blocker/empresa), deshabilitar el bloqueo y recargar.
5. En despliegues bajo subrutas (por ejemplo GitHub Pages), mantener las rutas relativas (`./archivo.html`) para garantizar la navegación correcta.

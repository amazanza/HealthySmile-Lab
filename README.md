
# HealthyLab — Cepillado mágico de Halloween

## Descripción

HealthyLab es una aplicación interactiva de escritorio desarrollada con JavaScript, p5.js y Electron.

La aplicación utiliza la cámara del ordenador y una biblioteca de reconocimiento facial para detectar la apertura de la boca y activar una experiencia de cepillado dental virtual con partículas y animaciones de temática Halloween.

## Requisitos para ejecutar la aplicación

- Ordenador con Windows.
- Node.js y npm instalados.
- Cámara web operativa.
- Permisos de acceso a la cámara.

## Instalación y ejecución

1. Descomprimir el archivo ZIP del proyecto.
2. Abrir una terminal en la carpeta Desktop App.
3. Instalar las dependencias:

   npm install

4. Iniciar la aplicación:

   npm start

## Funcionamiento

La aplicación se abre en pantalla completa y modo kiosco.

El usuario inicia la experiencia y permite el acceso a la cámara. Al abrir la boca, se activa el cepillado virtual mediante efectos gráficos sobre la imagen en directo.

La interfaz incorpora indicaciones visuales, un temporizador y mensajes que acompañan la interacción.

## Cerrar la aplicación

En Windows, pulsar Alt + F4.

## Observaciones

Si hay varias cámaras conectadas, puede ser necesario desconectar las cámaras virtuales para que la aplicación utilice la cámara integrada del ordenador.

## Tecnologías

- HTML y CSS.
- JavaScript.
- p5.js.
- Biblioteca externa de reconocimiento facial.
- Electron 45.1.0.

## Autoría

Amaya Muñoz Azanza

Grado en Multimedia — Universitat Oberta de Catalunya.

Asignatura: Desarrollo de aplicaciones interactivas.

PR2 — Desktop App: Interacción cámara.

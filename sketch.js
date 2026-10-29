
/*
------------------------------------------------------------
PR2. Desktop App — Interacción cámara
Reconocimiento facial y cepillado de dientes con temática
de Halloween.
------------------------------------------------------------

HealthySmile Lab es una aplicación interactiva que utiliza el acceso a
la cámara y el reconocimiento facial para detectar la apertura
de la boca. Al abrirla, se anima un cepillo de dientes,
aparecen partículas que simulan el cepillado y se reproducen efectos de sonido.

El tiempo de cepillado se acumula hasta alcanzar el objetivo que es 2 minutos.
Por cuestiones prácticas, para esta prueba, va a ser de 20 segundos.
Entonces se cierra la cámara y aparece una pantalla de
victoria. Desde allí se puede bien reiniciar la experiencia
o consultar los créditos.

Tecnologías: JavaScript, p5.js, MediaPipe, HTML y CSS.
*/


// ------------------------------------------------------------
// VARIABLES GLOBALES
// ------------------------------------------------------------

// Cámara, detector facial y estado del reconocimiento.
let video;
let detectorFacial;
let resultadoFacial;
let detectorPreparado = false;
let errorDetector = false;
let ultimoTiempoVideo = -1;
let mensaje = "Preparando reconocimiento facial...";

// Apertura y posición de la boca.
let aperturaBoca = 0;
let umbralBoca = 0.15;
let bocaX = 0;
let bocaY = 0;
let bocaAncho = 0;
let bocaDetectada = false;

// Imágenes de los cepillos y elementos de Halloween.
let imagenesCepillos = [];
let imagenesCepillosHTML = [];
let indiceCepillo = 0;
let imagenesHalloween = [];
let siguienteFiguraHalloween = 0;

// Pantalla de victoria y movimiento del cepillo.
let imagenVictoria;
let victoriaActiva = false;
let faseCepillado = 0;
let desplazamientoCepillo = 0;
let desplazamientoVertical = 0;

// Tiempo de cepillado y generación de las partículas.
let tiempoCepillado = 0;
let objetivoCepillado = 20; // Valor provisional. El definitivo será 120.
let particulas = [];
let acumuladorParticulas = 0;
let contadorParticulas = 0;

// Sonidos y control de su reproducción.
let sonidoIntro;
let sonidoSpark;
let sonidoFanfarria;
let sonidoOutro;
let estadoIntro = "pendiente";
let tiempoUltimoSonido = 0;
let intervaloSonido = 350;
let cepilladoAnterior = false;

//  Créditos y control de su movimiento.
let creditosActivos = false;
let creditosFinalizados = false;
let animacionCreditos = null;

let ultimoRegistroConsola = 0;


// ------------------------------------------------------------
// INICIALIZACIÓN DE LA APLICACIÓN
// ------------------------------------------------------------

function setup() {
  let lienzo = createCanvas(640, 480);
  lienzo.parent("zona-camara");

  // Capturamos la imagen de la cámara y ocultamos el vídeo
  // original, ya que vamos a trabajar  sobre el lienzo de p5.js
  // para incorporar el cepillo y los efectos visuales.
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  prepararImagenesHalloween();
  prepararCepillosHTML();

  imagenVictoria = document.getElementById("imagen-victoria");
  indiceCepillo = floor(random(4));

  prepararSonidos();
  prepararBotonesFinales();

  iniciarDetector();
  cargarCepillos();
  iniciarIntroduccion();
}


// ------------------------------------------------------------
// CARGA DE IMÁGENES
// ------------------------------------------------------------

// Cada imagen se carga de forma independiente. Si falla
// loadImage() (como nos ha ocurrido durante el desarrollo),
// se utiliza la imagen HTML correspondiente.

async function cargarImagenIndividual(ruta) {
  try {
    let imagen = await loadImage(ruta);

    console.log("Imagen cargada:", ruta);
    return imagen;

  } catch (error) {
    console.warn("No se pudo cargar la imagen:", ruta, error);
    return null;
  }
}

async function cargarCepillos() {
  let rutasCepillos = [
    "assets/images/Cepillo_azul.png",
    "assets/images/Cepillo_verde.png",
    "assets/images/Cepillo_rosa.png",
    "assets/images/Cepillo_amarillo.png"
  ];

  let promesas = [];

  for (let i = 0; i < rutasCepillos.length; i++) {
    promesas.push(
      cargarImagenIndividual(rutasCepillos[i])
    );
  }

  // Utilizamos Promise.all() para cargar las cuatro imágenes
  // de los cepillos. Así esperamos a que terminen todas las
  // operaciones de carga antes de guardar sus resultados.
  imagenesCepillos = await Promise.all(promesas);
}

function prepararCepillosHTML() {
  imagenesCepillosHTML[0] =
    document.getElementById("cepillo-html-azul");

  imagenesCepillosHTML[1] =
    document.getElementById("cepillo-html-verde");

  imagenesCepillosHTML[2] =
    document.getElementById("cepillo-html-rosa");

  imagenesCepillosHTML[3] =
    document.getElementById("cepillo-html-amarillo");
}

function prepararImagenesHalloween() {
  imagenesHalloween[0] =
    document.querySelector(".calabaza-carga");

  imagenesHalloween[1] =
    document.querySelector(".esquina-fantasma");

  imagenesHalloween[2] =
    document.getElementById("figura-murcielago");
}


// ------------------------------------------------------------
// SONIDOS DE LA APLICACIÓN
// ------------------------------------------------------------

function prepararSonidos() {
  sonidoSpark = new Audio("assets/sounds/Spark.mp3");
  sonidoSpark.volume = 0.35;
  sonidoSpark.preload = "auto";
  sonidoSpark.loop = false;

  sonidoSpark.addEventListener("error", function() {
    console.warn("No se pudo cargar Spark.mp3");
  });

  sonidoFanfarria = new Audio("assets/sounds/Fanfare.mp3");
  sonidoFanfarria.volume = 0.35;
  sonidoFanfarria.preload = "auto";
  sonidoFanfarria.loop = false;

  sonidoFanfarria.addEventListener("error", function() {
    console.warn("No se pudo cargar Fanfare.mp3");
  });

  // La melodía final.
  sonidoOutro = new Audio("assets/sounds/Outro.mp3");
  sonidoOutro.volume = 0.35;
  sonidoOutro.preload = "auto";
  sonidoOutro.loop = false;

  sonidoOutro.addEventListener("error", function() {
    console.warn("No se pudo cargar Outro.mp3");
  });

  // Cuando ya conocemos los datos de Outro.mp3, podemos
  // consultar cuanto dura para calcular el desplazamiento
  // de los créditos.
  sonidoOutro.addEventListener("loadedmetadata", function() {
    actualizarDesplazamientoCreditos();
  });

  sonidoOutro.addEventListener("ended", function() {
    if (creditosActivos) {
      finalizarCreditos();
    }
  });

  sonidoIntro = new Audio("assets/sounds/Intro.mp3");
  sonidoIntro.volume = 0.10;
  sonidoIntro.preload = "auto";
  sonidoIntro.loop = false;

  // Repetimos Intro si la cámara todavía no está lista.
  sonidoIntro.addEventListener("ended", function() {
    if (camaraYDetectorPreparados()) {
      estadoIntro = "terminada";

    } else {
      estadoIntro = "pendiente";
      iniciarIntroduccion();
    }
  });

  sonidoIntro.addEventListener("error", function() {
    console.warn("No se pudo cargar Intro.mp3");
    estadoIntro = "sin-audio";
  });

  // Chrome puede solicitar permisos del usuario.
  document.getElementById("pantalla-carga").addEventListener(
    "pointerdown",
    function() {
      if (estadoIntro === "bloqueada") {
        iniciarIntroduccion();
      }
    }
  );
}

function iniciarIntroduccion() {
  if (estadoIntro === "sonando" ||
      estadoIntro === "terminada" ||
      estadoIntro === "sin-audio") {
    return;
  }

  estadoIntro = "sonando";
  sonidoIntro.currentTime = 0;

  let reproduccion = sonidoIntro.play();

  if (reproduccion !== undefined) {
    reproduccion.catch(function(error) {
      console.warn(
        "No se pudo iniciar Intro.mp3:",
        error
      );

      if (error.name === "NotAllowedError") {
        estadoIntro = "bloqueada";
      } else {
        estadoIntro = "sin-audio";
      }
    });
  }
}

function detenerSonidos() {
  sonidoSpark.pause();
  sonidoSpark.currentTime = 0;
}

function reproducirSonidos() {
  if (millis() - tiempoUltimoSonido < intervaloSonido) {
    return;
  }

  sonidoSpark.pause();
  sonidoSpark.currentTime = 0;

  let reproduccion = sonidoSpark.play();

  if (reproduccion !== undefined) {
    reproduccion.catch(function(error) {
      console.warn(
        "No se pudo reproducir Spark.mp3:",
        error
      );
    });
  }

  tiempoUltimoSonido = millis();
}


// ------------------------------------------------------------
// BOTONES Y PANTALLA DE CRÉDITOS
// ------------------------------------------------------------

function prepararBotonesFinales() {
  document.getElementById("boton-reiniciar").addEventListener(
    "click",
    function() {
      if (animacionCreditos !== null) {
        cancelAnimationFrame(animacionCreditos);
        animacionCreditos = null;
      }

      sonidoOutro.pause();
      sonidoOutro.currentTime = 0;

      sonidoFanfarria.pause();
      sonidoFanfarria.currentTime = 0;

      window.location.reload();
    }
  );

  document.getElementById("boton-creditos").addEventListener(
    "click",
    function() {
      if (!victoriaActiva) {
        return;
      }

      mostrarCreditos();
    }
  );
}

function mostrarCreditos() {
  let pantalla = document.getElementById("pantalla-creditos");
  let desplazamiento = pantalla.querySelector(
    ".creditos-desplazamiento"
  );

  let aplicacion = document.getElementById("aplicacion");

  // Evitamos superponer la fanfarria con la música deOutro.
  sonidoFanfarria.pause();
  sonidoFanfarria.currentTime = 0;

  pantalla.classList.remove("oculta");
  pantalla.setAttribute("aria-hidden", "false");
  aplicacion.classList.add("creditos");

  creditosActivos = true;
  creditosFinalizados = false;

  sonidoOutro.pause();
  sonidoOutro.currentTime = 0;

  desplazamiento.style.transform = "translateY(0px)";

  if (animacionCreditos !== null) {
    cancelAnimationFrame(animacionCreditos);
    animacionCreditos = null;
  }

  let reproduccion = sonidoOutro.play();

  if (reproduccion !== undefined) {
    reproduccion.then(function() {
      // Iniciamos el movimiento cuando empieza el audio.
      animarCreditos();

    }).catch(function(error) {
      console.warn(
        "No se pudo reproducir Outro.mp3:",
        error
      );
    });
  }
}

// requestAnimationFrame permite actualizar la posición
// en cada fotograma, evitando los saltos de timeupdate.
function animarCreditos() {
  if (!creditosActivos || creditosFinalizados) {
    animacionCreditos = null;
    return;
  }

  actualizarDesplazamientoCreditos();

  animacionCreditos = requestAnimationFrame(
    animarCreditos
  );
}

// Calculamos el porcentaje de música reproducida.
// El recorrido incluye la altura completa del texto
// y la del marco para que aparezcan todas las líneas.
function actualizarDesplazamientoCreditos() {
  if (!creditosActivos || creditosFinalizados) {
    return;
  }

  if (!isFinite(sonidoOutro.duration) ||
      sonidoOutro.duration <= 0) {
    return;
  }

  let pantalla = document.getElementById("pantalla-creditos");
  let desplazamiento = pantalla.querySelector(
    ".creditos-desplazamiento"
  );

  let progreso = sonidoOutro.currentTime /
    sonidoOutro.duration;

  progreso = Math.max(0, Math.min(progreso, 1));

  let alturaCreditos = desplazamiento.scrollHeight;
  let alturaPantalla = pantalla.clientHeight;

  let recorrido = alturaCreditos + alturaPantalla;
  let desplazamientoActual = recorrido * progreso;

  desplazamiento.style.transform =
    "translateY(-" + desplazamientoActual + "px)";
}

function finalizarCreditos() {
  if (creditosFinalizados) {
    return;
  }

  // Al terminar la canción, completamos el recorrido.
  let pantalla = document.getElementById("pantalla-creditos");
  let desplazamiento = pantalla.querySelector(
    ".creditos-desplazamiento"
  );

  let recorrido = desplazamiento.scrollHeight +
    pantalla.clientHeight;

  desplazamiento.style.transform =
    "translateY(-" + recorrido + "px)";

  creditosFinalizados = true;
  creditosActivos = false;

  if (animacionCreditos !== null) {
    cancelAnimationFrame(animacionCreditos);
    animacionCreditos = null;
  }

  sonidoOutro.pause();

  // El cierre efectivo deberá verificarse en Electron.
  if (navigator.userAgent.includes("Electron")) {
    window.close();

  } else {
    console.log(
      "Créditos finalizados. El cierre automático " +
      "deberá comprobarse en Electron."
    );
  }
}


// ------------------------------------------------------------
// RECONOCIMIENTO FACIAL CON MEDIAPIPE
// ------------------------------------------------------------

function camaraYDetectorPreparados() {
  return video &&
    video.elt.readyState >= 2 &&
    detectorPreparado &&
    !errorDetector;
}

async function iniciarDetector() {
  try {
    const biblioteca = await import(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/+esm"
    );

    const vision = await biblioteca.FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/wasm"
    );

    // Configuramos MediaPipe para analizar imágenes de vídeo,
    // reconocer un rostro y obtener información sobre sus
    // movimientos faciales, sobre todo la apertura de la boca.
    detectorFacial = await biblioteca.FaceLandmarker.createFromOptions(
      vision,
      {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
        },
        runningMode: "VIDEO",
        numFaces: 1,
        outputFaceBlendshapes: true
      }
    );

    detectorPreparado = true;
    mensaje = "Buscando rostro...";

  } catch (error) {
    errorDetector = true;
    mensaje = "No se pudo cargar el reconocimiento facial";

    console.error("Error de MediaPipe:", error);
  }
}

function detectarAperturaBoca() {
  aperturaBoca = 0;

  // MediaPipe proporciona un valor llamado jawOpen que indica
  // cuánto se abre la mandíbula. Lo comparamos con el umbral
  // establecido para determinar si la boca está abierta.
  if (resultadoFacial.faceBlendshapes.length > 0) {
    let movimientos =
      resultadoFacial.faceBlendshapes[0].categories;

    for (let i = 0; i < movimientos.length; i++) {
      if (movimientos[i].categoryName === "jawOpen") {
        aperturaBoca = movimientos[i].score;
        break;
      }
    }
  }

  mensaje = aperturaBoca >= umbralBoca ?
    "Boca abierta" :
    "Boca cerrada";
}

function localizarBoca() {
  // Utilizamos los puntos 13 y 14, situados en los labios,
  // para calcular el centro de la boca. Los puntos 61 y 291
  // nos permiten medir su anchura y ajustar el cepillo.
  let puntos = resultadoFacial.faceLandmarks[0];

  let labioSuperior = puntos[13];
  let labioInferior = puntos[14];

  bocaX = (labioSuperior.x + labioInferior.x) / 2 * width;
  bocaY = (labioSuperior.y + labioInferior.y) / 2 * height;

  let comisuraIzquierda = puntos[61];
  let comisuraDerecha = puntos[291];

  bocaAncho = dist(
    comisuraIzquierda.x * width,
    comisuraIzquierda.y * height,
    comisuraDerecha.x * width,
    comisuraDerecha.y * height
  );

  bocaDetectada = true;
}


// ------------------------------------------------------------
// BUCLE PRINCIPAL DE LA APLICACIÓN
// ------------------------------------------------------------

function draw() {
  if (!video) {
    return;
  }

  if (victoriaActiva) {
    dibujarVictoria();
    actualizarInterfaz();
    return;
  }

  let pantallaCarga = document.getElementById("pantalla-carga");
  let mensajeCarga = document.getElementById("mensaje-carga");

  if (errorDetector) {
    mensajeCarga.textContent =
      "No se pudo cargar el reconocimiento facial.";

    actualizarInterfaz();
    return;
  }

  // La pantalla de carga permanece hasta que la cámara
  // está lista y ha terminado la introducción.
  if (!camaraYDetectorPreparados() ||
      (estadoIntro !== "terminada" &&
       estadoIntro !== "sin-audio")) {

    if (estadoIntro === "bloqueada") {
      mensajeCarga.textContent =
        "Haz clic aquí para comenzar la magia.";

    } else if (!camaraYDetectorPreparados()) {
      mensajeCarga.textContent = video.elt.readyState >= 2 ?
        "Preparando reconocimiento facial..." :
        "Preparando la cámara...";

    } else {
      mensajeCarga.textContent =
        "¡La magia está a punto de comenzar!";
    }

    actualizarInterfaz();
    return;
  }

  pantallaCarga.classList.add("oculta");

  image(video, 0, 0, width, height);

  // Analizamos únicamente los fotogramas nuevos de la cámara
  // para evitar repetir el reconocimiento facial sobre
  // una imagen que ya hemos procesado.
  if (video.elt.currentTime !== ultimoTiempoVideo) {
    try {
      resultadoFacial = detectorFacial.detectForVideo(
        video.elt,
        performance.now()
      );

      ultimoTiempoVideo = video.elt.currentTime;

      if (resultadoFacial.faceLandmarks.length > 0) {
        detectarAperturaBoca();
        localizarBoca();

      } else {
        aperturaBoca = 0;
        bocaDetectada = false;
        mensaje = "No se detecta ningún rostro";
      }

    } catch (error) {
      errorDetector = true;
      mensaje = "Error durante el reconocimiento facial";

      console.error("Error de detección:", error);
      actualizarInterfaz();
      return;
    }
  }

  let segundosFotograma = min(deltaTime / 1000, 0.05);

  let cepilladoActivo = bocaDetectada &&
    aperturaBoca >= umbralBoca;

  // Solo contabilizamos el tiempo con la boca abierta.
  if (cepilladoActivo && tiempoCepillado < objetivoCepillado) {
    tiempoCepillado = min(
      tiempoCepillado + segundosFotograma,
      objetivoCepillado
    );
  }

  if (tiempoCepillado >= objetivoCepillado) {
    activarVictoria();
    dibujarVictoria();
    actualizarInterfaz();
    return;
  }

  let progreso = tiempoCepillado / objetivoCepillado;

  if (bocaDetectada) {
    animarCepillo();
    dibujarCepillo();
  }

  actualizarParticulas(segundosFotograma);

  if (cepilladoActivo) {
    generarParticulas(progreso, segundosFotograma);
    reproducirSonidos();

  } else if (cepilladoAnterior) {
    detenerSonidos();
  }

  cepilladoAnterior = cepilladoActivo;

  dibujarParticulas(progreso);
  actualizarInterfaz();

  if (millis() - ultimoRegistroConsola >= 1000) {
    console.log(
      "Apertura de la boca:",
      aperturaBoca.toFixed(2)
    );

    ultimoRegistroConsola = millis();
  }
}


// ------------------------------------------------------------
// CEPILLO Y PARTÍCULAS
// ------------------------------------------------------------

// Utilizamos sin() para crear un movimiento de vaivén.
// De este modo, el cepillo se desplaza suavemente sobre
// la boca y simula la acción del cepillado.
function animarCepillo() {
  if (aperturaBoca >= umbralBoca) {
    faseCepillado += 0.15;

    desplazamientoCepillo =
      sin(faseCepillado) * bocaAncho * 0.12;

    desplazamientoVertical =
      sin(faseCepillado * 0.5) * bocaAncho * 0.08;
  }
}

// Colocamos el cepillo en la posición de la boca
// calculada a partir del reconocimiento facial.
function dibujarCepillo() {
  let cepilloP5 = imagenesCepillos[indiceCepillo];
  let cepilloHTML = imagenesCepillosHTML[indiceCepillo];

  let cepilloHTMLPreparado = cepilloHTML &&
    cepilloHTML.complete &&
    cepilloHTML.naturalWidth > 0;

  if (!cepilloP5 && !cepilloHTMLPreparado) {
    return;
  }

  let anchoOriginal = cepilloP5 ?
    cepilloP5.width :
    cepilloHTML.naturalWidth;

  let altoOriginal = cepilloP5 ?
    cepilloP5.height :
    cepilloHTML.naturalHeight;

  let anchoCepillo = bocaAncho * 3.8;

  let altoCepillo = anchoCepillo *
    altoOriginal / anchoOriginal;

  let posicionX = bocaX -
    anchoCepillo * 0.12 +
    desplazamientoCepillo;

  let posicionY = bocaY -
    altoCepillo / 2 +
    desplazamientoVertical;

  if (cepilloP5) {
    image(
      cepilloP5,
      posicionX,
      posicionY,
      anchoCepillo,
      altoCepillo
    );

  } else {
    drawingContext.drawImage(
      cepilloHTML,
      posicionX,
      posicionY,
      anchoCepillo,
      altoCepillo
    );
  }
}

// La cantidad de partículas aumenta progresivamente.
// Una de cada diez utiliza una ilustración de Halloween.
function generarParticulas(progreso, segundosFotograma) {
  let frecuencia = 24 + progreso * 28;

  // El acumulador regula la creación de partículas según
  // el tiempo transcurrido. También limitamos su cantidad
  // para evitar que se acumulen demasiadas en pantalla.
  acumuladorParticulas += frecuencia * segundosFotograma;

  while (acumuladorParticulas >= 1 &&
         particulas.length < 140) {

    contadorParticulas++;

    let esHalloween = contadorParticulas % 10 === 0;

    let nuevaParticula = {
      x: bocaX + desplazamientoCepillo +
        random(-bocaAncho * 0.40, bocaAncho * 0.40),

      y: bocaY + desplazamientoVertical +
        random(-bocaAncho * 0.30, bocaAncho * 0.30),

      velocidadX: random(-75, 75),
      velocidadY: random(-85, 25),

      tamano: random(4, 7 + progreso * 3),
      vida: 1,

      esHalloween: esHalloween,
      imagen: null
    };

    if (esHalloween) {
      let imagen =
        imagenesHalloween[siguienteFiguraHalloween];

      siguienteFiguraHalloween =
        (siguienteFiguraHalloween + 1) %
        imagenesHalloween.length;

      if (imagen &&
          imagen.complete &&
          imagen.naturalWidth > 0) {

        nuevaParticula.imagen = imagen;
        nuevaParticula.tamano = random(20, 28);

      } else {
        nuevaParticula.esHalloween = false;
      }
    }

    particulas.push(nuevaParticula);
    acumuladorParticulas -= 1;
  }

  if (particulas.length >= 140) {
    acumuladorParticulas = 0;
  }
}

// Las partículas se desplazan y van perdiendo vida
// progresivamente. Cuando su valor llega a cero,
// las eliminamos para que dejen de dibujarse.
function actualizarParticulas(segundosFotograma) {
  for (let i = particulas.length - 1; i >= 0; i--) {
    let particula = particulas[i];

    particula.x +=
      particula.velocidadX * segundosFotograma;

    particula.y +=
      particula.velocidadY * segundosFotograma;

    particula.vida -= segundosFotograma / 1.7;

    if (particula.vida <= 0) {
      particulas.splice(i, 1);
    }
  }
}

// Dibujamos partículas luminosas y pequeñas ilustraciones
// de Halloween. Su transparencia disminuye a medida que
// transcurre su tiempo de vida.
function dibujarParticulas(progreso) {
  noStroke();

  for (let i = 0; i < particulas.length; i++) {
    let particula = particulas[i];

    if (particula.esHalloween &&
        particula.imagen !== null) {

      let ancho = particula.tamano;

      let alto = ancho *
        particula.imagen.naturalHeight /
        particula.imagen.naturalWidth;

      let transparencia = map(
        particula.vida,
        0,
        1,
        140,
        255
      );

      drawingContext.save();
      drawingContext.globalAlpha = transparencia / 255;

      drawingContext.drawImage(
        particula.imagen,
        particula.x - ancho / 2,
        particula.y - alto / 2,
        ancho,
        alto
      );

      drawingContext.restore();

    } else {
      let transparencia =
        particula.vida * (200 + progreso * 55);

      fill(
        195,
        235,
        255,
        particula.vida * (40 + progreso * 60)
      );

      circle(
        particula.x,
        particula.y,
        particula.tamano * 3
      );

      if (i % 2 === 0) {
        fill(255, 255, 255, transparencia);
      } else {
        fill(165, 230, 255, transparencia);
      }

      circle(
        particula.x,
        particula.y,
        particula.tamano
      );

      if (i % 5 === 0) {
        stroke(
          255,
          255,
          255,
          particula.vida * (110 + progreso * 110)
        );

        strokeWeight(1.5);

        let longitud =
          particula.tamano * (0.8 + progreso * 0.5);

        line(
          particula.x - longitud,
          particula.y,
          particula.x + longitud,
          particula.y
        );

        line(
          particula.x,
          particula.y - longitud,
          particula.x,
          particula.y + longitud
        );

        noStroke();
      }

      if (progreso >= 0.8 && i % 3 === 0) {
        let intensidadBrillo =
          (progreso - 0.8) / 0.2;

        fill(
          220,
          245,
          255,
          particula.vida * intensidadBrillo * 100
        );

        circle(
          particula.x,
          particula.y,
          particula.tamano * 3.5
        );
      }
    }
  }
}


// ------------------------------------------------------------
// PANTALLA DE VICTORIA
// ------------------------------------------------------------

// Al completar el objetivo detenemos los efectos,
// cerramos la cámara y mostramos los botones finales.
function activarVictoria() {
  if (victoriaActiva) {
    return;
  }

  victoriaActiva = true;
  detenerSonidos();

  if (video.elt.srcObject) {
    let pistas = video.elt.srcObject.getTracks();

    for (let i = 0; i < pistas.length; i++) {
      pistas[i].stop();
    }
  }

  video.elt.pause();
  video.elt.srcObject = null;

  document.getElementById("aplicacion").classList.add(
    "victoria"
  );

  document.getElementById("botones-final").hidden = false;

  sonidoFanfarria.currentTime = 0;

  let reproduccion = sonidoFanfarria.play();

  if (reproduccion !== undefined) {
    reproduccion.catch(function(error) {
      console.warn(
        "No se pudo reproducir Fanfare.mp3:",
        error
      );
    });
  }

  console.log(
    "Cepillado completado. Pantalla de victoria."
  );
}

function dibujarVictoria() {
  background(247, 242, 252);

  if (!imagenVictoria ||
      !imagenVictoria.complete ||
      imagenVictoria.naturalWidth === 0) {
    return;
  }

  let anchoOriginal = imagenVictoria.naturalWidth;
  let altoOriginal = imagenVictoria.naturalHeight;

  let escala = min(
    (width - 20) / anchoOriginal,
    (height - 20) / altoOriginal
  );

  let anchoFinal = anchoOriginal * escala;
  let altoFinal = altoOriginal * escala;

  drawingContext.drawImage(
    imagenVictoria,
    (width - anchoFinal) / 2,
    (height - altoFinal) / 2,
    anchoFinal,
    altoFinal
  );
}


// ------------------------------------------------------------
// ACTUALIZACIÓN DE LA INTERFAZ
// ------------------------------------------------------------

function actualizarInterfaz() {
  let estado =
    document.getElementById("estado-cepillado");

  let indicador =
    document.getElementById("indicador-boca");

  let contador =
    document.getElementById("contador-cepillado");

  let segundos = floor(tiempoCepillado);
  let minutos = floor(segundos / 60);
  let segundosRestantes = segundos % 60;

  contador.textContent =
    nf(minutos, 2) + ":" +
    nf(segundosRestantes, 2) + " / 02:00";

  if (!detectorPreparado || errorDetector) {
    indicador.textContent = "Preparando...";

  } else if (!bocaDetectada) {
    indicador.textContent = "Buscando rostro...";

  } else if (aperturaBoca >= umbralBoca) {
    indicador.textContent = "Boca abierta";

  } else {
    indicador.textContent = "Boca cerrada";
  }

  if (errorDetector) {
    estado.textContent = mensaje;

  } else if (tiempoCepillado >= objetivoCepillado) {
    estado.textContent = "¡Cepillado completado!";

  } else if (!detectorPreparado) {
    estado.textContent = mensaje;

  } else if (!bocaDetectada) {
    estado.textContent = "¡Colócate frente a la cámara!";

  } else if (aperturaBoca >= umbralBoca) {
    estado.textContent = "¡Muy bien! ¡Sigue cepillando!";

  } else {
    estado.textContent = "¡Abre la boca para continuar!";
  }
}

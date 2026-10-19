/* =================================================================
   Calistenia · Sitio educativo · Script
   JavaScript puro (sin frameworks). Funciones de accesibilidad,
   menú móvil, año automático y manejo de fallos de carga.
   ================================================================= */

(function () {
    "use strict";

    /* ---------- Utilidades de almacenamiento (con fallback) ------- */
    function storeGet(key) {
        try { return localStorage.getItem(key); } catch (e) { return null; }
    }
    function storeSet(key, value) {
        try { localStorage.setItem(key, value); } catch (e) { /* modo privado: ignorar */ }
    }

    /* ---------- 1. Año automático en el pie de página -------------- */
    var yearEl = document.getElementById("year");
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }

    /* ---------- 2. Menú desplegable accesible (móvil) -------------- */
    var menuToggle = document.getElementById("menuToggle");
    var mainNav = document.getElementById("mainNav");

    if (menuToggle && mainNav) {
        menuToggle.addEventListener("click", function () {
            var isOpen = mainNav.classList.toggle("open");
            menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
        });

        // Cerrar al navegar con el teclado a un enlace
        mainNav.querySelectorAll(".nav-link").forEach(function (link) {
            link.addEventListener("click", function () {
                if (mainNav.classList.contains("open")) {
                    mainNav.classList.remove("open");
                    menuToggle.setAttribute("aria-expanded", "false");
                }
            });
        });

        // Cerrar con tecla Escape cuando el menú está abierto
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && mainNav.classList.contains("open")) {
                mainNav.classList.remove("open");
                menuToggle.setAttribute("aria-expanded", "false");
                menuToggle.focus();
            }
        });
    }

    /* ---------- 3. Tema claro/oscuro ------------------------------- */
    var btnTheme = document.getElementById("btnTheme");
    var savedTheme = storeGet("calistenia-theme");

    // Respetar preferencia del sistema en la primera visita
    if (!savedTheme && window.matchMedia) {
        savedTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark" : "light";
    }
    applyTheme(savedTheme || "light");

    function applyTheme(theme) {
        if (theme === "dark") {
            document.documentElement.setAttribute("data-theme", "dark");
            if (btnTheme) btnTheme.setAttribute("aria-pressed", "true");
        } else {
            document.documentElement.removeAttribute("data-theme");
            if (btnTheme) btnTheme.setAttribute("aria-pressed", "false");
        }
    }

    if (btnTheme) {
        btnTheme.addEventListener("click", function () {
            var isDark = document.documentElement.getAttribute("data-theme") === "dark";
            var next = isDark ? "light" : "dark";
            applyTheme(next);
            storeSet("calistenia-theme", next);
        });
    }

    /* ---------- 4. Tamaño de texto (aumentar / disminuir) ---------- */
    var btnFontInc = document.getElementById("btnFontInc");
    var btnFontDec = document.getElementById("btnFontDec");
    var btnFontReset = document.getElementById("btnFontReset");

    var MIN_FS = 14;   // px
    var MAX_FS = 28;   // px
    var STEP = 2;      // px
    var DEFAULT_FS = 18;

    var savedFs = parseInt(storeGet("calistenia-fs"), 10);
    if (!isNaN(savedFs) && savedFs >= MIN_FS && savedFs <= MAX_FS) {
        document.documentElement.style.fontSize = savedFs + "px";
    }

    function currentFs() {
        return parseInt(
            window.getComputedStyle(document.documentElement).fontSize,
            10
        );
    }
    function setFs(px) {
        var clamped = Math.max(MIN_FS, Math.min(MAX_FS, px));
        document.documentElement.style.fontSize = clamped + "px";
        storeSet("calistenia-fs", String(clamped));
    }

    if (btnFontInc) btnFontInc.addEventListener("click", function () { setFs(currentFs() + STEP); });
    if (btnFontDec) btnFontDec.addEventListener("click", function () { setFs(currentFs() - STEP); });
    if (btnFontReset) btnFontReset.addEventListener("click", function () { setFs(DEFAULT_FS); });

    /* ---------- 5. Alto contraste ---------------------------------- */
    var btnContrast = document.getElementById("btnContrast");
    var savedContrast = storeGet("calistenia-contrast");
    applyContrast(savedContrast === "high");

    function applyContrast(high) {
        if (high) {
            document.documentElement.setAttribute("data-contrast", "high");
            if (btnContrast) btnContrast.setAttribute("aria-pressed", "true");
        } else {
            document.documentElement.removeAttribute("data-contrast");
            if (btnContrast) btnContrast.setAttribute("aria-pressed", "false");
        }
    }

    if (btnContrast) {
        btnContrast.addEventListener("click", function () {
            var isHigh = document.documentElement.getAttribute("data-contrast") === "high";
            var next = !isHigh;
            applyContrast(next);
            storeSet("calistenia-contrast", next ? "high" : "normal");
        });
    }

    /* ---------- 6. Marcar enlace activo en la navegación ---------- */
    var navLinks = document.querySelectorAll(".nav-link");
    var sections = document.querySelectorAll("main section[id]");

    if ("IntersectionObserver" in window && sections.length) {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    var id = entry.target.getAttribute("id");
                    navLinks.forEach(function (link) {
                        var isActive = link.getAttribute("href") === "#" + id;
                        if (isActive) {
                            link.setAttribute("aria-current", "page");
                        } else {
                            link.removeAttribute("aria-current");
                        }
                    });
                }
            });
        }, { rootMargin: "-40% 0px -55% 0px", threshold: 0 });

        sections.forEach(function (sec) { observer.observe(sec); });
    }

    /* ---------- 7. Manejo de fallos de carga de imágenes ---------- */
    document.querySelectorAll("img").forEach(function (img) {
        img.addEventListener("error", function () {
            img.style.display = "none";
            var figure = img.closest("figure");
            if (figure && !figure.querySelector(".img-fallback")) {
                var note = document.createElement("p");
                note.className = "img-fallback";
                note.setAttribute("role", "status");
                note.style.cssText =
                    "padding:14px;background:var(--code-bg);color:var(--text-soft);" +
                    "border:1px dashed var(--border-strong);border-radius:8px;" +
                    "font-size:0.85rem;margin:0;";
                note.textContent =
                    "⚠️ No se pudo cargar esta imagen (requiere conexión a Internet). " +
                    "Consulta los créditos en el pie de página para verla en su origen.";
                img.parentNode.insertBefore(note, img.nextSibling);
            }
        });
    });

    /* ---------- 8. Video local + audio sincronizado ----------------- */
    var videoFrame = document.getElementById("videoFrame");
    var videoAudio = document.getElementById("videoAudio");
    var videoFallback = document.getElementById("videoFallback");

    // Sincronizar la pista de audio local (videoplayback--Audio.m4a) con el
    // video (videoplayback.mp4). El usuario controla todo con los controles
    // nativos del <video>: play, pause, seek y volumen se reflejan en el audio.
    if (videoFrame && videoAudio &&
        videoFrame.tagName.toLowerCase() === "video") {

        // Reproduce el audio siguiendo el estado del video
        var startAudio = function () {
            try {
                videoAudio.currentTime = videoFrame.currentTime;
                videoAudio.playbackRate = videoFrame.playbackRate;
                videoAudio.volume = videoFrame.volume;
                videoAudio.muted = videoFrame.muted;
            } catch (e) { /* valores no disponibles todavía */ }
            var p = videoAudio.play();
            if (p && typeof p.catch === "function") {
                p.catch(function () { /* autoplay bloqueado: reintentar en click */ });
            }
        };

        videoFrame.addEventListener("play", startAudio);
        videoFrame.addEventListener("playing", startAudio);
        videoFrame.addEventListener("pause", function () { videoAudio.pause(); });
        videoFrame.addEventListener("seeking", function () {
            try { videoAudio.currentTime = videoFrame.currentTime; } catch (e) {}
        });
        videoFrame.addEventListener("seeked", function () {
            try { videoAudio.currentTime = videoFrame.currentTime; } catch (e) {}
        });
        videoFrame.addEventListener("volumechange", function () {
            videoAudio.volume = videoFrame.volume;
            videoAudio.muted = videoFrame.muted;
        });
        videoFrame.addEventListener("ratechange", function () {
            videoAudio.playbackRate = videoFrame.playbackRate;
        });
        videoFrame.addEventListener("waiting", function () { videoAudio.pause(); });

        // Re-sincronización periódica por si hay desviación (buffer distinto)
        setInterval(function () {
            if (!videoFrame.paused &&
                Math.abs(videoAudio.currentTime - videoFrame.currentTime) > 0.5) {
                try { videoAudio.currentTime = videoFrame.currentTime; } catch (e) {}
            }
        }, 2000);
    }

    // Fallback del video (si el archivo no carga)
    if (videoFrame && videoFallback) {
        var tag = videoFrame.tagName.toLowerCase();

        if (tag === "video") {
            videoFrame.addEventListener("error", function () {
                videoFallback.hidden = false;
            }, true);
            window.addEventListener("load", function () {
                var source = videoFrame.querySelector("source");
                if (!source || !source.getAttribute("src")) {
                    videoFallback.hidden = false;
                }
            });
        } else if (tag === "iframe") {
            window.addEventListener("load", function () {
                if (!videoFrame.getAttribute("src")) {
                    videoFallback.hidden = false;
                }
            });
        }
    }

    /* ---------- 9. Navegación con teclado: cerrar menú al perder foco */
    if (mainNav && menuToggle) {
        mainNav.addEventListener("focusout", function (e) {
            // Si el foco sale del menú (y no vuelve al botón), cerrar en móvil
            if (!mainNav.contains(e.relatedTarget) &&
                e.relatedTarget !== menuToggle &&
                window.matchMedia("(max-width: 700px)").matches) {
                mainNav.classList.remove("open");
                menuToggle.setAttribute("aria-expanded", "false");
            }
        });
    }

})();

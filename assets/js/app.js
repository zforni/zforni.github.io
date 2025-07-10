let map, fuse, arcadesearch = [];
let arcades; // Definir arcades en el ámbito global

// Asegurar que el DOM esté listo
$(document).ready(() => {
	
	 $("#loading").show();

  // Inicializar arcades como una capa GeoJSON vacía
  arcades = L.geoJson(null, {
    pointToLayer: (feature, latlng) => {
      return L.marker(latlng, {
        icon: L.icon({
          iconUrl: "assets/img/arcade-machine.png",
          iconSize: [30, 36],
          iconAnchor: [12, 28],
          popupAnchor: [0, -25],
        }),
        title: feature.properties.name,
        riseOnHover: true,
      });
    },
    onEachFeature: (feature, layer) => {
      if (feature.properties) {
        const content = `<table class="table table-striped table-bordered table-condensed">
          <tr><th>Name</th><td>${feature.properties.name}</td></tr>
          <tr><th>Descripción</th><td>${feature.properties.description}</td></tr>
          <tr><th>Address</th><td>${feature.properties.street} ${feature.properties.housenumber}, ${feature.properties.city}, ${feature.properties.postcode}</td></tr>
        </table>`;
        layer.on({
          click: () => {
            $("#feature-title").html(feature.properties.name);
            $("#feature-info").html(content);
            $("#featureModal").modal("show");
            highlight.clearLayers().addLayer(
              L.circleMarker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], highlightStyle)
            );
          },
        });
        arcadesearch.push({
          name: feature.properties.name,
          address: `${feature.properties.street} ${feature.properties.housenumber}, ${feature.properties.city}, ${feature.properties.postcode}`,
          source: "arcades",
          id: L.stamp(layer),
          lat: feature.geometry.coordinates[1],
          lng: feature.geometry.coordinates[0],
        });
      }
    },
  });

  // Ajustar el tamaño del control de capas al redimensionar la ventana
  $(window).on("resize", () => {
    sizeLayerControl();
  });

  // Evento al hacer clic en una fila de la barra lateral
  $(document).on("click", ".feature-row", function () {
    $(document).off("mouseout", ".feature-row", clearHighlight);
    sidebarClick(parseInt($(this).attr("id"), 10));
  });

  // Resaltar marcadores al pasar el mouse (solo en dispositivos no táctiles)
  if (!("ontouchstart" in window)) {
    $(document).on("mouseover", ".feature-row", function () {
      highlight.clearLayers().addLayer(
        L.circleMarker([$(this).attr("lat"), $(this).attr("lng")], highlightStyle)
      );
    });
  }

  $(document).on("mouseout", ".feature-row", clearHighlight);

  // Mostrar el modal "Acerca de"
  $("#about-btn").on("click", () => {
    $("#aboutModal").modal("show");
    $(".navbar-collapse.show").collapse("hide");
    return false;
  });

  // Mostrar el modal de la leyenda
  $("#legend-btn").on("click", () => {
    $("#legendModal").modal("show");
    $(".navbar-collapse.show").collapse("hide");
    return false;
  });

  // Mostrar el modal de inicio de sesión
  $("#login-btn").on("click", () => {
    $("#loginModal").modal("show");
    $(".navbar-collapse.show").collapse("hide");
    return false;
  });

  // Alternar la visibilidad de la barra lateral

  $("#list-btn, #sidebar-toggle-btn, #sidebar-hide-btn").on("click", () => {
    animateSidebar();
    return false;
  });


  // Alternar la visibilidad del menú de navegación
  
  $("#nav-btn").on("click", () => {
    $(".navbar-collapse").collapse("toggle");
    return false;
  });

  // Cargar datos de arcades
$.getJSON("data/arcades.geojson", (data) => {
    data.features.forEach((feature, index) => {
        //console.log("Feature", index, ":", feature.properties.name); // Añadir este log
    });
    arcades.addData(data);
    map.addLayer(arcadesLayer);

    // Inicializar Fuse.js con los datos cargados
    const options = {
      keys: ["name"], // Campo por el cual se realizará la búsqueda
      includeScore: true,
      threshold: 0.3, // Ajusta este valor para mayor o menor precisión en la búsqueda
    };
    fuse = new Fuse(arcadesearch, options); // Inicializar Fuse.js
	
/*	
// Inicializar List.js
const featureList = new List("features", {
    valueNames: ["feature-name"],
});
console.log("List.js inicializado:", featureList);

// Evento de ordenamiento
$("#sort-btn").on("click", function () {
    console.log("Evento click capturado");
    featureList.sort("feature-name", { order: "asc" });
});
	*/
	
$("#sort-btn").on("click", function () {
    $(".form-control.search").val(""); // Limpiar el input de filtrado
    searchFeatures(""); // Mostrar todos los items
});
	 $("#loading").hide();
	
  }).fail((jqXHR, textStatus, errorThrown) => {
    console.error("Error al cargar arcades.geojson:", textStatus, errorThrown); // Manejo de errores
  });
});

// Animación para mostrar/ocultar la barra lateral
function animateSidebar() {
    $("#sidebar").toggleClass("d-none"); // Ocultar/mostrar la barra lateral con Bootstrap

    if ($("#sidebar").hasClass("d-none")) { // Si la barra lateral está oculta
        $("#map").css("margin-left", "0"); // Eliminar el margen izquierdo del mapa
        $("#map").toggleClass("col-md-12 col-lg-12"); // Expandir el mapa
    } else { // Si la barra lateral está visible
        $("#map").css("margin-left", "250px"); // Restaurar el margen izquierdo del mapa
        $("#map").toggleClass("col-md-8 col-lg-9"); // Restaurar el ancho del mapa
    }

    map.invalidateSize(); // Actualizar el tamaño del mapa
}

// Ajustar el tamaño del control de capas
function sizeLayerControl() {
  $(".leaflet-control-layers").css("max-height", $("#map").height() - 50);
}

// Limpiar el resaltado de los marcadores
function clearHighlight() {
  highlight.clearLayers();
}

// Manejar clics en la barra lateral
function sidebarClick(id) {
    const layer = arcades.getLayer(id);
    if (layer) {
        map.setView([layer.getLatLng().lat, layer.getLatLng().lng], 17);
        const feature = layer.feature;
        const content = `<table class="table table-striped table-bordered table-condensed">
            <tr><th>Name</th><td>${feature.properties.name}</td></tr>
            <tr><th>Descripción</th><td>${feature.properties.description}</td></tr>
            <tr><th>Address</th><td>${feature.properties.street} ${feature.properties.housenumber}, ${feature.properties.city}, ${feature.properties.postcode}</td></tr>
        </table>`;
        $("#feature-title").html(feature.properties.name);
        $("#feature-info").html(content);

        $("#featureModal").modal("show");
        highlight.clearLayers().addLayer(
            L.circleMarker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], highlightStyle)
        );
        if (document.body.clientWidth <= 767) {
            //$("#sidebar").hide();
            map.invalidateSize();
        }
    } else {
        console.log("Capa no encontrada para id:", id); // Log de consola
    }
}

// Sincronizar la barra lateral con los marcadores visibles en el mapa
function syncSidebar() {
  $("#feature-list tbody").empty();
  arcades.eachLayer((layer) => {
    if (map.hasLayer(arcadesLayer) && map.getBounds().contains(layer.getLatLng())) {
      $("#feature-list tbody").append(
        `<tr class="feature-row" id="${L.stamp(layer)}" lat="${layer.getLatLng().lat}" lng="${layer.getLatLng().lng}">
          <td style="vertical-align: middle;"><img width="16" height="18" src="assets/img/arcade-machine.png"></td>
          <td class="feature-name">${layer.feature.properties.name}</td>
          <td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td>
        </tr>`
      );
    }
  });
}

// Función para buscar elementos con Fuse.js
function searchFeatures(query) {
    $("#feature-list tbody").empty(); // Limpiar la lista

    if (query) { // Si hay una consulta, realizar la búsqueda
        if (fuse) {
            const results = fuse.search(query);

            results.forEach((result) => {
                const layer = arcades.getLayer(result.item.id);
                if (layer) {
                    $("#feature-list tbody").append(
                        `<tr class="feature-row" id="${L.stamp(layer)}" lat="${layer.getLatLng().lat}" lng="${layer.getLatLng().lng}">
                            <td style="vertical-align: middle;"><img width="16" height="18" src="assets/img/arcade-machine.png"></td>
                            <td class="feature-name">${layer.feature.properties.name}</td>
                            <td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td>
                        </tr>`
                    );
                }
            });
        }
    } else { // Si no hay consulta, mostrar todos los items
        arcades.eachLayer(function (layer) {
            $("#feature-list tbody").append(
                `<tr class="feature-row" id="${L.stamp(layer)}" lat="${layer.getLatLng().lat}" lng="${layer.getLatLng().lng}">
                    <td style="vertical-align: middle;"><img width="16" height="18" src="assets/img/arcade-machine.png"></td>
                    <td class="feature-name">${layer.feature.properties.name}</td>
                    <td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td>
                </tr>`
            );
        });
    }
}

// Evento de búsqueda
/*
$("#searchbox").on("input", function () {
    const query = $(this).val();
    searchFeatures(query);
});
*/
$(".form-control.search").on("input", function () {
    const query = $(this).val();
   // console.log("Input:", query); // Log de consola
    searchFeatures(query);
});

// Capas base
const cartoLight = L.tileLayer(
  "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png",
  {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://cartodb.com/attributions">CartoDB</a>',
  }
);

const usgsImagery = L.layerGroup([
  L.tileLayer("http://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}", {
    maxZoom: 15,
  }),
  L.tileLayer.wms("http://raster.nationalmap.gov/arcgis/services/Orthoimagery/USGS_EROS_Ortho_SCALE/ImageServer/WMSServer?", {
    minZoom: 16,
    maxZoom: 19,
    layers: "0",
    format: "image/jpeg",
    transparent: true,
    attribution: "Aerial Imagery courtesy USGS",
  }),
]);

// Capa de resaltado
const highlight = L.geoJson(null);
const highlightStyle = {
  stroke: false,
  fillColor: "#00FFFF",
  fillOpacity: 0.7,
  radius: 10,
};

// Capa de marcadores agrupados
const markerClusters = L.markerClusterGroup({
  spiderfyOnMaxZoom: true,
  showCoverageOnHover: false,
  zoomToBoundsOnClick: true,
  disableClusteringAtZoom: 16,
});

// Capa de arcades
const arcadesLayer = L.geoJson(null);

// Inicializar el mapa
map = L.map("map", {
  zoom: 5, // Nivel de zoom inicial (ajusta según sea necesario)
  center: [-34.6037, -58.3816], // Coordenadas de Buenos Aires, Argentina
  layers: [cartoLight, markerClusters, highlight],
  zoomControl: false,
  attributionControl: false,
});

// Escuchar cambios en las capas
map.on("overlayadd", (e) => {
  if (e.layer === arcadesLayer) {
    markerClusters.addLayer(arcades);
    syncSidebar();
  }
});

map.on("overlayremove", (e) => {
  if (e.layer === arcadesLayer) {
    markerClusters.removeLayer(arcades);
    syncSidebar();
  }
});

// Sincronizar la barra lateral al mover el mapa
map.on("moveend", syncSidebar);

// Limpiar resaltado al hacer clic en el mapa
map.on("click", clearHighlight);

// Control de atribución
const attributionControl = L.control({ position: "bottomright" });
attributionControl.onAdd = () => {
  const div = L.DomUtil.create("div", "leaflet-control-attribution");
  div.innerHTML =
    '<span class="hidden-xs">Developed by <a href="https://www.instagram.com/mapafichines">mapafichines.fun</a>';
  return div;
};
map.addControl(attributionControl);

// Control de zoom
L.control.zoom({ position: "bottomright" }).addTo(map);

// Control de geolocalización
const locateControl = L.control.locate({
  position: "bottomright",
  drawCircle: true,
  follow: false,
  setView: false,
  keepCurrentZoomLevel: true,
  markerStyle: {
    weight: 1,
    opacity: 0.8,
    fillOpacity: 0.8,
  },
  circleStyle: {
    weight: 1,
    clickable: false,
  },
  icon: "fa fa-location-arrow",
  metric: false,
  strings: {
    title: "Mi ubicación",
    popup: "Vos estás a {distance} {unit} de este punto",
    outsideMapBoundsMsg: "Pareces estar ubicado fuera de los límites del mapa.",
  },
  locateOptions: {
    maxZoom: 18,
    watch: false,
    enableHighAccuracy: true,
    maximumAge: 10000,
    timeout: 10000,
  },
}).addTo(map);

    // Agregar el evento locationfound
    map.on("locationfound", (e) => {
        map.flyTo(e.latlng, 15); // Zoom animado a nivel 15
    });

// Control de capas agrupadas
const baseLayers = {
  "Mapa de Calles": cartoLight,
  "Imágenes Satelitales": usgsImagery,
};

const groupedOverlays = {
  "Arcades": {
    "<img src='assets/img/arcade-machine.png' width='32' height='32'>&nbsp;Arcades": arcadesLayer,
  },
};

$("#searchbox").on("input", function () {
    const query = $(this).val();
    searchFeatures(query);
});

const layerControl = L.control.groupedLayers(baseLayers, groupedOverlays, {
  collapsed: document.body.clientWidth <= 767,
}).addTo(map);


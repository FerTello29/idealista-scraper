document.addEventListener('DOMContentLoaded', () => {
  const API_KEY = 'e8f2a597fbbcff67567a723fa5c8c26e';
  const baseUrl = 'https://www.idealista.com/alquiler-viviendas/madrid-madrid/';
  const scraperApiBase = `http://api.scraperapi.com?api_key=${API_KEY}&url=`;

  let propiedadesData = [];
  let urlOrden = ''; // para saber qué orden se está usando

  const tbody = document.getElementById('propiedades');
  const precioFiltroInput = document.getElementById('precioFiltro');
  const busquedaInput = document.getElementById('busquedaInput');
  const botonesOrden = document.querySelectorAll('.order-btn');

  function parsePrecio(precioStr) {
    if (!precioStr) return 0;
    const num = precioStr.replace(/[^\d]/g, '');
    return parseInt(num) || 0;
  }

  function renderTabla() {
    const filtroPrecioMax = parseInt(precioFiltroInput.value) || 0;
    const textoBusqueda = busquedaInput.value.trim().toLowerCase();

    tbody.innerHTML = '';

    const filtradas = propiedadesData.filter(prop => {
      const precioNum = parsePrecio(prop.precio);

      // Filtro precio
      if (filtroPrecioMax && precioNum > filtroPrecioMax) return false;

      // Filtro texto: buscamos en titulo, descripcion, ellipsis
      if (
        textoBusqueda &&
        !(
          prop.titulo.toLowerCase().includes(textoBusqueda) ||
          prop.descripcion.toLowerCase().includes(textoBusqueda) ||
          prop.ellipsis.toLowerCase().includes(textoBusqueda)
        )
      ) {
        return false;
      }

      return true;
    });

    if (filtradas.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center">No se encontraron propiedades</td></tr>`;
      return;
    }

    filtradas.forEach(prop => {
      const fila = document.createElement('tr');
      fila.innerHTML = `
        <td title="${prop.titulo}">${prop.titulo}</td>
        <td>${prop.precio}</td>
        <td title="${prop.descripcion}">${prop.descripcion}</td>
        <td>${prop.ellipsis}</td>
        <td>${prop.galeria}</td>
      `;
      tbody.appendChild(fila);
    });
  }

  async function cargarDatos(urlOrdenParam = '') {
    try {
      // Construir url con orden
      const urlCompleta = urlOrdenParam
        ? `${baseUrl}?ordenado-por=${urlOrdenParam}`
        : baseUrl;

      const urlScraper = scraperApiBase + encodeURIComponent(urlCompleta);

      const response = await fetch(urlScraper);
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const propiedades = doc.querySelectorAll('.item');
      propiedadesData = [];

      propiedades.forEach(prop => {
        const titulo = prop.querySelector('.item-link')?.textContent.trim() || 'Sin título';
        const precio = prop.querySelector('.item-price')?.textContent.trim() || 'Precio no disponible';
        const descripcion = prop.querySelector('.item-detail')?.textContent.trim() || 'Sin descripción';
        const ellipsis = prop.querySelector('.ellipsis')?.textContent.trim() || '';

        let galeriaHtml = '';
        const galeria = prop.querySelectorAll('.item-gallery img');
        if (galeria.length > 0) {
          galeria.forEach(img => {
            const src = img.src || img.getAttribute('data-src') || '';
            galeriaHtml += `<img src="${src}" alt="Foto" style="max-height:40px; margin-right:5px;">`;
          });
        } else {
          galeriaHtml = 'No hay imágenes';
        }

        propiedadesData.push({
          titulo,
          precio,
          descripcion,
          ellipsis,
          galeria: galeriaHtml
        });
      });

      renderTabla();
    } catch (err) {
      console.error('Error al hacer scraping:', err);
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Error cargando datos</td></tr>`;
    }
  }

  // Eventos para filtro y búsqueda
  precioFiltroInput.addEventListener('input', renderTabla);
  busquedaInput.addEventListener('input', renderTabla);

  // Eventos para botones orden
  botonesOrden.forEach(btn => {
    btn.addEventListener('click', () => {
      const orden = btn.getAttribute('data-order');
      urlOrden = orden;

      // Activar/desactivar botón activo
      botonesOrden.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      cargarDatos(orden);
    });
  });

  // Carga inicial sin orden
  cargarDatos();
});

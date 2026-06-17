import { turso } from "@/lib/turso";

export default async function HomePage({ searchParams }) {
  // Capturamos la página actual de la URL, por defecto es la 1
  const parametros = await searchParams;
  const paginaActual = Number(parametros.page) || 1;
  const limitePorPagina = 50;
  const offset = (paginaActual - 1) * limitePorPagina;

  let productos = [];
  let totalPaginas = 1;

  try {
    console.log(`\n🔍 --- AUDITORÍA DE CAMBIO DE PÁGINA (Pág. ${paginaActual}) ---`);

    // Cronómetro 1: Tiempo total del conteo
    console.time("⏱️ Tiempo Conteo Total");
    const conteo = await turso.execute("SELECT COUNT(*) as total FROM productos;");
    const totalRegistros = conteo.rows[0].total;
    totalPaginas = Math.ceil(totalRegistros / limitePorPagina);
    console.timeEnd("⏱️ Tiempo Conteo Total");

    // Cronómetro 2: Tiempo del query de la matriz con su paginación
    const query = `
      SELECT 
        p.*,
        (SELECT COUNT(*) FROM variantes v WHERE v.cod_universal = p.cod_universal AND v.genero = p.genero) as cantidad,
        CASE WHEN p.descuento = 10 THEN p.precio_final ELSE NULL END as desc_10,
        CASE WHEN p.descuento = 20 THEN p.precio_final ELSE NULL END as desc_20,
        CASE WHEN p.descuento = 30 THEN p.precio_final ELSE NULL END as desc_30,
        CASE WHEN p.descuento = 40 THEN p.precio_final ELSE NULL END as desc_40,
        CASE WHEN p.descuento = 50 THEN p.precio_final ELSE NULL END as desc_50,
        CASE WHEN p.descuento = 60 THEN p.precio_final ELSE NULL END as desc_60,
        CASE WHEN p.descuento = 70 THEN p.precio_final ELSE NULL END as desc_70
      FROM productos p 
      LIMIT ? OFFSET ?;
    `;

    console.log(`📡 Ejecutando SELECT con LIMIT ${limitePorPagina} y OFFSET ${offset}...`);
    console.time("⏱️ Tiempo Query Matriz (Turso Cloud)");

    const resultado = await turso.execute({ sql: query, args: [limitePorPagina, offset] });
    productos = resultado.rows;

    console.timeEnd("⏱️ Tiempo Query Matriz (Turso Cloud)");
    console.log(`✅ Se renderizaron ${productos.length} productos en pantalla.`);

  } catch (error) {
    console.error("❌ Error en catálogo paginado:", error);
  }

  return (
    <main className="min-h-screen bg-gray-950 p-2 md:p-4 text-white font-sans">
      <div className="w-full mx-auto">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-4">
          <div>
            <h1 className="text-base md:text-xl font-black text-blue-400 tracking-tight">MATRIZ GENERAL DE STOCK</h1>
            <p className="text-[10px] md:text-xs text-gray-400">Página {paginaActual} de {totalPaginas}</p>
          </div>
          <a href="/admin" className="text-[10px] md:text-xs bg-gray-900 border border-gray-800 hover:bg-gray-800 px-3 py-1.5 rounded font-bold transition-all">
            ⚙️ Panel
          </a>
        </div>

        {/* ========================================================================= */}
        {/* VISTA 1: DESKTOP (Tu tabla actual - Solo se muestra en pantallas medianas/grandes) */}
        {/* ========================================================================= */}
        <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-800 bg-gray-900 shadow-2xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-black text-white font-bold uppercase border-b border-gray-800 divide-x divide-gray-800">
                <th className="p-2 text-center w-12">Imagen</th>
                <th className="p-2">Cod. Marca</th>
                <th className="p-2">Marca</th>
                <th className="p-2">Modelo</th>
                <th className="p-2">Géner.</th>
                <th className="p-2">Categoría</th>
                <th className="p-2">Color</th>
                <th className="p-2 text-center">Cant.</th>
                <th className="p-2 text-right">P. Vent</th>
                <th className="p-2">Grupo</th>
                <th className="p-2">Grupo Padre</th>
                <th className="p-2 text-center bg-green-950 text-green-400 w-14">10%</th>
                <th className="p-2 text-center bg-yellow-950 text-yellow-400 w-14">20%</th>
                <th className="p-2 text-center bg-orange-950 text-orange-400 w-14">30%</th>
                <th className="p-2 text-center bg-red-950 text-red-400 w-14">40%</th>
                <th className="p-2 text-center bg-purple-950 text-purple-400 w-14">50%</th>
                <th className="p-2 text-center bg-amber-900 text-amber-300 w-14">60%</th>
                <th className="p-2 text-center bg-gray-800 text-gray-300 w-14">70%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {productos.map((p, index) => (
                <tr key={index} className="hover:bg-gray-800/60 transition-colors divide-x divide-gray-800">
                  <td className="p-1 text-center bg-gray-950">
                    {p.imagen_url ? <img src={p.imagen_url} alt="" className="h-8 w-8 object-contain mx-auto" /> : <span className="text-[10px] text-gray-700">-</span>}
                  </td>
                  <td className="p-2 font-mono text-gray-300 font-semibold">{p.cod_universal}</td>
                  <td className="p-2 text-gray-400 font-bold">{p.marca}</td>
                  <td className="p-2 font-bold text-white">{p.modelo}</td>
                  <td className="p-2 text-gray-400">{p.genero}</td>
                  <td className="p-2 text-gray-400">{p.categoria}</td>
                  <td className="p-2 text-gray-400">{p.color}</td>
                  <td className="p-2 text-center font-bold text-blue-400 bg-gray-950/40">{p.cantidad}</td>
                  <td className="p-2 text-right font-bold text-white">S/ {p.precio_lista.toFixed(2)}</td>
                  <td className="p-2 text-gray-500">{p.grupo}</td>
                  <td className="p-2 text-gray-500">{p.categoria}</td>
                  <td className={`p-2 text-center font-bold ${p.desc_10 ? 'bg-green-500/20 text-green-400' : ''}`}>{p.desc_10 ? `S/ ${p.desc_10.toFixed(0)}` : ''}</td>
                  <td className={`p-2 text-center font-bold ${p.desc_20 ? 'bg-yellow-500/20 text-yellow-400' : ''}`}>{p.desc_20 ? `S/ ${p.desc_20.toFixed(0)}` : ''}</td>
                  <td className={`p-2 text-center font-bold ${p.desc_30 ? 'bg-orange-500/20 text-orange-400' : ''}`}>{p.desc_30 ? `S/ ${p.desc_30.toFixed(0)}` : ''}</td>
                  <td className={`p-2 text-center font-bold ${p.desc_40 ? 'bg-red-500/20 text-red-400' : ''}`}>{p.desc_40 ? `S/ ${p.desc_40.toFixed(0)}` : ''}</td>
                  <td className={`p-2 text-center font-bold ${p.desc_50 ? 'bg-purple-500/20 text-purple-400' : ''}`}>{p.desc_50 ? `S/ ${p.desc_50.toFixed(0)}` : ''}</td>
                  <td className={`p-2 text-center font-bold ${p.desc_60 ? 'bg-amber-500/20 text-amber-400' : ''}`}>{p.desc_60 ? `S/ ${p.desc_60.toFixed(0)}` : ''}</td>
                  <td className={`p-2 text-center font-bold ${p.desc_70 ? 'bg-white/10 text-gray-200' : ''}`}>{p.desc_70 ? `S/ ${p.desc_70.toFixed(0)}` : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ========================================================================= */}
        {/* VISTA 2: MOBILE (Fichas Colapsables - Solo se muestra en celulares) */}
        {/* ========================================================================= */}
        <div className="block md:hidden space-y-2">
          {productos.map((p, index) => (
            <details key={index} className="group rounded-lg border border-gray-800 bg-gray-900 overflow-hidden [&_summary::-webkit-details-marker]:hidden">
              {/* Parte Visible Siempre */}
              <summary className="flex items-center justify-between p-3 cursor-pointer select-none hover:bg-gray-800/40">
                <div className="flex items-center space-x-3">
                  {/* Mini Imagen */}
                  <div className="h-10 w-10 flex-shrink-0 bg-gray-950 rounded p-1 flex items-center justify-center">
                    {p.imagen_url ? <img src={p.imagen_url} alt="" className="h-full object-contain" /> : <span className="text-[9px] text-gray-600">-</span>}
                  </div>
                  {/* Datos rápidos */}
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-mono text-xs font-bold text-gray-300">{p.cod_universal}</span>
                      <span className="text-[10px] px-1 bg-gray-800 text-gray-400 rounded uppercase font-semibold">{p.marca}</span>
                    </div>
                    <h3 className="text-xs font-bold text-white line-clamp-1 mt-0.5">{p.modelo}</h3>
                    <p className="text-[10px] text-gray-500">{p.genero} • {p.color}</p>
                  </div>
                </div>

                {/* Stock y Precio */}
                <div className="text-right">
                  <div className="text-xs font-black text-white">S/ {p.precio_lista.toFixed(0)}</div>
                  <div className="text-[10px] text-blue-400 font-bold mt-0.5">Stock: {p.cantidad}</div>
                </div>
              </summary>

              {/* Contenido Desplegable Oculto */}
              <div className="border-t border-gray-800 bg-black/40 p-3 text-[11px] space-y-2.5">
                {/* Detalles extra */}
                <div className="grid grid-cols-2 gap-2 text-gray-400">
                  <div><span className="text-gray-600">Categoría:</span> {p.categoria}</div>
                  <div><span className="text-gray-600">Grupo:</span> {p.grupo}</div>
                </div>

                {/* Bloque Liquidación Móvil (Muestra el descuento activo si existe) */}
                <div>
                  <span className="text-gray-600 block mb-1">Liquidación / Oferta Activa:</span>
                  {p.descuento > 0 ? (
                    <div className="inline-flex items-center space-x-2 rounded bg-orange-500/10 border border-orange-500/30 p-2 text-orange-400 font-bold">
                      <span>🔥 {p.descuento}% DESC.</span>
                      <span className="text-white">→ S/ {p.precio_final.toFixed(0)}</span>
                    </div>
                  ) : (
                    <span className="text-gray-500 italic">Precio regular sin oferta</span>
                  )}
                </div>
              </div>
            </details>
          ))}
        </div>

        {/* CONTROLES DE PAGINACIÓN COMPACTOS */}
        <div className="flex items-center justify-center space-x-2 mt-6 pb-8">
          <a
            href={`?page=${paginaActual - 1}`}
            className={`px-3 py-1.5 rounded text-xs font-bold border border-gray-800 bg-gray-900 ${paginaActual <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-gray-800'}`}
          >
            ◀ Anterior
          </a>
          <span className="text-xs text-gray-400 font-mono">Pág. {paginaActual} / {totalPaginas}</span>
          <a
            href={`?page=${paginaActual + 1}`}
            className={`px-3 py-1.5 rounded text-xs font-bold border border-gray-800 bg-gray-900 ${paginaActual >= totalPaginas ? 'pointer-events-none opacity-40' : 'hover:bg-gray-800'}`}
          >
            Siguiente ▶
          </a>
        </div>
      </div>
    </main>
  );
}
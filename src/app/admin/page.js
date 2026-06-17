import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";
import * as cheerio from "cheerio";
import { turso } from "@/lib/turso";
import BotonCargar from "@/components/BotonCargar";

export default async function AdminPage() {

    async function procesarArchivos(formData) {
        "use server";

        const archivoStock = formData.get("stock");
        const archivoImagenes = formData.get("imagenes");
        const archivosDescuentos = formData.getAll("descuentos"); // Array de archivos de descuento

        if (!archivoStock || archivoStock.size === 0) return;

        console.log("⚡ --- Iniciando Procesamiento Completo ---");

        // ==========================================
        // 1. PASO 1: Imágenes (Cheerio) - CORREGIDO
        // ==========================================
        let dictImagenes = {};
        if (archivoImagenes && archivoImagenes.size > 0) {
            const htmlTexto = Buffer.from(await archivoImagenes.arrayBuffer()).toString("utf-8");
            const $ = cheerio.load(htmlTexto);

            $("table tr").each((_, fila) => {
                // Columna 3 tiene el COD. UNIVERSAL (PISCO, BORGONIA, etc.)
                const codUniv = $(fila).find("td").eq(3).text().trim();

                // Columna 2 tiene la etiqueta <img>. Extraemos su atributo 'src'
                const urlImg = $(fila).find("td").eq(2).find("img").attr("src") || null;

                if (codUniv) {
                    dictImagenes[codUniv] = urlImg;
                }
            });
            console.log(`✅ Diccionario de imágenes indexado correctamente.`);
        }
        // ==========================================
        // 2. PASO 2: Procesar Múltiples Archivos de Descuentos
        // ==========================================
        let dictDescuentos = {}; // { "COD_UNIVERSAL": porcentaje_descuento }

        for (const archivoDesc of archivosDescuentos) {
            if (archivoDesc && archivoDesc.size > 0) {
                // EXTRAER EL PORCENTAJE DEL NOMBRE DEL ARCHIVO
                // Ejemplo: "ofertas_15.html" -> busca los números y los vuelve un 15
                const coincidencia = archivoDesc.name.match(/\d+/);
                const porcentajeDelNombre = coincidencia ? Number(coincidencia[0]) : 0;

                console.log(`🏷️ Leyendo archivo: "${archivoDesc.name}" -> Detectado: ${porcentajeDelNombre}% de descuento.`);

                const bufferDesc = Buffer.from(await archivoDesc.arrayBuffer());
                const wbDesc = XLSX.read(bufferDesc, { type: "buffer" });
                const filasDesc = XLSX.utils.sheet_to_json(wbDesc.Sheets[wbDesc.SheetNames[0]]);

                for (const fDesc of filasDesc) {
                    // Usamos la columna del código universal para amarrarle el descuento
                    const codUniv = fDesc['COD. UNIVERSAL.']?.toString().trim();

                    if (codUniv) {
                        // Guardamos el porcentaje en nuestro diccionario indexado
                        dictDescuentos[codUniv] = porcentajeDelNombre;
                    }
                }
            }
        }
        console.log(`✅ Diccionario de descuentos unificado para ${Object.keys(dictDescuentos).length} productos.`);

        // 3. PASO 3: Leer Stock Global (SheetJS)
        const bufferStock = Buffer.from(await archivoStock.arrayBuffer());
        const workbook = XLSX.read(bufferStock, { type: "buffer" });
        const filas = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

        const productosMap = new Map();
        const variantesParaInsertar = [];

        // 4. PASO 4: Cruzar y Normalizar Datos
        for (const fila of filas) {
            const codUniversal = fila['COD.UNIV.']?.toString().trim();
            const genero = fila['GENERO']?.toString().trim();
            if (!codUniversal) continue;

            const llaveProducto = `${codUniversal}-${genero}`;

            // Buscamos si este producto tiene descuento en nuestro diccionario
            const descPorcentaje = dictDescuentos[codUniversal] || 0;
            const precioLista = Number(fila['LISTA']) || 0;
            const precioFinal = precioLista * (1 - descPorcentaje / 100);

            if (!productosMap.has(llaveProducto)) {
                productosMap.set(llaveProducto, {
                    cod_universal: codUniversal,
                    genero: genero,
                    marca: fila['MARCA']?.toString().trim() || "SIN MARCA",
                    modelo: fila['MODELO']?.toString().trim() || "SIN MODELO",
                    categoria: fila['CATEGORIA']?.toString().trim() || "GENERAL",
                    grupo: fila['GRUPO']?.toString().trim() || "VARIOS",
                    color: fila['COLOR']?.toString().trim() || "VARIOS",
                    precio_lista: precioLista,
                    descuento: descPorcentaje,
                    precio_final: precioFinal,
                    imagen_url: dictImagenes[codUniversal] || null
                });
            }

            // Dentro del bucle "for (const fila of filas)" del PASO 4:
            variantesParaInsertar.push({
                cod_universal: codUniversal,
                genero: genero, // <-- ASEGÚRATE DE QUE ESTA LÍNEA ESTÉ AQUÍ
                almacen: fila['IZQ']?.toString().trim() || "ALM",
                cod_prod: fila['COD.PROD']?.toString() || "",
                cod_barras: fila['COD.BARRAS']?.toString().trim(),
                talla: fila['TALLA']?.toString().trim() || "ÚNICA",
                precio_compra: Number(fila['COMPRA']) || 0
            });
        }

        // ==========================================
        // 5. PASO 5: Inserción Real con Índices Forzados
        // ==========================================
        try {
            console.log("🗑️ Borrando tablas antiguas para limpiar el esquema...");
            await turso.execute("PRAGMA foreign_keys = OFF;");
            await turso.execute("DROP TABLE IF EXISTS variantes;");
            await turso.execute("DROP TABLE IF EXISTS productos;");
            await turso.execute("PRAGMA foreign_keys = ON;");

            console.log("🏗️ Creando Tabla: Productos...");
            await turso.execute(`
        CREATE TABLE productos (
          cod_universal TEXT,
          genero TEXT,
          marca TEXT,
          modelo TEXT,
          categoria TEXT,
          grupo TEXT,
          color TEXT,
          precio_lista REAL,
          descuento REAL,
          precio_final REAL,
          imagen_url TEXT,
          PRIMARY KEY (cod_universal, genero)
        );
      `);

            console.log("🏗️ Creando Tabla: Variantes...");
            await turso.execute(`
        CREATE TABLE variantes (
          cod_universal TEXT,
          genero TEXT,
          almacen TEXT,
          cod_prod TEXT,
          cod_barras TEXT PRIMARY KEY,
          talla TEXT,
          precio_compra REAL,
          FOREIGN KEY (cod_universal, genero) REFERENCES productos(cod_universal, genero)
        );
      `);

            console.log("⚡ Forzando creación de Índices en la nube...");
            // Índices compuestos para que el motor jamás tenga que escanear la tabla completa
            await turso.execute("CREATE INDEX idx_variantes_lookup ON variantes (cod_universal, genero);");
            await turso.execute("CREATE INDEX idx_productos_lookup ON productos (cod_universal, genero);");

            console.log("📤 Insertando Productos Únicos...");
            const opsProductos = Array.from(productosMap.values()).map((p) => ({
                sql: `INSERT INTO productos VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                args: [p.cod_universal, p.genero, p.marca, p.modelo, p.categoria, p.grupo, p.color, p.precio_lista, p.descuento, p.precio_final, p.imagen_url]
            }));
            await turso.batch(opsProductos, "write");

            console.log("📤 Insertando Variantes por lotes...");
            const tamañoBloque = 2000;
            for (let i = 0; i < variantesParaInsertar.length; i += tamañoBloque) {
                const bloque = variantesParaInsertar.slice(i, i + tamañoBloque);
                const opsVariantes = bloque.map((v) => ({
                    sql: `INSERT OR IGNORE INTO variantes (cod_universal, genero, almacen, cod_prod, cod_barras, talla, precio_compra) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    args: [v.cod_universal, v.genero, v.almacen, v.cod_prod, v.cod_barras, v.talla, v.precio_compra]
                }));
                await turso.batch(opsVariantes, "write");
            }

            console.log("🎉 ¡PROCESO COMPLETADO! Estructura indexada al 100%.");
        } catch (error) {
            console.error("❌ Error SQL Catastrófico:", error);
        }

        revalidatePath("/");
    }

    return (
        // ... Tu interfaz se mantiene exactamente IGUAL que antes ...
        <main className="flex min-h-screen flex-col items-center justify-start bg-gray-950 p-8 text-white">
            <div className="w-full max-w-3xl">
                <h1 className="mb-2 text-3xl font-extrabold text-blue-400">Panel de Control Administrativo</h1>
                <form action={procesarArchivos} className="space-y-6 rounded-xl border border-gray-800 bg-gray-900 p-8 shadow-xl">
                    <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                        <label className="block text-sm font-bold tracking-wide text-gray-300 uppercase mb-2">1. Inventario Global (Falso Excel .xls)</label>
                        <input type="file" name="stock" accept=".xls,.xlsx" className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer" />
                    </div>
                    <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                        <label className="block text-sm font-bold tracking-wide text-gray-300 uppercase mb-2">2. Tabla de Imágenes (Archivo .html)</label>
                        <input type="file" name="imagenes" accept=".html" className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer" />
                    </div>
                    <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                        <label className="block text-sm font-bold tracking-wide text-gray-300 uppercase mb-2">3. Listas de Descuentos</label>
                        <input type="file" name="descuentos" multiple accept=".xls,.xlsx" className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer" />
                    </div>
                    {/* Botón de envío interactivo */}
                    <BotonCargar />
                </form>
            </div>
        </main>
    );
}
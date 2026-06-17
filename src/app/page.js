import { turso } from "@/lib/turso";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Settings, Database, Layers, CheckCircle2 } from "lucide-react";

export const revalidate = 0;

export default async function HomePage() {
  let todosLosProductos = [];
  let totalProductos = 0;

  try {
    const [resMeta, resMatriz] = await Promise.all([
      turso.execute("SELECT valor FROM metadata WHERE clave = 'total_productos' LIMIT 1;"),
      turso.execute("SELECT * FROM productos ORDER BY cod_universal;")
    ]);

    totalProductos = Number(resMeta.rows[0]?.valor) || resMatriz.rows.length;

    // 🔥 LA CORRECCIÓN: Convertimos las filas complejas de Turso a objetos planos puros de JS
    todosLosProductos = JSON.parse(JSON.stringify(resMatriz.rows));

  } catch (error) {
    console.error("❌ Error cargando el catálogo maestro:", error);
  }

  return (
    <main className="min-h-screen bg-background/50 text-foreground p-2 md:p-6 font-sans antialiased">
      <div className="mx-auto max-w-[98%] w-full space-y-4">

        {/* Componente Lógico Avanzado con Filtros y Columnas Configurables */}
        <DataTable data={todosLosProductos} title="Control General de Inventario" />

      </div>
    </main>
  );
}
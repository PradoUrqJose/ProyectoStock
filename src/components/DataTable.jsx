"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  Search,
  X,
  ChevronsLeft,
  ChevronsRight,
  Filter,
} from "lucide-react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Header de Ordenamiento Reutilizable con Alineación Soportada
const sortableHeader = (column, title, align = "left") => {
  const isSorted = column.getIsSorted();
  
  let btnClass = "justify-start text-left";
  if (align === "center") {
    btnClass = "justify-center text-center mx-auto";
  } else if (align === "right") {
    btnClass = "justify-end text-right ml-auto";
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => column.toggleSorting(isSorted === "asc")}
      className={`-ml-2 h-8 font-bold text-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-1 text-[11px] w-full ${btnClass}`}
    >
      <span>{title}</span>
      {isSorted === "asc" ? (
        <ChevronUp className="h-3 w-3 text-primary shrink-0" />
      ) : isSorted === "desc" ? (
        <ChevronDown className="h-3 w-3 text-primary shrink-0" />
      ) : (
        <ArrowUpDown className="h-2.5 w-2.5 text-muted-foreground/40 shrink-0" />
      )}
    </Button>
  );
};

export function DataTable({ data, title }) {
  const [sorting, setSorting] = React.useState([]);
  const [globalFilter, setGlobalFilter] = React.useState("");

  // Filtros Avanzados Reactivos de Selección Múltiple (Checkboxes)
  const [selectedMarcas, setSelectedMarcas] = React.useState([]);
  const [selectedCategorias, setSelectedCategorias] = React.useState([]);
  const [selectedGeneros, setSelectedGeneros] = React.useState([]);

  // Estados de popovers activos
  const [activePopover, setActivePopover] = React.useState(null); // 'marca' | 'categoria' | 'genero' | null
  const [showColMenu, setShowColMenu] = React.useState(false);

  // Vista previa de imagen
  const [previewImage, setPreviewImage] = React.useState(null);

  const colMenuRef = React.useRef(null);
  const filterPanelRef = React.useRef(null);

  // Cerrar menús al hacer clic afuera
  React.useEffect(() => {
    function handleClickOutside(event) {
      if (colMenuRef.current && !colMenuRef.current.contains(event.target)) {
        setShowColMenu(false);
      }
      if (filterPanelRef.current && !filterPanelRef.current.contains(event.target)) {
        setActivePopover(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Extraer valores únicos dinámicamente de forma óptima
  const marcas = React.useMemo(() => {
    const set = new Set(data.map((item) => item.marca).filter(Boolean));
    return Array.from(set).sort();
  }, [data]);

  const categorias = React.useMemo(() => {
    const set = new Set(data.map((item) => item.group_name || item.categoria).filter(Boolean));
    return Array.from(set).sort();
  }, [data]);

  const generos = React.useMemo(() => {
    const set = new Set(data.map((item) => item.genero).filter(Boolean));
    return Array.from(set).sort();
  }, [data]);

  // Filtrado Multivariable Local con Soporte Multiselección
  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      if (selectedMarcas.length > 0 && !selectedMarcas.includes(item.marca)) return false;
      const itemCat = item.group_name || item.categoria;
      if (selectedCategorias.length > 0 && !selectedCategorias.includes(itemCat)) return false;
      if (selectedGeneros.length > 0 && !selectedGeneros.includes(item.genero)) return false;
      return true;
    });
  }, [data, selectedMarcas, selectedCategorias, selectedGeneros]);

  // Visibilidad Inicial de Columnas
  const [columnVisibility, setColumnVisibility] = React.useState({
    genero: false,
    categoria: false,
    color: false,
    desc_10: false,
    desc_20: false,
    desc_30: false,
    desc_40: false,
    desc_50: false,
    desc_60: false,
    desc_70: false,
  });

  // Definición de Columnas
  const columns = React.useMemo(
    () => [
      {
        accessorKey: "imagen_url",
        id: "imagen_url",
        header: "Vista",
        cell: ({ row }) => {
          const url = row.getValue("imagen_url");
          return (
            <div
              className="w-12.5 h-12.5 flex items-center justify-center cursor-pointer rounded-md transition-all hover:bg-muted/30 group relative mx-auto p-5px"
              onClick={() => {
                if (url) setPreviewImage(url);
              }}
            >
              {url ? (
                <img
                  src={url}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                  loading="lazy"
                />
              ) : (
                <span className="text-[10px] text-muted-foreground font-mono font-medium">N/A</span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "cod_universal",
        id: "cod_universal",
        header: ({ column }) => sortableHeader(column, "Código Universal", "left"),
        cell: ({ row }) => <span className="font-mono font-bold tracking-tight text-foreground/90">{row.getValue("cod_universal")}</span>,
      },
      {
        accessorKey: "marca",
        id: "marca",
        header: ({ column }) => sortableHeader(column, "Marca", "left"),
        cell: ({ row }) => <span className="text-muted-foreground font-semibold uppercase text-[10px] bg-muted/50 py-0.5 px-1.5 rounded">{row.getValue("marca")}</span>,
      },
      {
        accessorKey: "modelo",
        id: "modelo",
        header: ({ column }) => sortableHeader(column, "Modelo", "left"),
        cell: ({ row }) => <span className="font-semibold tracking-tight text-foreground/80">{row.getValue("modelo")}</span>,
      },
      {
        accessorKey: "genero",
        id: "genero",
        header: ({ column }) => sortableHeader(column, "Género", "left"),
        cell: ({ row }) => <span className="text-muted-foreground font-medium uppercase text-[10px]">{row.getValue("genero")}</span>,
      },
      {
        accessorKey: "categoria",
        id: "categoria",
        header: ({ column }) => sortableHeader(column, "Categoría", "left"),
        cell: ({ row }) => <span className="text-muted-foreground font-medium text-[10px]">{row.getValue("categoria") || row.original.group_name}</span>,
      },
      {
        accessorKey: "color",
        id: "color",
        header: ({ column }) => sortableHeader(column, "Color", "left"),
        cell: ({ row }) => <span className="text-muted-foreground font-medium text-[10px]">{row.getValue("color")}</span>,
      },
      {
        accessorKey: "stock_total",
        id: "stock_total",
        header: ({ column }) => sortableHeader(column, "Stock", "center"),
        cell: ({ row }) => {
          const stock = Number(row.getValue("stock_total")) || 0;
          let colorClass = "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
          if (stock === 0) {
            colorClass = "bg-destructive/10 text-destructive border-destructive/20";
          } else if (stock <= 5) {
            colorClass = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
          }
          return (
            <div className="flex justify-center">
              <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-extrabold font-mono border ${colorClass} min-w-[28px]`}>
                {stock}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "precio_lista",
        id: "precio_lista",
        header: ({ column }) => sortableHeader(column, "P. Lista", "right"),
        cell: ({ row }) => <div className="text-right font-medium font-mono text-xs text-muted-foreground">S/ {Number(row.getValue("precio_lista"))?.toFixed(2)}</div>,
      },
      {
        accessorKey: "descuento",
        id: "descuento",
        header: ({ column }) => sortableHeader(column, "Descuento", "center"),
        cell: ({ row }) => {
          const desc = Number(row.getValue("descuento")) || 0;
          if (desc === 0) return <span className="text-muted-foreground/30 text-center block font-mono">-</span>;

          const colorsMap = {
            10: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
            20: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
            30: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
            40: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
            50: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
            60: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
            70: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
          };
          const colorClass = colorsMap[desc] || "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20";

          return (
            <div className="flex justify-center">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-extrabold font-mono border ${colorClass}`}>
                {desc}%
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "precio_final",
        id: "precio_final",
        header: ({ column }) => sortableHeader(column, "Precio Final", "left"),
        cell: ({ row }) => {
          const final = Number(row.getValue("precio_final")) || 0;
          return (
            <div className="text-left font-bold font-mono text-xs text-foreground">
              S/ {final.toFixed(2)}
            </div>
          );
        },
      },
      // Bloque de Descuentos
      ...[10, 20, 30, 40, 50, 60, 70].map((pct) => ({
        accessorKey: `desc_${pct}`,
        id: `desc_${pct}`,
        header: `${pct}%`,
        cell: ({ row }) => {
          const valor = row.getValue(`desc_${pct}`);
          if (!valor) return <span className="text-muted-foreground/30 text-center block font-mono">-</span>;
          const bgColors = {
            10: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
            20: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
            30: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
            40: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
            50: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
            60: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
            70: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
          };
          return (
            <div className={`text-center font-bold font-mono p-1 rounded text-[11px] border ${bgColors[pct]}`}>
              S/ {Number(valor).toFixed(0)}
            </div>
          );
        },
      })),
    ],
    [],
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, globalFilter, columnVisibility },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: { pageSize: 15 },
    },
  });

  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = table.getPageCount();

  // Calcular páginas visibles en el paginador
  const pageNumbers = React.useMemo(() => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(0, pageIndex - Math.floor(maxVisible / 2));
    let end = Math.min(pageCount - 1, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(0, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [pageIndex, pageCount]);

  return (
    <div className="space-y-3 font-sans">
      
      {/* 🛠️ PANEL DE FILTROS Y CONTROLES */}
      <div className="flex flex-col gap-3.5 bg-card p-4 rounded-xl border border-border/60 shadow-sm text-xs">
        
        {/* FILA 1: Título a la izquierda y Config de columnas a la derecha */}
        <div className="flex items-center justify-between border-b pb-2.5 border-border/50">
          <div>
            <h2 className="text-base font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <span>{title || "Inventario"}</span>
              <span className="text-[11.5px] text-muted-foreground font-normal bg-muted/65 px-2 py-0.5 rounded-full border border-border/40 font-mono">
                {filteredData.length}
              </span>
            </h2>
          </div>

          {/* Menú Desplegable de Columnas */}
          <div className="relative" ref={colMenuRef}>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-2 border-border/80 hover:bg-accent text-xs font-semibold shadow-sm transition-all"
              onClick={() => setShowColMenu(!showColMenu)}
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Columnas</span>
            </Button>
            {showColMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-lg border bg-card p-3 shadow-lg z-50 space-y-2 text-xs border-border/80 animate-in fade-in slide-in-from-top-1 duration-150">
                <p className="font-bold text-muted-foreground border-b pb-1.5 mb-1.5 uppercase tracking-wider text-[9px]">Ver/Ocultar Columnas</p>
                <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                  {table
                    .getAllLeafColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => {
                      const labelMap = {
                        imagen_url: "Imagen Vista",
                        cod_universal: "Código Universal",
                        marca: "Marca",
                        modelo: "Modelo",
                        genero: "Género",
                        categoria: "Categoría",
                        color: "Color",
                        stock_total: "Stock Total",
                        precio_lista: "Precio Lista",
                        descuento: "Descuento Activo",
                        precio_final: "Precio Final",
                        desc_10: "Matriz 10%",
                        desc_20: "Matriz 20%",
                        desc_30: "Matriz 30%",
                        desc_40: "Matriz 40%",
                        desc_50: "Matriz 50%",
                        desc_60: "Matriz 60%",
                        desc_70: "Matriz 70%",
                      };
                      return (
                        <label key={column.id} className="flex items-center gap-2.5 py-1 hover:bg-accent/50 rounded px-2 cursor-pointer transition-colors font-medium">
                          <input
                            type="checkbox"
                            checked={column.getIsVisible()}
                            onChange={column.getToggleVisibilityHandler()}
                            className="rounded border-border text-primary focus:ring-ring h-3.5 w-3.5 cursor-pointer"
                          />
                          <span>{labelMap[column.id] || column.id}</span>
                        </label>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FILA 2: Buscar + Filtros Checkbox a la izquierda | Paginador + Select de filas a la derecha */}
        <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center lg:justify-between">
          
          {/* Izquierda: Buscador + Checkbox Filters */}
          <div className="flex flex-wrap items-center gap-3.5" ref={filterPanelRef}>
            
            {/* Buscador */}
            <div className="flex items-center w-full sm:w-60 relative">
              <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Buscar por código, marca..."
                value={globalFilter ?? ""}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="h-8 pl-9 pr-8 text-xs font-medium bg-background border-border/80 focus-visible:ring-1"
              />
              {globalFilter && (
                <button
                  onClick={() => setGlobalFilter("")}
                  className="absolute right-2.5 p-1 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Selector Checkbox Marca */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className={`h-8 gap-1.5 border-border/85 text-xs font-semibold hover:bg-accent ${
                  selectedMarcas.length > 0 ? "bg-primary/10 text-primary border-primary/30" : ""
                }`}
                onClick={() => setActivePopover(activePopover === "marca" ? null : "marca")}
              >
                <span>Marca</span>
                {selectedMarcas.length > 0 && (
                  <span className="bg-primary text-primary-foreground rounded-full h-4 min-w-4 px-1 flex items-center justify-center text-[9px] font-extrabold font-mono">
                    {selectedMarcas.length}
                  </span>
                )}
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/60 ml-0.5" />
              </Button>
              {activePopover === "marca" && (
                <div className="absolute left-0 mt-2 w-56 rounded-lg border bg-card p-3 shadow-lg z-50 space-y-2 text-xs border-border/80 max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="flex items-center justify-between border-b pb-1.5 mb-1">
                    <span className="font-bold text-muted-foreground uppercase tracking-wider text-[9px]">Marcas</span>
                    {selectedMarcas.length > 0 && (
                      <button
                        onClick={() => setSelectedMarcas([])}
                        className="text-[10px] text-red-500 hover:underline font-semibold"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
                  <div className="space-y-1 pr-1">
                    {marcas.map((m) => (
                      <label key={m} className="flex items-center gap-2.5 py-1 hover:bg-accent/50 rounded px-1.5 cursor-pointer transition-colors font-medium">
                        <input
                          type="checkbox"
                          checked={selectedMarcas.includes(m)}
                          onChange={() => {
                            if (selectedMarcas.includes(m)) {
                              setSelectedMarcas(selectedMarcas.filter((x) => x !== m));
                            } else {
                              setSelectedMarcas([...selectedMarcas, m]);
                            }
                          }}
                          className="rounded border-border text-primary focus:ring-ring h-3.5 w-3.5 cursor-pointer"
                        />
                        <span className="uppercase text-[10px]">{m}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Selector Checkbox Categoría */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className={`h-8 gap-1.5 border-border/85 text-xs font-semibold hover:bg-accent ${
                  selectedCategorias.length > 0 ? "bg-primary/10 text-primary border-primary/30" : ""
                }`}
                onClick={() => setActivePopover(activePopover === "categoria" ? null : "categoria")}
              >
                <span>Categoría</span>
                {selectedCategorias.length > 0 && (
                  <span className="bg-primary text-primary-foreground rounded-full h-4 min-w-4 px-1 flex items-center justify-center text-[9px] font-extrabold font-mono">
                    {selectedCategorias.length}
                  </span>
                )}
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/60 ml-0.5" />
              </Button>
              {activePopover === "categoria" && (
                <div className="absolute left-0 mt-2 w-56 rounded-lg border bg-card p-3 shadow-lg z-50 space-y-2 text-xs border-border/80 max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="flex items-center justify-between border-b pb-1.5 mb-1">
                    <span className="font-bold text-muted-foreground uppercase tracking-wider text-[9px]">Categorías</span>
                    {selectedCategorias.length > 0 && (
                      <button
                        onClick={() => setSelectedCategorias([])}
                        className="text-[10px] text-red-500 hover:underline font-semibold"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
                  <div className="space-y-1 pr-1">
                    {categorias.map((c) => (
                      <label key={c} className="flex items-center gap-2.5 py-1 hover:bg-accent/50 rounded px-1.5 cursor-pointer transition-colors font-medium">
                        <input
                          type="checkbox"
                          checked={selectedCategorias.includes(c)}
                          onChange={() => {
                            if (selectedCategorias.includes(c)) {
                              setSelectedCategorias(selectedCategorias.filter((x) => x !== c));
                            } else {
                              setSelectedCategorias([...selectedCategorias, c]);
                            }
                          }}
                          className="rounded border-border text-primary focus:ring-ring h-3.5 w-3.5 cursor-pointer"
                        />
                        <span className="uppercase text-[10px]">{c}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Selector Checkbox Género */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className={`h-8 gap-1.5 border-border/85 text-xs font-semibold hover:bg-accent ${
                  selectedGeneros.length > 0 ? "bg-primary/10 text-primary border-primary/30" : ""
                }`}
                onClick={() => setActivePopover(activePopover === "genero" ? null : "genero")}
              >
                <span>Género</span>
                {selectedGeneros.length > 0 && (
                  <span className="bg-primary text-primary-foreground rounded-full h-4 min-w-4 px-1 flex items-center justify-center text-[9px] font-extrabold font-mono">
                    {selectedGeneros.length}
                  </span>
                )}
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/60 ml-0.5" />
              </Button>
              {activePopover === "genero" && (
                <div className="absolute left-0 mt-2 w-56 rounded-lg border bg-card p-3 shadow-lg z-50 space-y-2 text-xs border-border/80 max-h-72 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="flex items-center justify-between border-b pb-1.5 mb-1">
                    <span className="font-bold text-muted-foreground uppercase tracking-wider text-[9px]">Géneros</span>
                    {selectedGeneros.length > 0 && (
                      <button
                        onClick={() => setSelectedGeneros([])}
                        className="text-[10px] text-red-500 hover:underline font-semibold"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>
                  <div className="space-y-1 pr-1">
                    {generos.map((g) => (
                      <label key={g} className="flex items-center gap-2.5 py-1 hover:bg-accent/50 rounded px-1.5 cursor-pointer transition-colors font-medium">
                        <input
                          type="checkbox"
                          checked={selectedGeneros.includes(g)}
                          onChange={() => {
                            if (selectedGeneros.includes(g)) {
                              setSelectedGeneros(selectedGeneros.filter((x) => x !== g));
                            } else {
                              setSelectedGeneros([...selectedGeneros, g]);
                            }
                          }}
                          className="rounded border-border text-primary focus:ring-ring h-3.5 w-3.5 cursor-pointer"
                        />
                        <span className="uppercase text-[10px]">{g}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Botón de limpiar filtros */}
            {(selectedMarcas.length > 0 || selectedCategorias.length > 0 || selectedGeneros.length > 0) && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  setSelectedMarcas([]);
                  setSelectedCategorias([]);
                  setSelectedGeneros([]);
                }}
                className="text-red-500 dark:text-red-400 hover:bg-red-500/5 hover:text-red-600 border-red-500/20 font-semibold px-2 h-7 rounded-lg"
              >
                Limpiar Filtros
              </Button>
            )}
          </div>

          {/* Derecha: Paginador + Selector de número de filas */}
          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3.5 ml-auto lg:ml-0">
            {/* Selector de Filas */}
            <div className="flex items-center space-x-1.5">
              <span className="text-muted-foreground font-semibold text-[11px]">Ver:</span>
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                className="h-8 rounded-lg border border-border/85 bg-background px-2 py-1 text-xs font-bold font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors hover:bg-accent/40 cursor-pointer"
              >
                {[15, 30, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

            {/* Paginador */}
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="icon-xs"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="h-8 w-8 text-muted-foreground border-border/80 hover:bg-accent shadow-sm"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {pageNumbers.map((p) => (
                <Button
                  key={p}
                  variant={p === pageIndex ? "default" : "outline"}
                  size="sm"
                  className={`h-8 w-8 text-[11px] font-extrabold border-border/80 transition-all font-mono ${
                    p === pageIndex
                      ? "bg-primary text-primary-foreground hover:bg-primary/95 shadow"
                      : "hover:bg-accent"
                  }`}
                  onClick={() => table.setPageIndex(p)}
                >
                  {p + 1}
                </Button>
              ))}

              <Button
                variant="outline"
                size="icon-xs"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="h-8 w-8 text-muted-foreground border-border/80 hover:bg-accent shadow-sm"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 LA MATRIZ DE DISEÑO COMPACTO Y RENDIMIENTO ELEVADO */}
      <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-muted/30 border-b border-border/80">
                  {headerGroup.headers.map((header) => {
                    const colId = header.column.id;
                    const isImage = colId === "imagen_url";
                    let alignClass = "text-left";
                    if (colId === "stock_total" || colId === "descuento" || colId.startsWith("desc_")) {
                      alignClass = "text-center";
                    } else if (colId === "precio_lista" || colId === "precio_final") {
                      alignClass = "text-right";
                    }
                    return (
                      <TableHead
                        key={header.id}
                        className={`text-xs font-bold text-muted-foreground uppercase tracking-wider ${alignClass} ${
                          isImage ? "p-0 w-20 text-center" : "p-1.5"
                        }`}
                      >
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="text-[12px]">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row, index) => (
                  <TableRow
                    key={row.id}
                    className="hover:bg-muted/20 transition-colors animate-row-fade border-b border-border/40"
                    style={{ animationDelay: `${(index % 15) * 8}ms` }}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const colId = cell.column.id;
                      const isImage = colId === "imagen_url";
                      let alignClass = "text-left";
                      if (colId === "stock_total" || colId === "descuento" || colId.startsWith("desc_")) {
                        alignClass = "text-center";
                      } else if (colId === "precio_lista" || colId === "precio_final") {
                        alignClass = "text-right";
                      }
                      return (
                        <TableCell
                          key={cell.id}
                          className={`${alignClass} ${
                            isImage ? "p-0 align-middle w-20 text-center" : "p-1.5 align-middle"
                          }`}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-28 text-center text-muted-foreground font-medium text-sm">
                    Ningún registro coincide con los filtros especificados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* MODAL DE VISTA PREVIA DE IMAGEN (Click simple) */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-55 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-lg w-full bg-card rounded-xl border border-border/80 shadow-2xl p-2 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 bg-muted hover:bg-muted/80 text-foreground p-1.5 rounded-full shadow transition-all hover:scale-105 z-10"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="w-full h-[400px] flex items-center justify-center bg-muted/10 rounded-lg overflow-hidden">
              <img
                src={previewImage}
                alt="Vista previa del producto"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

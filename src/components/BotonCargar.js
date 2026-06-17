"use client";
import { useState } from "react";

export default function BotonCargar() {
    const [procesando, setProcesando] = useState(false);

    return (
        <button
            type="submit"
            onClick={() => setTimeout(() => setProcesando(true), 50)} // Espera un instante para dejar que el formulario valide
            disabled={procesando}
            className={`w-full rounded-md py-3 font-bold text-white transition-all flex items-center justify-center space-x-2 ${procesando
                    ? "bg-gray-700 cursor-not-allowed text-gray-400"
                    : "bg-green-600 hover:bg-green-700 active:scale-[0.99]"
                }`}
        >
            {procesando ? (
                <>
                    <span className="h-4 w-4 rounded-full border-2 border-gray-400 border-t-white animate-spin"></span>
                    <span>Procesando ERP Masivo... No cierres la ventana (11s)</span>
                </>
            ) : (
                <span>Procesar y Actualizar Base de Datos</span>
            )}
        </button>
    );
}
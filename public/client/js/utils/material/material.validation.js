import { materialState as state } from "../../state/material.state.js";

export function verificarDuplicado(nome) {

  if (!nome) return false;

  const nomeNormalizado = nome.trim().toUpperCase();

  return (state.listaMateriais || []).some(m => {
    return (m.nome || "").trim().toUpperCase() === nomeNormalizado;
  });

}
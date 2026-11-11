/** Un fallo mostrado arriba del editor; `code` deja decidir qué ofrecer (recargar, publicar igual). */
export type EditorProblem = {
  code: string;
  message: string;
  details: string[];
};

export type PageItem = number | "ellipsis-start" | "ellipsis-end";

const MAX_PAGES_WITHOUT_ELLIPSIS = 7;
const EDGE_PAGES = 5;

// Numéros de page affichés (à partir de 1), toujours sur 7 emplacements : première, dernière et voisines de la page courante.
export const getPageItems = (currentPage: number, pageCount: number): PageItem[] => {
  if (pageCount <= MAX_PAGES_WITHOUT_ELLIPSIS) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  if (currentPage < EDGE_PAGES) {
    return [...Array.from({ length: EDGE_PAGES }, (_, index) => index + 1), "ellipsis-end", pageCount];
  }

  if (currentPage > pageCount - EDGE_PAGES + 1) {
    return [1, "ellipsis-start", ...Array.from({ length: EDGE_PAGES }, (_, index) => pageCount - EDGE_PAGES + 1 + index)];
  }

  return [1, "ellipsis-start", currentPage - 1, currentPage, currentPage + 1, "ellipsis-end", pageCount];
};

/**
 * Construye las opciones de paginación/orden a partir del query string,
 * y devuelve también un objeto listo para armar la respuesta paginada.
 */
export function buildPagination(query, { defaultSortBy = "createdAt", defaultSortDirection = "desc" } = {}) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(query.pageSize, 10) || 10, 1), 100);
  const sortBy = query.sortBy || defaultSortBy;
  const sortDirection = (query.sortDirection || defaultSortDirection).toLowerCase() === "asc" ? 1 : -1;

  const skip = (page - 1) * pageSize;
  const sort = { [sortBy]: sortDirection };

  return { page, pageSize, skip, sort };
}

export function buildPaginatedResponse({ items, total, page, pageSize }) {
  return {
    items,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
    },
  };
}

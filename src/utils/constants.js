export const ROLES = Object.freeze({
  ADMIN: "Admin",
  CLIENT: "Client",
  DELIVERY: "Delivery",
  COMMERCE: "Commerce",
});

export const ORDER_STATUS = Object.freeze({
  PENDING: "Pending",
  IN_PROGRESS: "InProgress",
  COMPLETED: "Completed",
});

export const ORDER_STATUS_SEQUENCE = Object.freeze([
  ORDER_STATUS.PENDING,
  ORDER_STATUS.IN_PROGRESS,
  ORDER_STATUS.COMPLETED,
]);

export const TOKEN_EXPIRATION_HOURS = 24;

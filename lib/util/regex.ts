// alphanumeric and underscores, 3-16 characters
export const usernameRegex = /^[a-zA-Z0-9_]{3,16}$/
// uuid, with or without hyphens
export const uuidRegex =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/

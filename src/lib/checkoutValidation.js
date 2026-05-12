/**
 * Utilidades de validación para el flujo de Checkout
 */

export const NAME_PATTERN = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const NUMERIC_PATTERN = /^\d+$/;

/**
 * Valida un campo individual del formulario de checkout
 * @param {string} name - Nombre del campo
 * @param {string} value - Valor ingresado
 * @param {string} idType - Tipo de documento (opcional, para idNumber)
 * @returns {string|null} - Mensaje de error o null si es válido
 */
export const getValidationError = (name, value, idType = "V") => {
  const trimmed = String(value || "").trim();

  if (!trimmed && name !== "email" && name !== "notes") {
    return "Este campo es obligatorio";
  }

  switch (name) {
    case "name":
      if (!NAME_PATTERN.test(trimmed)) {
        return "El nombre solo debe contener letras";
      }
      if (trimmed.length < 3) {
        return "El nombre es muy corto";
      }
      break;

    case "idNumber": {
      const type = String(idType || "V").trim().toUpperCase();

      if (type === "P") {
        // Pasaporte: Alfanumérico, 6 a 12 caracteres
        if (!/^[a-zA-Z0-9]+$/.test(trimmed)) {
          return "El pasaporte debe ser alfanumérico";
        }
        if (trimmed.length < 6 || trimmed.length > 12) {
          return "Debe tener entre 6 y 12 caracteres";
        }
      } else {
        // V, E, J, G: Solo números
        if (!NUMERIC_PATTERN.test(trimmed)) {
          return "Debe ingresar solo números";
        }

        if (type === "V") {
          if (trimmed.length < 6 || trimmed.length > 8) {
            return "Cédula V: Debe tener entre 6 y 8 dígitos";
          }
        } else if (type === "E") {
          if (trimmed.length < 6 || trimmed.length > 9) {
            return "Cédula E: Debe tener entre 6 y 9 dígitos";
          }
        } else if (type === "J" || type === "G") {
          if (trimmed.length !== 9) {
            return `RIF ${type}: Debe tener exactamente 9 dígitos`;
          }
        }
      }
      break;
    }

    case "email":
      if (trimmed && !EMAIL_PATTERN.test(trimmed)) {
        return "Formato de correo inválido";
      }
      break;

    case "phone":
      const digits = trimmed.replace(/\D/g, "");
      if (digits.length < 10) {
        return "El teléfono debe tener al menos 10 dígitos";
      }
      break;

    case "reference":
      if (trimmed.length < 3) {
        return "Ingrese una referencia válida";
      }
      break;

    default:
      break;
  }

  return null;
};

/**
 * Valida todos los campos necesarios para procesar la orden
 * @param {object} formData - Datos del formulario
 * @param {string} idType - Tipo de documento
 * @returns {object} - Objeto mapeado { campo: error }
 */
export const validateEntireForm = (formData, idType) => {
  const errors = {};
  const fieldsToValidate = ["name", "idNumber", "phone", "reference"];

  fieldsToValidate.forEach((field) => {
    const error = getValidationError(field, formData[field], idType);
    if (error) errors[field] = error;
  });

  // El email solo se valida si se ingresó algo
  if (formData.email) {
    const emailError = getValidationError("email", formData.email);
    if (emailError) errors.email = emailError;
  }

  return errors;
};

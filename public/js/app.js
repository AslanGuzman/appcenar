// Cierra automáticamente los mensajes de éxito/error después de unos segundos
document.addEventListener("DOMContentLoaded", () => {
  const alerts = document.querySelectorAll(".alert");
  alerts.forEach((alert) => {
    setTimeout(() => {
      const instance = window.bootstrap?.Alert?.getOrCreateInstance(alert);
      if (instance) instance.close();
    }, 5000);
  });
});

/* ------------------------------------------------------------------ */
/* Botón para mostrar/ocultar contraseña en TODOS los campos password  */
/* ------------------------------------------------------------------ */
function setupPasswordToggles(scope = document) {
  scope.querySelectorAll('input[type="password"]').forEach((input) => {
    // Evita envolver dos veces el mismo input (por si el script corre de nuevo)
    if (input.closest(".password-toggle-group")) return;

    const wrapper = document.createElement("div");
    wrapper.className = "input-group password-toggle-group";

    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);

    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = "btn btn-outline-secondary password-toggle-btn";
    toggleBtn.setAttribute("aria-label", "Mostrar contraseña");
    toggleBtn.tabIndex = -1; // no interrumpe la navegación por Tab/Enter entre campos
    toggleBtn.innerHTML = '<i class="bi bi-eye"></i>';
    wrapper.appendChild(toggleBtn);

    toggleBtn.addEventListener("click", () => {
      const willShow = input.type === "password";
      input.type = willShow ? "text" : "password";
      toggleBtn.innerHTML = willShow ? '<i class="bi bi-eye-slash"></i>' : '<i class="bi bi-eye"></i>';
      toggleBtn.setAttribute("aria-label", willShow ? "Ocultar contraseña" : "Mostrar contraseña");
      input.focus();
    });
  });
}

/* ------------------------------------------------------------------ */
/* Al presionar Enter en un campo, salta automáticamente al siguiente  */
/* campo del formulario en vez de intentar enviarlo de una vez.        */
/* En el último campo, Enter sí envía el formulario normalmente.       */
/* ------------------------------------------------------------------ */
const ENTER_SKIP_TYPES = ["checkbox", "radio", "file", "submit", "button", "reset", "hidden"];

function getFocusableFormFields(form) {
  return Array.from(form.querySelectorAll("input, select, textarea")).filter((field) => {
    if (field.disabled || field.readOnly) return false;
    if (field.tagName === "INPUT" && ENTER_SKIP_TYPES.includes(field.type)) return false;
    if (field.classList.contains("password-toggle-btn")) return false;
    return field.offsetParent !== null; // solo campos visibles
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;

  const el = event.target;

  // En textareas, Enter debe seguir insertando saltos de línea normalmente.
  if (el.tagName === "TEXTAREA") return;

  const isEligibleInput = el.tagName === "INPUT" && !ENTER_SKIP_TYPES.includes(el.type);
  const isEligibleSelect = el.tagName === "SELECT";
  if (!isEligibleInput && !isEligibleSelect) return;

  const form = el.closest("form");
  if (!form) return;

  const fields = getFocusableFormFields(form);
  const currentIndex = fields.indexOf(el);
  if (currentIndex === -1) return;

  const nextField = fields[currentIndex + 1];
  if (nextField) {
    event.preventDefault();
    nextField.focus();
    if (nextField.tagName === "INPUT" && typeof nextField.select === "function") {
      nextField.select();
    }
  }
  // Si no hay siguiente campo (es el último), se deja el envío normal del formulario.
});

document.addEventListener("DOMContentLoaded", () => setupPasswordToggles());

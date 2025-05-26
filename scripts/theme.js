/**
 * Applies a time-based theme (dark or light mode) to the document body.
 */
function applyTimeBasedTheme() {
  if (!document.body) {
    console.error("document.body not found. Ensure script is run after body is parsed or via DOMContentLoaded.");
    return;
  }

  const currentHour = new Date().getHours();

  // Dark mode: 6 PM (18) to 6:59 AM (before 7)
  const isDarkMode = currentHour >= 18 || currentHour < 7;

  if (isDarkMode) {
    document.body.classList.add('dark-mode');
    document.body.classList.remove('light-mode');
    console.log("Theme applied: dark-mode");
  } else {
    document.body.classList.add('light-mode');
    document.body.classList.remove('dark-mode');
    console.log("Theme applied: light-mode");
  }
}

// Apply the theme when the script is loaded.
// Using DOMContentLoaded to be absolutely sure document.body is available,
// though with 'defer' this might be redundant but safe.
document.addEventListener('DOMContentLoaded', function() {
  applyTimeBasedTheme();
});

// Also call it directly in case DOMContentLoaded has already fired for some reason
// or if the script is loaded dynamically after DOM ready.
// If 'defer' is used, this direct call might execute after DOMContentLoaded anyway.
// The check within applyTimeBasedTheme for document.body handles cases where it might not be ready.
// applyTimeBasedTheme(); // Re-evaluating this direct call. DOMContentLoaded with defer is standard.
// Let's stick to DOMContentLoaded for applying the theme to avoid potential race conditions or multiple calls.
// The 'defer' attribute ensures the script is executed after the document is parsed but before DOMContentLoaded.
// So, a direct call should be fine if document.body is all that's needed.
// For simplicity and safety, let's ensure it runs once after DOM is ready.
// The 'DOMContentLoaded' listener is the most robust way for this with `defer`.

// If the script is loaded with 'defer', it will execute after the HTML is parsed but before DOMContentLoaded.
// In this case, document.body should be available.
// Let's simplify and call it directly, relying on `defer`.
applyTimeBasedTheme();

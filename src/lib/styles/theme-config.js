// Centralized theme configuration for easy style updates
export const themeConfig = {
  // Color scheme definitions
  colors: {
    // Primary brand colors
    primary: "#fb5c16",
    primaryHover: "#FF8418",

    // Secondary colors
    secondary: "#04dfff",
    accent: "#f9d72d",

    // Status colors
    success: "#28a745",
    warning: "#ffc107",
    danger: "#dc3545",
    info: "#17a2b8",
  },

  // Theme variants
  themes: {
    light: {
      background: "#f4f4f4",
      surface: "#FFF",
      text: {
        primary: "#222",
        secondary: "#444",
        muted: "#444",
      },
      borders: "#CCC",
      striped: "#f0f0f0",
    },
    dark: {
      background: "#222",
      surface: "#333",
      text: {
        primary: "#CCC",
        secondary: "#AAA",
        muted: "#999",
      },
      borders: "#4f4f4f",
      striped: "#262626",
    },
    mew: {
      background: "#160d25",
      surface: "#271843",
      footer: "#0e0917",
      text: {
        primary: "#CCC",
        secondary: "#ffffff88",
        muted: "#ffffff77",
      },
      borders: "#ffffff22",
      striped: "#160d25",
      primary: "#f9d72d",
      primaryHover: "#04dfff",
    },
  },

  // Typography scale
  typography: {
    fontFamily: {
      base: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
      mono: '"DejaVu", monospace',
    },
    fontSize: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
    },
    fontWeight: {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
    },
  },

  // Spacing scale
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
    "2xl": "3rem",
  },

  // Border radius
  borderRadius: {
    none: "0",
    sm: "2px",
    base: "4px",
    md: "5px",
    lg: "8px",
    full: "50%",
  },

  // Shadows
  shadows: {
    sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
    base: "0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)",
    md: "0 4px 6px rgba(0, 0, 0, 0.1)",
    lg: "0 10px 15px rgba(0, 0, 0, 0.1)",
    xl: "0 20px 25px rgba(0, 0, 0, 0.15)",
  },

  // Component-specific styles
  components: {
    navbar: {
      height: "55px",
      padding: "1rem",
    },
    card: {
      borderRadius: "5px",
      padding: "15px",
    },
    button: {
      borderRadius: "4px",
      padding: "0.5rem 1rem",
    },
  },
};

// Helper function to apply theme variables to CSS
export function applyThemeVariables(theme = "light") {
  const selectedTheme = themeConfig.themes[theme];
  const root = document.documentElement;

  // Apply color variables
  root.style.setProperty(
    "--main-color",
    selectedTheme.primary || themeConfig.colors.primary,
  );
  root.style.setProperty(
    "--main-color-hover",
    selectedTheme.primaryHover || themeConfig.colors.primaryHover,
  );
  root.style.setProperty("--background", selectedTheme.background);
  root.style.setProperty("--forms-bg", selectedTheme.surface);
  root.style.setProperty("--text-strong", selectedTheme.text.primary);
  root.style.setProperty("--text-color", selectedTheme.text.secondary);
  root.style.setProperty("--text-light", selectedTheme.text.muted);
  root.style.setProperty("--borders", selectedTheme.borders);
  root.style.setProperty("--striped-1", selectedTheme.striped);

  if (selectedTheme.footer) {
    root.style.setProperty("--footer", selectedTheme.footer);
  } else {
    root.style.setProperty("--footer", selectedTheme.surface);
  }
}

// Utility functions for consistent styling
export const styleUtils = {
  // Generate consistent button classes
  buttonClass: (variant = "primary", size = "md") => {
    const baseClasses = "btn transition-colors duration-200";
    const variantClasses = {
      primary: "btn-primary",
      secondary: "btn-secondary",
      info: "btn-info",
      outline: "btn-outline-primary",
    };
    const sizeClasses = {
      sm: "btn-sm",
      md: "",
      lg: "btn-lg",
    };

    return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`.trim();
  },

  // Generate consistent card classes
  cardClass: (variant = "default") => {
    const baseClasses = "border-no-flat";
    const variantClasses = {
      default: "div-cell",
      dark: "div-cell-dark",
      summary: "div-summary",
    };

    return `${baseClasses} ${variantClasses[variant]}`;
  },

  // Generate consistent text classes
  textClass: (variant = "primary", weight = "normal") => {
    const variantClasses = {
      primary: "text-strong",
      secondary: "text-color",
      muted: "text-light",
      accent: "erg-span",
    };
    const weightClasses = {
      normal: "",
      medium: "fw-medium",
      semibold: "fw-semibold",
      bold: "fw-bold",
    };

    return `${variantClasses[variant]} ${weightClasses[weight]}`.trim();
  },
};

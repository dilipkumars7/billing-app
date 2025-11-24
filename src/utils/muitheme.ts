import { extendTheme } from "@mui/joy/styles";

const theme = extendTheme({
  fontFamily: {
    display: 'DKSans',
    body: 'DKSans',
  },
  colorSchemes: {
    
    light: {
      palette: {
        primary: {
          50:  "#E6F0FF",
          100: "#CCE0FF",
          200: "#99C2FF",
          300: "#66A3FF",
          400: "#3385FF",
          500: "#0052CC",   // Atlassian “B400” approx
          600: "#0040A0",
          700: "#003070",
          800: "#002050",
          900: "#001030",
        },
        success: {
          50:  "#E6F8F2",
          100: "#CCF2E6",
          200: "#99E5CC",
          300: "#66D8B3",
          400: "#33C999",
          500: "#36B37E",   // Atlassian G300
          600: "#2A8C65",
          700: "#1F644C",
          800: "#143033",
          900: "#0A1A1F",
        },
        danger: {
          50:  "#FFEDEB",
          100: "#FFD9D6",
          200: "#FFB3AC",
          300: "#FF8D82",
          400: "#FF6858",
          500: "#FF5630",   // Atlassian R300
          600: "#CC4525",
          700: "#99341B",
          800: "#662210",
          900: "#33110A",
        }
      },
    },
    // Optionally configure dark mode too
  },
});
export default theme;

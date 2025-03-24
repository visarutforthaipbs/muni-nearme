const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// ANSI color codes for better logging
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

// Helper function for better logging
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Function to execute a command and log its output
function execute(command, cwd = process.cwd()) {
  log(`\n$ ${command}`, colors.cyan);
  try {
    execSync(command, {
      cwd,
      stdio: "inherit",
      env: { ...process.env },
    });
    return true;
  } catch (error) {
    log(`Error executing command: ${command}`, colors.red);
    log(error.message, colors.red);
    return false;
  }
}

async function build() {
  log("Starting build process...", colors.green);

  // Build the frontend
  log("Building frontend...", colors.blue);
  if (!execute("npm run build", path.join(process.cwd(), "frontend"))) {
    log("Frontend build failed!", colors.red);
    process.exit(1);
  }
  log("Frontend build completed successfully!", colors.green);

  // Copy the frontend build to the backend public directory for Render deployment
  log("Copying frontend build to backend...", colors.blue);
  const frontendBuildDir = path.join(process.cwd(), "frontend", "build");
  const backendPublicDir = path.join(process.cwd(), "backend", "public");

  // Create the backend public directory if it doesn't exist
  if (!fs.existsSync(backendPublicDir)) {
    fs.mkdirSync(backendPublicDir, { recursive: true });
  }

  // Copy the frontend build to the backend public directory
  execute(`cp -r ${frontendBuildDir}/* ${backendPublicDir}`);
  log("Frontend build copied to backend successfully!", colors.green);

  log("Build process completed successfully!", colors.green);
}

build().catch((error) => {
  log(`Build failed: ${error.message}`, colors.red);
  process.exit(1);
});

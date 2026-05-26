import { defineCliConfig } from 'sanity/cli'

// Env se carga con dotenv-cli en los scripts (dev/build/deploy); ver package.json

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID || process.env.PUBLIC_SANITY_PROJECT_ID || 'your-project-id',
    dataset: process.env.SANITY_STUDIO_DATASET || process.env.PUBLIC_SANITY_DATASET || 'production',
  },
  studioHost: 'porsche-reunions',
})

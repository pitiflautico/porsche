import { createClient, type SanityClient } from '@sanity/client';

const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = import.meta.env.PUBLIC_SANITY_DATASET ?? 'production';

/** Client solo existe si hay PROJECT_ID (evita fallo en Netlify/CI sin env). Configura PUBLIC_SANITY_PROJECT_ID y PUBLIC_SANITY_DATASET en Netlify. */
export const sanity: SanityClient | null =
  projectId && String(projectId).trim()
    ? createClient({
        projectId: String(projectId).trim(),
        dataset,
        apiVersion: '2024-01-01',
        useCdn: true,
      })
    : null;

import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { ImagesIcon } from '@sanity/icons'
import { orderableDocumentListDeskItem } from '@sanity/orderable-document-list'
import { schemaTypes } from './schemas'

export default defineConfig({
  name: 'porsche-reunions',
  title: 'Porsche Reunions',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || process.env.PUBLIC_SANITY_PROJECT_ID || 'your-project-id',
  dataset: process.env.SANITY_STUDIO_DATASET || process.env.PUBLIC_SANITY_DATASET || 'production',
  plugins: [
    structureTool({
      structure: (S, context) =>
        S.list()
          .title('Content')
          .items([
            orderableDocumentListDeskItem({
              type: 'galleryPhoto',
              title: 'Gallery',
              icon: ImagesIcon,
              S,
              context,
            }),
          ]),
    }),
  ],
  schema: {
    types: schemaTypes,
  },
})

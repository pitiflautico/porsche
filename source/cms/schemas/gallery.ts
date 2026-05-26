import { defineType, defineField } from 'sanity'
import { ImageIcon } from '@sanity/icons'
import { orderRankField } from '@sanity/orderable-document-list'

export const galleryPhotoType = defineType({
  name: 'galleryPhoto',
  title: 'Gallery Photo',
  type: 'document',
  icon: ImageIcon,
  fields: [
    defineField({
      name: 'photo',
      title: 'Photo',
      type: 'image',
      options: {
        hotspot: true,
        accept: 'image/jpeg,image/png,image/webp',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'caption',
      title: 'Caption (ES)',
      type: 'string',
      description: 'Pie de foto en español.',
    }),
    defineField({
      name: 'caption_en',
      title: 'Caption (EN)',
      type: 'string',
      description: 'English caption. If empty, the Spanish caption is shown.',
    }),
    defineField({
      name: 'alt',
      title: 'Alt text',
      type: 'string',
      description: 'Texto alternativo para accesibilidad (lectores de pantalla). Si está vacío, se usa el caption.',
    }),
    defineField({
      name: 'date',
      title: 'Date',
      type: 'date',
      initialValue: () => new Date().toISOString().split('T')[0],
    }),
    defineField({
      name: 'visible',
      title: 'Visible',
      type: 'boolean',
      description: 'Uncheck to hide this photo from the frontend without deleting it.',
      initialValue: true,
    }),
    orderRankField({ type: 'galleryPhoto' }),
  ],
  preview: {
    select: {
      caption: 'caption',
      caption_en: 'caption_en',
      visible: 'visible',
      media: 'photo',
    },
    prepare({ caption, caption_en, visible, media }) {
      const dot = visible === false ? 'Hidden' : 'Visible'
      const title = caption || caption_en || 'Untitled photo'

      return {
        title,
        subtitle: dot,
        media,
      }
    },
  },
})

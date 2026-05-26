/** GROQ: visible gallery photos ordered by drag-and-drop rank. */
export const GALLERY_PHOTOS_QUERY = `*[_type == "galleryPhoto" && visible != false] | order(orderRank) {
  _id,
  caption,
  caption_en,
  alt,
  date,
  "imageUrl": photo.asset->url,
  "lqip": photo.asset->metadata.lqip,
  "width": photo.asset->metadata.dimensions.width,
  "height": photo.asset->metadata.dimensions.height
}`;

export type GalleryPhoto = {
  _id: string;
  caption: string | null;
  caption_en: string | null;
  alt: string | null;
  date: string | null;
  imageUrl: string | null;
  lqip: string | null;
  width: number | null;
  height: number | null;
};

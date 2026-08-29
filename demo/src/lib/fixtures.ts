export const photos = [
  "/fixtures/bellfield/image0.jpeg",
  "/fixtures/bellfield/image1.jpeg",
  "/fixtures/bellfield/image2.jpeg",
  "/fixtures/bellfield/new-house.jpg",
  "/fixtures/bellfield/mark.jpg",
  "/fixtures/bellfield/aoife.jpg",
  "/fixtures/bellfield/siobhan.jpg",
] as const;

export function photo(index: number): string {
  return photos[index % photos.length];
}

export const placeOptions = [
  { id: "Dublin", title: "Dublin", hint: "County", radius: "25 km" },
  { id: "Swords", title: "Swords", hint: "Town", radius: "15 km" },
  { id: "Malahide", title: "Malahide", hint: "Town", radius: "15 km" },
  {
    id: "North County Dublin",
    title: "North County Dublin",
    hint: "Area",
    radius: "40 km",
  },
] as const;

export const serviceOptions = [
  { id: "roofing-replacement", title: "Roofing replacement", hint: "Current" },
  { id: "roof-repair", title: "Roof repair" },
  { id: "gutter-cleaning", title: "Gutter cleaning" },
] as const;

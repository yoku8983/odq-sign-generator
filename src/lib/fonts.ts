const FONT_DEFINITIONS = [
  { name: 'Mplus2c', url: '/fonts/Mplus2c-Medium.woff2' },
  { name: 'VialogLT', url: '/fonts/VialogLT-Regular.woff2' },
  { name: 'FrutigerBold', url: '/fonts/Frutiger-Bold.woff2' },
] as const;

export async function loadFonts(): Promise<void> {
  const faces = FONT_DEFINITIONS.map((def) => {
    const face = new FontFace(def.name, `url(${def.url})`);
    document.fonts.add(face);
    return face.load();
  });

  await Promise.all(faces);
  await document.fonts.ready;
}

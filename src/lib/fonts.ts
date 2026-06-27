const FONT_DEFINITIONS = [
  { name: 'Mplus2c', url: '/fonts/Mplus2c-Medium.ttf' },
  { name: 'VialogLT', url: '/fonts/VialogLT-Regular.ttf' },
  { name: 'FrutigerBold', url: '/fonts/Frutiger-Bold.ttf' },
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

// Redes y WhatsApp del local. Las usan el footer y la página Quiénes somos.
export const REDES = {
  whatsapp: { numero: "+54 9 2984 95-7572", url: "https://wa.me/5492984957572", color: "#25d366" },
  facebook: { url: "https://www.facebook.com/jscomputacionallen", color: "#1877f2" },
  instagram: { url: "https://www.instagram.com/jscomputacionallen/", color: "#e1306c" },
} as const;

export type RedSocial = keyof typeof REDES;
export const NOMBRES_REDES: Record<RedSocial, string> = {
  whatsapp: "WhatsApp",
  facebook: "Facebook",
  instagram: "Instagram",
};

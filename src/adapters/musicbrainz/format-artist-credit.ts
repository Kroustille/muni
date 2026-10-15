type ArtistCreditPart = {
  name?: string;
  joinphrase?: string;
  artist?: { name?: string };
};

export function formatArtistCredit(credits: ArtistCreditPart[] | undefined): string {
  if (credits === undefined || credits.length === 0) return "";
  return credits
    .map((part) => {
      const join = typeof part.joinphrase === "string" ? part.joinphrase : "";
      const name =
        typeof part.name === "string" && part.name.trim() !== ""
          ? part.name
          : typeof part.artist?.name === "string" && part.artist.name.trim() !== ""
            ? part.artist.name
            : "";
      return join + name;
    })
    .join("")
    .trim();
}

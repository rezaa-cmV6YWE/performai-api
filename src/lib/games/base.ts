export interface GameProfile {
  name: string | null;
  rating: number | null;
}

export interface GameAdapter {
  getProfile(server: string, cookie: string): Promise<GameProfile>;
}

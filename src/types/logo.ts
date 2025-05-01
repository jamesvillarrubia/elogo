export interface Logo {
  id: string;
  name: string;
  url: string;
  eloRating: number;
  totalMatches: number;
}

export interface LogoPair {
  logo1: Logo;
  logo2: Logo;
}

export interface LogoConfig {
  designBrief: string;
  logos: Omit<Logo, 'id' | 'eloRating' | 'totalMatches'>[];
} 
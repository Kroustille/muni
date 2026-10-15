export interface User {
  id: string;
  email: string;
  googleSub: string | null;
  createdAt: Date;
}

export interface NewUser {
  id: string;
  email: string;
  googleSub: string | null;
  createdAt: Date;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  /** Emails are stored and matched lowercased. */
  findByEmail(email: string): Promise<User | null>;
  findByGoogleSub(googleSub: string): Promise<User | null>;
  create(user: NewUser): Promise<User>;
  linkGoogleSub(userId: string, googleSub: string): Promise<User>;
}

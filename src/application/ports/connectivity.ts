export type Unsubscribe = () => void;

export interface Connectivity {
  isOnline(): boolean;
  onChange(listener: (online: boolean) => void): Unsubscribe;
}

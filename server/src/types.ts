export interface Category {
  id: string;
  name: string;
  target: number;
}

export interface Expense {
  id: string;
  date: string;
  amount: number;
  categoryId: string;
  note: string;
}

export interface Subscription {
  id: string;
  name: string;
  monthly: number;
  startMonth: number;
  endMonth: number;
  ongoing: boolean;
}

export interface YearData {
  categories: Category[];
  expenses: Expense[];
  subs: Subscription[];
}

export interface UserData {
  years: number[];
  datasets: Record<string, YearData>;
}

export interface SessionData {
  user?: string;
}

declare module 'express-session' {
  interface SessionData {
    user?: string;
  }
}


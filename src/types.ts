export type Task = {
  id: number;
  name: string;
  description: string;
};

export type NewTask = Omit<Task, "id">;

export type HttpError = Error & {
  status?: number;
};

export type TaskParams = {
  id: string;
};
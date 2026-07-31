export type GoalCategory = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  icon_key: string | null;
  is_active: boolean;
  task_count?: number;
};

export type GoalCategoryInput = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  icon_key: string;
  is_active: boolean;
};

export type CategoryResourceLink = {
  resource_id: string;
  sort_order: number;
  resources: { title: string } | null;
};

export type Category = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  icon_key: string | null;
  is_active: boolean;
  category_resources?: CategoryResourceLink[];
};

export type CategoryInput = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  icon_key: string;
  is_active?: boolean;
};

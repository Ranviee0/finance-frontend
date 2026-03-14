"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { api } from "@/lib/api";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type CategoryItem = {
  category: string;
  total_expense: string;
};

type Transaction = {
  id: number;
  type: string;
  datetime: string;
  category: string;
  notes: string;
  amount: string;
  created_at: string;
};

type CategorySummaryResponse = {
  transactions: Transaction[];
  total_expense: string;
};

type CategoryGroup = {
  id: string;
  name: string;
  colorId: string;
};

type GroupColorPreset = {
  id: string;
  label: string;
  badgeClassName: string;
};

const GROUP_COLOR_PRESETS: GroupColorPreset[] = [
  {
    id: "emerald",
    label: "Emerald",
    badgeClassName: "bg-emerald-100 text-emerald-800 ring-emerald-300",
  },
  {
    id: "sky",
    label: "Sky",
    badgeClassName: "bg-sky-100 text-sky-800 ring-sky-300",
  },
  {
    id: "amber",
    label: "Amber",
    badgeClassName: "bg-amber-100 text-amber-800 ring-amber-300",
  },
  {
    id: "rose",
    label: "Rose",
    badgeClassName: "bg-rose-100 text-rose-800 ring-rose-300",
  },
  {
    id: "violet",
    label: "Violet",
    badgeClassName: "bg-violet-100 text-violet-800 ring-violet-300",
  },
  {
    id: "teal",
    label: "Teal",
    badgeClassName: "bg-teal-100 text-teal-800 ring-teal-300",
  },
];

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).formatToParts(date);

  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  return `${getPart("day")} ${getPart("month")} ${getPart("year")} ${getPart("hour")}:${getPart("minute")}`;
}

function parseNumber(value: string): number {
  const n = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function formatAmount(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const detailColumns: ColumnDef<Transaction>[] = [
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => <span className="font-medium">{row.original.type}</span>,
  },
  {
    accessorKey: "datetime",
    header: "Date",
    sortingFn: (rowA, rowB) =>
      new Date(rowA.original.datetime).getTime() -
      new Date(rowB.original.datetime).getTime(),
    cell: ({ row }) => formatDateTime(row.original.datetime),
  },
  {
    accessorKey: "notes",
    header: "Notes",
  },
  {
    accessorKey: "amount",
    header: "Amount",
    sortingFn: (rowA, rowB) =>
      parseNumber(rowA.original.amount) - parseNumber(rowB.original.amount),
    cell: ({ row }) => <span className="block text-right">{row.original.amount}</span>,
  },
];

async function getCategories(): Promise<CategoryItem[]> {
  const response = await api.get<{ categories: CategoryItem[] }>("/api/category-all");
  return response.data.categories;
}

async function getCategorySummary(
  category: string,
  startDate?: Date,
  endDate?: Date,
): Promise<CategorySummaryResponse> {
  const params: Record<string, string> = { category };
  if (startDate) params.start_date = format(startDate, "yyyy-MM-dd");
  if (endDate) params.end_date = format(endDate, "yyyy-MM-dd");
  const response = await api.get<CategorySummaryResponse>("/api/category-summary", { params });
  return response.data;
}

function DatePicker({
  value,
  onChange,
  placeholder,
}: {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  placeholder: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[160px] justify-start text-left font-normal",
              !value && "text-muted-foreground",
            )}
          >
            <CalendarIcon />
            {value ? format(value, "dd MMM yyyy") : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={value} onSelect={onChange} />
        </PopoverContent>
      </Popover>
      {value && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onChange(undefined)}
          aria-label="Clear date"
        >
          <X />
        </Button>
      )}
    </div>
  );
}

export default function CategoryPage() {
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [startDate, setStartDate] = React.useState<Date | undefined>();
  const [endDate, setEndDate] = React.useState<Date | undefined>();
  const [checkedCategories, setCheckedCategories] = React.useState<Record<string, boolean>>({});
  const [groups, setGroups] = React.useState<CategoryGroup[]>([
    { id: "group-1", name: "Group1", colorId: GROUP_COLOR_PRESETS[0].id },
    { id: "group-2", name: "Group2", colorId: GROUP_COLOR_PRESETS[1].id },
  ]);
  const [categoryAssignments, setCategoryAssignments] = React.useState<Record<string, string>>({});

  const {
    data: categories = [],
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery<CategoryItem[]>({
    queryKey: ["category-all"],
    queryFn: getCategories,
  });

  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
  } = useQuery<CategorySummaryResponse>({
    queryKey: ["category-summary", selectedCategory, startDate, endDate],
    queryFn: () => getCategorySummary(selectedCategory!, startDate, endDate),
    enabled: selectedCategory !== null,
    staleTime: 300000,
    refetchOnWindowFocus: false,
  });

  React.useEffect(() => {
    setCategoryAssignments((prev) => {
      const validGroupIds = new Set(groups.map((group) => group.id));
      const next: Record<string, string> = {};

      for (const item of categories) {
        const assignedGroup = prev[item.category];
        if (assignedGroup && validGroupIds.has(assignedGroup)) {
          next[item.category] = assignedGroup;
        }
      }

      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(next);
      if (prevKeys.length !== nextKeys.length) return next;
      for (const key of prevKeys) {
        if (prev[key] !== next[key]) return next;
      }
      return prev;
    });
  }, [categories, groups]);

  React.useEffect(() => {
    setCheckedCategories((prev) => {
      const next: Record<string, boolean> = {};
      for (const item of categories) {
        if (prev[item.category]) next[item.category] = true;
      }
      return next;
    });
  }, [categories]);

  const selectedTotalExpense = React.useMemo(
    () => categories.find((item) => item.category === selectedCategory)?.total_expense ?? "-",
    [categories, selectedCategory]
  );

  const checkedTotal = React.useMemo(
    () =>
      categories.reduce((sum, item) => {
        if (!checkedCategories[item.category]) return sum;
        return sum + parseNumber(item.total_expense);
      }, 0),
    [categories, checkedCategories]
  );

  const checkedCount = React.useMemo(
    () => Object.values(checkedCategories).filter(Boolean).length,
    [checkedCategories]
  );

  const groupedSummaries = React.useMemo(
    () =>
      groups.map((group) => {
        const assignedCategories = categories.filter(
          (item) => categoryAssignments[item.category] === group.id
        );
        const total = assignedCategories.reduce(
          (sum, item) => sum + parseNumber(item.total_expense),
          0
        );
        return {
          group,
          assignedCategories,
          total,
        };
      }),
    [groups, categories, categoryAssignments]
  );

  const unassignedCategories = React.useMemo(
    () => categories.filter((item) => !categoryAssignments[item.category]),
    [categories, categoryAssignments]
  );

  const addGroup = () => {
    setGroups((prev) => {
      const nextIndex = prev.length;
      const colorId = GROUP_COLOR_PRESETS[nextIndex % GROUP_COLOR_PRESETS.length].id;
      return [
        ...prev,
        {
          id: `group-${nextIndex + 1}`,
          name: `Group${nextIndex + 1}`,
          colorId,
        },
      ];
    });
  };

  const updateGroupName = (groupId: string, name: string) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId ? { ...group, name } : group
      )
    );
  };

  const updateGroupColor = (groupId: string, colorId: string) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId ? { ...group, colorId } : group
      )
    );
  };

  const assignCategoryToGroup = (category: string, groupId: string) => {
    setCategoryAssignments((prev) => {
      const next = { ...prev };
      if (!groupId) {
        delete next[category];
        return next;
      }
      next[category] = groupId;
      return next;
    });
  };

  const categoryColumns = React.useMemo<ColumnDef<CategoryItem>[]>(
    () => [
      {
        id: "checked",
        header: "",
        cell: ({ row }) => {
          const category = row.original.category;
          return (
            <Checkbox
              checked={Boolean(checkedCategories[category])}
              onCheckedChange={(checked) => {
                const isChecked = Boolean(checked);
                setCheckedCategories((prev) => ({
                  ...prev,
                  [category]: isChecked,
                }));
              }}
              aria-label={`Select ${category}`}
            />
          );
        },
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => {
          const category = row.original.category;
          const isSelected = selectedCategory === category;
          return (
            <Button
              variant="ghost"
              className={cn(
                "h-auto p-0 font-medium",
                isSelected && "text-primary underline underline-offset-4"
              )}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          );
        },
      },
      {
        accessorKey: "total_expense",
        header: "Total Expense",
        sortingFn: (rowA, rowB) =>
          parseNumber(rowA.original.total_expense) -
          parseNumber(rowB.original.total_expense),
        cell: ({ row }) => (
          <span className="block text-right">{row.original.total_expense}</span>
        ),
      },
    ],
    [selectedCategory, checkedCategories]
  );

  if (categoriesLoading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  if (categoriesError) {
    return <div className="text-sm text-destructive">Failed to load categories.</div>;
  }

  return (
    <div className="w-full max-w-[1700px] mx-auto space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <DatePicker
              value={startDate}
              onChange={setStartDate}
              placeholder="Start date"
            />
            <span className="text-sm text-muted-foreground">to</span>
            <DatePicker
              value={endDate}
              onChange={setEndDate}
              placeholder="End date"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStartDate(undefined);
                setEndDate(undefined);
              }}
            >
              Clear Dates
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1">
              <div className="mb-2 rounded-md border px-3 py-2 text-sm">
                <span className="font-medium">Checked total:</span>{" "}
                {formatAmount(checkedTotal)}
                <span className="text-muted-foreground"> ({checkedCount} selected)</span>
              </div>
              <DataTable
                columns={categoryColumns}
                data={categories}
                caption="Category totals"
                initialSorting={[{ id: "total_expense", desc: true }]}
              />
            </div>

            {selectedCategory ? (
              <div className="space-y-3 rounded-lg border p-4 lg:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold">{selectedCategory}</h2>
                  <span className="rounded-full bg-muted px-3 py-0.5 text-sm font-medium">
                    Total: {selectedTotalExpense}
                  </span>
                </div>

                <div className="max-h-[70vh] overflow-y-auto">
                  {summaryLoading ? (
                    <div className="text-sm text-muted-foreground">Loading...</div>
                  ) : summaryError ? (
                    <div className="text-sm text-destructive">Failed to load transactions.</div>
                  ) : (
                    <DataTable
                      columns={detailColumns}
                      data={summary?.transactions ?? []}
                      caption="Category transactions"
                      initialSorting={[{ id: "datetime", desc: true }]}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border p-4 text-sm text-muted-foreground lg:col-span-2">
                Select a category from the table to view transactions.
              </div>
            )}
          </div>
    </div>
  );
}

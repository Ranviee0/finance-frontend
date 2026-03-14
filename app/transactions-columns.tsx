import { ColumnDef } from "@tanstack/react-table";

export type Transaction = {
  id: number;
  type: string;
  datetime: string;
  category: string;
  notes: string;
  amount: string;
  created_at: string;
  balance: string;
};

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
    parts.find((part) => part.type === type)?.value ?? "";

  return `${getPart("day")} ${getPart("month")} ${getPart("year")} ${getPart("hour")}:${getPart("minute")}`;
}

function parseNumber(value: string): number {
  const numericValue = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numericValue) ? numericValue : 0;
}

export const transactionColumns: ColumnDef<Transaction>[] = [
  {
    accessorKey: "type",
    header: "Invoice",
    cell: ({ row }) => <span className="font-medium">{row.original.type}</span>,
  },
  {
    accessorKey: "datetime",
    header: "Date",
    sortingFn: (rowA, rowB) => {
      const aTime = new Date(rowA.original.datetime).getTime();
      const bTime = new Date(rowB.original.datetime).getTime();
      return aTime - bTime;
    },
    cell: ({ row }) => formatDateTime(row.original.datetime),
  },
  {
    accessorKey: "category",
    header: "Category",
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
  {
    accessorKey: "balance",
    header: "Balance",
    sortingFn: (rowA, rowB) =>
      parseNumber(rowA.original.balance) - parseNumber(rowB.original.balance),
    cell: ({ row }) => <span className="block text-right">{row.original.balance}</span>,
  },
];
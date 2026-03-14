"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { DataTable } from "@/components/data-table";
import { Transaction, transactionColumns } from "./transactions-columns";

type TransactionsResponse =
  | Transaction[]
  | { data: Transaction[] }
  | { transactions: Transaction[] };

async function getTransactions(): Promise<Transaction[]> {
  const response = await api.get<TransactionsResponse>("/api/transactions");
  const payload = response.data;

  if (Array.isArray(payload)) return payload;
  if ("data" in payload && Array.isArray(payload.data)) return payload.data;
  if ("transactions" in payload && Array.isArray(payload.transactions)) {
    return payload.transactions;
  }

  return [];
}

export default function Home() {
  const { data = [], isLoading, error } = useQuery<Transaction[]>({
    queryKey: ["transactions"],
    queryFn: getTransactions,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Failed to load transactions.</div>;

  return (
    <div>
      <div className="w-7xl mx-auto">
        <DataTable
          columns={transactionColumns}
          data={data}
          caption="A list of your recent invoices."
          initialSorting={[{ id: "datetime", desc: true }]}
        />
      </div>
    </div>
  );
}

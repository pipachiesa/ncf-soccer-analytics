"use client";

import { useState } from "react";
import Papa from "papaparse";

import {
  EVENT_CSV_COLUMNS,
  type EventCsvRow,
  type CsvValidation,
  validateEventCsv,
} from "@/lib/event-import";

import { importEventRows, type ImportResult } from "./actions";

export function ImportClient() {
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<EventCsvRow[]>([]);
  const [validation, setValidation] = useState<CsvValidation | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  function handleFile(file: File | undefined) {
    setRows([]);
    setValidation(null);
    setParseErrors([]);
    setResult(null);

    if (!file) {
      setFileName("");
      return;
    }

    setFileName(file.name);

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setParseErrors(["Choose a .csv file."]);
      return;
    }

    Papa.parse<EventCsvRow>(file, {
      header: true,
      skipEmptyLines: "greedy",
      complete(parsed) {
        const parsedRows = parsed.data;
        const headers = parsed.meta.fields ?? [];

        setRows(parsedRows);
        setValidation(validateEventCsv(headers, parsedRows));
        setParseErrors(
          parsed.errors.map(
            (error) =>
              `Row ${typeof error.row === "number" ? error.row + 2 : "unknown"}: ${error.message}`,
          ),
        );
      },
      error(error) {
        setParseErrors([error.message]);
      },
    });
  }

  const hasBlockingIssues =
    !rows.length ||
    Boolean(parseErrors.length) ||
    Boolean(validation?.missingColumns.length) ||
    Boolean(validation?.unexpectedColumns.length) ||
    Boolean(validation?.rowWarnings.length);

  async function handleImport() {
    setIsImporting(true);
    setResult(null);

    try {
      setResult(await importEventRows(rows));
    } catch (error) {
      setResult({
        status: "error",
        message:
          error instanceof Error ? error.message : "The import could not be completed.",
      });
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-elevated p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-foreground">Choose event data</h2>
            <p className="mt-1 text-sm text-muted">
              Upload one match per CSV. Pitch coordinates must be between 0 and 100.
            </p>
          </div>
          <a
            href="/templates/events_template.csv"
            download
            className="text-sm font-medium text-foreground underline decoration-accent decoration-2 underline-offset-4"
          >
            Download template
          </a>
        </div>

        <label className="mt-5 flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-border bg-panel px-6 py-8 text-center text-sm text-foreground hover:border-accent">
          <span>{fileName || "Select a .csv file"}</span>
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(event) => handleFile(event.target.files?.[0])}
          />
        </label>
      </section>

      {validation || parseErrors.length ? (
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-panel p-5">
            <p className="text-sm text-muted">Total rows</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{rows.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-panel p-5">
            <p className="text-sm text-muted">Rows with warnings</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {validation?.rowWarnings.length ?? 0}
            </p>
          </div>
        </section>
      ) : null}

      {validation?.missingColumns.length ? (
        <Message title="Missing columns" messages={validation.missingColumns} />
      ) : null}
      {validation?.unexpectedColumns.length ? (
        <Message title="Unexpected columns" messages={validation.unexpectedColumns} />
      ) : null}
      {parseErrors.length ? (
        <Message title="CSV parsing errors" messages={parseErrors} />
      ) : null}
      {validation?.rowWarnings.length ? (
        <Message
          title="Row warnings"
          messages={validation.rowWarnings.slice(0, 20).map(
            (warning) => `Row ${warning.row}: ${warning.messages.join("; ")}`,
          )}
        />
      ) : null}

      {rows.length ? (
        <section className="overflow-hidden rounded-xl border border-border bg-panel">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-semibold text-foreground">Preview</h2>
            <p className="mt-1 text-sm text-muted">First 10 rows</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-max text-left text-xs">
              <thead className="bg-elevated text-foreground">
                <tr>
                  {EVENT_CSV_COLUMNS.map((column) => (
                    <th key={column} className="whitespace-nowrap px-3 py-2 font-medium">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.slice(0, 10).map((row, index) => (
                  <tr key={index}>
                    {EVENT_CSV_COLUMNS.map((column) => (
                      <td key={column} className="whitespace-nowrap px-3 py-2 text-foreground">
                        {row[column] || "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {result ? (
        <div
          role="status"
          className={`rounded-xl border p-5 text-sm ${
            result.status === "success"
              ? "border-accent bg-elevated text-foreground"
              : "border-pass-fail bg-panel text-pass-fail"
          }`}
        >
          {result.status === "success" ? (
            <p>
              Match {result.match}; {result.playersUpserted} players upserted;{" "}
              {result.eventsInserted} events inserted.
            </p>
          ) : (
            <p>{result.message}</p>
          )}
        </div>
      ) : null}

      {rows.length ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleImport}
            disabled={hasBlockingIssues || isImporting}
            className="rounded-md bg-accent px-5 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isImporting ? "Importing…" : "Import"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Message({ title, messages }: { title: string; messages: string[] }) {
  return (
    <section className="rounded-xl border border-accent bg-elevated p-5 text-sm text-foreground">
      <h2 className="font-semibold">{title}</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {messages.map((message, index) => (
          <li key={`${message}-${index}`}>{message}</li>
        ))}
      </ul>
    </section>
  );
}

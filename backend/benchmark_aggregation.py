import argparse
import csv
import json
import statistics
import time
from datetime import datetime, timezone
from pathlib import Path

from analytics import aggregate_equipment_summary
from database import get_collection


BASE_DIR = Path(__file__).resolve().parent
JSON_OUTPUT = BASE_DIR / "aggregation_benchmark.json"
CSV_OUTPUT = BASE_DIR / "aggregation_benchmark.csv"
DEFAULT_SIZES = [100, 1_000, 5_000, 10_000]


def benchmark_size(collection, document_limit: int, repeats: int) -> dict:
    aggregate_equipment_summary(collection, document_limit)
    durations = []
    processed_documents = 0
    group_count = 0

    for _ in range(repeats):
        started = time.perf_counter()
        groups = aggregate_equipment_summary(collection, document_limit)
        durations.append(time.perf_counter() - started)
        processed_documents = sum(group["readings"] for group in groups)
        group_count = len(groups)

    average_seconds = statistics.mean(durations)
    sorted_durations = sorted(durations)
    p95_index = min(len(sorted_durations) - 1, int(0.95 * len(sorted_durations)))
    return {
        "requested_documents": document_limit,
        "processed_documents": processed_documents,
        "groups_returned": group_count,
        "repeats": repeats,
        "processing_time_avg_ms": average_seconds * 1000,
        "query_latency_p50_ms": statistics.median(durations) * 1000,
        "query_latency_p95_ms": sorted_durations[p95_index] * 1000,
        "throughput_documents_per_second": (
            processed_documents / average_seconds if average_seconds else 0.0
        ),
    }


def run_benchmark(sizes: list[int] | None = None, repeats: int = 7) -> dict:
    if repeats < 1:
        raise ValueError("repeats must be at least 1")

    collection = get_collection("sensor_data")
    total_documents = collection.count_documents({})
    if total_documents == 0:
        raise RuntimeError("sensor_data kosong; impor data.csv ke MongoDB terlebih dahulu")

    requested_sizes = sizes or DEFAULT_SIZES + [total_documents]
    effective_sizes = sorted({min(size, total_documents) for size in requested_sizes if size > 0})
    if not effective_sizes:
        raise ValueError("sizes harus berisi bilangan positif")

    results = [benchmark_size(collection, size, repeats) for size in effective_sizes]
    return {
        "benchmark": "MongoDB equipment and operating-mode aggregation",
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "database": collection.database.name,
        "collection": collection.name,
        "total_documents_available": total_documents,
        "repeats_per_size": repeats,
        "warmup_runs_per_size": 1,
        "measurement": "Client-observed wall time from aggregate request through full cursor consumption",
        "pipeline_stages": ["$sort reading_id", "$limit", "$group", "$set anomaly_rate", "$sort groups"],
        "results": results,
    }


def save_results(report: dict) -> None:
    JSON_OUTPUT.write_text(json.dumps(report, indent=2), encoding="utf-8")
    results = report["results"]
    with CSV_OUTPUT.open("w", newline="", encoding="utf-8") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=list(results[0]))
        writer.writeheader()
        writer.writerows(results)


def main() -> None:
    parser = argparse.ArgumentParser(description="Benchmark read-only MongoDB aggregation")
    parser.add_argument("--repeats", type=int, default=7)
    parser.add_argument("--sizes", type=int, nargs="+", help="Document counts to benchmark")
    args = parser.parse_args()

    report = run_benchmark(args.sizes, args.repeats)
    save_results(report)
    print(f"MongoDB: {report['database']}.{report['collection']}")
    print(f"Documents available: {report['total_documents_available']}")
    print("size | process avg ms | latency p50 ms | latency p95 ms | throughput docs/s")
    for row in report["results"]:
        print(
            f"{row['processed_documents']:>5} | "
            f"{row['processing_time_avg_ms']:>14.3f} | "
            f"{row['query_latency_p50_ms']:>14.3f} | "
            f"{row['query_latency_p95_ms']:>14.3f} | "
            f"{row['throughput_documents_per_second']:>18.1f}"
        )
    print(f"JSON report: {JSON_OUTPUT.name}")
    print(f"CSV report: {CSV_OUTPUT.name}")


if __name__ == "__main__":
    main()
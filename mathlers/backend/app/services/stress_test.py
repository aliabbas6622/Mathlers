import time
import random
import json
from typing import List, Dict, Any
from mathlers.backend.app.services.question_engine import MathlersEngine

class StressTestHarness:
    """
    STRESS TEST HARNESS
    Verifies the system by running massive generations and calculating metrics.
    """

    def __init__(self, engine: MathlersEngine):
        self.engine = engine
        self.results = []
        self.start_time = 0
        self.end_time = 0

    def generate_synthetic_record(self, record_id: int) -> Dict[str, Any]:
        """Generates a random record card for testing."""
        categories = ["sports", "esports", "gaming", "science"]
        units = ["viewers", "USD", "seconds", "points"]

        value = random.randint(1000, 10000000)
        previous_value = round(value * random.uniform(0.5, 1.5), 2)

        return {
            "id": record_id,
            "title": f"Synthetic Record {record_id}",
            "value": value,
            "unit": random.choice(units),
            "previous_value": previous_value,
            "category": random.choice(categories),
            "verified": True,
            "version": 1
        }

    def run_test(self, num_iterations: int = 10000):
        """Runs the stress test and tracks performance."""
        print(f"Starting Stress Test: {num_iterations} iterations...")
        self.start_time = time.time()

        for i in range(num_iterations):
            record = self.generate_synthetic_record(i)
            iter_start = time.time()

            try:
                question = self.engine.generate_question(record, student_id=1, round_type="warm_up")
                success = question is not None
                error = None
            except Exception as e:
                success = False
                error = str(e)

            latency = time.time() - iter_start

            self.results.append({
                "iteration": i,
                "success": success,
                "latency": latency,
                "error": error,
                "math_topic": question.get('math_topic') if success else None
            })

            if i > 0 and i % 1000 == 0:
                print(f"Completed {i} iterations...")

        self.end_time = time.time()
        print("Stress test complete.")

    def generate_report(self) -> Dict[str, Any]:
        """Generates the metrics report."""
        total = len(self.results)
        successes = [r for r in self.results if r['success']]
        failures = [r for r in self.results if not r['success']]

        pass_rate = (len(successes) / total) * 100 if total > 0 else 0
        error_rate = (len(failures) / total) * 100 if total > 0 else 0

        # Latency
        latencies = [r['latency'] for r in self.results]
        avg_latency = sum(latencies) / total if total > 0 else 0

        # Throughput
        total_time = self.end_time - self.start_time
        throughput = total / total_time if total_time > 0 else 0

        # Check against requirements
        production_ready = (
            pass_rate >= 99.9 and
            error_rate <= 0.1
        )

        report = {
            "total_iterations": total,
            "pass_rate": f"{pass_rate:.2f}%",
            "error_rate": f"{error_rate:.2f}%",
            "avg_latency_ms": f"{avg_latency * 1000:.2f}ms",
            "throughput_req_per_sec": f"{throughput:.2f}",
            "total_time_sec": f"{total_time:.2f}",
            "production_ready": production_ready,
            "failure_types": self._summarize_failures(failures),
            "math_topic_distribution": self._summarize_topics(successes)
        }

        return report

    def _summarize_failures(self, failures: List[Dict]) -> Dict[str, int]:
        summary = {}
        for f in failures:
            err = f.get('error') or "Validation Filtered"
            summary[err] = summary.get(err, 0) + 1
        return summary

    def _summarize_topics(self, successes: List[Dict]) -> Dict[str, int]:
        summary = {}
        for s in successes:
            topic = s.get('math_topic')
            summary[topic] = summary.get(topic, 0) + 1
        return summary

if __name__ == "__main__":
    from mathlers.backend.app.services.question_engine import MathlersEngine

    engine = MathlersEngine()
    harness = StressTestHarness(engine)
    harness.run_test(10000)
    report = harness.generate_report()

    print("\n" + "="*40)
    print("🥊 MATHLERS STRESS TEST REPORT 🥊")
    print("="*40)
    print(json.dumps(report, indent=4))
    print("="*40)

    if report['production_ready']:
        print("✅ SYSTEM IS PRODUCTION READY")
    else:
        print("❌ SYSTEM FAILED PRODUCTION THRESHOLDS")

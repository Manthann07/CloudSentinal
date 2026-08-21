import { useEffect, useState } from "react";
import { api } from "./api/client";

const TEST_DETAILS = {
  "stop-ec2": ["Stop EC2", "Stops one ASG instance and measures replacement recovery."],
  "terminate-ec2": ["Terminate EC2", "Terminates one instance and verifies desired capacity recovery."],
  "detach-lb": ["Detach Load Balancer target", "Deregisters a target and verifies traffic failover."],
  "reboot-ec2": ["Reboot EC2", "Reboots one target while checking ALB availability."],
  "scale-asg": ["Force scale down", "Reduces ASG capacity, then restores it automatically."],
  "cpu-stress": ["CPU stress scale-out", "Uses SSM to trigger CloudWatch and ASG scale-out."],
  "sg-block": ["Security Group block", "Blocks one dedicated target and checks ALB failover."],
};

function readableName(testName) {
  return TEST_DETAILS[testName]?.[0] || testName;
}

function StatusPill({ status }) {
  return <span className={`status status-${status || "unknown"}`}>{status || "unknown"}</span>;
}

export default function App() {
  const [health, setHealth] = useState("checking");
  const [tests, setTests] = useState([]);
  const [runs, setRuns] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  const [report, setReport] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [busyTest, setBusyTest] = useState(null);
  const [error, setError] = useState("");

  async function loadDashboard() {
    try {
      const [healthData, testsData, runsData] = await Promise.all([
        api.health(),
        api.tests(),
        api.testRuns(),
      ]);
      setHealth(healthData.status);
      setTests(testsData.tests);
      setRuns(runsData);
      setError("");
    } catch (requestError) {
      setHealth("offline");
      setError(requestError.message);
    }
  }

  useEffect(() => {
    loadDashboard();
    const intervalId = window.setInterval(loadDashboard, 5000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!selectedRun) return;
    const intervalId = window.setInterval(async () => {
      try {
        const run = await api.testRun(selectedRun.id);
        setSelectedRun(run);
        if (run.status === "passed" || run.status === "failed") {
          setReport(await api.report(run.id));
          setBusyTest(null);
        }
      } catch (requestError) {
        setError(requestError.message);
      }
    }, 3000);
    return () => window.clearInterval(intervalId);
  }, [selectedRun?.id]);

  async function startTest(testName) {
    if (!confirmed) {
      setError("Confirm that you understand this test changes AWS infrastructure first.");
      return;
    }
    try {
      setError("");
      setBusyTest(testName);
      const started = await api.runTest(testName);
      const run = await api.testRun(started.run_id);
      setSelectedRun(run);
      setReport(null);
      await loadDashboard();
    } catch (requestError) {
      setBusyTest(null);
      setError(requestError.message);
    }
  }

  async function openRun(run) {
    setSelectedRun(run);
    setReport(null);
    try {
      const currentRun = await api.testRun(run.id);
      setSelectedRun(currentRun);
      if (currentRun.status === "passed" || currentRun.status === "failed") {
        setReport(await api.report(run.id));
      }
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">AWS reliability validation</p>
          <h1>CloudSentinel</h1>
          <p className="subtitle">Run controlled failure tests and inspect real AWS recovery behavior.</p>
        </div>
        <div className="api-status">
          <span className={`indicator indicator-${health}`} />
          API {health}
        </div>
      </header>

      {error && <div className="alert">{error}</div>}

      <section className="warning-card">
        <input
          id="confirm"
          type="checkbox"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
        />
        <label htmlFor="confirm">
          I understand that running a test intentionally changes AWS infrastructure.
        </label>
      </section>

      <section>
        <div className="section-heading">
          <div>
            <p className="eyebrow">Reliability tests</p>
            <h2>Run a controlled validation</h2>
          </div>
          <button className="secondary-button" onClick={loadDashboard}>Refresh</button>
        </div>
        <div className="test-grid">
          {tests.map((testName) => {
            const [, description] = TEST_DETAILS[testName] || [testName, "Cloud reliability test"];
            return (
              <article className="test-card" key={testName}>
                <p className="test-number">{testName}</p>
                <h3>{readableName(testName)}</h3>
                <p>{description}</p>
                <button
                  className="primary-button"
                  disabled={!confirmed || busyTest !== null || health !== "ok"}
                  onClick={() => startTest(testName)}
                >
                  {busyTest === testName ? "Starting…" : "Run test"}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="content-grid">
        <article className="panel">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow">History</p>
              <h2>Recent runs</h2>
            </div>
          </div>
          {runs.length === 0 ? (
            <p className="empty-state">No API test runs yet.</p>
          ) : (
            <div className="run-list">
              {runs.map((run) => (
                <button className="run-row" key={run.id} onClick={() => openRun(run)}>
                  <span>
                    <strong>{readableName(run.test_name)}</strong>
                    <small>{new Date(run.created_at).toLocaleString()}</small>
                  </span>
                  <StatusPill status={run.status} />
                </button>
              ))}
            </div>
          )}
        </article>

        <article className="panel report-panel">
          <p className="eyebrow">Live report</p>
          <h2>{selectedRun ? readableName(selectedRun.test_name) : "Select a test run"}</h2>
          {!selectedRun && <p className="empty-state">Start a test or select one from history.</p>}
          {selectedRun && (
            <>
              <StatusPill status={selectedRun.status} />
              <p className="summary">{report?.summary || selectedRun.summary || "Test is running…"}</p>
              {report?.recommendation && <p className="recommendation">{report.recommendation}</p>}
              <pre>{report?.output || selectedRun.output || "Waiting for output…"}</pre>
            </>
          )}
        </article>
      </section>
    </main>
  );
}

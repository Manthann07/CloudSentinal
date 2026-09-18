import { useState, useRef, useEffect } from "react";
import {
  Terminal,
  FileText,
  Clock,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Cpu,
  Layers,
  Filter,
  ArrowDownCircle,
  Cloud,
  CloudLightning,
  CloudCheck,
} from "lucide-react";
import { TEST_METADATA } from "./TestGrid";
import { soundFX } from "../utils/audio";

export default function TerminalReportSection({
  runs,
  selectedRun,
  report,
  onSelectRun,
}) {
  const [activeTab, setActiveTab] = useState("terminal"); // 'terminal' | 'report'
  const [filterStatus, setFilterStatus] = useState("all");
  const [logFilter, setLogFilter] = useState("ALL"); // ALL, INFO, WARN, ERROR
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [autoScroll, setAutoScroll] = useState(false);
  const terminalBodyRef = useRef(null);

  useEffect(() => {
    if (activeTab === "terminal" && autoScroll && terminalBodyRef.current) {
      terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
    }
  }, [selectedRun?.output, report?.output, activeTab, autoScroll]);

  useEffect(() => {
    if (terminalBodyRef.current) {
      terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
    }
  }, [selectedRun?.id]);

  const filteredRuns = runs.filter((run) => {
    if (filterStatus === "all") return true;
    return run.status === filterStatus;
  });

  const getTestTitle = (testName) => {
    return TEST_METADATA[testName]?.title || testName;
  };

  const handleCopyLogs = () => {
    soundFX.playClick();
    const textToCopy = report?.output || selectedRun?.output || "No output logs available.";
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const rawOutput = report?.output || selectedRun?.output || "System idling. Select an execution run from the ledger to inspect live AWS cloud stdout logs.";

  const lines = rawOutput.split("\n");

  const filteredLogLines = lines.filter((line) => {
    if (logFilter === "ALL") return true;
    if (logFilter === "ERROR") return line.includes("ERROR") || line.includes("FAIL") || line.includes("Failed");
    if (logFilter === "WARN") return line.includes("WARN") || line.includes("Warning");
    if (logFilter === "INFO") return !line.includes("ERROR") && !line.includes("FAIL");
    return true;
  });

  const formatLogLine = (line, index) => {
    let lineClass = "log-line-default";
    if (line.includes("ERROR") || line.includes("Failed") || line.includes("FAIL")) {
      lineClass = "log-line-error";
    } else if (line.includes("SUCCESS") || line.includes("Passed") || line.includes("PASS")) {
      lineClass = "log-line-success";
    } else if (line.includes("WARN") || line.includes("Warning")) {
      lineClass = "log-line-warn";
    } else if (line.includes("AWS") || line.includes("EC2") || line.includes("ALB") || line.includes("ASG")) {
      lineClass = "log-line-aws";
    }

    return (
      <div key={index} className={`terminal-log-line ${lineClass}`}>
        <span className="log-line-num">{(index + 1).toString().padStart(3, "0")}</span>
        <span className="log-line-content">{line}</span>
      </div>
    );
  };

  return (
    <section className={`terminal-report-workspace ${isFullScreen ? "is-fullscreen-modal" : ""}`}>
      <div className="workspace-header">
        <div className="section-eyebrow">
          <Cloud className="eyebrow-icon text-cyan" />
          <span>AWS CLOUD TELEMETRY & INTELLIGENCE DECK</span>
        </div>
        <h2 className="section-title">Execution Console & Cloud Analysis</h2>
      </div>

      <div className="workspace-grid">
        {/* Left Column: History Ledger */}
        <aside className="history-panel">
          <div className="panel-header">
            <div className="panel-title-group">
              <Clock className="panel-icon" />
              <h3>Cloud Execution Ledger</h3>
            </div>
            <span className="run-count-badge">{runs.length} Runs</span>
          </div>

          <div className="history-filter-bar">
            {["all", "passed", "failed", "running"].map((status) => (
              <button
                key={status}
                className={`history-filter-chip ${filterStatus === status ? "active" : ""}`}
                onClick={() => {
                  soundFX.playClick();
                  setFilterStatus(status);
                }}
              >
                {status.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="history-scroll-list">
            {filteredRuns.length === 0 ? (
              <div className="empty-history">
                <Filter className="empty-history-icon" />
                <p>No cloud test runs found matching filter "{filterStatus}".</p>
              </div>
            ) : (
              filteredRuns.map((run) => {
                const isSelected = selectedRun?.id === run.id;
                const dateStr = new Date(run.created_at || Date.now()).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                });

                return (
                  <button
                    key={run.id}
                    className={`history-row ${isSelected ? "selected" : ""}`}
                    onClick={() => {
                      soundFX.playClick();
                      onSelectRun(run);
                    }}
                  >
                    <div className="row-main">
                      <div className="row-title-line">
                        <Cloud className="row-cloud-icon" />
                        <span className="row-test-name">{getTestTitle(run.test_name)}</span>
                        <ChevronRight className="row-arrow" />
                      </div>
                      <div className="row-meta">
                        <span className="run-id-tag">#{run.id?.toString().slice(-6)}</span>
                        <span className="run-time-tag">{dateStr}</span>
                      </div>
                    </div>

                    <div className={`status-pill status-${run.status || "unknown"}`}>
                      <span className="status-pulse-dot" />
                      <span>{run.status}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Column: Cyber Console & Intelligence Report */}
        <main className="telemetry-panel">
          <div className="telemetry-tabs-bar">
            <div className="tabs-left">
              <button
                className={`nav-tab ${activeTab === "terminal" ? "active" : ""}`}
                onClick={() => {
                  soundFX.playClick();
                  setActiveTab("terminal");
                }}
              >
                <Terminal className="tab-icon" />
                <span>Live Cyber Console</span>
              </button>
              <button
                className={`nav-tab ${activeTab === "report" ? "active" : ""}`}
                onClick={() => {
                  soundFX.playClick();
                  setActiveTab("report");
                }}
              >
                <FileText className="tab-icon" />
                <span>Cloud Intelligence Report</span>
              </button>
            </div>

            <div className="tabs-right">
              {selectedRun && (
                <div className={`active-run-badge status-${selectedRun.status}`}>
                  <CloudLightning className="badge-cloud-icon" />
                  <span>RUN ID: {selectedRun.id}</span>
                </div>
              )}
            </div>
          </div>

          {!selectedRun ? (
            <div className="empty-telemetry">
              <Cpu className="empty-telemetry-icon" />
              <h3>No Cloud Experiment Selected</h3>
              <p>Select a scenario execution from the ledger on the left or execute a new cloud test above.</p>
            </div>
          ) : activeTab === "terminal" ? (
            <div className="terminal-window">
              <div className="terminal-bar">
                <div className="terminal-dots">
                  <span className="dot dot-red" />
                  <span className="dot dot-yellow" />
                  <span className="dot dot-green" />
                </div>
                <div className="terminal-title">
                  cloudsentinel@aws-cloud-matrix: ~/fault-experiments / {selectedRun.test_name}
                </div>
                <div className="terminal-actions">
                  <button
                    className={`term-action-btn ${autoScroll ? "active-scroll" : ""}`}
                    onClick={() => {
                      soundFX.playClick();
                      setAutoScroll(!autoScroll);
                    }}
                    title={autoScroll ? "Auto-scroll ON (click to lock position)" : "Auto-scroll OFF"}
                  >
                    <ArrowDownCircle />
                    <span>Auto-Scroll: {autoScroll ? "ON" : "OFF"}</span>
                  </button>

                  <div className="log-filter-group">
                    {["ALL", "INFO", "WARN", "ERROR"].map((lvl) => (
                      <button
                        key={lvl}
                        className={`log-lvl-btn ${logFilter === lvl ? "active" : ""}`}
                        onClick={() => {
                          soundFX.playClick();
                          setLogFilter(lvl);
                        }}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>

                  <button className="term-action-btn" onClick={handleCopyLogs} title="Copy Raw Logs">
                    {copied ? <Check className="text-emerald" /> : <Copy />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>

                  <button
                    className="term-action-btn"
                    onClick={() => {
                      soundFX.playClick();
                      setIsFullScreen(!isFullScreen);
                    }}
                    title={isFullScreen ? "Exit Fullscreen" : "Fullscreen Console"}
                  >
                    {isFullScreen ? <Minimize2 /> : <Maximize2 />}
                  </button>
                </div>
              </div>

              {selectedRun.status === "queued" || selectedRun.status === "running" ? (
                <div className="live-progress-bar">
                  <div className="progress-fill" />
                  <span className="progress-text">EXECUTING AWS CLOUD FAULT EXPERIMENT... DO NOT DISCONNECT</span>
                </div>
              ) : null}

              <div className="terminal-body" ref={terminalBodyRef}>
                {filteredLogLines.map((line, idx) => formatLogLine(line, idx))}
              </div>
            </div>
          ) : (
            <div className="report-dashboard">
              <div className={`report-status-banner banner-${selectedRun.status}`}>
                <div className="banner-left">
                  {selectedRun.status === "passed" ? (
                    <CloudCheck className="banner-icon text-emerald" />
                  ) : selectedRun.status === "failed" ? (
                    <AlertTriangle className="banner-icon text-crimson" />
                  ) : (
                    <Clock className="banner-icon text-amber" />
                  )}
                  <div>
                    <h3>
                      Cloud Experiment Status:{" "}
                      <strong style={{ textTransform: "uppercase" }}>{selectedRun.status}</strong>
                    </h3>
                    <p>Scenario: {getTestTitle(selectedRun.test_name)}</p>
                  </div>
                </div>
              </div>

              <div className="report-sections">
                <div className="report-card">
                  <h4 className="report-card-title">
                    <Cloud className="card-title-icon text-cyan" />
                    AWS Cloud Summary & Findings
                  </h4>
                  <p className="report-text">
                    {report?.summary || selectedRun.summary || "Summary report generation in progress..."}
                  </p>
                </div>

                {report?.recommendation && (
                  <div className="report-card recommendation-card">
                    <h4 className="report-card-title text-emerald">
                      <ShieldCheck className="card-title-icon" />
                      Sentinel Cloud Architectural Recommendation
                    </h4>
                    <p className="report-text text-emerald-light">{report.recommendation}</p>
                  </div>
                )}

                <div className="report-card">
                  <h4 className="report-card-title">Raw Command & Telemetry Logs</h4>
                  <pre className="report-raw-output">
                    {report?.output || selectedRun.output || "No log output recorded."}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </section>
  );
}

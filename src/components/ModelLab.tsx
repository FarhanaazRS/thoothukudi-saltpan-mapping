import { useState, useMemo } from 'react'
import type { DashboardData } from '../state/useDashboardData'
import type { ModelBenchmarkRow } from '../types'

interface ModelLabProps {
  data: DashboardData
}

type MetricSort = 'model' | 'overall_accuracy' | 'balanced_accuracy' | 'salt_precision' | 'salt_recall' | 'salt_f1' | 'roc_auc' | 'pr_auc'

export function ModelLab({ data }: ModelLabProps) {
  const { models, confusionMatrices, featureImportance } = data
  const [selectedModel, setSelectedModel] = useState<string>('SVM_RBF')
  const [importanceModel, setImportanceModel] = useState<string>('RandomForest')
  const [sortField, setSortField] = useState<MetricSort>('salt_f1')
  const [sortAsc, setSortAsc] = useState<boolean>(false)

  const modelRows: ModelBenchmarkRow[] = useMemo(() => {
    return Array.isArray(models.data) ? models.data : []
  }, [models.data])

  // Sorting
  const sortedModels = useMemo(() => {
    return [...modelRows].sort((a, b) => {
      let vA = a[sortField] ?? 0
      let vB = b[sortField] ?? 0
      if (typeof vA === 'string') {
        return sortAsc ? String(vA).localeCompare(String(vB)) : String(vB).localeCompare(String(vA))
      }
      return sortAsc ? (vA as number) - (vB as number) : (vB as number) - (vA as number)
    })
  }, [modelRows, sortField, sortAsc])

  // Find max values for highlighting best per column
  const bests = useMemo(() => {
    if (modelRows.length === 0) return {}
    return {
      acc: Math.max(...modelRows.map((m) => m.overall_accuracy)),
      balAcc: Math.max(...modelRows.map((m) => m.balanced_accuracy)),
      prec: Math.max(...modelRows.map((m) => m.salt_precision)),
      rec: Math.max(...modelRows.map((m) => m.salt_recall)),
      f1: Math.max(...modelRows.map((m) => m.salt_f1)),
      roc: Math.max(...modelRows.map((m) => m.roc_auc ?? 0)),
      pr: Math.max(...modelRows.map((m) => m.pr_auc ?? 0)),
    }
  }, [modelRows])

  const handleSort = (field: MetricSort) => {
    if (sortField === field) {
      setSortAsc((prev) => !prev)
    } else {
      setSortField(field)
      setSortAsc(false)
    }
  }

  // Active confusion matrix
  const activeCM = useMemo(() => {
    if (!confusionMatrices.data) return null
    return confusionMatrices.data[selectedModel] ?? null
  }, [confusionMatrices.data, selectedModel])

  const activeModelDetails = useMemo(() => {
    return modelRows.find((m) => m.model === selectedModel)
  }, [modelRows, selectedModel])

  // Active feature importance
  const activeImportance = useMemo(() => {
    if (!featureImportance.data) return []
    const list = featureImportance.data[importanceModel]
    return Array.isArray(list) ? list : []
  }, [featureImportance.data, importanceModel])

  return (
    <div className="model-lab-page">
      {/* ── Headline Metric Cards ────────────────────────────────────────────── */}
      <section className="kpis" aria-label="Model Benchmark Highlights">
        <div className="kpi" title="SVM RBF achieved highest accuracy (99.51%) on spatial holdout (205 correct of 206)">
          <span className="badge badge-purple">Top Accuracy</span>
          <h3>Overall Accuracy</h3>
          <p className="kpi-value">99.51%</p>
          <p className="kpi-sub">SVM (RBF Kernel) • Holdout</p>
        </div>

        <div className="kpi" title="SVM RBF achieved the highest harmonic mean of precision and recall (88.89% F1)">
          <span className="badge badge-gold">Top Salt Pan F1</span>
          <h3>Salt-Pan F1-Score</h3>
          <p className="kpi-value">88.89%</p>
          <p className="kpi-sub">SVM (RBF Kernel) • 4 TP, 1 FN</p>
        </div>

        <div className="kpi" title="SVM, RF, ExtraTrees, XGBoost, and GradientBoosting produced 0 false positives on holdout">
          <span className="badge badge-green">Zero False Alarms</span>
          <h3>Salt Precision</h3>
          <p className="kpi-value">100.0%</p>
          <p className="kpi-sub">SVM RBF &amp; Random Forest</p>
        </div>

        <div className="kpi" title="SVM RBF and Logistic Regression correctly captured 4 of 5 salt pan polygons in holdout">
          <span className="badge badge-cyan">Minority Coverage</span>
          <h3>Salt-Pan Recall</h3>
          <p className="kpi-value">80.0%</p>
          <p className="kpi-sub">SVM RBF &amp; Logistic Regression</p>
        </div>

        <div className="kpi" title="Random Forest (300 estimators) was selected for district-wide pixel inference">
          <span className="badge badge-gold">Inference Model</span>
          <h3>Production Classifier</h3>
          <p className="kpi-value">Random Forest</p>
          <p className="kpi-sub">300 trees • ROC-AUC: 1.000</p>
        </div>
      </section>

      {/* ── Architectural Distinction Banner ─────────────────────────────────── */}
      <div className="card" style={{ marginTop: '16px', background: 'rgba(242, 201, 76, 0.05)', borderColor: 'rgba(242, 201, 76, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="badge badge-gold" style={{ fontSize: '11px' }}>Benchmark Architecture Note</span>
          <strong style={{ color: 'var(--accent)' }}>Model Role Separation</strong>
        </div>
        <p className="small muted" style={{ marginTop: '6px', lineHeight: 1.5 }}>
          <strong>SVM (RBF Kernel)</strong> achieved the top holdout F1-score (<strong>88.89%</strong>) during polygon-level benchmarking.
          However, for full-district raster inference across 90,148,947 Sentinel-2 pixels, <strong>Random Forest (300 estimators)</strong> was selected as the production classifier due to its superior inference throughput, probability calibration (ROC-AUC: 1.000), and robust pixel-wise generalization.
        </p>
      </div>

      {/* ── Model Comparison Table ───────────────────────────────────────────── */}
      <div className="card" style={{ marginTop: '16px', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3>Multi-Algorithm Evaluation Benchmark</h3>
            <span className="small muted">7 models trained on 8,220 polygons and evaluated on 206 spatial-block holdout polygons</span>
          </div>
          <span className="badge badge-purple">Spatial Holdout Split</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" aria-label="7 Machine Learning Models Comparison">
            <thead>
              <tr>
                <th onClick={() => handleSort('model')} className="sortable">
                  Model Architecture {sortField === 'model' && (sortAsc ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('overall_accuracy')} className="sortable num" title="Percentage of total holdout samples correctly classified (TN+TP)/(Total)">
                  Overall Acc {sortField === 'overall_accuracy' && (sortAsc ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('balanced_accuracy')} className="sortable num" title="Unweighted mean of salt-pan recall and non-salt recall">
                  Balanced Acc {sortField === 'balanced_accuracy' && (sortAsc ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('salt_precision')} className="sortable num" title="Salt pan positive predictive value: TP / (TP + FP)">
                  Salt Precision {sortField === 'salt_precision' && (sortAsc ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('salt_recall')} className="sortable num" title="Salt pan sensitivity/detection rate: TP / (TP + FN)">
                  Salt Recall {sortField === 'salt_recall' && (sortAsc ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('salt_f1')} className="sortable num" title="Harmonic mean of precision and recall for minority salt pan class">
                  Salt F1-Score {sortField === 'salt_f1' && (sortAsc ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('roc_auc')} className="sortable num" title="Area under receiver operating characteristic curve">
                  ROC-AUC {sortField === 'roc_auc' && (sortAsc ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('pr_auc')} className="sortable num" title="Area under precision-recall curve">
                  PR-AUC {sortField === 'pr_auc' && (sortAsc ? '▲' : '▼')}
                </th>
                <th style={{ textAlign: 'center' }}>Inspect</th>
              </tr>
            </thead>
            <tbody>
              {sortedModels.map((m) => {
                const isSelected = selectedModel === m.model
                const isTopAcc = m.overall_accuracy === bests.acc
                const isTopF1 = m.salt_f1 === bests.f1
                const isTopPrec = m.salt_precision === bests.prec
                const isTopRec = m.salt_recall === bests.rec

                return (
                  <tr
                    key={m.model}
                    className={isSelected ? 'row-selected' : ''}
                    onClick={() => setSelectedModel(m.model)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, color: m.model === 'SVM_RBF' || m.model === 'RandomForest' ? 'var(--accent)' : 'inherit' }}>
                          {m.model}
                        </span>
                        {m.model === 'SVM_RBF' && <span className="badge badge-purple" style={{ fontSize: '10px' }}>Top F1</span>}
                        {m.model === 'RandomForest' && <span className="badge badge-green" style={{ fontSize: '10px' }}>Production</span>}
                      </div>
                    </td>
                    <td className="num" style={{ fontWeight: isTopAcc ? 700 : 400, color: isTopAcc ? 'var(--accent)' : 'inherit' }}>
                      {(m.overall_accuracy * 100).toFixed(2)}%
                    </td>
                    <td className="num">{(m.balanced_accuracy * 100).toFixed(2)}%</td>
                    <td className="num" style={{ fontWeight: isTopPrec ? 700 : 400, color: isTopPrec ? 'var(--ok)' : 'inherit' }}>
                      {(m.salt_precision * 100).toFixed(1)}%
                    </td>
                    <td className="num" style={{ fontWeight: isTopRec ? 700 : 400, color: isTopRec ? 'var(--evid)' : 'inherit' }}>
                      {(m.salt_recall * 100).toFixed(1)}%
                    </td>
                    <td className="num" style={{ fontWeight: isTopF1 ? 700 : 400, color: isTopF1 ? 'var(--accent)' : 'inherit' }}>
                      {(m.salt_f1 * 100).toFixed(2)}%
                    </td>
                    <td className="num">{m.roc_auc !== null ? m.roc_auc.toFixed(3) : '—'}</td>
                    <td className="num">{m.pr_auc !== null ? m.pr_auc.toFixed(3) : '—'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn btn-sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedModel(m.model)
                        }}
                      >
                        {isSelected ? 'Viewing' : 'Inspect'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Two Column: Confusion Matrix & Feature Importance ─────────────────── */}
      <div className="workspace-two-col" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px', marginTop: '16px' }}>
        {/* Left: Interactive Confusion Matrix */}
        <div className="card">
          <div className="card-head">
            <div>
              <h3>Confusion Matrix Inspector</h3>
              <span className="small muted">Holdout Test Set (N = 206: 201 Non-Salt, 5 Salt Pan)</span>
            </div>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="select-field"
              style={{ padding: '4px 10px' }}
            >
              {modelRows.map((m) => (
                <option key={m.model} value={m.model}>
                  {m.model}
                </option>
              ))}
            </select>
          </div>

          {activeCM ? (
            <div style={{ marginTop: '16px' }}>
              <div className="cm-wrapper">
                <div className="cm-header-label">Predicted Non-Salt</div>
                <div className="cm-header-label">Predicted Salt Pan</div>

                <div className="cm-side-label">Actual Non-Salt</div>
                <div className="cm-cell cm-tn" title={`True Negatives: ${activeCM[0][0]} correctly identified non-salt polygons`}>
                  <div className="cm-cell-title">True Negative (TN)</div>
                  <div className="cm-cell-value">{activeCM[0][0]}</div>
                  <div className="cm-cell-sub">97.0% – 100% of non-salt</div>
                </div>
                <div className="cm-cell cm-fp" title={`False Positives: ${activeCM[0][1]} non-salt falsely predicted as salt pan`}>
                  <div className="cm-cell-title">False Positive (FP)</div>
                  <div className="cm-cell-value">{activeCM[0][1]}</div>
                  <div className="cm-cell-sub">{activeCM[0][1] === 0 ? 'Zero false alarms' : 'False alarm'}</div>
                </div>

                <div className="cm-side-label">Actual Salt Pan</div>
                <div className="cm-cell cm-fn" title={`False Negatives: ${activeCM[1][0]} salt pans missed`}>
                  <div className="cm-cell-title">False Negative (FN)</div>
                  <div className="cm-cell-value">{activeCM[1][0]}</div>
                  <div className="cm-cell-sub">Missed salt pan</div>
                </div>
                <div className="cm-cell cm-tp" title={`True Positives: ${activeCM[1][1]} salt pans correctly identified`}>
                  <div className="cm-cell-title">True Positive (TP)</div>
                  <div className="cm-cell-value">{activeCM[1][1]}</div>
                  <div className="cm-cell-sub">{(activeCM[1][1] / 5 * 100).toFixed(0)}% salt captured</div>
                </div>
              </div>

              {activeModelDetails && (
                <div className="provenance-card" style={{ marginTop: '16px' }}>
                  <strong>Diagnostic Breakdown for {selectedModel}</strong>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '6px' }}>
                    <div>
                      <div className="small muted">Accuracy</div>
                      <strong>{(activeModelDetails.overall_accuracy * 100).toFixed(2)}%</strong>
                    </div>
                    <div>
                      <div className="small muted">Precision</div>
                      <strong>{(activeModelDetails.salt_precision * 100).toFixed(1)}%</strong>
                    </div>
                    <div>
                      <div className="small muted">Recall</div>
                      <strong>{(activeModelDetails.salt_recall * 100).toFixed(1)}%</strong>
                    </div>
                    <div>
                      <div className="small muted">F1-Score</div>
                      <strong style={{ color: 'var(--accent)' }}>{(activeModelDetails.salt_f1 * 100).toFixed(2)}%</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="muted small">Confusion matrix data is loading...</p>
          )}
        </div>

        {/* Right: Feature Importance */}
        <div className="card">
          <div className="card-head">
            <div>
              <h3>Spectral Feature Importance</h3>
              <span className="small muted">Fitted estimator Gini / split importance</span>
            </div>
            <select
              value={importanceModel}
              onChange={(e) => setImportanceModel(e.target.value)}
              className="select-field"
              style={{ padding: '4px 10px' }}
            >
              <option value="RandomForest">Random Forest (Production)</option>
              <option value="ExtraTrees">Extra Trees</option>
              <option value="GradientBoosting">Gradient Boosting</option>
              <option value="XGBoost">XGBoost</option>
            </select>
          </div>

          <div style={{ marginTop: '12px' }}>
            <p className="small muted" style={{ marginBottom: '12px' }}>
              Extracted directly from the serialized <code>{importanceModel}_pipeline.pkl</code>.
              Reflects the relative contribution of Sentinel-2 spectral bands, vegetation indices (NDVI), and moisture indices (MNDWI, NDMI).
            </p>

            <div className="fi-chart">
              {activeImportance.map((item) => {
                const maxImp = activeImportance[0]?.importance || 1
                const barWidth = (item.importance / maxImp) * 100
                const isWater = item.feature.includes('MNDWI') || item.feature.includes('water')
                const isVeg = item.feature.includes('NDVI')
                const isSwir = item.feature.includes('SWIR') || item.feature.includes('B11') || item.feature.includes('B12')

                return (
                  <div key={item.feature} className="fi-row">
                    <div className="fi-label">
                      <code>{item.feature}</code>
                    </div>
                    <div className="fi-bar-container">
                      <div
                        className="fi-bar"
                        style={{
                          width: `${Math.max(4, barWidth)}%`,
                          background: isVeg ? 'var(--accent)' : isWater ? 'var(--evid)' : isSwir ? 'var(--model)' : 'var(--text)',
                        }}
                      />
                    </div>
                    <div className="fi-val">{(item.importance * 100).toFixed(2)}%</div>
                  </div>
                )
              })}
            </div>

            <div className="provenance-card" style={{ marginTop: '14px' }}>
              <strong>SVM (RBF Kernel) Feature Method Note</strong>
              <div>
                Non-linear kernel SVM maps samples to an infinite-dimensional Hilbert space and does not compute intrinsic feature weights. Conventional tree-based split rankings are mathematically inapplicable to SVM RBF.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Validation Methodology & Caveats Panel ───────────────────────────── */}
      <div className="card" style={{ marginTop: '16px' }}>
        <div className="card-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-purple">Scientific Integrity</span>
            <h3>Validation Methodology &amp; Diagnostic Caveats</h3>
          </div>
          <span className="small muted">Holdout N = 206 polygons</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '12px' }}>
          <div className="provenance-card">
            <strong>1. Class Imbalance (15.8:1 Ratio)</strong>
            <p className="small muted" style={{ marginTop: '4px' }}>
              The dataset contains 7,925 non-salt polygons vs 501 salt-pan polygons. In the 206-sample holdout (201 non-salt, 5 salt), a naive zero-rule classifier predicting non-salt for every sample achieves <strong>97.57% accuracy</strong>. Therefore, salt-pan precision (100%), recall (80%), and F1-score (88.89%) are the true indicators of utility.
            </p>
          </div>

          <div className="provenance-card">
            <strong>2. Spatial Holdout &amp; Backfill Overlap</strong>
            <p className="small muted" style={{ marginTop: '4px' }}>
              Spatial-block validation was used to mitigate spatial autocorrelation. However, due to minority class scarcity in the holdout block, five salt pan polygons were backfilled. As noted in the audit report, geographic proximity between some training and holdout polygons exists.
            </p>
          </div>

          <div className="provenance-card">
            <strong>3. Absence of Field Validation</strong>
            <p className="small muted" style={{ marginTop: '4px' }}>
              All benchmark metrics derive strictly from polygon holdouts digitized from high-resolution Sentinel-2 and historical GIS layers. <strong>No independent external ground-truth field points are available.</strong> The reported 99.51% must not be interpreted as field-verified district accuracy.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

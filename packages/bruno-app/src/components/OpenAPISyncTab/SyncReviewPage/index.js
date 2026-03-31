import React, { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  IconCheck,
  IconX,
  IconArrowRight,
  IconArrowsDiff,
  IconInfoCircle,
  IconLoader2
} from '@tabler/icons';
import Button from 'ui/Button';
import StatusBadge from 'ui/StatusBadge';
import EndpointChangeSection from '../EndpointChangeSection';
import ExpandableEndpointRow from '../EndpointChangeSection/ExpandableEndpointRow';
import ConfirmSyncModal from '../ConfirmSyncModal';
import SpecDiffModal from '../SpecDiffModal';
import Help from 'components/Help';
import { setReviewDecision, setReviewDecisions, selectTabUiState } from 'providers/ReduxStore/slices/openapi-sync';

/**
 * Categorize remoteDrift endpoints using three-way merge.
 * Uses specDrift and collectionDrift to determine who changed each modified endpoint.
 *
 * Returns:
 *  - specAddedEndpoints: new in spec, not yet in collection
 *  - specUpdatedEndpoints: modified in spec (includes conflicts where both sides changed)
 *  - localUpdatedEndpoints: modified only in the collection (spec didn't change)
 *  - specRemovedEndpoints: removed from spec, still in collection
 */
const categorizeEndpoints = (remoteDrift, specDrift, collectionDrift) => {
  // Only show endpoints as "New in Spec" if they were actually added to the spec
  // (i.e., they appear in specDrift.added). Endpoints the user deleted locally that
  // still exist in both stored and remote spec should not appear here — they belong
  // in "Collection Changes" only.
  const specAddedIds = new Set((specDrift?.added || []).map((ep) => ep.id));
  const specAddedEndpoints = (remoteDrift.missing || []).filter((ep) => specAddedIds.has(ep.id));

  // Only show endpoints as "Removed from Spec" if they were actually in the stored spec
  // (i.e., they appear in specDrift.removed). Locally-added endpoints that were never in
  // the spec should not appear here — they belong in "Collection Changes" only.
  const specRemovedIds = new Set((specDrift?.removed || []).map((ep) => ep.id));
  const specRemovedEndpoints = (remoteDrift.localOnly || []).filter((ep) => specRemovedIds.has(ep.id));

  // Build lookup sets to determine who changed each modified endpoint
  const specModifiedIds = new Set((specDrift?.modified || []).map((ep) => ep.id));
  const localModifiedIds = new Set((collectionDrift?.modified || []).map((ep) => ep.id));
  const noMergeBase = collectionDrift?.noStoredSpec;

  const specUpdatedEndpoints = [];
  const localUpdatedEndpoints = [];

  (remoteDrift.modified || []).forEach((ep) => {
    // When there's no merge base (noStoredSpec), we can't tell who changed what — treat as spec update
    const specChanged = !noMergeBase && specModifiedIds.has(ep.id);
    const localChanged = !noMergeBase && localModifiedIds.has(ep.id);

    if (!specChanged && localChanged) {
      // Only local changed — user modification, spec didn't change
      localUpdatedEndpoints.push({
        ...ep,
        source: 'collection-drift',
        localAction: 'modified'
      });
    } else {
      // Spec changed, both changed (conflict), no merge base, or sensitivity mismatch
      specUpdatedEndpoints.push({
        ...ep,
        source: 'spec-modified',
        specAction: 'modified',
        ...(specChanged && localChanged && { conflict: true, localAction: 'modified' })
      });
    }
  });

  return { specAddedEndpoints, specUpdatedEndpoints, localUpdatedEndpoints, specRemovedEndpoints };
};

const SyncReviewPage = ({
  specDrift,
  remoteDrift,
  collectionDrift,
  collectionPath,
  collectionUid,
  newSpec,
  isSyncing,
  isLoading,
  onApplySync
}) => {
  const dispatch = useDispatch();
  const tabUiState = useSelector(selectTabUiState(collectionUid));
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSpecDiffModal, setShowSpecDiffModal] = useState(false);

  const { specAddedEndpoints, specUpdatedEndpoints, localUpdatedEndpoints, specRemovedEndpoints } = useMemo(() => {
    if (!remoteDrift) {
      return { specAddedEndpoints: [], specUpdatedEndpoints: [], localUpdatedEndpoints: [], specRemovedEndpoints: [] };
    }
    return categorizeEndpoints(remoteDrift, specDrift, collectionDrift);
  }, [specDrift, remoteDrift, collectionDrift]);

  const conflictCount = specUpdatedEndpoints.filter((ep) => ep.conflict).length;
  const hasConflicts = conflictCount > 0;

  // Track decisions in Redux (persisted across navigations)
  const savedDecisions = tabUiState.reviewDecisions || {};

  // Compute defaults for any endpoints not yet in Redux
  const decisions = useMemo(() => {
    const merged = { ...savedDecisions };
    // Spec changes: accept-incoming by default, null for conflicts (must resolve manually)
    specUpdatedEndpoints.forEach((ep) => {
      if (!(ep.id in merged)) merged[ep.id] = ep.conflict ? null : 'accept-incoming';
    });
    // Local changes: keep-mine (preserved silently, not shown in review)
    localUpdatedEndpoints.forEach((ep) => {
      if (!(ep.id in merged)) merged[ep.id] = 'keep-mine';
    });
    // Added + removed endpoints: accept-incoming
    [...specAddedEndpoints, ...specRemovedEndpoints].forEach((ep) => {
      if (!(ep.id in merged)) merged[ep.id] = 'accept-incoming';
    });
    return merged;
  }, [savedDecisions, specUpdatedEndpoints, localUpdatedEndpoints, specRemovedEndpoints, specAddedEndpoints]);

  // Sync computed defaults back to Redux when they differ from saved state
  useEffect(() => {
    const hasNewDefaults = Object.keys(decisions).some((id) => !(id in savedDecisions));
    if (hasNewDefaults) {
      dispatch(setReviewDecisions({ collectionUid, decisions }));
    }
  }, [decisions, savedDecisions, collectionUid, dispatch]);

  const handleDecisionChange = (endpointId, decision) => {
    dispatch(setReviewDecision({ collectionUid, endpointId, decision }));
  };

  // Bulk actions — all spec-driven sections
  const decidableEndpoints = useMemo(() => {
    return [...specUpdatedEndpoints, ...specAddedEndpoints, ...specRemovedEndpoints];
  }, [specUpdatedEndpoints, specAddedEndpoints, specRemovedEndpoints]);

  const setBulkDecision = (decision) => {
    const newDecisions = {};
    decidableEndpoints.forEach((ep) => { newDecisions[ep.id] = decision; });
    dispatch(setReviewDecisions({ collectionUid, decisions: newDecisions }));
  };

  const allAccepted = decidableEndpoints.length > 0
    && decidableEndpoints.every((ep) => decisions[ep.id] === 'accept-incoming');
  const allSkipped = decidableEndpoints.length > 0
    && decidableEndpoints.every((ep) => decisions[ep.id] === 'keep-mine');

  const unresolvedConflicts = specUpdatedEndpoints.filter((ep) => ep.conflict && !decisions[ep.id]).length;

  // Confirmation summary — grouped endpoint lists
  const confirmGroups = useMemo(() => {
    const groups = [];
    const addGroup = (label, type, endpoints) => {
      if (endpoints.length > 0) groups.push({ label, type, endpoints });
    };

    const isAccepted = (ep) => decisions[ep.id] === 'accept-incoming';
    const isSkipped = (ep) => decisions[ep.id] === 'keep-mine';

    // Accepted — changes that will be applied
    addGroup('要添加的新 endpoint', 'add', specAddedEndpoints.filter(isAccepted));
    addGroup('要更新的 endpoint', 'update', specUpdatedEndpoints.filter(isAccepted));
    addGroup('要删除的 endpoint', 'remove', specRemovedEndpoints.filter(isAccepted));

    // Skipped — changes that will be preserved as-is
    addGroup('保留本地版本', 'keep', specUpdatedEndpoints.filter((ep) => ep.conflict && isSkipped(ep)));
    addGroup('保留已删除的 endpoint', 'keep', specRemovedEndpoints.filter(isSkipped));
    addGroup('跳过的新 endpoint', 'keep', specAddedEndpoints.filter(isSkipped));
    addGroup('保留当前版本（跳过更新）', 'keep', specUpdatedEndpoints.filter((ep) => !ep.conflict && isSkipped(ep)));

    return groups;
  }, [specAddedEndpoints, specUpdatedEndpoints, specRemovedEndpoints, decisions]);

  const handleConfirmApply = () => {
    setShowConfirmation(false);

    // Filter based on decisions
    const filteredAddedEndpoints = specAddedEndpoints.filter(
      (ep) => decisions[ep.id] === 'accept-incoming'
    );
    const filteredSpecChanges = specUpdatedEndpoints.filter(
      (ep) => !ep.conflict && decisions[ep.id] === 'accept-incoming'
    );

    // Collect "Not in Spec" endpoints where user chose to remove
    const localOnlyIds = specRemovedEndpoints
      .filter((ep) => decisions[ep.id] === 'accept-incoming')
      .map((ep) => ep.id);

    onApplySync({
      endpointDecisions: decisions,
      localOnlyIds,
      // Pass filtered categorized endpoints for performSync to construct the right backend diff
      newToCollection: filteredAddedEndpoints,
      specUpdates: filteredSpecChanges,
      resolvedConflicts: specUpdatedEndpoints.filter((ep) => ep.conflict && decisions[ep.id] === 'accept-incoming'),
      localChangesToReset: localUpdatedEndpoints.filter((ep) => decisions[ep.id] === 'accept-incoming')
    });
  };

  const totalChanges = specAddedEndpoints.length + specUpdatedEndpoints.length + localUpdatedEndpoints.length + specRemovedEndpoints.length;
  const hasRemoteUpdates = specAddedEndpoints.length + specUpdatedEndpoints.length + specRemovedEndpoints.length > 0;

  const buttonLabel = unresolvedConflicts > 0
    ? `解决 ${unresolvedConflicts} 个冲突并同步`
    : !hasRemoteUpdates && specDrift?.storedSpecMissing
        ? '恢复 Spec 文件'
        : '同步 Collection';

  return (
    <div className="sync-review-page sync-mode">
      {hasRemoteUpdates && (
        <div className="sync-review-header">
          <div className="title-row">
            <div className="title-left">
              <h3 className="review-title">审查变更</h3>
              {totalChanges > 0 && (
                <p className="review-subtitle">
                  选择保留当前版本或接受更新版本。
                </p>
              )}
            </div>
            {(specDrift?.unifiedDiff || decidableEndpoints.length > 0) && (
              <div className="bulk-actions">
                {specDrift?.unifiedDiff && (
                  <button className="bulk-btn" onClick={() => setShowSpecDiffModal(true)}>
                    <IconArrowsDiff size={12} /> 查看 Spec 差异
                  </button>
                )}
                {decidableEndpoints.length > 0 && (
                  <>
                    <button
                      className={`bulk-btn ${allSkipped ? 'active' : ''}`}
                      onClick={() => setBulkDecision('keep-mine')}
                    >
                      <IconX size={12} /> 全部跳过
                    </button>
                    <button
                      className={`bulk-btn ${allAccepted ? 'active' : ''}`}
                      onClick={() => setBulkDecision('accept-incoming')}
                    >
                      <IconCheck size={12} /> 全部接受
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="sync-review-body">
        {!hasRemoteUpdates ? (
          <div className="sync-review-empty-state">
            {isLoading ? (
              <>
                <IconLoader2 size={40} className="empty-state-icon animate-spin" />
                <h4>检查更新中</h4>
                <p>正在将上次同步的 Spec 与最新 Spec 进行比较...</p>
              </>
            ) : (
              <>
                <IconCheck size={40} className="empty-state-icon" />
                <h4>Spec 无更新</h4>
                <p>自上次同步以来 Spec endpoint 未更新。</p>
              </>
            )}
          </div>
        ) : (
          <div className="endpoints-review-sections">
            {/* === Updates from Spec === */}
            {decidableEndpoints.length > 0 && (
              <div className="review-group">

                <EndpointChangeSection
                  title="Spec 中已更新"
                  type="spec-modified"
                  endpoints={specUpdatedEndpoints}
                  defaultExpanded={true}
                  expandableLayout
                  subtitle="Spec 有这些 endpoint 的更新"
                  headerExtra={conflictCount > 0 ? (
                    <StatusBadge
                      status="danger"
                      rightSection={(
                        <Help icon="info" size={11} placement="top" width={250}>
                          {`此部分有 ${conflictCount} 个 endpoint 在 Spec 和你的 Collection 中都被修改。展开以审查并解决。`}
                        </Help>
                      )}
                    >
                      {conflictCount} {conflictCount === 1 ? '冲突' : '个冲突'}
                    </StatusBadge>
                  ) : null}
                  collectionUid={collectionUid}
                  sectionKey="review-spec-modified"
                  renderItem={(endpoint, idx) => (
                    <ExpandableEndpointRow
                      key={endpoint.id || idx}
                      endpoint={endpoint}
                      decision={decisions?.[endpoint.id]}
                      onDecisionChange={(decision) => handleDecisionChange(endpoint.id, decision)}
                      collectionPath={collectionPath}
                      newSpec={newSpec}
                      showDecisions={true}
                      decisionLabels={{ keep: '保留当前', accept: '更新' }}
                      collectionUid={collectionUid}
                    />
                  )}
                />

                <EndpointChangeSection
                  title="Spec 中新增"
                  type="added"
                  endpoints={specAddedEndpoints}
                  defaultExpanded={true}
                  expandableLayout
                  subtitle="来自 Spec 的新 endpoint"
                  collectionUid={collectionUid}
                  sectionKey="review-added"
                  renderItem={(endpoint, idx) => (
                    <ExpandableEndpointRow
                      key={endpoint.id || idx}
                      endpoint={endpoint}
                      decision={decisions?.[endpoint.id]}
                      onDecisionChange={(decision) => handleDecisionChange(endpoint.id, decision)}
                      collectionPath={collectionPath}
                      newSpec={newSpec}
                      showDecisions={true}
                      decisionLabels={{ keep: '跳过', accept: '添加' }}
                      collectionUid={collectionUid}
                    />
                  )}
                />

                <EndpointChangeSection
                  title="Spec 中已删除"
                  type="removed"
                  endpoints={specRemovedEndpoints}
                  defaultExpanded={true}
                  expandableLayout
                  subtitle="这些 endpoint 在你的 Collection 中但不在 Spec 中"
                  collectionUid={collectionUid}
                  sectionKey="review-removed"
                  renderItem={(endpoint, idx) => (
                    <ExpandableEndpointRow
                      key={endpoint.id || idx}
                      endpoint={endpoint}
                      decision={decisions?.[endpoint.id]}
                      onDecisionChange={(decision) => handleDecisionChange(endpoint.id, decision)}
                      collectionPath={collectionPath}
                      newSpec={newSpec}
                      showDecisions={true}
                      decisionLabels={{ keep: '保留', accept: '删除' }}
                      collectionUid={collectionUid}
                    />
                  )}
                />
              </div>
            )}

          </div>
        )}
      </div>

      {hasRemoteUpdates && (
        <div className="sync-info-notice mt-4">
          <IconInfoCircle size={14} className="sync-info-icon" />
          <span><span className="whats-updated-title">更新内容：</span>参数、headers、body 和 auth 将被更新。测试、脚本和断言始终保留。</span>
        </div>
      )}

      {hasRemoteUpdates && (
        <div className="sync-review-bottom-bar mt-4">
          <div className="bar-stats">
            {totalChanges === 0 && (
              <span className="stats-prefix">
                {specDrift?.storedSpecMissing ? '同步将更新 Spec 文件' : '无 endpoint 变更需要应用'}
              </span>
            )}
          </div>
          <div className="bar-actions">
            <Button
              onClick={totalChanges === 0 ? handleConfirmApply : () => setShowConfirmation(true)}
              disabled={unresolvedConflicts > 0 || isSyncing}
              loading={isSyncing}
            >
              {buttonLabel}
              {unresolvedConflicts === 0 && <IconArrowRight size={14} style={{ marginLeft: 4 }} />}
            </Button>
          </div>
        </div>
      )}

      {showConfirmation && (
        <ConfirmSyncModal
          groups={confirmGroups}
          onCancel={() => setShowConfirmation(false)}
          onSync={handleConfirmApply}
          isSyncing={isSyncing}
        />
      )}

      {showSpecDiffModal && (
        <SpecDiffModal
          specDrift={specDrift}
          onClose={() => setShowSpecDiffModal(false)}
        />
      )}
    </div>
  );
};

export default SyncReviewPage;

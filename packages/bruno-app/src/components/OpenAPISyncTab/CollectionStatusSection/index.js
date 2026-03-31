import { useMemo } from 'react';
import {
  IconCheck,
  IconPlus,
  IconTrash,
  IconArrowBackUp,
  IconExternalLink,
  IconAlertTriangle,
  IconInfoCircle,
  IconLoader2
} from '@tabler/icons';
import moment from 'moment';
import Button from 'ui/Button';
import StatusBadge from 'ui/StatusBadge';
import Modal from 'components/Modal';
import EndpointChangeSection from '../EndpointChangeSection';
import ExpandableEndpointRow from '../EndpointChangeSection/ExpandableEndpointRow';
import useEndpointActions from '../hooks/useEndpointActions';

const CollectionStatusSection = ({
  collection,
  collectionDrift,
  reloadDrift,
  specDrift,
  storedSpec,
  lastSyncDate,
  onOpenEndpoint,
  isLoading,
  onTabSelect
}) => {
  const {
    pendingAction, setPendingAction,
    confirmPendingAction,
    handleResetEndpoint,
    handleResetAllModified,
    handleDeleteEndpoint,
    handleDeleteAllLocalOnly,
    handleRevertAllChanges,
    handleAddMissingEndpoint,
    handleAddAllMissing
  } = useEndpointActions(collection, collectionDrift, reloadDrift);

  const spec = storedSpec || specDrift?.newSpec;
  const hasStoredSpec = collectionDrift && !collectionDrift.noStoredSpec;
  const hasDrift = hasStoredSpec && (collectionDrift.modified?.length > 0
    || collectionDrift.missing?.length > 0
    || collectionDrift.localOnly?.length > 0);

  const renderDriftRow = (endpoint, idx, actions) => (
    <ExpandableEndpointRow
      key={endpoint.id}
      endpoint={endpoint}
      collectionPath={collection.pathname}
      newSpec={spec}
      showDecisions={false}
      diffLeftLabel="上次同步的 Spec"
      diffRightLabel="当前（Collection 中）"
      swapDiffSides
      collectionUid={collection.uid}
      actions={actions}
    />
  );

  const modifiedCount = collectionDrift?.modified?.length || 0;
  const missingCount = collectionDrift?.missing?.length || 0;
  const localOnlyCount = collectionDrift?.localOnly?.length || 0;
  const version = specDrift?.storedVersion || storedSpec?.info?.version;

  const bannerState = useMemo(() => {
    if (hasDrift) {
      return {
        variant: 'muted',
        message: 'Collection 自上次同步后有变更',
        badges: { modifiedCount, missingCount, localOnlyCount },
        actions: ['revert-all']
      };
    }
    return null;
  }, [hasDrift, modifiedCount, missingCount, localOnlyCount, version, lastSyncDate]);

  return (
    <div className="collection-status-section">
      {bannerState && (
        <div className={`spec-update-banner ${bannerState.variant}`}>
          <div className="banner-left">
            {bannerState.variant === 'success'
              ? <IconCheck size={16} className="status-check-icon" />
              : <div className={`status-dot ${bannerState.variant}`} />}
            <span className="banner-title">
              {bannerState.message}
            </span>
            {bannerState.badges && (
              <span className="banner-details">
                {bannerState.badges.modifiedCount > 0 && <StatusBadge status="warning" radius="full">{bannerState.badges.modifiedCount} 已修改</StatusBadge>}
                {bannerState.badges.missingCount > 0 && <StatusBadge status="danger" radius="full">{bannerState.badges.missingCount} 已删除</StatusBadge>}
                {bannerState.badges.localOnlyCount > 0 && <StatusBadge status="muted" radius="full">{bannerState.badges.localOnlyCount} 已添加</StatusBadge>}
              </span>
            )}
          </div>
          {bannerState.actions.includes('revert-all') && (
            <div className="banner-actions">
              <Button size="sm" variant="ghost" color="danger" onClick={handleRevertAllChanges}>
                全部重置为 Spec
              </Button>
            </div>
          )}
        </div>
      )}

      {hasDrift && (
        <div className="sync-info-notice mt-4">
          <IconInfoCircle size={14} className="sync-info-icon" />
          <span><span className="whats-updated-title">追踪内容：</span>相对于已同步 Spec 的参数、headers、body 和 auth 变更。你的变量、脚本、测试、断言、设置等不在追踪范围内。</span>
        </div>
      )}

      {hasDrift ? (
        <div className="mt-5">
          {/* Collection 中已修改 */}
          <EndpointChangeSection
            title="Collection 中已修改"
            type="modified"
            endpoints={collectionDrift.modified || []}
            expandableLayout
            collectionUid={collection.uid}
            sectionKey="drift-modified"
            renderItem={(endpoint, idx) =>
              renderDriftRow(endpoint, idx, (
                <>
                  <Button size="xs" variant="ghost" onClick={() => onOpenEndpoint(endpoint.id)} title="在新标签页打开" icon={<IconExternalLink size={14} />}>
                    打开
                  </Button>
                  <Button size="xs" variant="ghost" onClick={() => handleResetEndpoint(endpoint)} title="重置为 Spec" icon={<IconArrowBackUp size={14} />}>
                    重置
                  </Button>
                </>
              ))}
            actions={(
              <Button
                size="xs"
                variant="outline"
                onClick={handleResetAllModified}
                title="将所有已修改的 endpoint 重置为与 Spec 一致"
                icon={<IconArrowBackUp size={14} />}
              >
                全部重置
              </Button>
            )}
          />

          {/* Collection 中已删除 */}
          <EndpointChangeSection
            title="Collection 中已删除"
            type="missing"
            endpoints={collectionDrift.missing || []}
            expandableLayout
            collectionUid={collection.uid}
            sectionKey="drift-missing"
            renderItem={(endpoint, idx) =>
              renderDriftRow(endpoint, idx, (
                <Button size="xs" variant="ghost" onClick={() => handleAddMissingEndpoint(endpoint)} title="恢复到 Collection" icon={<IconPlus size={14} />}>
                  恢复
                </Button>
              ))}
            actions={(
              <Button
                size="xs"
                variant="outline"
                onClick={handleAddAllMissing}
                title="将所有已删除的 endpoint 添加回 Collection"
                icon={<IconPlus size={14} />}
              >
                全部恢复
              </Button>
            )}
          />

          {/* Collection 中已添加 */}
          <EndpointChangeSection
            title="Collection 中已添加"
            type="local-only"
            endpoints={collectionDrift.localOnly || []}
            expandableLayout
            collectionUid={collection.uid}
            sectionKey="drift-local-only"
            renderItem={(endpoint, idx) =>
              renderDriftRow(endpoint, idx, (
                <>
                  <Button size="xs" variant="ghost" onClick={() => onOpenEndpoint(endpoint.id)} title="在新标签页打开" icon={<IconExternalLink size={14} />}>
                    打开
                  </Button>
                  <Button size="xs" variant="ghost" color="danger" onClick={() => handleDeleteEndpoint(endpoint)} title="删除 endpoint" icon={<IconTrash size={14} />}>
                    删除
                  </Button>
                </>
              ))}
            actions={(
              <Button
                size="xs"
                variant="outline"
                color="danger"
                onClick={handleDeleteAllLocalOnly}
                title="删除所有本地添加的 endpoint"
                icon={<IconTrash size={14} />}
              >
                全部删除
              </Button>
            )}
          />
        </div>
      ) : isLoading ? (
        <div className="sync-review-empty-state mt-5">
          <IconLoader2 size={40} className="empty-state-icon animate-spin" />
          <h4>检查更新中</h4>
          <p>正在将你的 Collection 与上次同步的 Spec 进行比较...</p>
        </div>
      ) : !hasStoredSpec ? (
        <div className="sync-review-empty-state mt-5">
          <IconAlertTriangle size={40} className="empty-state-icon" />
          <h4>{lastSyncDate ? '无法追踪 Collection 变更' : '等待初始同步'}</h4>
          <p>{lastSyncDate
            ? '上次同步的 Spec 已丢失。前往"Spec 更新"标签页恢复，或在有可用更新时同步 Collection 以追踪后续变更。'
            : 'Collection 与 Spec 同步后，本地变更将显示在此处。'}
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => onTabSelect('spec-updates')}>前往 Spec 更新</Button>
        </div>
      ) : (
        <div className="sync-review-empty-state mt-5">
          <IconCheck size={40} className="empty-state-icon" />
          <h4>Collection 无变更</h4>
          <p>Collection 中的 endpoint 与上次同步的 Spec 一致。无需审查。</p>
        </div>
      )}
      {/* Action confirmation modal */}
      {pendingAction && (
        <Modal size="sm" title={pendingAction.title} hideFooter={true} handleCancel={() => setPendingAction(null)}>
          <div className="action-confirm-modal">
            <p className="confirm-message">{pendingAction.message}</p>
            <div className="confirm-actions">
              <Button variant="ghost" onClick={() => setPendingAction(null)}>
                取消
              </Button>
              <Button
                color={pendingAction.type.includes('delete') ? 'danger' : 'primary'}
                onClick={confirmPendingAction}
              >
                确认
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CollectionStatusSection;

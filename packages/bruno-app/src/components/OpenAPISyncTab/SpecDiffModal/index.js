import { useRef, useEffect, useState } from 'react';
import { useTheme } from 'providers/Theme/index';
import { IconLoader2 } from '@tabler/icons';
import Modal from 'components/Modal';
import StatusBadge from 'ui/StatusBadge';

const SpecDiffModal = ({ specDrift, onClose }) => {
  const diffRef = useRef(null);
  const { displayedTheme } = useTheme();
  const [isRendering, setIsRendering] = useState(true);

  const addedCount = specDrift?.added?.length || 0;
  const modifiedCount = specDrift?.modified?.length || 0;
  const removedCount = specDrift?.removed?.length || 0;

  const versionLabel = specDrift?.versionChanged
    ? `v${specDrift.storedVersion || '?'} → v${specDrift.newVersion}`
    : null;

  useEffect(() => {
    const { Diff2Html } = window;
    if (!diffRef?.current || !Diff2Html || !specDrift?.unifiedDiff) {
      setIsRendering(false);
      return;
    }
    setIsRendering(true);
    const diffHtml = Diff2Html.html(specDrift.unifiedDiff, {
      drawFileList: false,
      matching: 'lines',
      outputFormat: 'side-by-side',
      synchronisedScroll: true,
      highlight: true,
      renderNothingWhenEmpty: false,
      colorScheme: displayedTheme
    });
    // Safe: Diff2Html is loaded from a local static bundle (public/static/diff2Html.js)
    diffRef.current.innerHTML = diffHtml;
    setIsRendering(false);
  }, [displayedTheme, specDrift?.unifiedDiff]);

  return (
    <Modal
      size="xl"
      title="Spec 差异"
      hideFooter
      handleCancel={onClose}
    >
      <div className="spec-diff-modal">
        <div className="spec-diff-badges">
          {modifiedCount > 0 && <StatusBadge status="warning">已更新: {modifiedCount}</StatusBadge>}
          {addedCount > 0 && <StatusBadge status="success">已添加: {addedCount}</StatusBadge>}
          {removedCount > 0 && <StatusBadge status="danger">已删除: {removedCount}</StatusBadge>}
          {versionLabel && <StatusBadge>{versionLabel}</StatusBadge>}
        </div>

        <p className="spec-diff-subtitle">
          {specDrift?.storedSpecMissing
            ? '当前 Spec 文件缺失。下方显示完整的远程 Spec。'
            : '当前 Spec 与来自 Spec URL 的更新 Spec 的并排差异对比。'}
        </p>

        <div className="spec-diff-body">
          <div className="text-diff-container">
            {specDrift?.unifiedDiff ? (
              <>
                <div className="diff-column-headers">
                  <span className="diff-column-label">{specDrift?.storedSpecMissing ? '当前 Spec（缺失）' : '当前 Spec'}</span>
                  <span className="diff-column-label">更新的 Spec</span>
                </div>
                {isRendering && (
                  <div className="text-diff-loading">
                    <IconLoader2 className="animate-spin" size={20} strokeWidth={1.5} />
                    <span>加载差异中...</span>
                  </div>
                )}
                <div ref={diffRef} style={{ display: isRendering ? 'none' : 'block' }}></div>
              </>
            ) : (
              <div className="text-diff-empty">无文本差异可用。</div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SpecDiffModal;

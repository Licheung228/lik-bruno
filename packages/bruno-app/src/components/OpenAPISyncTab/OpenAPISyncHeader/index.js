import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectStoredSpecMeta } from 'providers/ReduxStore/slices/openapi-sync';
import {
  IconCopy,
  IconDotsVertical,
  IconUnlink,
  IconSettings,
  IconRefresh,
  IconCircleCheck,
  IconAlertTriangle
} from '@tabler/icons';
import toast from 'react-hot-toast';
import Button from 'ui/Button';
import ActionIcon from 'ui/ActionIcon/index';
import MenuDropdown from 'ui/MenuDropdown';
import Help from 'components/Help';
import { isHttpUrl } from 'utils/url/index';

const OpenAPISyncHeader = ({
  collection, spec, sourceUrl, syncStatus, onViewSpec,
  onOpenSettings, onOpenDisconnect,
  onCheck, isLoading
}) => {
  const sourceIsLocal = !isHttpUrl(sourceUrl);
  const canCheck = !!sourceUrl?.trim();

  // Resolve relative file paths to absolute for display
  const [displayPath, setDisplayPath] = useState(sourceUrl);
  useEffect(() => {
    if (sourceIsLocal && sourceUrl) {
      window.ipcRenderer.invoke('renderer:resolve-path', sourceUrl, collection.pathname)
        .then((resolved) => setDisplayPath(resolved))
        .catch(() => setDisplayPath(sourceUrl));
    } else {
      setDisplayPath(sourceUrl);
    }
  }, [sourceUrl, sourceIsLocal, collection.pathname]);

  const specMeta = useSelector(selectStoredSpecMeta(collection.uid));
  const title = specMeta?.title || spec?.info?.title || 'Unknown API';

  const copyUrl = async () => {
    if (!sourceUrl) return;
    try {
      if (sourceIsLocal) {
        const absolutePath = await window.ipcRenderer.invoke('renderer:resolve-path', sourceUrl, collection.pathname);
        await navigator.clipboard.writeText(absolutePath);
      } else {
        await navigator.clipboard.writeText(sourceUrl);
      }
      toast.success(sourceIsLocal ? '路径已复制到剪贴板' : 'URL 已复制到剪贴板');
    } catch (err) {
      console.error('Error copying to clipboard:', err);
      toast.error('复制到剪贴板失败');
    }
  };

  const revealInFolder = async () => {
    if (!sourceUrl) return;
    try {
      const absolutePath = await window.ipcRenderer.invoke('renderer:resolve-path', sourceUrl, collection.pathname);
      await window.ipcRenderer.invoke('renderer:show-in-folder', absolutePath);
    } catch (err) {
      console.error('Error revealing in folder:', err);
      toast.error('在文件管理器中打开失败');
    }
  };

  const menuItems = [
    {
      id: 'settings',
      label: '编辑连接设置',
      leftSection: IconSettings,
      onClick: onOpenSettings
    },
    {
      id: 'disconnect',
      label: '断开同步',
      leftSection: IconUnlink,
      className: 'delete-item',
      onClick: onOpenDisconnect
    }
  ];

  return (
    <div className="spec-info-card">
      <div className="spec-info-header">
        <div className="spec-title-section">
          <div className="spec-title-row">
            <span className="spec-title">{title}</span>
          </div>
        </div>
        <div className="spec-header-actions">
          <Button
            color="secondary"
            size="sm"
            onClick={onCheck}
            disabled={!canCheck}
            loading={isLoading}
            icon={<IconRefresh size={14} />}
          >
            检查更新
          </Button>
          <Button
            color="secondary"
            size="sm"
            onClick={onViewSpec}
          >
            查看 Spec
          </Button>
          <MenuDropdown items={menuItems} placement="bottom-end">
            <ActionIcon label="更多选项">
              <IconDotsVertical size={16} strokeWidth={2} />
            </ActionIcon>
          </MenuDropdown>
        </div>
      </div>
      <div className="spec-url-row">
        <span className="spec-url-label">{sourceIsLocal ? '源文件:' : '源 URL:'}</span>
        {sourceIsLocal ? (
          <button
            className="spec-url-value spec-file-reveal"
            title="在文件管理器中显示"
            type="button"
            onClick={revealInFolder}
          >
            {displayPath}
          </button>
        ) : (
          <a
            className="spec-url-value"
            href={sourceUrl}
            title={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {sourceUrl}
          </a>
        )}
        <button className="copy-btn" onClick={copyUrl} title={sourceIsLocal ? '复制路径' : '复制 URL'} type="button">
          <IconCopy size={12} />
        </button>
      </div>
      <div className="linked-collection-row mt-1">
        <span className="spec-url-label">关联的 Collection:</span>
        <span className="linked-collection-name">{collection.name}</span>
        {syncStatus === 'in-sync' && (
          <Help
            placement="bottom"
            width={240}
            iconComponent={() => <IconCircleCheck size={14} className="sync-status-icon in-sync" />}
          >
            Collection 已与 Spec 同步
          </Help>
        )}
        {syncStatus === 'not-in-sync' && (
          <Help
            placement="bottom"
            width={260}
            iconComponent={() => <IconAlertTriangle size={14} className="sync-status-icon not-in-sync" />}
          >
            Collection 未与 Spec 同步
          </Help>
        )}
      </div>
    </div>
  );
};

export default OpenAPISyncHeader;
